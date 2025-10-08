const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('Creating test student user...\n');
    
    const email = 'teststudent@unizik.edu.ng';
    const password = 'test123';
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      console.log('Test user already exists, updating password...');
      
      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Update the password
      await prisma.user.update({
        where: { email },
        data: { password: hashedPassword }
      });
      
      console.log(`Updated password for ${email} to "${password}"`);
    } else {
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Create new test user
      const user = await prisma.user.create({
        data: {
          firstName: 'Test',
          lastName: 'Student',
          email: email,
          password: hashedPassword,
          role: 'STUDENT',
          studentId: 'TEST001',
          isActive: true
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          studentId: true
        }
      });
      
      console.log('Created test user:', user);
      console.log(`Password: "${password}"`);
    }
    
    // Now test the API with the known password
    console.log('\nTesting API login with test user...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      }),
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✓ Login successful!');
      
      // Test browse classes
      console.log('\nTesting browse classes endpoint...');
      const browseResponse = await fetch('http://localhost:3001/api/classes/browse', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${loginData.accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (browseResponse.ok) {
        const browseData = await browseResponse.json();
        console.log('✓ Browse classes successful!');
        console.log('Response structure:', Object.keys(browseData));
        console.log('Total classes:', browseData.totalClasses);
        console.log('Classes in response:', browseData.classes?.length);
        console.log('Current page:', browseData.currentPage);
        console.log('Total pages:', browseData.totalPages);
        
        if (browseData.classes?.[0]) {
          console.log('\nFirst class details:');
          console.log('- Name:', browseData.classes[0].name);
          console.log('- Code:', browseData.classes[0].classCode);
          console.log('- Teacher:', browseData.classes[0].teacher?.firstName, browseData.classes[0].teacher?.lastName);
          console.log('- Student count:', browseData.classes[0]._count?.students);
        }
      } else {
        const errorText = await browseResponse.text();
        console.log('✗ Browse classes failed:', browseResponse.status, errorText);
      }
    } else {
      const errorText = await loginResponse.text();
      console.log('✗ Login failed:', loginResponse.status, errorText);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();