const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function checkStudentEnrollment() {
  try {
    console.log('🔍 Checking Student Enrollment Status...\n');
    
    const studentId = '68e2bdfaf7ee577f0b860f98';
    
    // Get student with enrolled classes
    const student = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        enrolledClasses: {
          select: {
            id: true,
            name: true,
            description: true,
            teacher: {
              select: {
                name: true,
                email: true
              }
            }
          }
        }
      }
    });
    
    console.log('Student:', student.name, student.email);
    console.log('Enrolled classes:', student.enrolledClasses.length);
    
    student.enrolledClasses.forEach((cls, index) => {
      console.log(`${index + 1}. ${cls.name} (ID: ${cls.id})`);
      console.log(`   Teacher: ${cls.teacher.name}`);
      console.log(`   Description: ${cls.description}`);
    });
    
    // Get all classes and see which ones have this student
    console.log('\n🔍 Checking all classes for student enrollment...');
    
    const allClasses = await prisma.class.findMany({
      where: {
        students: {
          some: {
            id: studentId
          }
        }
      },
      select: {
        id: true,
        name: true,
        teacher: {
          select: { name: true }
        }
      }
    });
    
    console.log(`Found ${allClasses.length} classes where student is enrolled:`);
    allClasses.forEach((cls, index) => {
      console.log(`${index + 1}. ${cls.name} (Teacher: ${cls.teacher.name})`);
    });
    
    // Check active sessions
    console.log('\n🔍 Checking active sessions...');
    const activeSessions = await prisma.session.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
            studentIds: true
          }
        }
      }
    });
    
    console.log(`Found ${activeSessions.length} active sessions:`);
    activeSessions.forEach((session, index) => {
      const isStudentEnrolled = session.class.studentIds.includes(studentId);
      console.log(`${index + 1}. Class: ${session.class.name}`);
      console.log(`   Session ID: ${session.id}`);
      console.log(`   Student enrolled: ${isStudentEnrolled ? '✅ YES' : '❌ NO'}`);
      console.log(`   Total students in class: ${session.class.studentIds.length}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkStudentEnrollment();