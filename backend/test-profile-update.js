const BASE_URL = 'http://localhost:3000/api';

async function testProfileUpdate() {
  try {
    console.log('🧪 Testing profile update...\n');

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
    
    console.log('\n📡 Testing profile update...');
    
    // Update profile
    const updateResponse = await fetch(`${BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        firstName: 'Updated',
        lastName: 'Student',
        phone: '+1234567890'
      })
    });

    console.log('Update response status:', updateResponse.status);
    console.log('Update response headers:', Object.fromEntries(updateResponse.headers.entries()));
    
    const updateData = await updateResponse.json();
    console.log('Update response data:', updateData);

    if (updateResponse.ok) {
      console.log('✅ Profile update successful!');
    } else {
      console.log('❌ Profile update failed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testProfileUpdate();