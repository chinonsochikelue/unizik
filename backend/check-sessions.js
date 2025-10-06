const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSessions() {
  try {
    const sessions = await prisma.session.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        expiresAt: true,
        class: {
          select: { name: true }
        }
      }
    });

    console.log('Active sessions:', JSON.stringify(sessions, null, 2));
    
    if (sessions.length > 0) {
      const now = new Date();
      sessions.forEach((session, i) => {
        const expired = session.expiresAt < now;
        console.log(`Session ${i + 1} (${session.code}): ${expired ? 'EXPIRED' : 'ACTIVE'}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSessions();