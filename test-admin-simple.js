const { exec } = require('child_process')
const util = require('util')

const execAsync = util.promisify(exec)
const API_BASE = 'http://localhost:3001/api'

let authToken = null

async function testAdminFunctionality() {
  console.log('🧪 Testing Admin Functionality...\n')
  
  try {
    // 1. Admin Login
    console.log('1. Testing Admin Login...')
    const loginCommand = `curl -s -X POST ${API_BASE}/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"admin@unizik.edu.ng\\",\\"password\\":\\"admin123\\"}"`
    
    const { stdout: loginResult } = await execAsync(loginCommand)
    const loginData = JSON.parse(loginResult)
    
    if (loginData.success) {
      authToken = loginData.token
      console.log('✅ Admin login successful')
    } else {
      throw new Error('Login failed: ' + loginData.message)
    }
    
    // 2. Test Dashboard
    console.log('\n2. Testing Dashboard...')
    const dashCommand = `curl -s -X GET ${API_BASE}/admin/dashboard -H "Authorization: Bearer ${authToken}"`
    const { stdout: dashResult } = await execAsync(dashCommand)
    const dashData = JSON.parse(dashResult)
    
    if (dashData.success) {
      console.log('✅ Dashboard loaded successfully')
      console.log(`   Total Students: ${dashData.data.totalStudents}`)
      console.log(`   Total Teachers: ${dashData.data.totalTeachers}`)
    } else {
      console.log('❌ Dashboard failed:', dashData.message)
    }
    
    // 3. Test User List
    console.log('\n3. Testing User Management...')
    const usersCommand = `curl -s -X GET "${API_BASE}/admin/users?limit=3" -H "Authorization: Bearer ${authToken}"`
    const { stdout: usersResult } = await execAsync(usersCommand)
    const usersData = JSON.parse(usersResult)
    
    if (usersData.success) {
      console.log('✅ User list loaded successfully')
      console.log(`   Found ${usersData.data.length} users`)
    } else {
      console.log('❌ User list failed:', usersData.message)
    }
    
    // 4. Test Classes List
    console.log('\n4. Testing Class Management...')
    const classesCommand = `curl -s -X GET "${API_BASE}/admin/classes?limit=3" -H "Authorization: Bearer ${authToken}"`
    const { stdout: classesResult } = await execAsync(classesCommand)
    const classesData = JSON.parse(classesResult)
    
    if (classesData.success) {
      console.log('✅ Classes list loaded successfully')
      console.log(`   Found ${classesData.data.length} classes`)
    } else {
      console.log('❌ Classes list failed:', classesData.message)
    }
    
    // 5. Test Settings
    console.log('\n5. Testing System Settings...')
    const settingsCommand = `curl -s -X GET ${API_BASE}/admin/settings -H "Authorization: Bearer ${authToken}"`
    const { stdout: settingsResult } = await execAsync(settingsCommand)
    const settingsData = JSON.parse(settingsResult)
    
    if (settingsData.success) {
      console.log('✅ Settings loaded successfully')
      console.log(`   System Name: ${settingsData.data.systemName}`)
    } else {
      console.log('❌ Settings failed:', settingsData.message)
    }
    
    console.log('\n🎉 Admin functionality test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testAdminFunctionality()