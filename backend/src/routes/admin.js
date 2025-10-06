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
    // In a real app, these would be stored in database
    const settings = {
      systemName: "Student Attendance System",
      allowSelfRegistration: false,
      sessionTimeout: 120,
      biometricRequired: true,
      emailNotifications: true,
      backupFrequency: "daily",
      maxLoginAttempts: 3,
      passwordMinLength: 8,
    }

    res.json({
      success: true,
      data: settings,
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
    // In a real app, these would be saved to database
    const settings = req.body

    // Validate settings
    if (settings.sessionTimeout < 0) {
      return res.status(400).json({
        success: false,
        message: "Session timeout cannot be negative",
      })
    }

    if (settings.maxLoginAttempts < 1) {
      return res.status(400).json({
        success: false,
        message: "Max login attempts must be at least 1",
      })
    }

    if (settings.passwordMinLength < 6) {
      return res.status(400).json({
        success: false,
        message: "Password minimum length must be at least 6",
      })
    }

    // Save settings (in real app, save to database)
    console.log("Settings updated:", settings)

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

module.exports = router
