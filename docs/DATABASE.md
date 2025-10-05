# Database Schema

## Overview

The database schema is designed to support all aspects of the attendance management system, including user management, class scheduling, attendance tracking, and reporting.

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Attendance : marks
    User ||--o{ Class : teaches
    User ||--o{ Class : enrolls
    Class ||--o{ Session : has
    Session ||--o{ Attendance : contains
    Department ||--o{ Class : contains
    Department ||--o{ User : belongs_to

    User {
        string id PK
        string email
        string password
        string firstName
        string lastName
        string role
        string departmentId FK
        datetime createdAt
        datetime updatedAt
        json biometricData
        boolean isActive
    }

    Class {
        string id PK
        string name
        string code
        string description
        string teacherId FK
        string departmentId FK
        datetime createdAt
        datetime updatedAt
        boolean isActive
    }

    Session {
        string id PK
        string classId FK
        datetime startTime
        datetime endTime
        string status
        string description
        datetime createdAt
        datetime updatedAt
    }

    Attendance {
        string id PK
        string sessionId FK
        string userId FK
        datetime markedAt
        string status
        json location
        string device
        datetime createdAt
        datetime updatedAt
    }

    Department {
        string id PK
        string name
        string code
        string description
        datetime createdAt
        datetime updatedAt
    }
```

## Schema Details

### User Entity
The User entity stores information about all system users (students, teachers, and admins).

#### Fields
- `id`: Unique identifier (UUID)
- `email`: User's email address (unique)
- `password`: Hashed password
- `firstName`: User's first name
- `lastName`: User's last name
- `role`: User role (ADMIN, TEACHER, STUDENT)
- `departmentId`: Reference to Department
- `biometricData`: Stored biometric templates (encrypted)
- `isActive`: Account status

### Class Entity
Represents academic classes or courses.

#### Fields
- `id`: Unique identifier (UUID)
- `name`: Class name
- `code`: Course code
- `description`: Class description
- `teacherId`: Reference to User (teacher)
- `departmentId`: Reference to Department
- `isActive`: Class status

### Session Entity
Represents individual class sessions or meetings.

#### Fields
- `id`: Unique identifier (UUID)
- `classId`: Reference to Class
- `startTime`: Session start time
- `endTime`: Session end time
- `status`: Session status (SCHEDULED, ONGOING, COMPLETED, CANCELLED)
- `description`: Session notes

### Attendance Entity
Records attendance for each student in each session.

#### Fields
- `id`: Unique identifier (UUID)
- `sessionId`: Reference to Session
- `userId`: Reference to User (student)
- `markedAt`: Time attendance was marked
- `status`: Attendance status (PRESENT, ABSENT, LATE)
- `location`: GPS coordinates (for verification)
- `device`: Device information

### Department Entity
Organizes classes and users into departments.

#### Fields
- `id`: Unique identifier (UUID)
- `name`: Department name
- `code`: Department code
- `description`: Department description

## Indexes

### Performance Indexes
```sql
-- User indexes
CREATE INDEX idx_user_email ON User(email);
CREATE INDEX idx_user_role ON User(role);
CREATE INDEX idx_user_department ON User(departmentId);

-- Class indexes
CREATE INDEX idx_class_teacher ON Class(teacherId);
CREATE INDEX idx_class_department ON Class(departmentId);
CREATE INDEX idx_class_code ON Class(code);

-- Session indexes
CREATE INDEX idx_session_class ON Session(classId);
CREATE INDEX idx_session_time ON Session(startTime, endTime);
CREATE INDEX idx_session_status ON Session(status);

-- Attendance indexes
CREATE INDEX idx_attendance_session ON Attendance(sessionId);
CREATE INDEX idx_attendance_user ON Attendance(userId);
CREATE INDEX idx_attendance_marked ON Attendance(markedAt);
```

## Relationships

### One-to-Many Relationships
1. Department -> Users
   - A department has many users
   - A user belongs to one department

2. Department -> Classes
   - A department has many classes
   - A class belongs to one department

3. Class -> Sessions
   - A class has many sessions
   - A session belongs to one class

### Many-to-Many Relationships
1. Users <-> Classes (Students)
   - A student can enroll in many classes
   - A class can have many students

2. Users -> Classes (Teachers)
   - A teacher can teach many classes
   - A class has one teacher

## Data Integrity

### Foreign Key Constraints
```sql
ALTER TABLE User ADD FOREIGN KEY (departmentId) REFERENCES Department(id);
ALTER TABLE Class ADD FOREIGN KEY (teacherId) REFERENCES User(id);
ALTER TABLE Class ADD FOREIGN KEY (departmentId) REFERENCES Department(id);
ALTER TABLE Session ADD FOREIGN KEY (classId) REFERENCES Class(id);
ALTER TABLE Attendance ADD FOREIGN KEY (sessionId) REFERENCES Session(id);
ALTER TABLE Attendance ADD FOREIGN KEY (userId) REFERENCES User(id);
```

### Unique Constraints
```sql
ALTER TABLE User ADD CONSTRAINT unique_email UNIQUE (email);
ALTER TABLE Class ADD CONSTRAINT unique_code UNIQUE (code);
ALTER TABLE Department ADD CONSTRAINT unique_dept_code UNIQUE (code);
```

## Data Protection

### Encryption
- Biometric data is encrypted at rest
- Passwords are hashed using bcrypt
- Sensitive personal information is encrypted

### Audit Trail
All entities include:
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- Change tracking through database triggers

## Data Migration

### Version Control
- Migrations are version controlled
- Each migration has up/down methods
- Migration history is tracked

### Sample Migration
```typescript
import { Prisma } from '@prisma/client';

export const up = async (prisma: Prisma) => {
  await prisma.$executeRaw`
    ALTER TABLE User 
    ADD COLUMN biometricData jsonb;
  `;
};

export const down = async (prisma: Prisma) => {
  await prisma.$executeRaw`
    ALTER TABLE User 
    DROP COLUMN biometricData;
  `;
};
```

## Backup Strategy

### Regular Backups
- Daily full database backups
- Hourly incremental backups
- 30-day retention policy

### Backup Verification
- Automated restore testing
- Data integrity checks
- Backup monitoring and alerts