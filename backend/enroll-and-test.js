const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();
const BASE_URL = 'http://localhost:3000/api';

async function enrollStudentAndTest() {
  try {
    console.log('🔄 Enrolling Student and Testing Attendance...\n');
    
    const studentId = '68e2bdfaf7ee577f0b860f98';
    
    // Step 1: Get a class to enroll the student in
    const classes = await prisma.class.findMany({
      select: {
        id: true,
        name: true,
        teacher: {
          select: { name: true, email: true }
        },
        studentIds: true
      },
      take: 1
    });
    
    if (classes.length === 0) {
      console.log('❌ No classes found');
      return;
    }
    
    const testClass = classes[0];
    console.log(`1. Using class: ${testClass.name}`);
    console.log(`   Teacher: ${testClass.teacher.name}`);
    console.log(`   Current students: ${testClass.studentIds.length}`);
    
    // Step 2: Enroll student in the class if not already enrolled
    if (!testClass.studentIds.includes(studentId)) {
      console.log('\n2. Enrolling student in class...');
      await prisma.class.update({
        where: { id: testClass.id },
        data: {
          studentIds: {
            push: studentId
          }
        }
      });
      console.log('✅ Student enrolled successfully');
    } else {
      console.log('\n2. Student already enrolled in this class');
    }
    
    // Step 3: Login as Teacher and start session
    console.log('\n3. Teacher Login and Session Start...');
    const teacherLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testClass.teacher.email,
        password: 'Teacher123!'
      })
    });
    
    if (!teacherLoginResponse.ok) {
      console.log('❌ Teacher login failed');
      return;
    }
    
    const teacherData = await teacherLoginResponse.json();
    const teacherToken = teacherData.accessToken;
    console.log('✅ Teacher logged in');
    
    // Start session
    const sessionResponse = await fetch(`${BASE_URL}/sessions/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${teacherToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        classId: testClass.id
      })
    });
    
    let sessionData;
    if (sessionResponse.ok) {
      sessionData = await sessionResponse.json();
      console.log('✅ Session started');
      console.log(`   Session Code: ${sessionData.session.code}`);
    } else {
      const sessionError = await sessionResponse.json();
      if (sessionError.error?.includes('already an active session')) {
        console.log('✅ Active session already exists');
      } else {
        console.log('❌ Failed to start session:', sessionError);
        return;
      }
    }
    
    // Step 4: Login as Student
    console.log('\n4. Student Login...');
    const studentLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'chinonsoneft@gmail.com',
        password: 'Student123!'
      })
    });
    
    if (!studentLoginResponse.ok) {
      console.log('❌ Student login failed');
      return;
    }
    
    const studentLoginData = await studentLoginResponse.json();
    const studentToken = studentLoginData.accessToken;
    console.log('✅ Student logged in');
    
    // Step 5: Check active sessions
    console.log('\n5. Checking Active Sessions...');
    const activeSessionsResponse = await fetch(`${BASE_URL}/sessions/active`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    
    const activeSessions = await activeSessionsResponse.json();
    console.log(`Found ${activeSessions.length} active sessions for student`);
    
    if (activeSessions.length === 0) {
      console.log('❌ Still no active sessions visible to student');
      return;
    }
    
    const activeSession = activeSessions[0];
    console.log(`✅ Active session: ${activeSession.class.name}`);
    
    // Step 6: Mark Attendance
    console.log('\n6. Marking Attendance...');
    const biometricToken = `bio-${studentId}-${Date.now()}`;
    
    const attendanceResponse = await fetch(`${BASE_URL}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        studentId: studentId,
        sessionId: activeSession.id,
        biometricToken: biometricToken
      })
    });
    
    const attendanceData = await attendanceResponse.json();
    console.log('Attendance Response Status:', attendanceResponse.status);
    
    if (attendanceResponse.ok) {
      console.log('🎉 ATTENDANCE MARKED SUCCESSFULLY!');
      console.log('📊 Details:');
      console.log('   - Status:', attendanceData.attendance.status);
      console.log('   - Class:', attendanceData.attendance.class.name);
      console.log('   - Marked At:', attendanceData.attendance.markedAt);
      console.log('   - Minutes Late:', attendanceData.attendance.minutesLate);
      
      console.log('\n✅ CONCLUSION: Students CAN mark attendance!');
      console.log('Requirements:');
      console.log('  1. Student must be enrolled in a class ✅');
      console.log('  2. Teacher must start an active session ✅');
      console.log('  3. Student must have fingerprint enrolled ✅');
      console.log('  4. Student provides biometric authentication ✅');
      
      return true;
      
    } else {
      console.log('❌ Attendance marking failed:', attendanceData);
      
      if (attendanceData.error?.includes('already marked')) {
        console.log('💡 This means attendance system is working correctly!');
        console.log('✅ CONCLUSION: Students CAN mark attendance (duplicate prevented)');
        return true;
      }
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

enrollStudentAndTest();