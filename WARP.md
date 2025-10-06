# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is a full-stack Student Management & Biometric Attendance System with role-based access control. The system supports three user roles (Admin, Teacher, Student) and uses biometric authentication for attendance tracking.

**Tech Stack:**

- Backend: Node.js + Express REST API with Prisma ORM
- Database: MongoDB
- Mobile App: Expo Router with biometric authentication
- Authentication: JWT with refresh tokens

## Architecture

### Multi-App Structure

- `backend/` - Express.js REST API server
- `mobapp/` - Modern Expo Router app with file-based routing
- `docs/` - Documentation

### Backend Architecture

The backend follows a clean REST API pattern:

- `src/routes/` - Express route handlers organized by domain (auth, classes, sessions, attendance, reports, admin, dev)
- `src/middleware/` - Authentication middleware
- `src/utils/` - Utilities for encryption and validation
- `prisma/` - Database schema and seeding

### Database Schema (MongoDB + Prisma)

Key entities with relationships:

- **User** (Admin/Teacher/Student roles)
- **Class** (many-to-many with Students, belongs to Teacher)
- **Session** (attendance sessions with unique codes)
- **Attendance** (student presence records)
- **Fingerprint** (biometric templates)
- **RefreshToken** (JWT refresh token management)

### Frontend Architecture

- `mobapp/` - Modern Expo Router with file-based routing using `(auth)`, `(protected)`, and role-based tab groups
- `mobapp/app/` - Screens use Expo Router
- `mobapp/app/(auth)/` - Auth Screens
- `mobapp/app/(protected)/` Role based screens

## Development Commands

### Backend Setup & Development

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run seed
npm run dev        # Start development server
npm test           # Run Jest tests
npm run start      # Production server
```

### Mobile App (Expo Router) Development

```bash
cd mobapp
pnpm install       # Uses pnpm package manager
pnpm start         # Start Expo dev server
pnpm android       # Android emulator
pnpm ios           # iOS simulator
pnpm web           # Web version
pnpm lint          # ESLint
```

### Database Management

```bash
cd backend
npx prisma studio          # GUI for database
npx prisma db push         # Push schema changes
npx prisma generate        # Regenerate client
npm run seed              # Seed with test data
```

## Testing

### Backend Tests

- Located in `backend/tests/`
- Uses Jest with Supertest for API testing
- Test files: `auth.test.js`, `attendance.test.js`
- Run with: `npm test` or `npm run test:watch`

### Frontend Tests

- Uses Jest with React Native Testing Library
- Test files in `src/components/__tests__/`
- Run with: `npm test`

## Development Features

### Development Mode

Backend includes development-only features when `DEV_MODE=true`:

- `/api/dev/fingerprint-simulate` - Simulate biometric operations without hardware
- Enhanced error messages and logging

### Seeded Data

Running `npm run seed` creates:

- Admin: [admin@example.com] / Admin123!

- Teacher: [teacher@example.com](mailto:teacher@example.com) / Teacher123!

- Students: [student1-5@example.com] / Student123!

- Sample classes and relationships

### Environment Configuration

**Backend (.env):**

- `DATABASE_URL` - MongoDB connection string
- `JWT_SECRET` & `JWT_REFRESH_SECRET` - JWT signing keys
- `ENCRYPTION_KEY` - For biometric data encryption
- `DEV_MODE=true` - Enables dev routes
- `PORT=3000` - Server port

**Frontend/MobApp:**

- `EXPO_PUBLIC_API_URL` - Backend API endpoint
- `EXPO_PUBLIC_DEV_MODE=true` - Development features

## Key Workflows

### Attendance Flow

1. Teacher starts session: `POST /api/sessions/start`
2. System generates unique session code
3. Student marks attendance: `POST /api/attendance/mark` with biometric verification
4. Teacher can view/export attendance data

### Biometric Authentication

- Uses Expo LocalAuthentication for device-level biometrics
- Fingerprint templates stored encrypted in MongoDB
- Development simulation available for testing without biometric hardware

### Role-Based Access

- Route protection via JWT middleware
- Different UI flows based on user role
- API endpoints restricted by user permissions

## Important Notes

- The project has two frontend implementations: `mobapp/` (modern with Expo Router)
- MongoDB is used but the README mentions Docker Compose setup (though docker-compose.yml wasn't found in root)
- Biometric data is encrypted before storage using the `ENCRYPTION_KEY`
- Session codes are unique per attendance session for security
- The system supports manual attendance editing by teachers
