# API Documentation

## Overview

The backend API provides comprehensive endpoints for managing attendance, users, classes, and generating reports. This document details all available endpoints, their request/response formats, and authentication requirements.

## Authentication

### JWT Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <token>
```

### Token Management

- Access tokens expire after 1 hour
- Refresh tokens expire after 7 days
- Token rotation is implemented for security

## Base URL

```
https://api.unizik-attendance.com/api
```

For development:
```
http://localhost:3000/api
```

## API Endpoints

### Authentication

#### Login

```http
POST /auth/login
```

Request:
```json
{
  "email": "string",
  "password": "string"
}
```

Response:
```json
{
  "token": "string",
  "refreshToken": "string",
  "user": {
    "id": "string",
    "email": "string",
    "role": "string",
    "firstName": "string",
    "lastName": "string"
  }
}
```

#### Signup

```http
POST /auth/signup
```

Request:
```json
{
  "email": "string",
  "password": "string",
  "firstName": "string",
  "lastName": "string",
  "role": "string",
  "departmentId": "string"
}
```

### User Management

#### Get Users

```http
GET /users
```

Query Parameters:
```
role: string (optional)
department: string (optional)
page: number (optional)
limit: number (optional)
```

Response:
```json
{
  "users": [
    {
      "id": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "string",
      "department": {
        "id": "string",
        "name": "string"
      }
    }
  ],
  "total": "number",
  "page": "number",
  "totalPages": "number"
}
```

### Class Management

#### Create Class

```http
POST /classes
```

Request:
```json
{
  "name": "string",
  "code": "string",
  "description": "string",
  "teacherId": "string",
  "departmentId": "string"
}
```

#### Get Class Attendance

```http
GET /classes/{id}/attendance
```

Query Parameters:
```
startDate: string (optional)
endDate: string (optional)
```

### Session Management

#### Create Session

```http
POST /sessions
```

Request:
```json
{
  "classId": "string",
  "startTime": "string",
  "endTime": "string",
  "description": "string"
}
```

#### Mark Attendance

```http
POST /attendance/mark
```

Request:
```json
{
  "sessionId": "string",
  "userId": "string",
  "status": "string",
  "location": {
    "latitude": "number",
    "longitude": "number"
  }
}
```

### Reports

#### Dashboard Statistics

```http
GET /reports/dashboard
```

Response:
```json
{
  "totalStudents": "number",
  "totalTeachers": "number",
  "totalClasses": "number",
  "todaySessions": "number",
  "attendanceTrend": {
    "labels": ["string"],
    "data": ["number"]
  },
  "classDistribution": {
    "labels": ["string"],
    "data": ["number"]
  },
  "roleDistribution": [
    {
      "name": "string",
      "count": "number",
      "color": "string"
    }
  ]
}
```

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": "object (optional)"
  }
}
```

### Common Error Codes

- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `422`: Validation Error
- `500`: Server Error

### Validation Errors

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": {
      "field": ["error message"]
    }
  }
}
```

## Rate Limiting

- Rate limit: 100 requests per minute
- Rate limit headers included in response:
  ```http
  X-RateLimit-Limit: 100
  X-RateLimit-Remaining: 99
  X-RateLimit-Reset: 1635529200
  ```

## Websocket Events

### Connection

```javascript
const socket = io('wss://api.unizik-attendance.com', {
  auth: {
    token: 'JWT_TOKEN'
  }
})
```

### Events

#### Session Updates

```javascript
// Listen for new sessions
socket.on('session:new', (session) => {
  // Handle new session
})

// Listen for session updates
socket.on('session:update', (session) => {
  // Handle session update
})
```

#### Attendance Updates

```javascript
// Listen for attendance marks
socket.on('attendance:marked', (attendance) => {
  // Handle new attendance mark
})
```

## API Versioning

API versioning is handled through URL prefixing:

```
/api/v1/resource
/api/v2/resource
```

Current stable version: v1

## Security

### CORS Configuration

```javascript
const corsOptions = {
  origin: ['https://unizik-attendance.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}
```

### Request Signing

For sensitive operations, requests must be signed:

```javascript
const signature = crypto
  .createHmac('sha256', API_SECRET)
  .update(payload)
  .digest('hex')
```

Include signature in headers:
```http
X-Request-Signature: <signature>
```

## Development

### Local Setup

1. Clone repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Setup environment:
   ```bash
   cp .env.example .env
   ```
4. Start development server:
   ```bash
   pnpm run dev
   ```

### Testing

Run tests:
```bash
pnpm test
```

Run specific test suite:
```bash
pnpm test:unit
pnpm test:integration
```

### API Documentation

Generate API documentation:
```bash
pnpm docs:generate
```

Access documentation:
```
http://localhost:3000/docs
```