const express = require("express")
const { PrismaClient } = require("@prisma/client")
const { authenticateJWT, authorizeRole } = require("../middleware/auth")
const { validateRequest, markAttendanceSchema } = require("../utils/validation")

const router = express.Router()
const prisma = new PrismaClient()

// Mark attendance (Student only)
router.post(
  "/mark",
  authenticateJWT,
  authorizeRole("STUDENT"),
  validateRequest(markAttendanceSchema),
  async (req, res) => {
    try {
      const { studentId, sessionId, biometricToken } = req.body

      // Verify student is the authenticated user
      if (studentId !== req.user.id) {
        return res.status(403).json({ error: "Can only mark attendance for yourself" })
      }

      if (!biometricToken) {
        return res.status(400).json({
          error: "Biometric authentication required",
          code: "BIOMETRIC_REQUIRED",
        })
      }

      const fingerprint = await prisma.fingerprint.findUnique({
        where: { userId: studentId },
      })

      if (!fingerprint) {
        return res.status(403).json({
          error: "Fingerprint not enrolled. Please enroll your fingerprint first.",
          code: "FINGERPRINT_NOT_ENROLLED",
        })
      }

      // In production, use proper cryptographic verification
      const tokenValid = biometricToken.startsWith(`bio-${studentId}`)
      if (!tokenValid) {
        return res.status(403).json({
          error: "Biometric verification failed",
          code: "BIOMETRIC_VERIFICATION_FAILED",
        })
      }

      // Verify session exists and is active
      const session = await prisma.session.findFirst({
        where: {
          id: sessionId,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          class: {
            include: {
              students: {
                where: { id: studentId },
              },
            },
          },
        },
      })

      if (!session) {
        return res.status(404).json({ error: "Session not found or expired" })
      }

      // Verify student is enrolled in the class
      if (session.class.students.length === 0) {
        return res.status(403).json({ error: "You are not enrolled in this class" })
      }

      // Check if attendance already marked
      const existingAttendance = await prisma.attendance.findFirst({
        where: {
          studentId,
          sessionId,
        },
      })

      if (existingAttendance) {
        return res.status(400).json({ error: "Attendance already marked for this session" })
      }

      const now = new Date()
      const sessionStart = new Date(session.startTime)
      const minutesLate = Math.floor((now - sessionStart) / (1000 * 60))

      let status = "PRESENT"
      if (minutesLate > 15) {
        status = "LATE"
      }

      // Mark attendance
      const attendance = await prisma.attendance.create({
        data: {
          studentId,
          sessionId,
          markedAt: now,
          status,
          notes: minutesLate > 0 ? `Marked ${minutesLate} minutes after session start` : null,
        },
        include: {
          session: {
            include: {
              class: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      })

      console.log(
        `[Biometric Attendance] Student ${studentId} marked attendance for session ${sessionId} - Status: ${status}`,
      )

      res.status(201).json({
        message: "Attendance marked successfully",
        attendance: {
          id: attendance.id,
          markedAt: attendance.markedAt,
          status: attendance.status,
          class: attendance.session.class,
          minutesLate: minutesLate > 0 ? minutesLate : 0,
        },
      })
    } catch (error) {
      console.error("Mark attendance error:", error)
      res.status(500).json({ error: "Failed to mark attendance" })
    }
  },
)

// Get attendance history for authenticated user (students can only view their own)
router.get("/history", authenticateJWT, async (req, res) => {
  try {
    const { page = 1, limit = 10, classId } = req.query
    const skip = (page - 1) * limit

    // Students can only view their own attendance history
    const studentId = req.user.role === "STUDENT" ? req.user.id : req.query.studentId
    
    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" })
    }

    // Check permissions
    if (req.user.role === "STUDENT" && studentId !== req.user.id) {
      return res.status(403).json({ error: "Can only view your own attendance history" })
    }

    const where = { studentId }
    if (classId) {
      where.session = { classId }
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        session: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      skip: Number.parseInt(skip),
      take: Number.parseInt(limit),
      orderBy: { markedAt: "desc" },
    })

    const total = await prisma.attendance.count({ where })

    res.json(attendance) // Return array directly for mobile app compatibility
  } catch (error) {
    console.error("Get attendance history error:", error)
    res.status(500).json({ error: "Failed to fetch attendance history" })
  }
})

// Get attendance history for a student
router.get("/history/:studentId", authenticateJWT, async (req, res) => {
  try {
    const { studentId } = req.params
    const { page = 1, limit = 10, classId } = req.query
    const skip = (page - 1) * limit

    // Check permissions
    if (req.user.role === "STUDENT" && studentId !== req.user.id) {
      return res.status(403).json({ error: "Can only view your own attendance history" })
    }

    const where = { studentId }
    if (classId) {
      where.session = { classId }
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        session: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      skip: Number.parseInt(skip),
      take: Number.parseInt(limit),
      orderBy: { markedAt: "desc" },
    })

    const total = await prisma.attendance.count({ where })

    res.json({
      attendance,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get attendance history error:", error)
    res.status(500).json({ error: "Failed to fetch attendance history" })
  }
})

// Get attendance for a session (Teacher/Admin)
router.get("/session/:sessionId", authenticateJWT, authorizeRole("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const { sessionId } = req.params

    // Verify session exists and user has permission
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        class: {
          include: {
            students: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!session) {
      return res.status(404).json({ error: "Session not found" })
    }

    if (req.user.role === "TEACHER" && session.teacherId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" })
    }

    // Get attendance records
    const attendance = await prisma.attendance.findMany({
      where: { sessionId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    // Create attendance summary
    const attendanceMap = new Map(attendance.map((a) => [a.studentId, a]))
    const attendanceSummary = session.class.students.map((student) => ({
      student,
      attendance: attendanceMap.get(student.id) || null,
      status: attendanceMap.has(student.id) ? attendanceMap.get(student.id).status : "ABSENT",
    }))

    res.json({
      session: {
        id: session.id,
        code: session.code,
        startTime: session.startTime,
        endTime: session.endTime,
        class: {
          id: session.class.id,
          name: session.class.name,
        },
      },
      attendance: attendanceSummary,
    })
  } catch (error) {
    console.error("Get session attendance error:", error)
    res.status(500).json({ error: "Failed to fetch session attendance" })
  }
})

// Manual attendance update (Teacher only)
router.put("/session/:sessionId/student/:studentId", authenticateJWT, authorizeRole("TEACHER"), async (req, res) => {
  try {
    const { sessionId, studentId } = req.params
    const { status, notes } = req.body

    if (!status || !["PRESENT", "ABSENT", "LATE", "EXCUSED"].includes(status)) {
      return res.status(400).json({ error: "Invalid status. Must be PRESENT, ABSENT, LATE, or EXCUSED" })
    }

    // Verify session exists and teacher owns it
    const session = await prisma.session.findFirst({
      where: {
        id: sessionId,
        teacherId: req.user.id,
      },
      include: {
        class: {
          include: {
            students: {
              where: { id: studentId },
            },
          },
        },
      },
    })

    if (!session) {
      return res.status(404).json({ error: "Session not found or access denied" })
    }

    if (session.class.students.length === 0) {
      return res.status(400).json({ error: "Student not enrolled in this class" })
    }

    // Update or create attendance record
    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_sessionId: {
          studentId,
          sessionId,
        },
      },
      update: {
        status,
        notes: notes || null,
        markedAt: new Date(),
      },
      create: {
        studentId,
        sessionId,
        status,
        notes: notes || null,
        markedAt: new Date(),
      },
    })

    res.json({
      message: "Attendance updated successfully",
      attendance: {
        id: attendance.id,
        status: attendance.status,
        markedAt: attendance.markedAt,
        notes: attendance.notes,
      },
    })
  } catch (error) {
    console.error("Update attendance error:", error)
    res.status(500).json({ error: "Failed to update attendance" })
  }
})

// Get class attendance statistics (Teacher)
router.get("/class/:classId/stats", authenticateJWT, authorizeRole("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const { classId } = req.params
    const { startDate, endDate } = req.query

    // Verify class exists and user has permission
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!classData) {
      return res.status(404).json({ error: "Class not found" })
    }

    if (req.user.role === "TEACHER" && classData.teacherId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" })
    }

    // Build date filter
    const dateFilter = {}
    if (startDate) {
      dateFilter.gte = new Date(startDate)
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate)
    }

    // Get sessions in date range
    const sessions = await prisma.session.findMany({
      where: {
        classId,
        ...(Object.keys(dateFilter).length > 0 && { startTime: dateFilter }),
      },
      include: {
        attendance: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: "desc" },
    })

    const totalSessions = sessions.length
    const totalStudents = classData.students.length

    // Calculate attendance statistics
    const studentStats = classData.students.map((student) => {
      const studentAttendance = []
      sessions.forEach((session) => {
        const attendance = session.attendance.find((a) => a.studentId === student.id)
        studentAttendance.push({
          sessionId: session.id,
          sessionDate: session.startTime,
          status: attendance ? attendance.status : "ABSENT",
          markedAt: attendance ? attendance.markedAt : null,
        })
      })

      const presentCount = studentAttendance.filter((a) => a.status === "PRESENT").length
      const lateCount = studentAttendance.filter((a) => a.status === "LATE").length
      const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0

      return {
        student,
        presentCount,
        lateCount,
        absentCount: totalSessions - presentCount - lateCount,
        attendanceRate,
        attendanceHistory: studentAttendance,
      }
    })

    // Overall class statistics
    const totalPresent = sessions.reduce((sum, session) => sum + session.attendance.length, 0)
    const maxPossibleAttendance = totalSessions * totalStudents
    const overallAttendanceRate = maxPossibleAttendance > 0 ? Math.round((totalPresent / maxPossibleAttendance) * 100) : 0

    res.json({
      class: {
        id: classData.id,
        name: classData.name,
        totalStudents,
        totalSessions,
      },
      overallStats: {
        totalPresent,
        totalAbsent: maxPossibleAttendance - totalPresent,
        attendanceRate: overallAttendanceRate,
      },
      studentStats,
      sessions: sessions.map((s) => ({
        id: s.id,
        startTime: s.startTime,
        endTime: s.endTime,
        attendanceCount: s.attendance.length,
      })),
    })
  } catch (error) {
    console.error("Get class stats error:", error)
    res.status(500).json({ error: "Failed to fetch class statistics" })
  }
})

