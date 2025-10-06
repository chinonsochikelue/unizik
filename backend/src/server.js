const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
require("dotenv").config()

const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/users")
const classRoutes = require("./routes/classes")
const sessionRoutes = require("./routes/sessions")
const attendanceRoutes = require("./routes/attendance")
const reportRoutes = require("./routes/reports")
const devRoutes = require("./routes/dev")
const adminRoutes = require("./routes/admin")
const fingerprintRoutes = require("./routes/fingerprints")

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(helmet())
app.use(cors())
app.use(morgan("combined"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/classes", classRoutes)
// app.use("/api/classes/teacher/classes", classRoutes)
app.use("/api/sessions", sessionRoutes)
// app.use("/api/sessions/teacher/sessions", sessionRoutes)
app.use("/api/attendance", attendanceRoutes)
app.use("/api/reports", reportRoutes)
app.use("/api/admin", adminRoutes)
app.use("/api/fingerprints", fingerprintRoutes)

// Development routes (only in dev mode)
if (process.env.DEV_MODE === "true") {
  app.use("/api/dev", devRoutes)
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    error: "Something went wrong!",
    message: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  })
})

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV}`)
  console.log(`Dev mode: ${process.env.DEV_MODE}`)
})

module.exports = app
