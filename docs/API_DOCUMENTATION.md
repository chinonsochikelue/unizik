# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Authentication

#### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "role": "STUDENT|TEACHER|ADMIN",
  "studentId": "STU001", // Required for STUDENT role
  "teacherId": "TCH001"  // Required for TEACHER role
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "STUDENT"
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "role": "STUDENT"
    },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

#### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

### Classes

#### GET /classes
Get all classes (Admin/Teacher) or enrolled classes (Student).

**Headers:** Authorization required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "class_id",
      "name": "Mathematics 101",
      "code": "MATH101",
      "teacher": {
        "firstName": "Jane",
        "lastName": "Smith"
      },
      "studentCount": 25
    }
  ]
}
```

#### POST /classes
Create a new class (Admin/Teacher only).

**Headers:** Authorization required

**Request Body:**
```json
{
  "name": "Physics 101",
  "code": "PHY101",
  "description": "Introduction to Physics"
}
```

### Sessions

#### GET /sessions/:classId
Get all sessions for a class.

**Headers:** Authorization required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "session_id",
      "startTime": "2024-01-15T09:00:00Z",
      "endTime": "2024-01-15T11:00:00Z",
      "isActive": true,
      "attendanceCount": 20
    }
  ]
}
```

#### POST /sessions
Create a new session (Teacher only).

**Headers:** Authorization required

**Request Body:**
```json
{
  "classId": "class_id",
  "startTime": "2024-01-15T09:00:00Z",
  "endTime": "2024-01-15T11:00:00Z"
}
```

### Attendance

#### POST /attendance/mark
Mark attendance for a session (Student only).

**Headers:** Authorization required

**Request Body:**
```json
{
  "sessionId": "session_id",
  "fingerprintData": "encrypted_fingerprint_data"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "attendance_id",
    "status": "PRESENT",
    "timestamp": "2024-01-15T09:15:00Z"
  }
}
```

#### GET /attendance/session/:sessionId
Get attendance for a session (Teacher only).

**Headers:** Authorization required

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "student": {
        "firstName": "John",
        "lastName": "Doe",
        "studentId": "STU001"
      },
      "status": "PRESENT",
      "timestamp": "2024-01-15T09:15:00Z"
    }
  ]
}
```

### Reports

#### GET /reports/attendance
Get attendance reports with filters.

**Headers:** Authorization required

**Query Parameters:**
- `classId` (optional): Filter by class
- `startDate` (optional): Start date for report
- `endDate` (optional): End date for report
- `studentId` (optional): Filter by student (Admin/Teacher only)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalSessions": 10,
      "attendedSessions": 8,
      "attendanceRate": 80
    },
    "details": [
      {
        "sessionId": "session_id",
        "className": "Mathematics 101",
        "date": "2024-01-15",
        "status": "PRESENT"
      }
    ]
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
