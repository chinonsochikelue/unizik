const BASE_URL = 'http://localhost:3000/api';

async function debugSessionStart() {
  try {
    console.log('🔍 Debugging Session Start Issue...\n');

    // Step 1: Login as Teacher
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
      const error = await teacherLoginResponse.json();
      console.log('❌ Teacher login failed:', error);
      return;
    }

    const teacherData = await teacherLoginResponse.json();
    console.log('✅ Teacher logged in successfully');
    const teacherToken = teacherData.accessToken;

    // Step 2: Get Teacher's Classes
    console.log('\n2. Getting Teacher Classes...');
    const classesResponse = await fetch(`${BASE_URL}/classes`, {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });

    if (!classesResponse.ok) {
      const error = await classesResponse.json();
      console.log('❌ Failed to get classes:', error);
      return;
    }

    const classesData = await classesResponse.json();
    console.log(`✅ Found ${classesData.length} classes`);
    
    if (classesData.length === 0) {
      console.log('❌ No classes available for teacher');
      return;
    }

    // Display classes
    classesData.forEach((cls, index) => {
      console.log(`   ${index + 1}. ${cls.name} (ID: ${cls.id})`);
      console.log(`      Students: ${cls._count?.students || 'N/A'}`);
      console.log(`      Active Session: ${cls.activeSession ? 'YES' : 'NO'}`);
    });

    const testClass = classesData[0];
    console.log(`\nUsing class: ${testClass.name}`);

    // Step 3: Attempt to Start Session - Test Different Scenarios
    console.log('\n3. Testing Session Start...');

    // Test 1: With correct payload
    console.log('Test 1: Standard session start request');
    let sessionResponse = await fetch(`${BASE_URL}/sessions/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${teacherToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        classId: testClass.id
      })
    });

    console.log('Response Status:', sessionResponse.status);
    const sessionData = await sessionResponse.json();
    console.log('Response Data:', sessionData);

    if (sessionResponse.ok) {
      console.log('✅ Session started successfully!');
      console.log(`   Session Code: ${sessionData.session.code}`);
      console.log(`   Expires At: ${sessionData.session.expiresAt}`);
    } else {
      console.log('❌ Session start failed');
      
      // Analyze the error
      if (sessionResponse.status === 400) {
        console.log('\n🔍 Analyzing 400 Error:');
        
        if (sessionData.error?.includes('Validation error')) {
          console.log('💡 Issue: Validation Error');
          console.log('Details:', sessionData.details);
          console.log('Possible causes:');
          console.log('- Missing or invalid classId');
          console.log('- Request body format issue');
        } else if (sessionData.error?.includes('already an active session')) {
          console.log('💡 Issue: Active session already exists');
          console.log('Solution: Stop existing session first or use existing session');
          
          // Try to find and stop the existing session
          console.log('\n4. Finding and stopping existing session...');
          const teacherSessionsResponse = await fetch(`${BASE_URL}/sessions/teacher/sessions`, {
            headers: { 'Authorization': `Bearer ${teacherToken}` }
          });
          
          if (teacherSessionsResponse.ok) {
            const sessions = await teacherSessionsResponse.json();
            console.log(`Found ${sessions.sessions?.length || sessions.length} teacher sessions`);
            
            const activeSessions = (sessions.sessions || sessions).filter(s => s.isActive);
            console.log(`Active sessions: ${activeSessions.length}`);
            
            if (activeSessions.length > 0) {
              const activeSession = activeSessions[0];
              console.log(`Stopping session: ${activeSession.id}`);
              
              const stopResponse = await fetch(`${BASE_URL}/sessions/${activeSession.id}/stop`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${teacherToken}` }
              });
              
              if (stopResponse.ok) {
                console.log('✅ Session stopped successfully');
                
                // Try starting session again
                console.log('\n5. Retrying session start...');
                const retryResponse = await fetch(`${BASE_URL}/sessions/start`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${teacherToken}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    classId: testClass.id
                  })
                });
                
                const retryData = await retryResponse.json();
                console.log('Retry Response Status:', retryResponse.status);
                console.log('Retry Response Data:', retryData);
                
                if (retryResponse.ok) {
                  console.log('🎉 SUCCESS! Session started on retry');
                } else {
                  console.log('❌ Session start still failed on retry');
                }
              } else {
                const stopError = await stopResponse.json();
                console.log('❌ Failed to stop session:', stopError);
              }
            }
          }
        } else if (sessionData.error?.includes('not found')) {
          console.log('💡 Issue: Class not found or access denied');
          console.log('Check if:');
          console.log('- Class ID is correct');
          console.log('- Teacher owns this class');
        } else {
          console.log('💡 Other 400 error:', sessionData.error);
        }
      }
    }

    // Step 4: Provide mobile app debugging tips
    console.log('\n📱 Mobile App Debugging Tips:');
    console.log('=====================================');
    console.log('1. Check request headers:');
    console.log('   - Authorization: Bearer {token}');
    console.log('   - Content-Type: application/json');
    console.log('');
    console.log('2. Check request body format:');
    console.log('   { "classId": "valid_class_id" }');
    console.log('');
    console.log('3. Common issues:');
    console.log('   - Token expired or invalid');
    console.log('   - Wrong class ID');
    console.log('   - Missing Content-Type header');
    console.log('   - Session already active for this class');
    console.log('');
    console.log('4. Test with curl:');
    console.log(`   curl -X POST ${BASE_URL}/sessions/start \\`);
    console.log(`     -H "Authorization: Bearer YOUR_TOKEN" \\`);
    console.log(`     -H "Content-Type: application/json" \\`);
    console.log(`     -d '{"classId":"${testClass.id}"}'`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugSessionStart();