
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
            name: true,
          },
        },
        attendance: {
          include: {
            student: {
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

module.exports = router
