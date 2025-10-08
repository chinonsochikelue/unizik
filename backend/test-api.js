const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testAPI() {
  try {
    console.log('Testing API endpoints...\n');
    
    // First, let's find a student user to test with
    const user = await prisma.user.findFirst({
      where: { role: 'STUDENT' }
    });
    
    if (!user) {
      console.log('No student user found in database');
      return;
    }
    
    console.log(`Found user: ${user.firstName} ${user.lastName} (${user.email})`);
    
    // Test login
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        password: 'password123' // Assuming this is the default password from seed data
      }),
    });
    
    if (!loginResponse.ok) {
      console.log('Login failed:', loginResponse.status, await loginResponse.text());
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('Login successful!');
    console.log('User:', loginData.user);
    
    const token = loginData.accessToken;
    
    // Test browse classes endpoint
    console.log('\nTesting browse classes endpoint...');
    const browseResponse = await fetch('http://localhost:3001/api/classes/browse', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!browseResponse.ok) {
      console.log('Browse classes failed:', browseResponse.status, await browseResponse.text());
      return;
    }
    
    const browseData = await browseResponse.json();
    console.log('Browse classes successful!');
    console.log('Classes found:', browseData.classes?.length || 0);
    console.log('Sample class:', browseData.classes?.[0]);
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAPI();