const BASE_URL = 'http://localhost:3001/api';

async function testSessionStart() {
  try {
    console.log('🔍 Testing Session Start Endpoint...\n');

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

    if (!loginResponse.ok) {
      console.log('❌ Teacher login failed, trying alternative credentials...');
      
      // Try different credentials or check if users exist
      const altLoginResponse = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'john.doe@university.edu',
          password: 'password123'
        })
      });
      
      if (!altLoginResponse.ok) {
        const error = await altLoginResponse.json();
        console.log('❌ Alternative login also failed:', error);
        return;
      }
      
      const teacherData = await altLoginResponse.json();
      console.log('✅ Teacher logged in with alternative credentials');
      var teacherToken = teacherData.accessToken;
    } else {
      const teacherData = await loginResponse.json();
      console.log('✅ Teacher logged in successfully');
      var teacherToken = teacherData.accessToken;
    }

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

    const testClass = classesData[0];
    console.log(`\nUsing class: ${testClass.name} (ID: ${testClass.id})`);

    // Step 3: Test Session Start
    console.log('\n3. Testing Session Start...');
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

    console.log('Response Status:', sessionResponse.status);
    const sessionData = await sessionResponse.json();
    console.log('Response Data:', JSON.stringify(sessionData, null, 2));

    if (sessionResponse.ok) {
      console.log('🎉 SUCCESS! Session started successfully!');
      console.log(`Session Code: ${sessionData.session.code}`);
    } else {
      console.log('❌ Session start failed');
      console.log('Error details:', sessionData);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSessionStart();