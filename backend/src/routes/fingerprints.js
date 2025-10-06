const express = require("express")
const { PrismaClient } = require("@prisma/client")
const { authenticateJWT, authorizeRole } = require("../middleware/auth")

const router = express.Router()
const prisma = new PrismaClient()

// Enroll fingerprint (Students only)
router.post("/enroll", authenticateJWT, authorizeRole("STUDENT"), async (req, res) => {
  try {
    const { templateData } = req.body
    const userId = req.user.id

    // Check if fingerprint already exists
    const existingFingerprint = await prisma.fingerprint.findUnique({
      where: { userId },
    })

    if (existingFingerprint) {
      // Update existing fingerprint
      const updatedFingerprint = await prisma.fingerprint.update({
        where: { userId },
        data: {
          templateData: templateData || `template-${userId}-${Date.now()}`,
          isActive: true,
        },
      })

      return res.json({
        message: "Fingerprint updated successfully",
        fingerprint: {
          id: updatedFingerprint.id,
          isActive: updatedFingerprint.isActive,
        },
      })
    }

    // Create new fingerprint
    const fingerprint = await prisma.fingerprint.create({
      data: {
        userId,
        templateData: templateData || `template-${userId}-${Date.now()}`,
        isActive: true,
      },
    })

    res.status(201).json({
      message: "Fingerprint enrolled successfully",
      fingerprint: {
        id: fingerprint.id,
        isActive: fingerprint.isActive,
      },
    })
  } catch (error) {
    console.error("Fingerprint enrollment error:", error)
    res.status(500).json({ error: "Failed to enroll fingerprint" })
  }
})

// Check fingerprint enrollment status
router.get("/status", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id

    const fingerprint = await prisma.fingerprint.findUnique({
      where: { userId },
    })

    res.json({
      enrolled: !!fingerprint,
      active: fingerprint?.isActive || false,
      enrolledAt: fingerprint?.createdAt || null,
    })
  } catch (error) {
    console.error("Fingerprint status error:", error)
    res.status(500).json({ error: "Failed to check fingerprint status" })
  }
})

// Verify fingerprint (for attendance marking)
router.post("/verify", authenticateJWT, authorizeRole("STUDENT"), async (req, res) => {
  try {
    const { templateData } = req.body
    const userId = req.user.id

    const fingerprint = await prisma.fingerprint.findUnique({
      where: { userId, isActive: true },
    })

    if (!fingerprint) {
      return res.status(404).json({ 
        error: "Fingerprint not enrolled",
        code: "FINGERPRINT_NOT_ENROLLED" 
      })
    }

    // In a real implementation, you would compare the templateData
    // For now, we'll simulate verification
    const isValid = templateData && templateData.includes(userId)

    if (!isValid) {
      return res.status(401).json({ 
        error: "Fingerprint verification failed",
        code: "VERIFICATION_FAILED" 
      })
    }

    res.json({
      verified: true,
      confidence: 0.95,
      token: `bio-${userId}-${Date.now()}`,
      message: "Fingerprint verified successfully",
    })
  } catch (error) {
    console.error("Fingerprint verification error:", error)
    res.status(500).json({ error: "Failed to verify fingerprint" })
  }
})

// Delete fingerprint (Students can delete their own)
router.delete("/", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id

    const fingerprint = await prisma.fingerprint.findUnique({
      where: { userId },
    })

    if (!fingerprint) {
      return res.status(404).json({ error: "Fingerprint not found" })
    }

    await prisma.fingerprint.delete({
      where: { userId },
    })

    res.json({ message: "Fingerprint deleted successfully" })
  } catch (error) {
    console.error("Fingerprint deletion error:", error)
    res.status(500).json({ error: "Failed to delete fingerprint" })
  }
})

module.exports = router