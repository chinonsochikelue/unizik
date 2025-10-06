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

  const teacherPassword = await bcrypt.hash("Teacher123!", saltRounds)
  const teachers = []

  const teacherNames = ["Dr. John Smith", "Prof. Sarah Johnson", "Dr. Michael Brown", "Prof. Emily Davis"]

  for (let i = 0; i < teacherNames.length; i++) {
    const teacher = await prisma.user.create({
      data: {
        name: teacherNames[i],
        email: `teacher${i + 1}@example.com`,
        password: teacherPassword,
        role: "TEACHER",
        isActive: true,
      },
    })
    teachers.push(teacher)
  }

  const studentPassword = await bcrypt.hash("Student123!", saltRounds)
  const students = []

  const firstNames = [
    "James",
    "Emma",
    "Oliver",
    "Sophia",
    "William",
    "Ava",
    "Benjamin",
    "Isabella",
    "Lucas",
    "Mia",
    "Henry",
    "Charlotte",
    "Alexander",
    "Amelia",
    "Sebastian",
  ]
  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
  ]

  for (let i = 0; i < 20; i++) {
    const firstName = firstNames[i % firstNames.length]
    const lastName = lastNames[Math.floor(i / firstNames.length) % lastNames.length]
    const student = await prisma.user.create({
      data: {
        name: `${firstName} ${lastName}`,
        email: `student${i + 1}@example.com`,
        password: studentPassword,
        role: "STUDENT",
        isActive: true,
      },
    })
    students.push(student)
  }

  console.log("🏫 Creating classes...")

  const classes = []

  const classData = [
    {
      name: "Computer Science 101",
      description: "Introduction to Computer Science and Programming",
      teacherId: teachers[0].id,
      studentIds: students.slice(0, 15).map((s) => s.id),
    },
    {
      name: "Mathematics 201",
      description: "Advanced Mathematics and Statistics",
      teacherId: teachers[1].id,
      studentIds: students.slice(5, 18).map((s) => s.id),
    },
    {
      name: "Physics 301",
      description: "Classical and Modern Physics",
      teacherId: teachers[2].id,
      studentIds: students.slice(0, 12).map((s) => s.id),
    },
    {
      name: "Data Structures",
      description: "Algorithms and Data Structures",
      teacherId: teachers[0].id,
      studentIds: students.slice(8, 20).map((s) => s.id),
    },
    {
      name: "Web Development",
      description: "Full Stack Web Development",
      teacherId: teachers[3].id,
      studentIds: students.slice(2, 14).map((s) => s.id),
    },
  ]

  for (const data of classData) {
    const cls = await prisma.class.create({ data })
    classes.push(cls)
  }

  // Create sample fingerprint templates for students
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

  console.log("📅 Creating sessions and attendance records...")

  const sessions = []
  const attendanceStatuses = ["PRESENT", "ABSENT", "LATE", "EXCUSED"]

  // Create sessions for the past 30 days
  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const sessionDate = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000)

    // Create 1-2 sessions per day for different classes
    const numSessionsToday = Math.floor(Math.random() * 2) + 1

    for (let sessionNum = 0; sessionNum < numSessionsToday; sessionNum++) {
      const classIndex = Math.floor(Math.random() * classes.length)
      const selectedClass = classes[classIndex]
      const teacher = teachers.find((t) => t.id === selectedClass.teacherId)

      const startTime = new Date(sessionDate)
      startTime.setHours(9 + sessionNum * 2, 0, 0, 0)

      const endTime = new Date(startTime)
      endTime.setHours(startTime.getHours() + 1)

      const expiresAt = new Date(startTime)
      expiresAt.setMinutes(startTime.getMinutes() + 30)

      const session = await prisma.session.create({
        data: {
          classId: selectedClass.id,
          teacherId: teacher.id,
          code: `SES${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
          startTime,
          endTime,
          expiresAt,
          isActive: dayOffset === 0, // Only today's sessions are active
        },
      })

      sessions.push(session)

      // Mark attendance for students in this class
      const enrolledStudents = students.filter((s) => selectedClass.studentIds.includes(s.id))

      for (const student of enrolledStudents) {
        // 80% chance of attendance being marked
        if (Math.random() > 0.2) {
          // Determine status: 70% present, 15% late, 10% absent, 5% excused
          const rand = Math.random()
          let status = "PRESENT"
          if (rand > 0.85) status = "LATE"
          else if (rand > 0.75) status = "ABSENT"
          else if (rand > 0.7) status = "EXCUSED"

          const markedAt = new Date(startTime)
          markedAt.setMinutes(startTime.getMinutes() + Math.floor(Math.random() * 20))

          await prisma.attendance.create({
            data: {
              studentId: student.id,
              sessionId: session.id,
              status,
              markedAt,
              notes: status === "EXCUSED" ? "Medical appointment" : undefined,
            },
          })
        }
      }
    }
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
        { userId: teachers[0].id, email: teachers[0].email, role: teachers[0].role },
        process.env.JWT_SECRET || "your-super-secret-jwt-key-change-in-production",
        { expiresIn: "15m" },
      ),
      refreshToken: jwt.sign(
        { userId: teachers[0].id },
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
    const userId = role === "admin" ? admin.id : role === "teacher" ? teachers[0].id : students[0].id
    await prisma.refreshToken.create({
      data: {
        token: tokenData.refreshToken,
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
  }

  console.log("✅ Database seeded successfully!")
  console.log("\n📊 Seeded data summary:")
  console.log(
    `- Users: ${await prisma.user.count()} (1 admin, ${teachers.length} teachers, ${students.length} students)`,
  )
  console.log(`- Classes: ${await prisma.class.count()}`)
  console.log(`- Sessions: ${await prisma.session.count()}`)
  console.log(`- Attendance records: ${await prisma.attendance.count()}`)
  console.log(`- Fingerprint templates: ${await prisma.fingerprint.count()}`)

  console.log("\n🔐 Sample login credentials:")
  console.log("Admin: admin@example.com / Admin123!")
  console.log("Teacher: teacher1@example.com / Teacher123!")
  console.log("Students: student1@example.com through student20@example.com / Student123!")

  console.log("\n🎫 Sample JWT tokens (valid for 15 minutes):")
  console.log("Admin Access Token:", tokens.admin.accessToken)
  console.log("Teacher Access Token:", tokens.teacher.accessToken)
  console.log("Student Access Token:", tokens.student.accessToken)

  // Write tokens to file for easy access
  const fs = require("fs")
  const tokensContent = `# Sample JWT Tokens for Testing

## Login Credentials
- **Admin**: admin@example.com / Admin123!
- **Teachers**: teacher1@example.com through teacher${teachers.length}@example.com / Teacher123!
- **Students**: student1@example.com through student${students.length}@example.com / Student123!

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
