const express = require("express")
const { PrismaClient } = require("@prisma/client")
const { authenticateJWT } = require("../middleware/auth")

const router = express.Router()
const prisma = new PrismaClient()

// Simulate fingerprint operations (Development only)
router.post("/fingerprint-simulate", authenticateJWT, async (req, res) => {
  try {
    const { studentId, action } = req.body

    if (!["enroll", "verify"].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be "enroll" or "verify"' })
    }

    // Verify student exists
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        role: "STUDENT",
        isActive: true,
      },
    })

    if (!student) {
      return res.status(404).json({ error: "Student not found" })
    }

    if (action === "enroll") {
      // Simulate fingerprint enrollment
      const templateBase64 = Buffer.from(`simulated-template-${studentId}-${Date.now()}`).toString("base64")

      // Store simulated fingerprint template
      await prisma.fingerprint.upsert({
        where: { userId: studentId },
        update: {
          templateData: templateBase64,
          updatedAt: new Date(),
        },
        create: {
          userId: studentId,
          templateData: templateBase64,
        },
      })

      res.json({
        success: true,
        message: "Fingerprint enrolled successfully",
        templateId: `sim-${studentId}`,
      })
    } else if (action === "verify") {
      // Simulate fingerprint verification
      const fingerprint = await prisma.fingerprint.findUnique({
        where: { userId: studentId },
      })

      if (!fingerprint) {
        return res.status(404).json({
          success: false,
          error: "No fingerprint template found. Please enroll first.",
        })
      }

      // Simulate successful verification (90% success rate)
      const success = Math.random() > 0.1

      res.json({
        success,
        message: success ? "Fingerprint verified successfully" : "Fingerprint verification failed",
        confidence: success ? Math.random() * 0.3 + 0.7 : Math.random() * 0.5, // 70-100% or 0-50%
      })
    }
  } catch (error) {
    console.error("Fingerprint simulation error:", error)
    res.status(500).json({ error: "Simulation failed" })
  }
})

// Get development status
router.get("/status", (req, res) => {
  res.json({
    devMode: process.env.DEV_MODE === "true",
    environment: process.env.NODE_ENV,
    features: {
      fingerprintSimulation: true,
      mockData: true,
    },
  })
})

module.exports = router
