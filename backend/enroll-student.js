const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enrollStudent() {
  try {
    const studentId = '68e2bdfaf7ee577f0b860f98';
    
    // Find the class with the active session ("Data Structures")
    const classId = '68e2be05f7ee577f0b860faf'; // Data Structures class ID from debug
    
    console.log('Enrolling student in Data Structures class...');
    
    await prisma.class.update({
      where: { id: classId },
      data: {
        studentIds: {
          push: studentId
        }
      }
    });
    
    console.log('✅ Student enrolled successfully!');
    
    // Verify enrollment
    const updatedClass = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        name: true,
        studentIds: true
      }
    });
    
    console.log(`Class: ${updatedClass.name}`);
    console.log(`Students enrolled: ${updatedClass.studentIds.length}`);
    console.log(`Student enrolled: ${updatedClass.studentIds.includes(studentId) ? 'YES' : 'NO'}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

enrollStudent();