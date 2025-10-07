const BASE_URL = 'http://localhost:3001/api';

async function cleanupSessions() {
  try {
    console.log('🔍 Checking and Cleaning Active Sessions...\n');

    // Step 1: Login as Teacher
    console.log('1. Teacher Login...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teacher1@example.com',
        password: 'Teacher123!'
      })
    });

    const teacherData = await loginResponse.json();
    const teacherToken = teacherData.accessToken;
    console.log('✅ Teacher logged in');

    // Step 2: Get all active sessions for this teacher
    console.log('\n2. Checking active sessions...');
    const activeSessionsResponse = await fetch(`${BASE_URL}/sessions/teacher/sessions`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });

    if (!activeSessionsResponse.ok) {
      console.log('❌ Failed to get teacher sessions');
      return;
    }

    const sessionsData = await activeSessionsResponse.json();
    const activeSessions = (sessionsData.sessions || sessionsData).filter(s => s.isActive);
    
    console.log(`Found ${activeSessions.length} active sessions:`);
    activeSessions.forEach((session, index) => {
      console.log(`  ${index + 1}. Class: ${session.class?.name || 'Unknown'} (ID: ${session.class?.id || session.classId})`);
      console.log(`     Session ID: ${session.id}`);
      console.log(`     Code: ${session.code}`);
      console.log(`     Started: ${new Date(session.startTime).toLocaleString()}`);
    });

    // Step 3: Stop all active sessions
    if (activeSessions.length > 0) {
      console.log('\n3. Stopping all active sessions...');
      
      for (const session of activeSessions) {
        console.log(`Stopping session ${session.code}...`);
        const stopResponse = await fetch(`${BASE_URL}/sessions/${session.id}/stop`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${teacherToken}` }
        });
        
        if (stopResponse.ok) {
          console.log(`✅ Session ${session.code} stopped successfully`);
        } else {
          const error = await stopResponse.json();
          console.log(`❌ Failed to stop session ${session.code}:`, error);
        }
      }
    } else {
      console.log('\n✅ No active sessions to clean up');
    }

    console.log('\n4. Cleanup complete! You can now start new sessions.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

cleanupSessions();