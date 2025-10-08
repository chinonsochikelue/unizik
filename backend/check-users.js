const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('Checking user roles in database...\n');
    
    // Get counts by role
    const studentCount = await prisma.user.count({ where: { role: 'STUDENT' } });
    const teacherCount = await prisma.user.count({ where: { role: 'TEACHER' } });
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    
    console.log('User counts by role:');
    console.log('- Students:', studentCount);
    console.log('- Teachers:', teacherCount);
    console.log('- Admins:', adminCount);
    
    // Get sample users of each role
    const sampleUsers = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true
      },
      take: 10,
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }]
    });
    
    console.log('\nSample users:');
    sampleUsers.forEach(user => {
      console.log(`- ${user.role}: ${user.firstName} ${user.lastName} (${user.email}) ${user.isActive ? '✓' : '✗'}`);
    });
    
    // Find or create an admin user for testing
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN', isActive: true }
    });
    
    if (!adminUser) {
      console.log('\n❌ No admin user found. Creating one...');
      
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      
      adminUser = await prisma.user.create({
        data: {
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@unizik.edu.ng',
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true
        }
      });
      
      console.log('✅ Created admin user:', adminUser);
      console.log('Password: admin123');
    } else {
      console.log('\n✅ Found admin user:', adminUser.email);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();