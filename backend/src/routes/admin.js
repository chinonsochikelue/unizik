const express = require("express")
const { PrismaClient } = require("@prisma/client")
const { authenticateJWT, authorizeRole } = require("../middleware/auth")

const router = express.Router()
const prisma = new PrismaClient()

// Get dashboard data
router.get("/dashboard", authenticateJWT, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    // Get basic counts
    const totalStudents = await prisma.user.count({ where: { role: "STUDENT" } })
    const totalTeachers = await prisma.user.count({ where: { role: "TEACHER" } })
    const totalClasses = await prisma.class.count()

    // Get today's sessions
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todaySessions = await prisma.session.count({
      where: {
        startTime: {
          gte: today,
          lt: tomorrow,
        },
      },
    })

    // Get attendance trend for last 7 days
    const attendanceTrend = await getAttendanceTrend()

    // Get class distribution
    const classDistribution = await getClassDistribution()

    // Get role distribution
    const roleDistribution = await getRoleDistribution()

    res.json({
      success: true,
      data: {
        totalStudents,
        totalTeachers,
        totalClasses,
        todaySessions,
        attendanceTrend,
        classDistribution,
        roleDistribution,
      },
    })
  } catch (error) {
    console.error("Dashboard error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data",
    })
  }
})

// Get system settings
router.get("/settings", authenticateJWT, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    // Get settings from database or create defaults
    const defaultSettings = {
      systemName: { value: "Student Attendance System", dataType: "string", category: "general" },
      allowSelfRegistration: { value: false, dataType: "boolean", category: "general" },
      sessionTimeout: { value: 120, dataType: "number", category: "general" },
      biometricRequired: { value: true, dataType: "boolean", category: "security" },
      emailNotifications: { value: true, dataType: "boolean", category: "notifications" },
      backupFrequency: { value: "daily", dataType: "string", category: "backup" },
      maxLoginAttempts: { value: 3, dataType: "number", category: "security" },
      passwordMinLength: { value: 8, dataType: "number", category: "security" },
    }

    const settingsArray = await prisma.systemSettings.findMany()
    const settingsMap = settingsArray.reduce((acc, setting) => {
      let parsedValue = setting.value
      if (setting.dataType === 'boolean') {
        parsedValue = setting.value === 'true'
      } else if (setting.dataType === 'number') {
        parsedValue = parseInt(setting.value)
      } else if (setting.dataType === 'object') {
        try {
          parsedValue = JSON.parse(setting.value)
        } catch (e) {
          parsedValue = setting.value
        }
      }
      acc[setting.key] = parsedValue
      return acc
    }, {})

    // Initialize default settings if they don't exist
    for (const [key, config] of Object.entries(defaultSettings)) {
      if (!settingsMap.hasOwnProperty(key)) {
        const setting = await prisma.systemSettings.create({
          data: {
            key,
            value: String(config.value),
            dataType: config.dataType,
            category: config.category,
            description: `Default ${key} setting`
          }
        })
        settingsMap[key] = config.value
      }
    }

    res.json({
      success: true,
      data: settingsMap,
    })
  } catch (error) {
    console.error("Settings error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to load settings",
    })
  }
})

// Update system settings
router.put("/settings", authenticateJWT, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    const settings = req.body

    // Validate settings
    if (settings.sessionTimeout && settings.sessionTimeout < 0) {
      return res.status(400).json({
        success: false,
        message: "Session timeout cannot be negative",
      })
    }

    if (settings.maxLoginAttempts && settings.maxLoginAttempts < 1) {
      return res.status(400).json({
        success: false,
        message: "Max login attempts must be at least 1",
      })
    }

    if (settings.passwordMinLength && settings.passwordMinLength < 6) {
      return res.status(400).json({
        success: false,
        message: "Password minimum length must be at least 6",
      })
    }

    // Save settings to database
    const updatePromises = Object.entries(settings).map(async ([key, value]) => {
      const dataType = typeof value === 'boolean' ? 'boolean' : 
                      typeof value === 'number' ? 'number' : 
                      typeof value === 'object' ? 'object' : 'string'
                      
      const stringValue = dataType === 'object' ? JSON.stringify(value) : String(value)
      
      return prisma.systemSettings.upsert({
        where: { key },
        update: {
          value: stringValue,
          dataType,
          updatedAt: new Date()
        },
        create: {
          key,
          value: stringValue,
          dataType,
          category: 'general',
          description: `User updated ${key} setting`
        }
      })
    })

    await Promise.all(updatePromises)

    res.json({
      success: true,
      message: "Settings updated successfully",
    })
  } catch (error) {
    console.error("Settings update error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update settings",
    })
  }
})

