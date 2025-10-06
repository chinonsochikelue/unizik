const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function debugSessionVisibility() {
  try {
    console.log('🔍 Debugging Session Visibility Issue...\n');
    
    const studentId = '68e2bdfaf7ee577f0b860f98';
    
    // Check all sessions
    console.log('1. Checking all active sessions in database...');
    const allActiveSessions = await prisma.session.findMany({
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
    
    console.log(`Found ${allActiveSessions.length} active sessions:`);
    allActiveSessions.forEach((session, index) => {
      const isStudentEnrolled = session.class.studentIds.includes(studentId);
      console.log(`${index + 1}. ${session.class.name} (Class ID: ${session.class.id})`);
      console.log(`   Session ID: ${session.id}`);
      console.log(`   Active: ${session.isActive}`);
      console.log(`   Expires: ${session.expiresAt}`);
      console.log(`   Student enrolled: ${isStudentEnrolled ? '✅ YES' : '❌ NO'}`);
      console.log(`   Students in class: ${session.class.studentIds.length}`);
    });
    
    // Test the exact query used by the API
    console.log('\n2. Testing the exact API query...');
    const apiQuery = await prisma.session.findMany({
      where: {
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
        class: {
          students: {
            some: {
              id: studentId,
            },
          },
        },
      },
      include: {
        class: {
          select: {
            id: true,
            name: true,
          },
        },
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
    });
    
    console.log(`API query result: ${apiQuery.length} sessions found`);
    apiQuery.forEach((session, index) => {
      console.log(`${index + 1}. ${session.class.name}`);
      console.log(`   Teacher: ${session.teacher.name}`);
    });
    
    // Check student enrollment using the many-to-many relationship
    console.log('\n3. Checking student enrollment via relationship...');
    const studentWithClasses = await prisma.user.findUnique({
      where: { id: studentId },
      include: {
        enrolledClasses: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    console.log('Student enrolled classes via relationship:');
    studentWithClasses.enrolledClasses.forEach((cls, index) => {
      console.log(`${index + 1}. ${cls.name} (ID: ${cls.id})`);
    });
    
    // Check if there's a mismatch
    console.log('\n4. Cross-checking enrollment methods...');
    const directEnrollment = await prisma.class.findMany({
      where: {
        studentIds: {
          has: studentId
        }
      },
      select: {
        id: true,
        name: true
      }
    });
    
    console.log('Classes with student in studentIds array:');
    directEnrollment.forEach((cls, index) => {
      console.log(`${index + 1}. ${cls.name} (ID: ${cls.id})`);
    });
    
    console.log('\n5. Diagnosis:');
    if (studentWithClasses.enrolledClasses.length === 0 && directEnrollment.length > 0) {
      console.log('❗ ISSUE FOUND: studentIds array has student but many-to-many relation is missing');
      console.log('💡 This suggests the Prisma schema many-to-many relationship needs to be synced');
    } else if (studentWithClasses.enrolledClasses.length > 0 && allActiveSessions.length === 0) {
      console.log('❗ ISSUE: Student enrolled but no active sessions exist');
    } else if (studentWithClasses.enrolledClasses.length > 0 && apiQuery.length === 0 && allActiveSessions.length > 0) {
      console.log('❗ ISSUE: Active sessions exist, student enrolled, but API query returns no results');
      console.log('💡 This could be a Prisma relationship configuration issue');
    } else {
      console.log('✅ Everything looks correct');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSessionVisibility();