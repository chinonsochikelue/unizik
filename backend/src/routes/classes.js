const express = require("express")
const { PrismaClient } = require("@prisma/client")
const { authenticateJWT, authorizeRole } = require("../middleware/auth")
const { validateRequest, createClassSchema } = require("../utils/validation")

const router = express.Router()
const prisma = new PrismaClient()

// Get all classes
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
        sessions: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            code: true,
            startTime: true,
            isActive: true,
          },
          take: 1, // Only get one active session (there should only be one anyway)
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

    // Transform the response to add activeSession property
    const classesWithActiveSession = classes.map(cls => ({
      ...cls,
      activeSession: cls.sessions && cls.sessions.length > 0 ? cls.sessions[0] : null,
      sessions: undefined, // Remove the sessions array from response
    }))

    // Return array directly for mobile app compatibility
    res.json(classesWithActiveSession)
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

// Update class (Admin or Teacher who owns the class)
router.put("/:id", authenticateJWT, authorizeRole("ADMIN", "TEACHER"), async (req, res) => {
  try {
    const { id } = req.params
    const { name, description } = req.body

    // Verify class exists
    const existingClass = await prisma.class.findUnique({
      where: { id },
    })

    if (!existingClass) {
      return res.status(404).json({ error: "Class not found" })
    }

    // Check permissions
    if (req.user.role === "TEACHER" && existingClass.teacherId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" })
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
      },
      include: {
        teacher: {
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
    })

    res.json({ class: updatedClass })
  } catch (error) {
    console.error("Update class error:", error)
    res.status(500).json({ error: "Failed to update class" })
  }
})

// Delete class (Admin only)
router.delete("/:id", authenticateJWT, authorizeRole("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params

    // Soft delete by setting isActive to false
    await prisma.class.update({
      where: { id },
      data: { isActive: false },
    })

    res.json({ message: "Class deleted successfully" })
  } catch (error) {
    console.error("Delete class error:", error)
    res.status(500).json({ error: "Failed to delete class" })
  }
})

// Get available students for class enrollment (Admin or Teacher)
router.get("/:id/available-students", authenticateJWT, authorizeRole("ADMIN", "TEACHER"), async (req, res) => {
  try {
    const { id } = req.params
    const { search = "" } = req.query

    // Verify class exists and user has permission
    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        students: {
          select: { id: true },
        },
      },
    })

    if (!classData) {
      return res.status(404).json({ error: "Class not found" })
    }

    if (req.user.role === "TEACHER" && classData.teacherId !== req.user.id) {
      return res.status(403).json({ error: "Access denied" })
    }

    // Get enrolled student IDs
    const enrolledStudentIds = classData.students.map((s) => s.id)

    // Find available students (not enrolled in this class)
    const whereClause = {
      role: "STUDENT",
      isActive: true,
      id: {
        notIn: enrolledStudentIds,
      },
    }

    if (search) {
      whereClause.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      ]
    }

    const availableStudents = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
      take: 50, // Limit results
      orderBy: { name: "asc" },
    })

    res.json({ 
      availableStudents,
      total: availableStudents.length 
    })
  } catch (error) {
    console.error("Get available students error:", error)
    res.status(500).json({ error: "Failed to fetch available students" })
  }
})

// Student self-enrollment by session code (Students only)
router.post("/enroll", authenticateJWT, authorizeRole("STUDENT"), async (req, res) => {
  try {
    const { classId, classCode } = req.body
    const studentId = req.user.id

    if (!classCode && !classId) {
      return res.status(400).json({ error: "Session code or class ID is required" })
    }

    // Find class by code or ID
    let classData
    if (classId) {
      classData = await prisma.class.findUnique({
        where: { id: classId },
        include: {
          students: {
            select: { id: true }
          },
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      })
    } else {
      // Find class by session code
      const session = await prisma.session.findFirst({
        where: {
          code: classCode.toUpperCase(),
          isActive: true
        },
        include: {
          class: {
            include: {
              students: {
                select: { id: true }
              },
              teacher: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true
                }
              }
            }
          }
        }
      })
      
      if (session) {
        classData = session.class
      } else {
        classData = null
      }
    }

    if (!classData) {
      return res.status(404).json({ error: "Class not found or inactive" })
    }

    // Check if student is already enrolled
    const isAlreadyEnrolled = classData.students.some(student => student.id === studentId)
    if (isAlreadyEnrolled) {
      return res.status(409).json({ 
        error: "Already enrolled",
        message: "You are already enrolled in this class" 
      })
    }

    // Enroll student in class
    await prisma.class.update({
      where: { id: classData.id },
      data: {
        studentIds: {
          push: studentId
        }
      }
    })

    // Log enrollment activity
    console.log(`Student ${req.user.email} enrolled in class ${classData.name}`)

    res.json({
      message: "Successfully enrolled in class",
      class: {
        id: classData.id,
        name: classData.name,
        description: classData.description,
        teacher: classData.teacher
      }
    })
  } catch (error) {
    console.error("Student enrollment error:", error)
    res.status(500).json({ error: "Failed to enroll in class" })
  }
})

// Remove student from class (Admin or Teacher)
router.delete("/:id/students/:studentId", authenticateJWT, authorizeRole("ADMIN", "TEACHER"), async (req, res) => {
  try {
    const { id, studentId } = req.params

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

    // Remove student from class
    await prisma.class.update({
      where: { id },
      data: {
        students: {
          disconnect: { id: studentId },
        },
      },
    })

    res.json({ message: "Student removed from class successfully" })
  } catch (error) {
    console.error("Remove student error:", error)
    res.status(500).json({ error: "Failed to remove student from class" })
  }
})

module.exports = router
