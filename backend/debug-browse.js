const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugBrowse() {
  try {
    console.log('=== Debug Browse Classes Endpoint ===\n');
    
    // Step 1: Check raw class data
    console.log('1. Checking raw class data...');
    const rawClasses = await prisma.class.findMany({
      take: 3
    });
    console.log('Raw classes (sample):');
    rawClasses.forEach((cls, i) => {
      console.log(`  ${i+1}. ID: ${cls.id}`);
      console.log(`     Name: ${cls.name}`);
      console.log(`     Code: ${cls.code || 'NULL'}`);
      console.log(`     IsActive: ${cls.isActive}`);
      console.log(`     TeacherId: ${cls.teacherId}`);
      console.log(`     StudentIds: [${cls.studentIds?.join(', ') || 'none'}]`);
      console.log('');
    });
    
    // Step 2: Try basic query with isActive filter
    console.log('2. Testing basic isActive filter...');
    try {
      const activeClasses = await prisma.class.findMany({
        where: {
          isActive: true
        }
      });
      console.log(`✓ Found ${activeClasses.length} active classes`);
    } catch (err) {
      console.log('✗ Basic query failed:', err.message);
    }
    
    // Step 3: Try with teacher relation
    console.log('3. Testing with teacher relation...');
    try {
      const classesWithTeacher = await prisma.class.findMany({
        where: {
          isActive: true
        },
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            }
          }
        },
        take: 2
      });
      console.log(`✓ Found ${classesWithTeacher.length} classes with teacher data`);
      if (classesWithTeacher[0]) {
        console.log('  Sample:', {
          name: classesWithTeacher[0].name,
          teacher: classesWithTeacher[0].teacher?.firstName + ' ' + classesWithTeacher[0].teacher?.lastName
        });
      }
    } catch (err) {
      console.log('✗ Teacher relation query failed:', err.message);
    }
    
    // Step 4: Try with _count
    console.log('4. Testing with _count...');
    try {
      const classesWithCount = await prisma.class.findMany({
        where: {
          isActive: true
        },
        include: {
          _count: {
            select: {
              students: true,
              sessions: true,
            }
          }
        },
        take: 2
      });
      console.log(`✓ Found ${classesWithCount.length} classes with count data`);
      if (classesWithCount[0]) {
        console.log('  Sample count:', {
          name: classesWithCount[0].name,
          studentCount: classesWithCount[0]._count?.students,
          sessionCount: classesWithCount[0]._count?.sessions
        });
      }
    } catch (err) {
      console.log('✗ Count query failed:', err.message);
    }
    
    // Step 5: Try the full query from browse endpoint
    console.log('5. Testing full browse query...');
    try {
      const fullQuery = await prisma.class.findMany({
        where: {
          isActive: true,
        },
        include: {
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              students: true,
              sessions: true,
            },
          },
        },
        take: 10,
        orderBy: { name: "asc" },
      });
      
      console.log(`✓ Full query successful! Found ${fullQuery.length} classes`);
      
      // Test the actual endpoint
      console.log('\n6. Testing actual API endpoint...');
      
      // First login
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
        
        // Now test browse endpoint
        const browseResponse = await fetch('http://localhost:3001/api/classes/browse', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${loginData.accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (browseResponse.ok) {
          const browseData = await browseResponse.json();
          console.log('✓ Browse endpoint successful!');
          console.log('Response structure:', Object.keys(browseData));
          console.log('Classes found:', browseData.classes?.length);
        } else {
          const errorText = await browseResponse.text();
          console.log('✗ Browse endpoint failed:', browseResponse.status);
          console.log('Error:', errorText);
        }
      } else {
        console.log('✗ Login failed');
      }
      
    } catch (err) {
      console.log('✗ Full query failed:', err.message);
      console.log('Stack:', err.stack);
    }
    
  } catch (error) {
    console.error('Debug error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugBrowse();