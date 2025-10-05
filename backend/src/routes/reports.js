const express = require("express")
const { PrismaClient } = require("@prisma/client")
const { authenticateJWT, authorizeRole } = require("../middleware/auth")

const router = express.Router()
const prisma = new PrismaClient()

// Get attendance analytics (Admin/Teacher)
router.get("/analytics", authenticateJWT, authorizeRole("ADMIN", "TEACHER"), async (req, res) => {
  try {
    const { classId, startDate, endDate, period = "daily" } = req.query

    const where = {}
    if (classId) {
      where.session = { classId }
    }
    if (req.user.role === "TEACHER") {
      where.session = {
        ...where.session,
        teacherId: req.user.id,
      }
    }
    if (startDate && endDate) {
      where.markedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    // Get attendance data
    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        session: {
          include: {
            class: {
              select: {
                id: true,
                name: true,
                _count: {
                  select: { students: true },
                },
              },
            },
          },
        },
      },
    })

    // Calculate analytics
    const analytics = {
      totalSessions: new Set(attendance.map((a) => a.sessionId)).size,
      totalAttendance: attendance.length,
      averageAttendanceRate: 0,
      byPeriod: {},
    }

    if (attendance.length > 0) {
      // Group by period (daily/weekly)
      const groupedData = {}
      attendance.forEach((record) => {
        const date = new Date(record.markedAt)
        let key

        if (period === "weekly") {
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = weekStart.toISOString().split("T")[0]
        } else {
          key = date.toISOString().split("T")[0]
        }

        if (!groupedData[key]) {
          groupedData[key] = {
            date: key,
            present: 0,
            sessions: new Set(),
          }
        }

        groupedData[key].present++
        groupedData[key].sessions.add(record.sessionId)
      })

      analytics.byPeriod = Object.values(groupedData).map((data) => ({
        date: data.date,
        present: data.present,
        sessions: data.sessions.size,
        attendanceRate: data.sessions.size > 0 ? (data.present / data.sessions.size) * 100 : 0,
      }))

      // Calculate overall average
      const totalRate = analytics.byPeriod.reduce((sum, period) => sum + period.attendanceRate, 0)
      analytics.averageAttendanceRate = analytics.byPeriod.length > 0 ? totalRate / analytics.byPeriod.length : 0
    }

    res.json({ analytics })
  } catch (error) {
    console.error("Get analytics error:", error)
    res.status(500).json({ error: "Failed to fetch analytics" })
  }
})

// Export attendance CSV (Admin/Teacher)
router.get("/export/csv", authenticateJWT, authorizeRole("ADMIN", "TEACHER"), async (req, res) => {
  try {
    const { classId, startDate, endDate } = req.query

    const where = {}
    if (classId) {
      where.session = { classId }
    }
    if (req.user.role === "TEACHER") {
      where.session = {
        ...where.session,
        teacherId: req.user.id,
      }
    }
    if (startDate && endDate) {
      where.markedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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
      orderBy: { markedAt: "desc" },
    })

    // Generate CSV content
    const csvHeaders = ["Student Name", "Student Email", "Class", "Session Code", "Date", "Time", "Status"]
    const csvRows = attendance.map((record) => [
      record.student.name,
      record.student.email,
      record.session.class.name,
      record.session.code,
      record.markedAt.toISOString().split("T")[0],
      record.markedAt.toISOString().split("T")[1].split(".")[0],
      record.status,
    ])

    const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

    res.setHeader("Content-Type", "text/csv")
    res.setHeader("Content-Disposition", 'attachment; filename="attendance-report.csv"')
    res.send(csvContent)
  } catch (error) {
    console.error("Export CSV error:", error)
    res.status(500).json({ error: "Failed to export CSV" })
  }
})

// Dashboard endpoint for admin dashboard
router.get("/dashboard", authenticateJWT, authorizeRole("ADMIN"), async (req, res) => {
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

// Detailed reports endpoint
router.get("/detailed", authenticateJWT, authorizeRole("ADMIN", "TEACHER"), async (req, res) => {
  try {
    const { startDate, endDate, type = "attendance" } = req.query

    let summary = {}
    let chartData = {}
    let detailedData = {}

    if (type === "attendance") {
      // Get attendance summary
      const attendanceRecords = await prisma.attendance.findMany({
        where: {
          markedAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        include: {
          student: true,
          session: {
            include: {
              class: true,
            },
          },
        },
      })

      const totalSessions = await prisma.session.count({
        where: {
          startTime: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      })

      const totalPresent = attendanceRecords.filter((a) => a.status === "PRESENT").length
      const overallAttendanceRate =
        attendanceRecords.length > 0 ? Math.round((totalPresent / attendanceRecords.length) * 100) : 0

      summary = {
        overallAttendanceRate,
        totalPresent,
        totalSessions,
        totalStudents: await prisma.user.count({ where: { role: "STUDENT" } }),
        activeClasses: await prisma.class.count(),
        averageSessionAttendance: overallAttendanceRate,
      }

      // Generate chart data for attendance trend
      const trendData = await generateAttendanceTrendData(startDate, endDate)
      chartData = {
        labels: trendData.labels,
        attendanceRates: trendData.data,
      }

      // Generate detailed data table
      detailedData = {
        headers: ["Student", "Class", "Date", "Status"],
        rows: attendanceRecords
          .slice(0, 50)
          .map((record) => [
            `${record.student.firstName} ${record.student.lastName}`,
            record.session.class.name,
            record.markedAt.toLocaleDateString(),
            record.status,
          ]),
      }
    }

    res.json({
      success: true,
      data: {
        summary,
        chartData,
        detailedData,
      },
    })
  } catch (error) {
    console.error("Detailed reports error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to load detailed reports",
    })
  }
})

// Export endpoint
router.get("/export", authenticateJWT, authorizeRole("ADMIN", "TEACHER"), async (req, res) => {
  try {
    const { startDate, endDate, type, format = "csv" } = req.query

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        markedAt: {
          gte: new Date(startDate),
          lte: new Date(endDate),
        },
      },
      include: {
        student: true,
        session: {
          include: {
            class: true,
          },
        },
      },
    })

    if (format === "csv") {
      const csvHeaders = ["Student Name", "Student ID", "Class", "Date", "Time", "Status"]
      const csvRows = attendanceRecords.map((record) => [
        `${record.student.firstName} ${record.student.lastName}`,
        record.student.studentId || record.student.id,
        record.session.class.name,
        record.markedAt.toLocaleDateString(),
        record.markedAt.toLocaleTimeString(),
        record.status,
      ])

      const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n")

      res.json({
        success: true,
        data: {
          csvData: csvContent,
        },
      })
    }
  } catch (error) {
    console.error("Export error:", error)
    res.status(500).json({
      success: false,
      message: "Failed to export data",
    })
  }
})

// Helper functions for dashboard data
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

  const labels = classes.map((cls) => cls.code)
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

async function generateAttendanceTrendData(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const days = []
  const data = []

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const attendance = await prisma.attendance.findMany({
      where: {
        markedAt: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    })

    const presentCount = attendance.filter((a) => a.status === "PRESENT").length
    const rate = attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0

    days.push(date.toLocaleDateString("en-US", { month: "short", day: "numeric" }))
    data.push(rate)
  }

  return { labels: days, data }
}

module.exports = router
