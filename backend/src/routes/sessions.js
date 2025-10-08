
const express = require("express")
const { PrismaClient } = require("@prisma/client")
const { authenticateJWT, authorizeRole } = require("../middleware/auth")
const { validateRequest, startSessionSchema } = require("../utils/validation")
const { generateSessionCode } = require("../utils/encryption")

const router = express.Router()
const prisma = new PrismaClient()

// Start attendance session (Teacher only)
router.post(
  "/start",
  authenticateJWT,
  authorizeRole("TEACHER"),
  validateRequest(startSessionSchema),
  async (req, res) => {
    try {
      const { classId } = req.body

      // Verify class exists and teacher owns it
      const classData = await prisma.class.findFirst({
        where: {
          id: classId,
          teacherId: req.user.id,
        },
      })

      if (!classData) {
        return res.status(404).json({ error: "Class not found or access denied" })
      }

      // Check if there's already an active session for this class
      const activeSession = await prisma.session.findFirst({
        where: {
          classId,
          isActive: true,
        },
      })

      if (activeSession) {
        return res.status(400).json({ error: "There is already an active session for this class" })
      }

      // Create new session
      const sessionCode = generateSessionCode()
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

      const session = await prisma.session.create({
        data: {
          classId,
          teacherId: req.user.id,
          code: sessionCode,
          startTime: new Date(),
          expiresAt,
          isActive: true,
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      })

      res.status(201).json({
        session: {
          id: session.id,
          code: session.code,
          startTime: session.startTime,
          expiresAt: session.expiresAt,
          class: session.class,
        },
      })
    } catch (error) {
      console.error("Start session error:", error)
      res.status(500).json({ error: "Failed to start session" })
    }
  },
)

// Get active sessions (accessible by students in their enrolled classes)
router.get("/active", authenticateJWT, async (req, res) => {
  try {
    let activeSessions = []

    if (req.user.role === "STUDENT") {
      // Get active sessions for classes the student is enrolled in
      activeSessions = await prisma.session.findMany({
        where: {
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
          class: {
            studentIds: {
              has: req.user.id,
            },
          },
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { startTime: "desc" },
      })
    } else if (req.user.role === "TEACHER") {
      // Get active sessions for teacher's classes
      activeSessions = await prisma.session.findMany({
        where: {
          teacherId: req.user.id,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { startTime: "desc" },
      })
    } else {
      // Admin can see all active sessions
      activeSessions = await prisma.session.findMany({
        where: {
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          class: {
            select: {
              id: true,
              name: true,
            },
          },
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { startTime: "desc" },
      })
    }

    res.json(activeSessions) // Return array directly for mobile app compatibility
  } catch (error) {
    console.error("Get active sessions error:", error)
    res.status(500).json({ error: "Failed to fetch active sessions" })
  }
})

// Get all classes for the logged-in teacher
router.get("/teacher/classes", authenticateJWT, authorizeRole("TEACHER"), async (req, res) => {
  try {
    const classes = await prisma.class.findMany({
      where: { teacherId: req.user.id },
      include: {
        sessions: {
          orderBy: { startTime: "desc" },
        },
        _count: {
          select: { students: true, sessions: true },
        },
      },
    })
    res.json({ classes })
  } catch (error) {
    console.error("Fetch teacher classes error:", error)
    res.status(500).json({ error: "Failed to fetch teacher classes" })
  }
})

// Get all sessions for the logged-in teacher
router.get("/teacher/sessions", authenticateJWT, authorizeRole("TEACHER"), async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { teacherId: req.user.id },
      orderBy: { startTime: "desc" },
      include: {
        class: {
          select: { id: true, name: true },
        },
      },
    })
    res.json({ sessions })
  } catch (error) {
    console.error("Fetch teacher sessions error:", error)
    res.status(500).json({ error: "Failed to fetch teacher sessions" })
  }
})

// Stop attendance session (Teacher only)
router.put("/:id/stop", authenticateJWT, authorizeRole("TEACHER"), async (req, res) => {
  try {
    const { id } = req.params

    // Verify session exists and teacher owns it
    const session = await prisma.session.findFirst({
      where: {
        id,
        teacherId: req.user.id,
        isActive: true,
      },
    })

    if (!session) {
      return res.status(404).json({ error: "Active session not found or access denied" })
    }

    // Stop session
    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        endTime: new Date(),
        isActive: false,
      },
    })

    res.json({
      message: "Session stopped successfully",
      session: {
        id: updatedSession.id,
        endTime: updatedSession.endTime,
      },
    })
  } catch (error) {
    console.error("Stop session error:", error)
    res.status(500).json({ error: "Failed to stop session" })
  }
})

// Get session details
router.get("/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            teacherId: true,
          },
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
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
    })

    if (!session) {
      return res.status(404).json({ error: "Session not found" })
    }

    // Check permissions
    if (req.user.role === "TEACHER" && session.teacherId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" })
    }

    res.json({ session })
  } catch (error) {
    console.error("Get session error:", error)
    res.status(500).json({ error: "Failed to fetch session" })
  }
})

