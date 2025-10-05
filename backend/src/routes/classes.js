const express = require("express")
const { PrismaClient } = require("@prisma/client")
const { authenticateJWT, authorizeRole } = require("../middleware/auth")
const { validateRequest, createClassSchema } = require("../utils/validation")

const router = express.Router()
const prisma = new PrismaClient()

// Get all classes
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const { teacherId } = req.query
    const where = {}

    // Filter by teacher if specified or if user is a teacher
    if (teacherId) {
      where.teacherId = teacherId
    } else if (req.user.role === "TEACHER") {
      where.teacherId = req.user.id
    }

    const classes = await prisma.class.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        students: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            students: true,
            sessions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    res.json({ classes })
  } catch (error) {
    console.error("Get classes error:", error)
    res.status(500).json({ error: "Failed to fetch classes" })
  }
})

// Create class (Admin only)
router.post("/", authenticateJWT, authorizeRole("ADMIN"), validateRequest(createClassSchema), async (req, res) => {
  try {
    const { name, description, teacherId } = req.body

    // Verify teacher exists and has TEACHER role
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        role: "TEACHER",
        isActive: true,
      },
    })

    if (!teacher) {
      return res.status(400).json({ error: "Invalid teacher ID" })
    }

    const newClass = await prisma.class.create({
      data: {
        name,
        description,
        teacherId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    res.status(201).json({ class: newClass })
  } catch (error) {
    console.error("Create class error:", error)
    res.status(500).json({ error: "Failed to create class" })
  }
})

// Get class by ID
router.get("/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params

    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        students: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sessions: {
          select: {
            id: true,
            code: true,
            startTime: true,
            endTime: true,
            isActive: true,
          },
          orderBy: { startTime: "desc" },
        },
      },
    })

    if (!classData) {
      return res.status(404).json({ error: "Class not found" })
    }

    // Check permissions
    if (req.user.role === "TEACHER" && classData.teacherId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" })
    }

    res.json({ class: classData })
  } catch (error) {
    console.error("Get class error:", error)
    res.status(500).json({ error: "Failed to fetch class" })
  }
})

// Add student to class (Admin or Teacher)
router.post("/:id/students", authenticateJWT, authorizeRole("ADMIN", "TEACHER"), async (req, res) => {
  try {
    const { id } = req.params
    const { studentId } = req.body

    // Verify class exists and user has permission
    const classData = await prisma.class.findUnique({
      where: { id },
    })

    if (!classData) {
      return res.status(404).json({ error: "Class not found" })
    }

    if (req.user.role === "TEACHER" && classData.teacherId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" })
    }

    // Verify student exists and has STUDENT role
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: "STUDENT",
        isActive: true,
      },
    })

    if (!student) {
      return res.status(400).json({ error: "Invalid student ID" })
    }

    // Add student to class
    await prisma.class.update({
      where: { id },
      data: {
        students: {
          connect: { id: studentId },
        },
      },
    })

    res.json({ message: "Student added to class successfully" })
  } catch (error) {
    console.error("Add student error:", error)
    res.status(500).json({ error: "Failed to add student to class" })
  }
})

module.exports = router