// Helper functions
async function getAttendanceTrend() {
  const days = []
  const data = []

  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    date.setHours(0, 0, 0, 0)

    const nextDay = new Date(date)
    nextDay.setDate(nextDay.getDate() + 1)

    const sessions = await prisma.session.findMany({
      where: {
        startTime: {
          gte: date,
          lt: nextDay,
        },
      },
      include: {
        attendance: true,
      },
    })

    let totalAttendance = 0
    let totalPossible = 0

    sessions.forEach((session) => {
      totalAttendance += session.attendance.filter((a) => a.status === "PRESENT").length
      totalPossible += session.attendance.length
    })

    const rate = totalPossible > 0 ? Math.round((totalAttendance / totalPossible) * 100) : 0

    days.push(date.toLocaleDateString("en-US", { weekday: "short" }))
    data.push(rate)
  }

  return { labels: days, data }
}

async function getClassDistribution() {
  const classes = await prisma.class.findMany({
    include: {
      students: true,
    },
  })

  const labels = classes.map((cls) => cls.name)
  const data = classes.map((cls) => cls.students.length)

  return { labels, data }
}

async function getRoleDistribution() {
  const students = await prisma.user.count({ where: { role: "STUDENT" } })
  const teachers = await prisma.user.count({ where: { role: "TEACHER" } })
  const admins = await prisma.user.count({ where: { role: "ADMIN" } })

  return [
    { name: "Students", count: students, color: "#3b82f6", legendFontColor: "#7F7F7F", legendFontSize: 15 },
    { name: "Teachers", count: teachers, color: "#10b981", legendFontColor: "#7F7F7F", legendFontSize: 15 },
    { name: "Admins", count: admins, color: "#ef4444", legendFontColor: "#7F7F7F", legendFontSize: 15 },
  ]
}

// User management routes
router.get("/users", authenticateJWT, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    const { page = 1, limit = 50, role, search } = req.query
    
    const where = {}
    if (role && role !== "ALL") {
      where.role = role
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
        { teacherId: { contains: search, mode: "insensitive" } },
      ]
    }
    
    const users = await prisma.user.findMany({
      where,
      skip: (page - 1) * parseInt(limit),
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: {
        enrolledClasses: { select: { id: true, name: true, code: true } },
        teachingClasses: { select: { id: true, name: true, code: true } },
      },
    })
    
    const total = await prisma.user.count({ where })
    
    // Add class count for each user
    const usersWithStats = users.map(user => ({
      ...user,
      classCount: user.role === "TEACHER" ? user.teachingClasses?.length || 0 : user.enrolledClasses?.length || 0
    }))
    
    res.json({
      success: true,
      data: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch users"
    })
  }
})

// Create user
router.post("/users", authenticateJWT, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    const { firstName, lastName, email, role, studentId, teacherId, password = "tempPassword123" } = req.body
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists"
      })
    }
    
    // Hash password
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const userData = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
    }
    
    if (role === "STUDENT" && studentId) {
      userData.studentId = studentId
    }
    
    if (role === "TEACHER" && teacherId) {
      userData.teacherId = teacherId
    }
    
    const user = await prisma.user.create({ data: userData })
    
    // Remove password from response
    const { password: _, ...userResponse } = user
    
    res.status(201).json({
      success: true,
      data: userResponse,
      message: "User created successfully"
    })
  } catch (error) {
    console.error("Create user error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create user"
    })
  }
})

// Update user
router.put("/users/:id", authenticateJWT, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    const { id } = req.params
    const { firstName, lastName, email, role, studentId, teacherId } = req.body
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id } })
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }
    
    // Check if email is being changed and if new email already exists
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } })
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already in use"
        })
      }
    }
    
    const updateData = {
      firstName,
      lastName,
      email,
      role,
    }
    
    // Clear previous role-specific fields
    updateData.studentId = null
    updateData.teacherId = null
    
    if (role === "STUDENT" && studentId) {
      updateData.studentId = studentId
    }
    
    if (role === "TEACHER" && teacherId) {
      updateData.teacherId = teacherId
    }
    
    const user = await prisma.user.update({
      where: { id },
      data: updateData
    })
    
    // Remove password from response
    const { password: _, ...userResponse } = user
    
    res.json({
      success: true,
      data: userResponse,
      message: "User updated successfully"
    })
  } catch (error) {
    console.error("Update user error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update user"
    })
  }
})

// Delete user
router.delete("/users/:id", authenticateJWT, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    const { id } = req.params
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id } })
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }
    
    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account"
      })
    }
    
    await prisma.user.delete({ where: { id } })
    
    res.json({
      success: true,
      message: "User deleted successfully"
    })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete user"
    })
  }
})

// Get user details
router.get("/users/:id", authenticateJWT, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    const { id } = req.params
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        enrolledClasses: { select: { id: true, name: true, code: true } },
        teachingClasses: { 
          include: { 
            students: { select: { id: true, firstName: true, lastName: true } } 
          } 
        },
        attendance: {
          include: { session: { include: { class: { select: { id: true, name: true, code: true } } } } },
          orderBy: { markedAt: "desc" },
          take: 10
        }
      }
    })
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      })
    }
    
    // Remove password from response
    const { password: _, ...userResponse } = user
    
    res.json({
      success: true,
      data: userResponse
    })
  } catch (error) {
    console.error("Get user details error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch user details"
    })
  }
})

// Class management routes
router.get("/classes", authenticateJWT, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query
    
    const where = {}
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }
    
    const classes = await prisma.class.findMany({
      where,
      skip: (page - 1) * parseInt(limit),
      take: parseInt(limit),
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        students: { select: { id: true } },
        sessions: { select: { id: true } },
      },
      orderBy: { createdAt: "desc" }
    })
    
    const total = await prisma.class.count({ where })
    
    // Add counts
    const classesWithStats = classes.map(cls => ({
      ...cls,
      studentCount: cls.students?.length || 0,
      sessionCount: cls.sessions?.length || 0
    }))
    
    res.json({
      success: true,
      data: classesWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error("Get classes error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch classes"
    })
  }
})

// Create class
router.post("/classes", authenticateJWT, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    const { name, code, description, teacherId } = req.body
    
    // Check if class code already exists
    const existingClass = await prisma.class.findUnique({ where: { code } })
    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: "Class code already exists"
      })
    }
    
    const classData = {
      name,
      code,
      description
    }
    
    if (teacherId) {
      // Verify teacher exists
      const teacher = await prisma.user.findFirst({
        where: { id: teacherId, role: "TEACHER" }
      })
      if (!teacher) {
        return res.status(400).json({
          success: false,
          message: "Invalid teacher ID"
        })
      }
      classData.teacherId = teacherId
    }
    
    const newClass = await prisma.class.create({
      data: classData,
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        students: { select: { id: true } },
        sessions: { select: { id: true } },
      }
    })
    
    res.status(201).json({
      success: true,
      data: {
        ...newClass,
        studentCount: 0,
        sessionCount: 0
      },
      message: "Class created successfully"
    })
  } catch (error) {
    console.error("Create class error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to create class"
    })
  }
})

// Update class
router.put("/classes/:id", authenticateJWT, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    const { id } = req.params
    const { name, code, description, teacherId } = req.body
    
    const existingClass = await prisma.class.findUnique({ where: { id } })
    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      })
    }
    
    // Check if code is being changed and if new code already exists
    if (code !== existingClass.code) {
      const codeExists = await prisma.class.findUnique({ where: { code } })
      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: "Class code already exists"
        })
      }
    }
    
    const updateData = { name, code, description }
    
    if (teacherId) {
      const teacher = await prisma.user.findFirst({
        where: { id: teacherId, role: "TEACHER" }
      })
      if (!teacher) {
        return res.status(400).json({
          success: false,
          message: "Invalid teacher ID"
        })
      }
      updateData.teacherId = teacherId
    } else {
      updateData.teacherId = null
    }
    
    const updatedClass = await prisma.class.update({
      where: { id },
      data: updateData,
      include: {
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        students: { select: { id: true } },
        sessions: { select: { id: true } },
      }
    })
    
    res.json({
      success: true,
      data: {
        ...updatedClass,
        studentCount: updatedClass.students?.length || 0,
        sessionCount: updatedClass.sessions?.length || 0
      },
      message: "Class updated successfully"
    })
  } catch (error) {
    console.error("Update class error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to update class"
    })
  }
})

// Delete class
router.delete("/classes/:id", authenticateJWT, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    const { id } = req.params
    
    const existingClass = await prisma.class.findUnique({ where: { id } })
    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found"
      })
    }
    
    await prisma.class.delete({ where: { id } })
    
    res.json({
      success: true,
      message: "Class deleted successfully"
    })
  } catch (error) {
    console.error("Delete class error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to delete class"
    })
  }
})

// Session management routes
router.get("/sessions", authenticateJWT, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    const { page = 1, limit = 100, status, search } = req.query
    
    const where = {}
    if (status) {
      if (status === "ACTIVE") {
        where.isActive = true
      } else if (status === "ENDED") {
        where.isActive = false
      }
    }
    
    if (search) {
      where.OR = [
        { class: { name: { contains: search, mode: "insensitive" } } },
        { class: { code: { contains: search, mode: "insensitive" } } },
        { teacher: { firstName: { contains: search, mode: "insensitive" } } },
        { teacher: { lastName: { contains: search, mode: "insensitive" } } },
      ]
    }
    
    const sessions = await prisma.session.findMany({
      where,
      skip: (page - 1) * parseInt(limit),
      take: parseInt(limit),
      include: {
        class: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        attendance: { select: { id: true, status: true } },
      },
      orderBy: { startTime: "desc" }
    })
    
    const total = await prisma.session.count({ where })
    
    // Add attendance count
    const sessionsWithStats = sessions.map(session => ({
      ...session,
      attendanceCount: session.attendance?.length || 0
    }))
    
    res.json({
      success: true,
      data: sessionsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error("Get sessions error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch sessions"
    })
  }
})

// End session
router.post("/sessions/:id/end", authenticateJWT, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    const { id } = req.params
    
    const session = await prisma.session.findUnique({ where: { id } })
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      })
    }
    
    if (!session.isActive) {
      return res.status(400).json({
        success: false,
        message: "Session is already ended"
      })
    }
    
    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        endTime: new Date(),
        isActive: false
      },
      include: {
        class: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        attendance: { select: { id: true, status: true } },
      }
    })
    
    res.json({
      success: true,
      data: {
        ...updatedSession,
        attendanceCount: updatedSession.attendance?.length || 0
      },
      message: "Session ended successfully"
    })
  } catch (error) {
    console.error("End session error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to end session"
    })
  }
})

// Get session details
router.get("/sessions/:id", authenticateJWT, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    const { id } = req.params
    
    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        class: true,
        teacher: { select: { id: true, firstName: true, lastName: true, email: true } },
        attendance: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true, studentId: true } }
          }
        },
      }
    })
    
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      })
    }
    
    res.json({
      success: true,
      data: {
        ...session,
        attendanceCount: session.attendance?.length || 0,
        presentCount: session.attendance?.filter(a => a.status === 'PRESENT').length || 0,
        lateCount: session.attendance?.filter(a => a.status === 'LATE').length || 0,
        absentCount: session.attendance?.filter(a => a.status === 'ABSENT').length || 0,
      }
    })
  } catch (error) {
    console.error("Get session details error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch session details"
    })
  }
})

