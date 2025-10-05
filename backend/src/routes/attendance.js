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
      const { studentId, sessionId } = req.body

      // Verify student is the authenticated user
      if (studentId !== req.user.id) {
        return res.status(403).json({ error: "Can only mark attendance for yourself" })
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

      // Mark attendance
      const attendance = await prisma.attendance.create({
        data: {
          studentId,
          sessionId,
          markedAt: new Date(),
          status: "PRESENT",
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

      res.status(201).json({
        message: "Attendance marked successfully",
        attendance: {
          id: attendance.id,
          markedAt: attendance.markedAt,
          status: attendance.status,
          class: attendance.session.class,
        },
      })
    } catch (error) {
      console.error("Mark attendance error:", error)
      res.status(500).json({ error: "Failed to mark attendance" })
    }
  },
)

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
                name: true,
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
            name: true,
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
      status: attendanceMap.has(student.id) ? "PRESENT" : "ABSENT",
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

module.exports = router
