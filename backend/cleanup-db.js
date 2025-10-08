const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupDatabase() {
  console.log('🧹 Cleaning up database...')
  
  try {
    // Delete all data in the correct order (respecting foreign key constraints)
    console.log('Deleting attendance records...')
    await prisma.attendance.deleteMany()
    
    console.log('Deleting sessions...')
    await prisma.session.deleteMany()
    
    console.log('Deleting fingerprints...')
    await prisma.fingerprint.deleteMany()
    
    console.log('Deleting refresh tokens...')
    await prisma.refreshToken.deleteMany()
    
    console.log('Deleting classes...')
    await prisma.class.deleteMany()
    
    console.log('Deleting users...')
    await prisma.user.deleteMany()
    
    console.log('✅ Database cleanup completed!')
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupDatabase()