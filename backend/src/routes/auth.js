const express = require("express")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { PrismaClient } = require("@prisma/client")
const { validateRequest, registerSchema, loginSchema, refreshTokenSchema } = require("../utils/validation")

const router = express.Router()
const prisma = new PrismaClient()

// Register
router.post("/register", validateRequest(registerSchema), async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, studentId, teacherId } = req.body

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
    const userData = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      isActive: true,
    }
    
    // Add role-specific fields
    if (role === "STUDENT" && studentId) {
      userData.studentId = studentId
    }
    if (role === "TEACHER" && teacherId) {
      userData.teacherId = teacherId
    }
    
    const user = await prisma.user.create({
      data: userData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        studentId: true,
        teacherId: true,
        createdAt: true,
      },
    })

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user,
    })
  } catch (error) {
    console.error("Registration error:", error)
    res.status(500).json({ error: "Failed to create user" })
  }
})

// Login
router.post("/login", validateRequest(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true,
        role: true,
        studentId: true,
        teacherId: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" })
    }

    // Generate tokens
    const accessToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "15m",
    })

    const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: "7d" })

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        teacherId: user.teacherId,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    res.status(500).json({ error: "Login failed" })
  }
})

// Refresh token
router.post("/refresh", validateRequest(refreshTokenSchema), async (req, res) => {
  try {
    const { refreshToken } = req.body

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

    // Check if refresh token exists in database
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: decoded.userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            studentId: true,
            teacherId: true,
            isActive: true,
          },
        },
      },
    })

    if (!storedToken || !storedToken.user.isActive) {
      return res.status(401).json({ error: "Invalid refresh token" })
    }

    // Generate new access token
    const accessToken = jwt.sign(
      {
        userId: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    )

    res.json({ accessToken })
  } catch (error) {
    console.error("Token refresh error:", error)
    res.status(401).json({ error: "Invalid refresh token" })
  }
})

// Logout
router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (refreshToken) {
      // Remove refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      })
    }

    res.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout error:", error)
    res.status(500).json({ error: "Logout failed" })
  }
})

module.exports = router
