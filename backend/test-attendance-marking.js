const BASE_URL = 'http://localhost:3000/api';

async function testAttendanceMarking() {
  try {
    console.log('🧪 Testing Student Attendance Marking Workflow...\n');

    // Step 1: Student Login
    console.log('1. Student Login...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'chinonsoneft@gmail.com',
        password: 'Student123!'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginData);
      return;
    }

    console.log('✅ Login successful');
    const token = loginData.accessToken;
    const studentId = loginData.user.id;
    console.log('Student ID:', studentId);

    // Step 2: Check if student has fingerprint enrolled
    console.log('\n2. Checking Fingerprint Status...');
    const fingerprintResponse = await fetch(`${BASE_URL}/fingerprints/status`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const fingerprintData = await fingerprintResponse.json();
    console.log('Fingerprint Status:', fingerprintData);
    
    if (!fingerprintData.enrolled) {
      console.log('❌ Student needs to enroll fingerprint first');
      return;
    }
    console.log('✅ Fingerprint enrolled');

    // Step 3: Get active sessions
    console.log('\n3. Getting Active Sessions...');
    const sessionsResponse = await fetch(`${BASE_URL}/sessions/active`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const sessionsData = await sessionsResponse.json();
    console.log('Active Sessions Response:', sessionsData);
    
    if (!Array.isArray(sessionsData) || sessionsData.length === 0) {
      console.log('⚠️  No active sessions found. Let me try to create one for testing...');
      
      // Try to get classes first
      const classesResponse = await fetch(`${BASE_URL}/classes`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const classesData = await classesResponse.json();
      console.log('Available classes:', classesData.length);
      
      if (classesData.length > 0) {
        console.log('📚 Student is enrolled in classes but no active sessions');
        console.log('💡 Teacher needs to start a session for attendance marking');
        console.log('📋 Testing with mock session data...');
        
        // Create mock session for testing attendance endpoint
        const mockSessionId = '507f1f77bcf86cd799439011'; // Valid ObjectId format
        return await testAttendanceEndpoint(token, studentId, mockSessionId);
      }
      return;
    }

    const activeSession = sessionsData[0];
    console.log('✅ Active session found:', {
      id: activeSession.id,
      class: activeSession.class?.name,
      startTime: activeSession.startTime
    });

    // Step 4: Mark Attendance
    return await testAttendanceEndpoint(token, studentId, activeSession.id);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testAttendanceEndpoint(token, studentId, sessionId) {
  console.log('\n4. Testing Attendance Marking...');
  
  // Generate biometric token (in production, this would come from actual biometric scan)
  const biometricToken = `bio-${studentId}-${Date.now()}`;
  
  const attendanceResponse = await fetch(`${BASE_URL}/attendance/mark`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      studentId: studentId,
      sessionId: sessionId,
      biometricToken: biometricToken
    })
  });

  console.log('Attendance Response Status:', attendanceResponse.status);
  
  const attendanceData = await attendanceResponse.json();
  console.log('Attendance Response:', attendanceData);

  if (attendanceResponse.ok) {
    console.log('✅ Attendance marked successfully!');
    console.log('📊 Attendance Details:');
    console.log('   - Status:', attendanceData.attendance?.status);
    console.log('   - Marked At:', attendanceData.attendance?.markedAt);
    console.log('   - Class:', attendanceData.attendance?.class?.name);
    
    // Step 5: Verify attendance was recorded
    console.log('\n5. Verifying Attendance History...');
    const historyResponse = await fetch(`${BASE_URL}/attendance/history`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const historyData = await historyResponse.json();
    console.log('📚 Recent attendance records:', historyData.length);
    
    if (historyData.length > 0) {
      const latest = historyData[0];
      console.log('Latest attendance:', {
        status: latest.status,
        markedAt: latest.markedAt,
        class: latest.session?.class?.name
      });
    }
    
    return true;
  } else {
    console.log('❌ Attendance marking failed');
    console.log('Error details:', attendanceData);
    
    // Check for specific error conditions
    if (attendanceData.code === 'BIOMETRIC_REQUIRED') {
      console.log('💡 Issue: Biometric authentication required');
    } else if (attendanceData.code === 'FINGERPRINT_NOT_ENROLLED') {
      console.log('💡 Issue: Student fingerprint not enrolled');
    } else if (attendanceData.error?.includes('Session not found')) {
      console.log('💡 Issue: Session not found or expired');
    } else if (attendanceData.error?.includes('not enrolled in this class')) {
      console.log('💡 Issue: Student not enrolled in the class');
    }
    
    return false;
  }
}

testAttendanceMarking();