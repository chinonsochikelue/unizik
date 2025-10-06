const BASE_URL = 'http://localhost:3000/api';

async function testProfileOnly() {
  try {
    console.log('🧪 Testing profile endpoint only...\n');

    // First login
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student1@example.com',
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
    
    console.log('\n📡 Making profile request...');
    
    // Then get profile
    const profileResponse = await fetch(`${BASE_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Profile response status:', profileResponse.status);
    
    const profileData = await profileResponse.json();
    console.log('Profile response data:', profileData);

    if (profileResponse.ok) {
      console.log('✅ Profile request successful!');
    } else {
      console.log('❌ Profile request failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testProfileOnly();