# Sample JWT Tokens for Testing

## Login Credentials
- **Admin**: admin@example.com / Admin123!
- **Teacher**: teacher@example.com / Teacher123!
- **Students**: student1@example.com through student5@example.com / Student123!

## Sample Access Tokens (Valid for 15 minutes)

### Admin Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGQ3NmFmODk5NzY2NzUwMzE0NjNhM2YiLCJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNzU4OTQ4MTAyLCJleHAiOjE3NTg5NDkwMDJ9.fgrDQLhnRhjUEMeD52Y0yY0bdgdTgszDCqM1W1fOsfY
```

### Teacher Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGQ3NmFmOTk5NzY2NzUwMzE0NjNhNDAiLCJlbWFpbCI6InRlYWNoZXJAZXhhbXBsZS5jb20iLCJyb2xlIjoiVEVBQ0hFUiIsImlhdCI6MTc1ODk0ODEwMiwiZXhwIjoxNzU4OTQ5MDAyfQ.wLZR5Q320r7GPzy0cXGTSqfODdsOLzEMhlF9isjE2DI
```

### Student Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGQ3NmFmYTk5NzY2NzUwMzE0NjNhNDEiLCJlbWFpbCI6InN0dWRlbnQxQGV4YW1wbGUuY29tIiwicm9sZSI6IlNUVURFTlQiLCJpYXQiOjE3NTg5NDgxMDIsImV4cCI6MTc1ODk0OTAwMn0.QNh1aHdDPex2vgizeIiXkVEfKyaLKFuXxgzFPzxVo9I
```

## Sample Refresh Tokens (Valid for 7 days)

### Admin Refresh Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGQ3NmFmODk5NzY2NzUwMzE0NjNhM2YiLCJpYXQiOjE3NTg5NDgxMDIsImV4cCI6MTc1OTU1MjkwMn0.BpSHi3__jOuv9kjyj3oQHTwc2IoySYjOXQyErYtRruE
```

### Teacher Refresh Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGQ3NmFmOTk5NzY2NzUwMzE0NjNhNDAiLCJpYXQiOjE3NTg5NDgxMDIsImV4cCI6MTc1OTU1MjkwMn0.6aT_ujgbG7g_6kDFtb1UzfGrLWiJly2a1ay-3K4WONw
```

### Student Refresh Token
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2OGQ3NmFmYTk5NzY2NzUwMzE0NjNhNDEiLCJpYXQiOjE3NTg5NDgxMDIsImV4cCI6MTc1OTU1MjkwMn0.UlSTN-EJOh1U__Wer_WCmJOzA6GF0XlekQzptck89nU
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
