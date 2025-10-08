const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testPasswords() {
  try {
    console.log('Checking user passwords...\n');
    
    // Get a student user
    const user = await prisma.user.findFirst({
      where: { role: 'STUDENT' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        password: true
      }
    });
    
    if (!user) {
      console.log('No student user found');
      return;
    }
    
    console.log(`Testing passwords for: ${user.firstName} ${user.lastName} (${user.email})`);
    
    // Common passwords to try
    const passwords = [
      'password',
      'password123',
      'student123',
      'unizik123',
      '123456',
      'admin',
      'student'
    ];
    
    for (const password of passwords) {
      try {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
          console.log(`✓ Password found: "${password}"`);
          
          // Now test the API login
          console.log('\nTesting API login...');
          const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              password: password
            }),
          });
          
          if (loginResponse.ok) {
            const loginData = await loginResponse.json();
            console.log('API login successful!');
            
            // Test browse classes
            console.log('\nTesting browse classes...');
            const browseResponse = await fetch('http://localhost:3001/api/classes/browse', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${loginData.accessToken}`,
                'Content-Type': 'application/json',
              },
            });
            
            if (browseResponse.ok) {
              const browseData = await browseResponse.json();
              console.log('Browse classes successful!');
              console.log('Total classes:', browseData.totalClasses);
              console.log('Classes in response:', browseData.classes?.length);
              if (browseData.classes?.[0]) {
                console.log('First class:', browseData.classes[0].name);
                console.log('Teacher:', browseData.classes[0].teacher?.firstName, browseData.classes[0].teacher?.lastName);
              }
            } else {
              console.log('Browse classes failed:', browseResponse.status, await browseResponse.text());
            }
          } else {
            console.log('API login failed:', loginResponse.status, await loginResponse.text());
          }
          
          return;
        }
      } catch (err) {
        console.log(`Error testing password "${password}":`, err.message);
      }
    }
    
    console.log('✗ No matching password found from common defaults');
    console.log('Password hash starts with:', user.password.substring(0, 10) + '...');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPasswords();