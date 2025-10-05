const request = require("supertest")
const app = require("../src/server")
const { PrismaClient } = require("@prisma/client")
const jwt = require("jsonwebtoken")

const prisma = new PrismaClient()

describe("Attendance Endpoints", () => {
  let studentToken, teacherToken, classId, sessionId

  beforeAll(async () => {
    // Create test users
    const student = await prisma.user.create({
      data: {
        email: "student.test@example.com",
        password: "hashedpassword",
        firstName: "Student",
        lastName: "Test",
        role: "STUDENT",
        studentId: "STU999",
      },
    })

    const teacher = await prisma.user.create({
      data: {
        email: "teacher.test@example.com",
        password: "hashedpassword",
        firstName: "Teacher",
        lastName: "Test",
        role: "TEACHER",
        teacherId: "TCH999",
      },
    })

    // Generate tokens
    studentToken = jwt.sign({ userId: student.id, role: student.role }, process.env.JWT_SECRET)
    teacherToken = jwt.sign({ userId: teacher.id, role: teacher.role }, process.env.JWT_SECRET)

    // Create test class
    const testClass = await prisma.class.create({
      data: {
        name: "Test Class",
        code: "TC999",
        teacherId: teacher.id,
        students: {
          connect: [{ id: student.id }],
        },
      },
    })
    classId = testClass.id

    // Create test session
    const session = await prisma.session.create({
      data: {
        classId: classId,
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
        isActive: true,
      },
    })
    sessionId = session.id
  })

  afterAll(async () => {
    await prisma.attendance.deleteMany({})
    await prisma.session.deleteMany({})
    await prisma.class.deleteMany({})
    await prisma.user.deleteMany({
      where: { email: { contains: "test@example.com" } },
    })
    await prisma.$disconnect()
  })

  describe("POST /api/attendance/mark", () => {
    it("should mark attendance successfully", async () => {
      const attendanceData = {
        sessionId: sessionId,
        fingerprintData: "mock_fingerprint_data",
      }

      const response = await request(app)
        .post("/api/attendance/mark")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(attendanceData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data.status).toBe("PRESENT")
    })

    it("should not allow duplicate attendance", async () => {
      const attendanceData = {
        sessionId: sessionId,
        fingerprintData: "mock_fingerprint_data",
      }

      const response = await request(app)
        .post("/api/attendance/mark")
        .set("Authorization", `Bearer ${studentToken}`)
        .send(attendanceData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain("already marked")
    })
  })
})
