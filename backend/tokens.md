# Sample JWT Tokens for Testing

## Login Credentials
- **Admin**: admin@example.com / Admin123!
- **Teachers**: teacher1@example.com through teacher4@example.com / Teacher123!
- **Students**: student1@example.com through student20@example.com / Student123!

## Sample Access Tokens (Valid for 15 minutes)

### Admin Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGUyYmRmNWY3ZWU1NzdmMGI4NjBmOTMiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU5NjkwNTQ3LCJleHAiOjE3NTk2OTE0NDd9.ehPpfBzygYMQldgga4fKjWtmuZSn8dBqWsUyfCdKe9U
```

### Teacher Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGUyYmRmN2Y3ZWU1NzdmMGI4NjBmOTQiLCJlbWFpbCI6InRlYWNoZXIxQGV4YW1wbGUuY29tIiwicm9sZSI6IlRFQUNIRVIiLCJpYXQiOjE3NTk2OTA1NDcsImV4cCI6MTc1OTY5MTQ0N30.29fcBDiSQ1ExwXu7_KTTVPKlNbzBCloAwncls7Cj0TA
```

### Student Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGUyYmRmYWY3ZWU1NzdmMGI4NjBmOTgiLCJlbWFpbCI6InN0dWRlbnQxQGV4YW1wbGUuY29tIiwicm9sZSI6IlNUVURFTlQiLCJpYXQiOjE3NTk2OTA1NDcsImV4cCI6MTc1OTY5MTQ0N30.LBfKkH8INiWvS1hQLvACl5xsRLumm5HQQAz5UuPOcac
```

## Sample Refresh Tokens (Valid for 7 days)

### Admin Refresh Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGUyYmRmNWY3ZWU1NzdmMGI4NjBmOTMiLCJpYXQiOjE3NTk2OTA1NDcsImV4cCI6MTc2MDI5NTM0N30.L0tMa3W8FtNSkRAXRBcJoZFpIhVPP-siYJ8b5ZfXTjw
```

### Teacher Refresh Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGUyYmRmN2Y3ZWU1NzdmMGI4NjBmOTQiLCJpYXQiOjE3NTk2OTA1NDcsImV4cCI6MTc2MDI5NTM0N30.JXCQM_H9Y9_XxH6K23Tcp4gmV8k-uF-1JNujoZnIsus
```

### Student Refresh Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGUyYmRmYWY3ZWU1NzdmMGI4NjBmOTgiLCJpYXQiOjE3NTk2OTA1NDcsImV4cCI6MTc2MDI5NTM0N30.HGGFYozfLhwFN1FTNFxS8ZHcQ0e7zoVNonLvWuX0Cbk
```

## Usage with curl

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "Admin123!"}'
```

### Use Access Token
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"
```

### Refresh Token
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "YOUR_REFRESH_TOKEN_HERE"}'
```
