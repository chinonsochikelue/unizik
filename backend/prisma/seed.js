const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seed...")

  // Clear existing data
  console.log("🧹 Cleaning existing data...")
  await prisma.attendance.deleteMany()
  await prisma.session.deleteMany()
  await prisma.fingerprint.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.class.deleteMany()
  await prisma.user.deleteMany()

  // Create users
  console.log("👥 Creating users...")

  const saltRounds = 12

  // Create Admin user
  const adminPassword = await bcrypt.hash("Admin123!", saltRounds)
  const admin = await prisma.user.create({
    data: {
      name: "System Administrator",
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN",
      isActive: true,
    },
  })

  // Create Teacher user
  const teacherPassword = await bcrypt.hash("Teacher123!", saltRounds)
  const teacher = await prisma.user.create({
    data: {
      name: "John Smith",
      email: "teacher@example.com",
      password: teacherPassword,
      role: "TEACHER",
      isActive: true,
    },
  })

  // Create Student users
  const studentPassword = await bcrypt.hash("Student123!", saltRounds)
  const students = []

  for (let i = 1; i <= 5; i++) {
    const student = await prisma.user.create({
      data: {
        name: `Student ${i}`,
        email: `student${i}@example.com`,
        password: studentPassword,
        role: "STUDENT",
        isActive: true,
      },
    })
    students.push(student)
  }

  // Create sample class
  console.log("🏫 Creating sample class...")
  const sampleClass = await prisma.class.create({
    data: {
      name: "Computer Science 101",
      description: "Introduction to Computer Science and Programming",
      teacherId: teacher.id,
      studentIds: students.map((s) => s.id),
    },
  })

  // Create another class
  const mathClass = await prisma.class.create({
    data: {
      name: "Mathematics 201",
      description: "Advanced Mathematics and Statistics",
      teacherId: teacher.id,
      studentIds: students.slice(0, 3).map((s) => s.id), // Only first 3 students
    },
  })

  // Create sample fingerprint templates for students (for dev simulation)
  console.log("👆 Creating sample fingerprint templates...")
  for (const student of students) {
    const templateData = Buffer.from(`simulated-template-${student.id}-${Date.now()}`).toString("base64")

    await prisma.fingerprint.create({
      data: {
        userId: student.id,
        templateData,
        isActive: true,
      },
    })
  }

  // Create sample sessions and attendance
  console.log("📅 Creating sample sessions and attendance...")

  // Create a past session with attendance
  const pastSession = await prisma.session.create({
    data: {
      classId: sampleClass.id,
      teacherId: teacher.id,
      code: "ABC123",
      startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hour later
      expiresAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 min after start
      isActive: false,
    },
  })

  // Mark attendance for some students in the past session
  for (let i = 0; i < 3; i++) {
    await prisma.attendance.create({
      data: {
        studentId: students[i].id,
        sessionId: pastSession.id,
        status: "PRESENT",
        markedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000), // 10 min after session start
      },
    })
  }

  // Create another past session for math class
  const mathSession = await prisma.session.create({
    data: {
      classId: mathClass.id,
      teacherId: teacher.id,
      code: "MATH01",
      startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      endTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000), // 1 hour later
      expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // 30 min after start
      isActive: false,
    },
  })

  // Mark attendance for math class
  for (let i = 0; i < 2; i++) {
    await prisma.attendance.create({
      data: {
        studentId: students[i].id,
        sessionId: mathSession.id,
        status: "PRESENT",
        markedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000), // 5 min after session start
      },
    })
  }

  // Generate sample JWT tokens for testing
  console.log("🔑 Generating sample JWT tokens...")

  const tokens = {
    admin: {
      accessToken: jwt.sign(
        { userId: admin.id, email: admin.email, role: admin.role },
        process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production",
        { expiresIn: "15m" },
      ),
      refreshToken: jwt.sign(
        { userId: admin.id },
        process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-change-in-production",
        { expiresIn: "7d" },
      ),
    },
    teacher: {
      accessToken: jwt.sign(
        { userId: teacher.id, email: teacher.email, role: teacher.role },
        process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production",
        { expiresIn: "15m" },
      ),
      refreshToken: jwt.sign(
        { userId: teacher.id },
        process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-change-in-production",
        { expiresIn: "7d" },
      ),
    },
    student: {
      accessToken: jwt.sign(
        { userId: students[0].id, email: students[0].email, role: students[0].role },
        process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production",
        { expiresIn: "15m" },
      ),
      refreshToken: jwt.sign(
        { userId: students[0].id },
        process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key-change-in-production",
        { expiresIn: "7d" },
      ),
    },
  }

  // Store refresh tokens in database
  for (const [role, tokenData] of Object.entries(tokens)) {
    const userId = role === "admin" ? admin.id : role === "teacher" ? teacher.id : students[0].id
    await prisma.refreshToken.create({
      data: {
        token: tokenData.refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    })
  }

  console.log("✅ Database seeded successfully!")
  console.log("\n📊 Seeded data summary:")
  console.log(`- Users: ${await prisma.user.count()}`)
  console.log(`- Classes: ${await prisma.class.count()}`)
  console.log(`- Sessions: ${await prisma.session.count()}`)
  console.log(`- Attendance records: ${await prisma.attendance.count()}`)
  console.log(`- Fingerprint templates: ${await prisma.fingerprint.count()}`)

  console.log("\n🔐 Sample login credentials:")
  console.log("Admin: admin@example.com / Admin123!")
  console.log("Teacher: teacher@example.com / Teacher123!")
  console.log("Students: student1@example.com through student5@example.com / Student123!")

  console.log("\n🎫 Sample JWT tokens (valid for 15 minutes):")
  console.log("Admin Access Token:", tokens.admin.accessToken)
  console.log("Teacher Access Token:", tokens.teacher.accessToken)
  console.log("Student Access Token:", tokens.student.accessToken)

  // Write tokens to file for easy access
  const fs = require("fs")
  const tokensContent = `# Sample JWT Tokens for Testing

## Login Credentials
- **Admin**: admin@example.com / Admin123!
- **Teacher**: teacher@example.com / Teacher123!
- **Students**: student1@example.com through student5@example.com / Student123!

## Sample Access Tokens (Valid for 15 minutes)

### Admin Token
\`\`\`
${tokens.admin.accessToken}
\`\`\`

### Teacher Token
\`\`\`
${tokens.teacher.accessToken}
\`\`\`

### Student Token
\`\`\`
${tokens.student.accessToken}
\`\`\`

## Sample Refresh Tokens (Valid for 7 days)

### Admin Refresh Token
\`\`\`
${tokens.admin.refreshToken}
\`\`\`

### Teacher Refresh Token
\`\`\`
${tokens.teacher.refreshToken}
\`\`\`

### Student Refresh Token
\`\`\`
${tokens.student.refreshToken}
\`\`\`

## Usage with curl

### Login
\`\`\`bash
curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "admin@example.com", "password": "Admin123!"}'
\`\`\`

### Use Access Token
\`\`\`bash
curl -X GET http://localhost:3000/api/users/profile \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
\`\`\`

### Refresh Token
\`\`\`bash
curl -X POST http://localhost:3000/api/auth/refresh \\
  -H "Content-Type: application/json" \\
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN_HERE"}'
\`\`\`
`

  fs.writeFileSync("tokens.md", tokensContent)
  console.log("\n📝 Sample tokens saved to tokens.md file")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
