# Student Management & Biometric Attendance System

A complete full-stack application for managing students and tracking attendance using biometric authentication.

## Tech Stack

- **Frontend**: React Native (Expo) with biometric authentication
- **Backend**: Node.js + Express REST API
- **Database**: MongoDB with Prisma ORM
- **Authentication**: JWT with refresh tokens
- **Infrastructure**: Docker & Docker Compose

## Features

### Role-Based Access Control
- **Admin**: Manage classes, teachers, students; export attendance; view analytics
- **Teacher**: Start/stop attendance sessions; view class lists; manual attendance edits
- **Student**: Enroll biometrics; mark attendance via biometric verification

### Biometric Attendance
- Device-based biometric authentication using Expo LocalAuthentication
- Session-based attendance marking with QR codes/session IDs
- Development simulation endpoints for testing without biometric hardware

## Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Expo CLI (`npm install -g @expo/cli`)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd student-attendance-system
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
npm install
```

### 3. Start Infrastructure
```bash
# From project root
docker-compose up -d mongodb
```

### 4. Initialize Database
```bash
cd backend
npx prisma generate
npx prisma db push
npm run seed
```

### 5. Start Backend
```bash
cd backend
npm run dev
```

### 6. Start Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm start
```

## Environment Variables

### Backend (.env)
```
DATABASE_URL="mongodb://admin:password123@localhost:27017/student_attendance?authSource=admin"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-in-production"
ENCRYPTION_KEY="your-32-character-encryption-key-here"
PORT=3000
NODE_ENV=development
DEV_MODE=true
```

### Frontend (.env)
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_DEV_MODE=true
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token

### Sessions
- `POST /api/sessions/start` - Start attendance session (Teacher)
- `GET /api/sessions/:id` - Get session details
- `PUT /api/sessions/:id/stop` - Stop attendance session

### Attendance
- `POST /api/attendance/mark` - Mark attendance (Student)
- `GET /api/attendance/history/:studentId` - Get attendance history

### Development
- `POST /api/dev/fingerprint-simulate` - Simulate biometric operations

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Seeded Data

After running `npm run seed`, you'll have:

- **Admin**: admin@example.com / Admin123!
- **Teacher**: teacher@example.com / Teacher123!
- **Students**: student1@example.com through student5@example.com / Student123!

## 5-Minute Demo Script

1. **Admin Login**: Use admin credentials to access admin dashboard
2. **View Classes**: Navigate to classes section, see sample class with students
3. **Teacher Session**: Login as teacher, start an attendance session
4. **Student Attendance**: Login as student, mark attendance using biometric simulation
5. **Export Data**: Return to admin, export attendance CSV report

## Development

### Project Structure
```
├── backend/                 # Express API server
│   ├── src/                # Source code
│   ├── prisma/             # Database schema & seeds
│   └── tests/              # Backend tests
├── frontend/               # React Native Expo app
│   ├── src/                # App source code
│   ├── assets/             # Images and icons
│   └── __tests__/          # Frontend tests
└── docker-compose.yml      # Infrastructure setup
```

### Available Scripts

**Backend**:
- `npm run dev` - Start development server
- `npm run start` - Start production server
- `npm test` - Run tests
- `npm run seed` - Seed database
- `npm run prisma:generate` - Generate Prisma client

**Frontend**:
- `npm start` - Start Expo development server
- `npm run android` - Start on Android
- `npm run ios` - Start on iOS
- `npm run web` - Start web version

## Docker Deployment

```bash
# Start full stack
docker-compose up --build

# Stop services
docker-compose down
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

MIT License - see LICENSE file for details



# MobApp Project Structure
