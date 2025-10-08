const axios = require('axios')

const API_BASE = 'http://localhost:3001/api'

// Test credentials
const adminCredentials = {
  email: 'admin@unizik.edu.ng',
  password: 'admin123'
}

let authToken = null

async function testAdminWorkflow() {
  console.log('🧪 Starting Admin Workflow Test...\n')
  
  try {
    // 1. Admin Login
    console.log('1. Testing Admin Login...')
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, adminCredentials)
    
    if (loginResponse.data.success) {
      authToken = loginResponse.data.token
      console.log('✅ Admin login successful')
      console.log(`   Token: ${authToken.substring(0, 20)}...`)
    } else {
      throw new Error('Admin login failed')
    }
    
    const headers = { Authorization: `Bearer ${authToken}` }
    
    // 2. Test Admin Dashboard
    console.log('\n2. Testing Admin Dashboard...')
    try {
      const dashboardResponse = await axios.get(`${API_BASE}/admin/dashboard`, { headers })
      console.log('✅ Dashboard data loaded')
      console.log(`   Total Students: ${dashboardResponse.data.data.totalStudents}`)
      console.log(`   Total Teachers: ${dashboardResponse.data.data.totalTeachers}`)
      console.log(`   Total Classes: ${dashboardResponse.data.data.totalClasses}`)
    } catch (error) {
      console.log(`❌ Dashboard error: ${error.response?.data?.message || error.message}`)
    }
    
    // 3. Test User Management
    console.log('\n3. Testing User Management...')
    try {
      const usersResponse = await axios.get(`${API_BASE}/admin/users?limit=5`, { headers })
      console.log('✅ User list loaded')
      console.log(`   Found ${usersResponse.data.data.length} users`)
      
      // Test creating a new user
      const newUser = {
        firstName: 'Test',
        lastName: 'User',
        email: `test.user.${Date.now()}@unizik.edu.ng`,
        role: 'STUDENT',
        studentId: `STU${Date.now()}`
      }
      
      const createUserResponse = await axios.post(`${API_BASE}/admin/users`, newUser, { headers })
      if (createUserResponse.data.success) {
        console.log('✅ Test user created successfully')
        const createdUserId = createUserResponse.data.data.id
        
        // Test updating the user
        const updateData = { firstName: 'Updated', lastName: 'TestUser' }
        await axios.put(`${API_BASE}/admin/users/${createdUserId}`, updateData, { headers })
        console.log('✅ User update successful')
        
        // Test deleting the user
        await axios.delete(`${API_BASE}/admin/users/${createdUserId}`, { headers })
        console.log('✅ User deletion successful')
      }
    } catch (error) {
      console.log(`❌ User management error: ${error.response?.data?.message || error.message}`)
    }
    
    // 4. Test Class Management
    console.log('\n4. Testing Class Management...')
    try {
      const classesResponse = await axios.get(`${API_BASE}/admin/classes?limit=5`, { headers })
      console.log('✅ Class list loaded')
      console.log(`   Found ${classesResponse.data.data.length} classes`)
      
      // Test creating a new class
      const newClass = {
        name: `Test Class ${Date.now()}`,
        code: `TC${Date.now()}`,
        description: 'Test class for admin workflow'
      }
      
      const createClassResponse = await axios.post(`${API_BASE}/admin/classes`, newClass, { headers })
      if (createClassResponse.data.success) {
        console.log('✅ Test class created successfully')
        const createdClassId = createClassResponse.data.data.id
        
        // Test updating the class
        const updateData = { name: 'Updated Test Class', description: 'Updated description' }
        await axios.put(`${API_BASE}/admin/classes/${createdClassId}`, updateData, { headers })
        console.log('✅ Class update successful')
        
        // Test deleting the class
        await axios.delete(`${API_BASE}/admin/classes/${createdClassId}`, { headers })
        console.log('✅ Class deletion successful')
      }
    } catch (error) {
      console.log(`❌ Class management error: ${error.response?.data?.message || error.message}`)
    }
    
    // 5. Test Session Management
    console.log('\n5. Testing Session Management...')
    try {
      const sessionsResponse = await axios.get(`${API_BASE}/admin/sessions?limit=5`, { headers })
      console.log('✅ Session list loaded')
      console.log(`   Found ${sessionsResponse.data.data.length} sessions`)
      
      if (sessionsResponse.data.data.length > 0) {
        const activeSessions = sessionsResponse.data.data.filter(s => s.isActive)
        console.log(`   Active sessions: ${activeSessions.length}`)
      }
    } catch (error) {
      console.log(`❌ Session management error: ${error.response?.data?.message || error.message}`)
    }
    
    // 6. Test System Settings
    console.log('\n6. Testing System Settings...')
    try {
      const settingsResponse = await axios.get(`${API_BASE}/admin/settings`, { headers })
      console.log('✅ System settings loaded')
      console.log(`   System Name: ${settingsResponse.data.data.systemName}`)
      console.log(`   Biometric Required: ${settingsResponse.data.data.biometricRequired}`)
      
      // Test updating settings
      const updateSettings = {
        systemName: 'Updated Attendance System',
        sessionTimeout: 150
      }
      
      const updateResponse = await axios.put(`${API_BASE}/admin/settings`, updateSettings, { headers })
      if (updateResponse.data.success) {
        console.log('✅ Settings update successful')
      }
    } catch (error) {
      console.log(`❌ Settings error: ${error.response?.data?.message || error.message}`)
    }
    
    // 7. Test Reports
    console.log('\n7. Testing Reports...')
    try {
      const endDate = new Date().toISOString().split('T')[0]
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      
      const reportsResponse = await axios.get(`${API_BASE}/admin/reports`, {
        headers,
        params: {
          startDate,
          endDate,
          type: 'attendance'
        }
      })
      
      console.log('✅ Reports loaded')
      console.log(`   Overall Attendance Rate: ${reportsResponse.data.data.summary?.overallAttendanceRate}%`)
      console.log(`   Total Sessions: ${reportsResponse.data.data.summary?.totalSessions}`)
    } catch (error) {
      console.log(`❌ Reports error: ${error.response?.data?.message || error.message}`)
    }
    
    console.log('\n🎉 Admin Workflow Test Completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data?.message || error.message)
    console.error('Stack:', error.stack)
  }
}

// Run the test
testAdminWorkflow()