// Get active sessions for a class
router.get("/class/:classId/active", authenticateJWT, async (req, res) => {
  try {
    const { classId } = req.params

    // Verify user has access to this class
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        OR: [{ teacherId: req.user.id }, { students: { some: { id: req.user.id } } }],
      },
    })

    if (!classData && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied" })
    }

    const activeSession = await prisma.session.findFirst({
      where: {
        classId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    res.json({ session: activeSession })
  } catch (error) {
    console.error("Get active session error:", error)
    res.status(500).json({ error: "Failed to fetch active session" })
  }
})

// Join session by code (Student only)
router.post("/join", authenticateJWT, authorizeRole("STUDENT"), async (req, res) => {
  try {
    const { code, sessionCode } = req.body
    const studentId = req.user.id
    
    // Accept either 'code' or 'sessionCode' field
    const sessionCodeValue = code || sessionCode

    if (!sessionCodeValue) {
      return res.status(400).json({ error: "Session code is required" })
    }

    // Find active session with this code
    const session = await prisma.session.findFirst({
      where: {
        code: sessionCodeValue.toUpperCase(),
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    })

    if (!session) {
      return res.status(404).json({ 
        error: "Invalid or expired session code",
        code: "SESSION_NOT_FOUND"
      })
    }

    // Check if student is already enrolled in this class
    const classEnrollment = await prisma.class.findFirst({
      where: {
        id: session.classId,
        studentIds: {
          has: studentId,
        },
      },
    })

    if (!classEnrollment) {
      // Auto-enroll student in the class
      await prisma.class.update({
        where: { id: session.classId },
        data: {
          studentIds: {
            push: studentId,
          },
        },
      })
    }

    // Check if attendance already marked
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId,
        sessionId: session.id,
      },
    })

    if (existingAttendance) {
      return res.status(400).json({ 
        error: "You have already joined this session",
        code: "ALREADY_JOINED",
        attendance: existingAttendance
      })
    }

    res.json({
      success: true,
      message: "Successfully joined session",
      session: {
        id: session.id,
        code: session.code,
        class: session.class,
        startTime: session.startTime,
        expiresAt: session.expiresAt,
      },
    })
  } catch (error) {
    console.error("Join session error:", error)
    res.status(500).json({ error: "Failed to join session" })
  }
})

// Join session and mark attendance with biometric authentication (Student only)
router.post("/join-and-mark-attendance", authenticateJWT, authorizeRole("STUDENT"), async (req, res) => {
  try {
    const { code, sessionCode, biometricToken } = req.body
    const studentId = req.user.id
    
    // Accept either 'code' or 'sessionCode' field
    const sessionCodeValue = code || sessionCode

    if (!sessionCodeValue) {
      return res.status(400).json({ error: "Session code is required" })
    }

    if (!biometricToken) {
      return res.status(400).json({
        error: "Biometric authentication required",
        code: "BIOMETRIC_REQUIRED"
      })
    }

    // Step 1: Verify biometric authentication first
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

    // Step 2: Find active session with this code
    const session = await prisma.session.findFirst({
      where: {
        code: sessionCodeValue.toUpperCase(),
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            description: true,
            studentIds: true,
          },
        },
      },
    })

    if (!session) {
      return res.status(404).json({ 
        error: "Invalid or expired session code",
        code: "SESSION_NOT_FOUND"
      })
    }

    // Step 3: Check if student is enrolled in this class, if not auto-enroll
    const isEnrolled = session.class.studentIds.includes(studentId)
    
    if (!isEnrolled) {
      await prisma.class.update({
        where: { id: session.classId },
        data: {
          studentIds: {
            push: studentId,
          },
        },
      })
      console.log(`Auto-enrolled student ${studentId} in class ${session.class.name}`)
    }

    // Step 4: Check if attendance already marked
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        studentId,
        sessionId: session.id,
      },
    })

    if (existingAttendance) {
      return res.status(400).json({ 
        error: "You have already marked attendance for this session",
        code: "ALREADY_MARKED",
        attendance: {
          id: existingAttendance.id,
          status: existingAttendance.status,
          markedAt: existingAttendance.markedAt,
          class: session.class
        }
      })
    }

    // Step 5: Calculate attendance status based on timing
    const now = new Date()
    const sessionStart = new Date(session.startTime)
    const minutesLate = Math.floor((now - sessionStart) / (1000 * 60))

    let status = "PRESENT"
    if (minutesLate > 15) {
      status = "LATE"
    }

    // Step 6: Mark attendance
    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        sessionId: session.id,
        markedAt: now,
        status,
        notes: minutesLate > 0 ? `Marked ${minutesLate} minutes after session start` : null,
      },
    })

    console.log(
      `[Integrated Flow] Student ${studentId} joined session and marked attendance - Status: ${status}, Class: ${session.class.name}`
    )

    // Step 7: Return comprehensive response
    res.json({
      success: true,
      message: "Successfully joined session and marked attendance",
      session: {
        id: session.id,
        code: session.code,
        class: session.class,
        startTime: session.startTime,
        expiresAt: session.expiresAt,
      },
      attendance: {
        id: attendance.id,
        status: attendance.status,
        markedAt: attendance.markedAt,
        minutesLate: minutesLate > 0 ? minutesLate : 0,
        class: {
          id: session.class.id,
          name: session.class.name
        }
      },
      enrolled: !isEnrolled ? "Auto-enrolled in class" : "Already enrolled"
    })
  } catch (error) {
    console.error("Join session and mark attendance error:", error)
    res.status(500).json({ error: "Failed to join session and mark attendance" })
  }
})

module.exports = router
