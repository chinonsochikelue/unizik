const express = require("express")
const { PrismaClient } = require("@prisma/client")
const { authenticateJWT, authorizeRole } = require("../middleware/auth")

const router = express.Router()
const prisma = new PrismaClient()

// Get all users (Admin only)
router.get("/", authenticateJWT, authorizeRole("ADMIN"), async (req, res) => {
  try {
    const { role, page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const where = role ? { role } : {}

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      skip: Number.parseInt(skip),
      take: Number.parseInt(limit),
      orderBy: { createdAt: "desc" },
    })

    const total = await prisma.user.count({ where })

    res.json({
      users,
      pagination: {
        page: Number.parseInt(page),
        limit: Number.parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error("Get users error:", error)
    res.status(500).json({ error: "Failed to fetch users" })
  }
})

// Get user profile
router.get("/profile", authenticateJWT, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    res.json({ user })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ error: "Failed to fetch profile" })
  }
})

// Update user (Admin only)
router.put("/:id", authenticateJWT, authorizeRole("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, role, isActive } = req.body

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(typeof isActive === "boolean" && { isActive }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    })

    res.json({ user })
  } catch (error) {
    console.error("Update user error:", error)
    res.status(500).json({ error: "Failed to update user" })
  }
})

// Delete user (Admin only)
router.delete("/:id", authenticateJWT, authorizeRole("ADMIN"), async (req, res) => {
  try {
    const { id } = req.params

    // Soft delete by setting isActive to false
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    res.json({ message: "User deactivated successfully" })
  } catch (error) {
    console.error("Delete user error:", error)
    res.status(500).json({ error: "Failed to delete user" })
  }
})

module.exports = router
