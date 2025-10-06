const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function testPrismaConnection() {
  try {
    console.log('🔍 Testing Prisma connection...');
    
    // Test basic connection
    const userCount = await prisma.user.count();
    console.log('✅ Connected to database. User count:', userCount);
    
    // Test finding a specific user
    const testUserId = '68e2bdfaf7ee577f0b860f98';
    console.log('🔍 Looking for user with ID:', testUserId);
    
    const user = await prisma.user.findUnique({
      where: { id: testUserId }
    });
    
    console.log('User found:', user ? '✅ YES' : '❌ NO');
    if (user) {
      console.log('User data:', {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    }
    
    // Test with the same query as the profile route
    const userWithSelect = await prisma.user.findUnique({
      where: { id: testUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        department: true,
        employeeId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    
    console.log('User with select query:', userWithSelect ? '✅ FOUND' : '❌ NOT FOUND');
    if (userWithSelect) {
      console.log('Selected user data:', userWithSelect);
    }
    
  } catch (error) {
    console.error('❌ Database error:');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaConnection();