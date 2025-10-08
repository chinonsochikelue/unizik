const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTeachersEndpoint() {
  try {
    console.log('Testing teachers endpoint...\n');
    
    // First login to get a token (using our test user)
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
    
    if (!loginResponse.ok) {
      console.log('❌ Login failed:', loginResponse.status);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    
    // Test the new teachers endpoint
    console.log('\n🧪 Testing /classes/teachers endpoint...');
    const teachersResponse = await fetch('http://localhost:3001/api/classes/teachers', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Teachers endpoint status:', teachersResponse.status);
    
    if (teachersResponse.ok) {
      const teachersData = await teachersResponse.json();
      console.log('✅ Teachers endpoint working!');
      console.log('Teachers found:', teachersData.teachers?.length || 0);
      
      if (teachersData.teachers && teachersData.teachers.length > 0) {
        console.log('\n📋 Sample teacher data:');
        const sampleTeacher = teachersData.teachers[0];
        console.log('- Name:', sampleTeacher.firstName, sampleTeacher.lastName);
        console.log('- Email:', sampleTeacher.email);
        console.log('- Classes:', sampleTeacher._count?.teachingClasses || 0);
      }
    } else {
      const errorText = await teachersResponse.text();
      console.log('❌ Teachers endpoint failed:', errorText);
    }
    
    // Test regular classes endpoint
    console.log('\n🧪 Testing regular /classes endpoint...');
    const classesResponse = await fetch('http://localhost:3001/api/classes', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Classes endpoint status:', classesResponse.status);
    
    if (classesResponse.ok) {
      const classesData = await classesResponse.json();
      console.log('✅ Classes endpoint working!');
      console.log('Classes found:', classesData.length || 0);
      
      if (classesData.length > 0) {
        console.log('\n📚 Sample class data:');
        const sampleClass = classesData[0];
        console.log('- Name:', sampleClass.name);
        console.log('- Code:', sampleClass.code);
        console.log('- Teacher ID:', sampleClass.teacherId || 'No teacher assigned');
        console.log('- Teacher:', sampleClass.teacher ? 
          `${sampleClass.teacher.firstName} ${sampleClass.teacher.lastName}` : 
          'No teacher'
        );
      }
    } else {
      const errorText = await classesResponse.text();
      console.log('❌ Classes endpoint failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testTeachersEndpoint();