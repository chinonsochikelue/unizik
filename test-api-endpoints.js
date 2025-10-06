/**
 * API Endpoints Test Script
 * 
 * This script tests the backend API endpoints to ensure they're working correctly
 * and to help debug authentication issues in the mobile app.
 */

const BASE_URL = 'http://localhost:3000/api';

// Test student credentials (you may need to adjust these)
const TEST_STUDENT = {
  email: 'student1@example.com',
  password: 'Student123!'
};

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    },
    ...(body && { body: JSON.stringify(body) })
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    return { 
      success: response.ok, 
      status: response.status, 
      data,
      statusText: response.statusText 
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function testBackendEndpoints() {
  console.log('🧪 Testing Backend API Endpoints...\n');

  let authToken = null;

  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  const healthResult = await apiCall('/health');
  console.log(`   Status: ${healthResult.status} - ${healthResult.success ? '✅ PASS' : '❌ FAIL'}`);
  if (healthResult.data) console.log(`   Response:`, healthResult.data);
  console.log('');

  // Test 2: Student Login
  console.log('2. Testing Student Login...');
  const loginResult = await apiCall('/auth/login', 'POST', TEST_STUDENT);
  console.log(`   Status: ${loginResult.status} - ${loginResult.success ? '✅ PASS' : '❌ FAIL'}`);
  
  if (loginResult.success && loginResult.data.accessToken) {
    authToken = loginResult.data.accessToken;
    console.log(`   ✅ Login successful - Token received`);
    console.log(`   User:`, loginResult.data.user);
  } else {
    console.log(`   ❌ Login failed:`, loginResult.data);
    console.log('   Cannot proceed with authenticated endpoints.');
    return;
  }
  console.log('');

  // Test 3: Get User Profile
  console.log('3. Testing Get User Profile...');
  const profileResult = await apiCall('/users/profile', 'GET', null, authToken);
  console.log(`   Status: ${profileResult.status} - ${profileResult.success ? '✅ PASS' : '❌ FAIL'}`);
  if (profileResult.data) {
    console.log(`   Profile data:`, profileResult.data);
  }
  console.log('');

  // Test 4: Get Attendance History
  console.log('4. Testing Get Attendance History...');
  const attendanceResult = await apiCall('/attendance/history', 'GET', null, authToken);
  console.log(`   Status: ${attendanceResult.status} - ${attendanceResult.success ? '✅ PASS' : '❌ FAIL'}`);
  if (attendanceResult.data) {
    console.log(`   Attendance records found: ${Array.isArray(attendanceResult.data) ? attendanceResult.data.length : 'Not an array'}`);
  }
  console.log('');

  // Test 5: Get Active Sessions
  console.log('5. Testing Get Active Sessions...');
  const sessionsResult = await apiCall('/sessions/active', 'GET', null, authToken);
  console.log(`   Status: ${sessionsResult.status} - ${sessionsResult.success ? '✅ PASS' : '❌ FAIL'}`);
  if (sessionsResult.data) {
    console.log(`   Active sessions found: ${Array.isArray(sessionsResult.data) ? sessionsResult.data.length : 'Not an array'}`);
  }
  console.log('');

  // Test 6: Get Classes
  console.log('6. Testing Get Classes...');
  const classesResult = await apiCall('/classes', 'GET', null, authToken);
  console.log(`   Status: ${classesResult.status} - ${classesResult.success ? '✅ PASS' : '❌ FAIL'}`);
  if (classesResult.data) {
    console.log(`   Classes found: ${Array.isArray(classesResult.data) ? classesResult.data.length : 'Not an array'}`);
  }
  console.log('');

  // Test 7: Check if fingerprint routes exist
  console.log('7. Testing Fingerprint Status...');
  const fingerprintResult = await apiCall('/fingerprints/status', 'GET', null, authToken);
  console.log(`   Status: ${fingerprintResult.status} - ${fingerprintResult.success ? '✅ PASS' : '❌ FAIL'}`);
  if (fingerprintResult.data) {
    console.log(`   Fingerprint status:`, fingerprintResult.data);
  }
  console.log('');

  // Summary
  console.log('🎯 Test Summary:');
  console.log('================');
  console.log('If all tests above show ✅ PASS, the backend is working correctly.');
  console.log('If you see ❌ FAIL, check the error messages and fix the backend routes.');
  console.log('');
  console.log('📱 Mobile App Integration:');
  console.log('- Make sure the AuthContext is properly storing tokens');
  console.log('- Verify that the apiService is using the correct base URL');
  console.log('- Check that AsyncStorage is working on your device/simulator');
  console.log('- Ensure the mobile app can reach localhost:3000');
}

// Run the tests
if (typeof fetch === 'undefined') {
  // Node.js environment
  console.log('❌ This script requires Node.js 18+ with built-in fetch or install node-fetch');
  console.log('Run: npm install node-fetch (if using Node.js < 18)');
} else {
  testBackendEndpoints().catch(console.error);
}

module.exports = { testBackendEndpoints };