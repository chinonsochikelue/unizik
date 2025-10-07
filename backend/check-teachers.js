const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTeachers() {
  try {
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER' },
      select: { id: true, email: true, name: true }
    });
    
    console.log('Teachers in database:');
    teachers.forEach((teacher, i) => {
      console.log(`${i + 1}. ${teacher.name} (${teacher.email})`);
      console.log(`   ID: ${teacher.id}`);
    });
    
    if (teachers.length === 0) {
      console.log('No teachers found in database');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeachers();