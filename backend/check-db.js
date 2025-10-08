const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Checking database...');
    
    // Check users
    const userCount = await prisma.user.count();
    console.log(`Users: ${userCount}`);
    
    // Check classes
    const classCount = await prisma.class.count();
    console.log(`Classes: ${classCount}`);
    
    if (classCount > 0) {
      const classes = await prisma.class.findMany({
        take: 3,
        include: {
          teacher: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          _count: {
            select: {
              students: true,
              sessions: true
            }
          }
        }
      });
      
      console.log('Sample classes:');
      classes.forEach((cls, index) => {
        console.log(`${index + 1}. ${cls.name} (Teacher: ${cls.teacher?.firstName} ${cls.teacher?.lastName})`);
        console.log(`   Students: ${cls._count.students}, Sessions: ${cls._count.sessions}`);
      });
    } else {
      console.log('No classes found in database');
    }
    
    // Check sessions
    const sessionCount = await prisma.session.count();
    console.log(`Sessions: ${sessionCount}`);
    
  } catch (error) {
    console.error('Database check error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();