const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function findStudents() {
  try {
    console.log('🔍 Finding student users...\n');
    
    // Get all students
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      },
      take: 5, // First 5 students
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`Found ${students.length} students:`);
    students.forEach((student, index) => {
      console.log(`${index + 1}. ${student.name} (${student.email}) - Active: ${student.isActive}`);
    });
    
    // Test login with the first student
    if (students.length > 0) {
      const testStudent = students[0];
      console.log(`\n🧪 Testing login with: ${testStudent.email}`);
      
      const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testStudent.email,
          password: 'Student123!' // Default password from seed
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✅ Login successful with this email!');
        console.log('User:', loginData.user);
        
        // Test attendance marking with this student
        console.log('\n📋 This student can be used for attendance testing');
        return testStudent.email;
      } else {
        const errorData = await loginResponse.json();
        console.log('❌ Login failed:', errorData);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

findStudents();