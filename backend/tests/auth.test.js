const request = require("supertest")
const app = require("../src/server")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

describe("Authentication Endpoints", () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { email: { contains: "test" } },
    })
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        firstName: "Test",
        lastName: "User",
        role: "STUDENT",
        studentId: "STU001",
      }

      const response = await request(app).post("/api/auth/register").send(userData).expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe(userData.email)
      expect(response.body.data.token).toBeDefined()
    })

    it("should not register user with existing email", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        firstName: "Test",
        lastName: "User2",
        role: "STUDENT",
        studentId: "STU002",
      }

      const response = await request(app).post("/api/auth/register").send(userData).expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain("already exists")
    })
  })

  describe("POST /api/auth/login", () => {
    it("should login with valid credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "password123",
      }

      const response = await request(app).post("/api/auth/login").send(loginData).expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.refreshToken).toBeDefined()
    })

    it("should not login with invalid credentials", async () => {
      const loginData = {
        email: "test@example.com",
        password: "wrongpassword",
      }

      const response = await request(app).post("/api/auth/login").send(loginData).expect(401)

      expect(response.body.success).toBe(false)
    })
  })
})