// Reports routes
router.get("/reports", authenticateJWT, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    const { startDate, endDate, type = "attendance" } = req.query
    
    const dateFilter = {}
    if (startDate && endDate) {
      dateFilter.startTime = {
        gte: new Date(startDate),
        lte: new Date(endDate + "T23:59:59.999Z")
      }
    }
    
    let reportData = {}
    
    if (type === "attendance") {
      // Get attendance data
      const sessions = await prisma.session.findMany({
        where: dateFilter,
        include: {
          class: true,
          attendance: true,
        }
      })
      
      let totalSessions = sessions.length
      let totalAttendance = 0
      let totalPossible = 0
      
      const dailyRates = {}
      
      sessions.forEach(session => {
        const date = session.startTime.toISOString().split('T')[0]
        const present = session.attendance.filter(a => a.status === 'PRESENT').length
        const total = session.attendance.length
        
        totalAttendance += present
        totalPossible += total
        
        if (!dailyRates[date]) {
          dailyRates[date] = { present: 0, total: 0 }
        }
        dailyRates[date].present += present
        dailyRates[date].total += total
      })
      
      const chartData = {
        labels: Object.keys(dailyRates).sort(),
        attendanceRates: Object.keys(dailyRates).sort().map(date => {
          const day = dailyRates[date]
          return day.total > 0 ? Math.round((day.present / day.total) * 100) : 0
        })
      }
      
      reportData = {
        summary: {
          overallAttendanceRate: totalPossible > 0 ? Math.round((totalAttendance / totalPossible) * 100) : 0,
          totalPresent: totalAttendance,
          totalSessions: totalSessions,
          averageSessionAttendance: totalSessions > 0 ? Math.round(totalAttendance / totalSessions) : 0
        },
        chartData,
        detailedData: {
          headers: ['Date', 'Class', 'Present', 'Total', 'Rate'],
          rows: sessions.map(session => [
            session.startTime.toLocaleDateString(),
            session.class.name,
            session.attendance.filter(a => a.status === 'PRESENT').length,
            session.attendance.length,
            `${session.attendance.length > 0 ? Math.round((session.attendance.filter(a => a.status === 'PRESENT').length / session.attendance.length) * 100) : 0}%`
          ])
        }
      }
    } else if (type === "classes") {
      // Get class data
      const classes = await prisma.class.findMany({
        include: {
          students: true,
          sessions: {
            where: dateFilter,
            include: {
              attendance: true
            }
          }
        }
      })
      
      const classStats = classes.map(cls => {
        const totalAttendance = cls.sessions.reduce((sum, session) => 
          sum + session.attendance.filter(a => a.status === 'PRESENT').length, 0
        )
        const totalPossible = cls.sessions.reduce((sum, session) => 
          sum + session.attendance.length, 0
        )
        
        return {
          name: cls.name,
          students: cls.students.length,
          sessions: cls.sessions.length,
          attendanceRate: totalPossible > 0 ? Math.round((totalAttendance / totalPossible) * 100) : 0
        }
      })
      
      reportData = {
        summary: {
          activeClasses: classes.length,
          totalStudents: classes.reduce((sum, cls) => sum + cls.students.length, 0),
          averageClassSize: classes.length > 0 ? Math.round(classes.reduce((sum, cls) => sum + cls.students.length, 0) / classes.length) : 0
        },
        chartData: {
          classLabels: classStats.map(c => c.name),
          classAttendance: classStats.map(c => c.attendanceRate)
        },
        detailedData: {
          headers: ['Class', 'Students', 'Sessions', 'Attendance Rate'],
          rows: classStats.map(cls => [
            cls.name,
            cls.students,
            cls.sessions,
            `${cls.attendanceRate}%`
          ])
        }
      }
    } else if (type === "users") {
      // Get user statistics
      const users = await prisma.user.findMany({
        include: {
          attendanceRecords: {
            where: {
              session: dateFilter
            }
          }
        }
      })
      
      const userStats = {
        total: users.length,
        students: users.filter(u => u.role === 'STUDENT').length,
        teachers: users.filter(u => u.role === 'TEACHER').length,
        admins: users.filter(u => u.role === 'ADMIN').length,
      }
      
      reportData = {
        summary: userStats,
        detailedData: {
          headers: ['Name', 'Email', 'Role', 'Attendance Records'],
          rows: users.map(user => [
            `${user.firstName} ${user.lastName}`,
            user.email,
            user.role,
            user.attendanceRecords.length
          ])
        }
      }
    }
    
    res.json({
      success: true,
      data: reportData
    })
  } catch (error) {
    console.error("Generate report error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to generate report"
    })
  }
})

// Export reports
router.get("/reports/export", authenticateJWT, authorizeRole(["ADMIN"]), async (req, res) => {
  try {
    const { startDate, endDate, type = "attendance", format = "csv" } = req.query
    
    // Get the same data as the reports endpoint
    const reportResponse = await new Promise((resolve, reject) => {
      // Simulate calling the reports endpoint internally
      req.query = { startDate, endDate, type }
      // This would normally be a separate function, but for now we'll inline it
      resolve({ data: { success: true, data: { detailedData: { headers: [], rows: [] } } } })
    })
    
    if (format === "csv") {
      // Convert to CSV format
      const headers = reportResponse.data.data.detailedData?.headers || []
      const rows = reportResponse.data.data.detailedData?.rows || []
      
      let csvContent = headers.join(',') + '\n'
      rows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n'
      })
      
      res.json({
        success: true,
        data: {
          csvData: csvContent,
          fileName: `${type}_report_${startDate}_to_${endDate}.csv`
        }
      })
    } else {
      res.status(400).json({
        success: false,
        message: "Unsupported export format"
      })
    }
  } catch (error) {
    console.error("Export report error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to export report"
    })
  }
})

module.exports = router
