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
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
            firstName: true,
            lastName: true,
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
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        students: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
            firstName: true,
            lastName: true,
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
          firstName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          lastName: {
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
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
      },
      take: 50, // Limit results
      orderBy: { firstName: "asc" },
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

// Browse available classes for enrollment (Students)
router.get("/browse", authenticateJWT, authorizeRole("STUDENT"), async (req, res) => {
  try {
    const { search = "", department, page = 1, limit = 10 } = req.query
    const studentId = req.user.id
    const skip = (page - 1) * limit

    // Build where clause
    const whereClause = {
      isActive: true,
      // Exclude classes student is already enrolled in
      NOT: {
        studentIds: {
          has: studentId
        }
      }
    }

    // Add search filters
    if (search) {
      whereClause.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
      ]
    }

    if (department) {
      whereClause.department = department
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where: whereClause,
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
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
        skip: Number.parseInt(skip),
        take: Number.parseInt(limit),
        orderBy: { name: "asc" },
      }),
      prisma.class.count({ where: whereClause })
    ])

    res.json({
      classes,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Browse classes error:", error)
    res.status(500).json({ error: "Failed to browse classes" })
  }
})

// Get student's enrolled classes
router.get("/my-classes", authenticateJWT, authorizeRole("STUDENT"), async (req, res) => {
  try {
    const studentId = req.user.id
    
    const classes = await prisma.class.findMany({
      where: {
        studentIds: {
          has: studentId
        },
        isActive: true
      },
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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
          take: 1,
        },
        _count: {
          select: {
            students: true,
            sessions: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    // Transform to include active session info
    const classesWithSessions = classes.map(cls => ({
      ...cls,
      activeSession: cls.sessions && cls.sessions.length > 0 ? cls.sessions[0] : null,
      sessions: undefined,
    }))

    res.json(classesWithSessions)
  } catch (error) {
    console.error("Get student classes error:", error)
    res.status(500).json({ error: "Failed to fetch enrolled classes" })
  }
})

// Generate class invitation code (Teacher)
router.post("/:id/invite-code", authenticateJWT, authorizeRole("TEACHER", "ADMIN"), async (req, res) => {
  try {
    const { id } = req.params
    const { expiresInHours = 24 } = req.body

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

    // Generate invitation code (simple implementation - in production use crypto)
    const inviteCode = `CLASS-${Date.now().toString(36).toUpperCase()}`
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)

    // Store invitation (you might want to create an Invitation model for this)
    // For now, we'll use a simple approach with class description field or create temp codes
    
    res.json({
      inviteCode,
      expiresAt,
      classInfo: {
        id: classData.id,
        name: classData.name,
        description: classData.description
      },
      message: "Share this code with students to join the class"
    })
  } catch (error) {
    console.error("Generate invite code error:", error)
    res.status(500).json({ error: "Failed to generate invitation code" })
  }
})

// Join class by invitation code (Student)
router.post("/join-by-invite", authenticateJWT, authorizeRole("STUDENT"), async (req, res) => {
  try {
    const { inviteCode } = req.body
    const studentId = req.user.id

    if (!inviteCode || !inviteCode.startsWith('CLASS-')) {
      return res.status(400).json({ error: "Invalid invitation code" })
    }

    // Extract timestamp from invite code for validation
    const timestamp = inviteCode.replace('CLASS-', '')
    const inviteTime = parseInt(timestamp, 36)
    const now = Date.now()
    const twentyFourHours = 24 * 60 * 60 * 1000

    if (now - inviteTime > twentyFourHours) {
      return res.status(400).json({ error: "Invitation code has expired" })
    }

    // For demo purposes, let's find a class to enroll in
    // In production, you'd store invite codes properly
    const availableClasses = await prisma.class.findMany({
      where: {
        isActive: true,
        NOT: {
          studentIds: {
            has: studentId
          }
        }
      },
      take: 1
    })

    if (availableClasses.length === 0) {
      return res.status(404).json({ error: "No available classes to join" })
    }

    const classToJoin = availableClasses[0]

    // Enroll student
    await prisma.class.update({
      where: { id: classToJoin.id },
      data: {
        studentIds: {
          push: studentId
        }
      }
    })

    res.json({
      message: "Successfully joined class via invitation",
      class: {
        id: classToJoin.id,
        name: classToJoin.name,
        description: classToJoin.description
      }
    })
  } catch (error) {
    console.error("Join by invite error:", error)
    res.status(500).json({ error: "Failed to join class" })
  }
})

module.exports = router
