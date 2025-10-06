const express = require("express")
const bcrypt = require("bcryptjs")
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
        firstName: true,
        lastName: true,
        phone: true,
        department: true,
        employeeId: true,
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
        firstName: true,
        lastName: true,
        phone: true,
        department: true,
        employeeId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({ user })
  } catch (error) {
    console.error("Get profile error:", error)
    res.status(500).json({ error: "Failed to fetch profile" })
  }
})

// Get specific user by ID (authenticated users can get their own, admins can get any)
router.get("/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params
    
    // Users can only access their own profile, unless they're admin
    if (req.user.role !== "ADMIN" && req.user.id !== id) {
      return res.status(403).json({ error: "Access denied" })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        department: true,
        employeeId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    res.json({ user })
  } catch (error) {
    console.error("Get user error:", error)
    res.status(500).json({ error: "Failed to fetch user" })
  }
})

// Create user (Admin only)
router.post("/", authenticateJWT, authorizeRole("ADMIN"), async (req, res) => {
  try {
    const { name, email, password, role, firstName, lastName, phone, department, employeeId } = req.body

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return res.status(400).json({ error: "User already exists with this email" })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        firstName,
        lastName,
        phone,
        department,
        employeeId,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        department: true,
        employeeId: true,
        createdAt: true,
      },
    })

    res.status(201).json({
      message: "User created successfully",
      user,
    })
  } catch (error) {
    console.error("Create user error:", error)
    res.status(500).json({ error: "Failed to create user" })
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

// Update user profile (authenticated user only) - MUST come before /:id route
router.put("/profile", authenticateJWT, async (req, res) => {
  try {
    console.log('🔄 Profile update request received');
    console.log('Authenticated user:', req.user);
    console.log('Request body:', req.body);
    
    const { firstName, lastName, email, phone, department, employeeId, name } = req.body
    const userId = req.user.id

    // Prepare update data
    const updateData = {}
    
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (department !== undefined) updateData.department = department
    if (employeeId !== undefined) updateData.employeeId = employeeId
    if (name !== undefined) updateData.name = name

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: userId }
        }
      })

      if (existingUser) {
        return res.status(400).json({ error: "Email is already in use by another account" })
      }
    }

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        department: true,
        employeeId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    })

    res.json({ 
      message: "Profile updated successfully",
      user: updatedUser 
    })
  } catch (error) {
    console.error("Update profile error:", error)
    res.status(500).json({ error: "Failed to update profile" })
  }
})

// Update user by ID (users can update their own profile, admins can update any)
router.put("/:id", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params
    const { firstName, lastName, email, phone, department, employeeId, name, role, isActive, password } = req.body
    
    // Users can only update their own profile, unless they're admin
    if (req.user.role !== "ADMIN" && req.user.id !== id) {
      return res.status(403).json({ error: "Access denied" })
    }

    // Prepare update data
    const updateData = {}
    
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (department !== undefined) updateData.department = department
    if (employeeId !== undefined) updateData.employeeId = employeeId
    if (name !== undefined) updateData.name = name
    
    // Only admins can change role and isActive
    if (req.user.role === "ADMIN") {
      if (role !== undefined) updateData.role = role
      if (typeof isActive === "boolean") updateData.isActive = isActive
    }

    // Hash password if provided
    if (password) {
      const saltRounds = 12
      updateData.password = await bcrypt.hash(password, saltRounds)
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: id }
        }
      })

      if (existingUser) {
        return res.status(400).json({ error: "Email is already in use by another account" })
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        department: true,
        employeeId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.json({ user })
  } catch (error) {
    console.error("Update user error:", error)
    res.status(500).json({ error: "Failed to update user" })
  }
})

// Change password for specific user (users can change their own, admins can change any)
router.put("/:id/password", authenticateJWT, async (req, res) => {
  try {
    const { id } = req.params
    const { currentPassword, newPassword } = req.body

    // Users can only change their own password, unless they're admin
    if (req.user.role !== "ADMIN" && req.user.id !== id) {
      return res.status(403).json({ error: "Access denied" })
    }

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long" })
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" })
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id },
      data: { password: hashedNewPassword }
    })

    res.json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({ error: "Failed to change password" })
  }
})

// Change password (authenticated user only)
router.put("/change-password", authenticateJWT, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const userId = req.user.id

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Current password and new password are required" })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters long" })
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return res.status(404).json({ error: "User not found" })
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" })
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12)

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    })

    res.json({ message: "Password changed successfully" })
  } catch (error) {
    console.error("Change password error:", error)
    res.status(500).json({ error: "Failed to change password" })
  }
})

module.exports = router