// Get student attendance history (student endpoint with consistent structure)
router.get("/student/history", authenticateJWT, authorizeRole("STUDENT"), async (req, res) => {
  try {
    const { page = 1, limit = 10, classId, startDate, endDate } = req.query
    const skip = (page - 1) * limit
    const studentId = req.user.id

    // Build where clause
    const where = { studentId }
    
    // Filter by class if specified
    if (classId) {
      where.session = { classId }
    }
    
    // Filter by date range if specified
    if (startDate || endDate) {
      where.session = where.session || {}
      where.session.startTime = {}
      if (startDate) where.session.startTime.gte = new Date(startDate)
      if (endDate) where.session.startTime.lte = new Date(endDate)
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        session: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      skip: Number.parseInt(skip),
      take: Number.parseInt(limit),
      orderBy: { markedAt: "desc" },
    })

    const total = await prisma.attendance.count({ where })

    res.json({
      attendance,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get student attendance history error:", error)
    res.status(500).json({ error: "Failed to fetch attendance history" })
  }
})

// Get student attendance summary (student endpoint)
router.get("/student/summary", authenticateJWT, authorizeRole("STUDENT"), async (req, res) => {
  try {
    const studentId = req.user.id
    const { classId } = req.query

    // Build where clause
    const where = { studentId }
    if (classId) {
      where.session = { classId }
    }

    // Get all attendance records for the student
    const attendance = await prisma.attendance.findMany({
      where,
      select: {
        status: true,
        session: {
          select: {
            id: true,
            class: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    })

    // Get total sessions the student should have attended
    const sessionWhere = {}
    if (classId) {
      sessionWhere.classId = classId
      // Also need to verify student is enrolled in the class
      const classData = await prisma.class.findFirst({
        where: {
          id: classId,
          students: {
            some: { id: studentId },
          },
        },
      })
      if (!classData) {
        return res.status(403).json({ error: "Not enrolled in this class" })
      }
    } else {
      // Get sessions for all classes the student is enrolled in
      sessionWhere.class = {
        students: {
          some: { id: studentId },
        },
      }
    }

    const totalSessions = await prisma.session.count({
      where: sessionWhere,
    })

    // Calculate summary statistics
    const presentCount = attendance.filter((a) => a.status === "PRESENT").length
    const absentCount = attendance.filter((a) => a.status === "ABSENT").length
    const lateCount = attendance.filter((a) => a.status === "LATE").length
    const excusedCount = attendance.filter((a) => a.status === "EXCUSED").length
    const attendanceRate = totalSessions > 0 ? (presentCount + lateCount) / totalSessions : 0

    res.json({
      summary: {
        totalSessions,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendanceRate,
      },
    })
  } catch (error) {
    console.error("Get student attendance summary error:", error)
    res.status(500).json({ error: "Failed to fetch attendance summary" })
  }
})

// Get student attendance for specific class (student endpoint)
router.get("/student/class/:classId", authenticateJWT, authorizeRole("STUDENT"), async (req, res) => {
  try {
    const studentId = req.user.id
    const { classId } = req.params

    // Verify student is enrolled in the class
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        students: {
          some: { id: studentId },
        },
      },
    })

    if (!classData) {
      return res.status(403).json({ error: "Not enrolled in this class" })
    }

    // Get attendance for this class
    const attendance = await prisma.attendance.findMany({
      where: {
        studentId,
        session: {
          classId,
        },
      },
      include: {
        session: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
      orderBy: { markedAt: "desc" },
    })

    // Get total sessions for this class
    const totalSessions = await prisma.session.count({
      where: { classId },
    })

    // Calculate summary for this class
    const presentCount = attendance.filter((a) => a.status === "PRESENT").length
    const absentCount = attendance.filter((a) => a.status === "ABSENT").length
    const lateCount = attendance.filter((a) => a.status === "LATE").length
    const excusedCount = attendance.filter((a) => a.status === "EXCUSED").length
    const attendanceRate = totalSessions > 0 ? (presentCount + lateCount) / totalSessions : 0

    res.json({
      attendance,
      summary: {
        totalSessions,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendanceRate,
      },
    })
  } catch (error) {
    console.error("Get student class attendance error:", error)
    res.status(500).json({ error: "Failed to fetch class attendance" })
  }
})

module.exports = router
