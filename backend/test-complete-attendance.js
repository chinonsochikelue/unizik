const BASE_URL = 'http://localhost:3000/api';

async function testCompleteAttendanceWorkflow() {
  try {
    console.log('🧪 Testing Complete Attendance Workflow (Teacher + Student)...\n');

    // Step 1: Login as Teacher to create session
    console.log('1. Teacher Login...');
    const teacherLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teacher1@example.com',
        password: 'Teacher123!'
      })
    });

    if (!teacherLoginResponse.ok) {
      console.log('❌ Teacher login failed');
      return;
    }

    const teacherData = await teacherLoginResponse.json();
    console.log('✅ Teacher logged in');
    const teacherToken = teacherData.accessToken;

    // Step 2: Get teacher's classes
    console.log('\n2. Getting Teacher Classes...');
    const classesResponse = await fetch(`${BASE_URL}/classes`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });

    const classesData = await classesResponse.json();
    console.log(`Found ${classesData.length} classes for teacher`);
    
    if (classesData.length === 0) {
      console.log('❌ No classes found for teacher');
      return;
    }

    const testClass = classesData[0];
    console.log(`Using class: ${testClass.name} (ID: ${testClass.id})`);

    // Step 3: Start a session
    console.log('\n3. Starting Attendance Session...');
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

    if (!sessionResponse.ok) {
      const sessionError = await sessionResponse.json();
      console.log('❌ Failed to start session:', sessionError);
      if (sessionError.error?.includes('already an active session')) {
        console.log('🔄 Active session already exists, continuing...');
      } else {
        return;
      }
    } else {
      const sessionData = await sessionResponse.json();
      console.log('✅ Session started successfully');
      console.log(`Session Code: ${sessionData.session.code}`);
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

    const studentData = await studentLoginResponse.json();
    console.log('✅ Student logged in');
    const studentToken = studentData.accessToken;
    const studentId = studentData.user.id;

    // Step 5: Check active sessions from student perspective
    console.log('\n5. Getting Active Sessions (Student View)...');
    const activeSessionsResponse = await fetch(`${BASE_URL}/sessions/active`, {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });

    const activeSessions = await activeSessionsResponse.json();
    console.log('Active sessions for student:', activeSessions.length);

    if (activeSessions.length === 0) {
      console.log('❌ No active sessions visible to student');
      console.log('💡 This might mean the student is not enrolled in the class');
      return;
    }

    const activeSession = activeSessions[0];
    console.log(`✅ Active session found: ${activeSession.class.name}`);

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

    console.log('Attendance Response Status:', attendanceResponse.status);
    const attendanceData = await attendanceResponse.json();

    if (attendanceResponse.ok) {
      console.log('✅ ATTENDANCE MARKED SUCCESSFULLY!');
      console.log('📊 Attendance Details:');
      console.log('   - Status:', attendanceData.attendance.status);
      console.log('   - Marked At:', attendanceData.attendance.markedAt);
      console.log('   - Class:', attendanceData.attendance.class.name);
      console.log('   - Minutes Late:', attendanceData.attendance.minutesLate);

      // Step 7: Verify in attendance history
      console.log('\n7. Verifying Attendance History...');
      const historyResponse = await fetch(`${BASE_URL}/attendance/history`, {
        headers: { 'Authorization': `Bearer ${studentToken}` }
      });

      const historyData = await historyResponse.json();
      console.log(`📚 Total attendance records: ${historyData.length}`);
      
      if (historyData.length > 0) {
        const latest = historyData[0];
        console.log('Latest attendance:', {
          status: latest.status,
          class: latest.session.class.name,
          markedAt: latest.markedAt
        });
      }

      console.log('\n🎉 COMPLETE ATTENDANCE WORKFLOW SUCCESSFUL!');
      console.log('✅ Students can now mark attendance properly');
      
      return true;

    } else {
      console.log('❌ Attendance marking failed');
      console.log('Error:', attendanceData);
      
      if (attendanceData.error?.includes('already marked')) {
        console.log('💡 Attendance already marked - this is expected behavior');
        console.log('✅ Attendance system is working (preventing duplicate entries)');
        return true;
      }
      
      return false;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

testCompleteAttendanceWorkflow();