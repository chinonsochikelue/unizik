const jwt = require('jsonwebtoken');

// Check JWT decode
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGUyYmRmYWY3ZWU1NzdmMGI4NjBmOTgiLCJlbWFpbCI6InN0dWRlbnQxQGV4YW1wbGUuY29tIiwicm9sZSI6IlNUVURFTlQiLCJpYXQiOjE3NTk3NDU5MDIsImV4cCI6MTc1OTc0NjgwMn0.OBg37Bl282JYqusAEQxEJK6VNDmxOz094T-DdwtMhDQ';

try {
  // Try to decode without verification first
  const decoded = jwt.decode(token);
  console.log('Decoded token (no verification):', decoded);

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (decoded.exp < now) {
    console.log('Token is expired');
    console.log('Token exp:', new Date(decoded.exp * 1000));
    console.log('Current time:', new Date());
  } else {
    console.log('Token is valid');
  }

  // Try to verify with env secret
  require('dotenv').config();
  const envSecret = process.env.JWT_SECRET;
  console.log('JWT_SECRET from env:', envSecret);
  
  try {
    const verified = jwt.verify(token, envSecret);
    console.log('Token verified with env secret:', verified);
  } catch (verifyError) {
    console.log('Token verification with env secret failed:', verifyError.message);
  }
  
  // Try to verify with default secret
  const defaultSecret = 'your-super-secret-jwt-key-change-in-production';
  try {
    const verified = jwt.verify(token, defaultSecret);
    console.log('Token verified with default secret:', verified);
  } catch (verifyError) {
    console.log('Token verification with default secret failed:', verifyError.message);
  }
  
} catch (error) {
  console.log('Error decoding token:', error.message);
}