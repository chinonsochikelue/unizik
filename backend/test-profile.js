const BASE_URL = 'http://localhost:3000/api';

async function testProfile() {
  try {
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
    console.log('Login result:', loginData);

    if (!loginResponse.ok) {
      console.log('Login failed');
      return;
    }

    const token = loginData.accessToken;
    
    // Then get profile
    const profileResponse = await fetch(`${BASE_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const profileData = await profileResponse.json();
    console.log('Profile result:', profileData);
    console.log('Profile status:', profileResponse.status);

  } catch (error) {
    console.error('Error:', error);
  }
}

testProfile();