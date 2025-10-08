const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMyClasses() {
  try {
    console.log('Testing my-classes endpoint...\n');
    
    // Login first
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teststudent@unizik.edu.ng',
        password: 'test123'
      }),
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✓ Login successful');
      
      // Test my-classes endpoint
      const myClassesResponse = await fetch('http://localhost:3001/api/classes/my-classes', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (myClassesResponse.ok) {
        const myClassesData = await myClassesResponse.json();
        console.log('✓ My classes endpoint successful!');
        console.log('Enrolled classes count:', myClassesData.length);
        if (myClassesData[0]) {
          console.log('Sample enrolled class:', {
            name: myClassesData[0].name,
            code: myClassesData[0].code,
            teacher: myClassesData[0].teacher?.firstName + ' ' + myClassesData[0].teacher?.lastName
          });
        }
      } else {
        const errorText = await myClassesResponse.text();
        console.log('✗ My classes endpoint failed:', myClassesResponse.status);
        console.log('Error:', errorText);
      }
    } else {
      console.log('✗ Login failed');
    }
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMyClasses();