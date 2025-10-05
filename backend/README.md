# Unizik Attendance Management System - Backend

A robust Node.js backend service for managing student attendance, classes, and user authentication in an educational environment.

## Features

- 🔐 JWT-based Authentication & Authorization
- 👥 User Management (Students, Teachers, Admins)
- 📊 Attendance Tracking & Reporting
- 📝 Class Management
- 📅 Session Management
- 📈 Analytics Dashboard
- 🔍 Detailed Reports Generation

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Prisma ORM
- **Authentication**: JWT
- **Testing**: Jest
- **Documentation**: Postman Collection
- **Containerization**: Docker

## Prerequisites

- Node.js (v18 or higher)
- MongoDB
- pnpm (Package Manager)
- Docker (optional)

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```
   DATABASE_URL="MongoDB://username:password@localhost:5432/unizik_db"
   JWT_SECRET="your-secret-key"
   PORT=3000
   ```

4. Set up the database:
   ```bash
   pnpm prisma migrate dev
   pnpm prisma db seed
   ```

5. Start the development server:
   ```bash
   pnpm run dev
   ```

## Docker Setup

1. Build the image:
   ```bash
   docker build -t unizik-backend .
   ```

2. Run with docker-compose:
   ```bash
   docker-compose up -d
   ```

## API Documentation

API documentation is available in the Postman collection: `postman_collection.json`

### Key Endpoints

- Auth:
  - POST `/api/auth/login`
  - POST `/api/auth/signup`
  - POST `/api/auth/refresh`

- Users:
  - GET `/api/users`
  - POST `/api/users`
  - PATCH `/api/users/:id`

- Classes:
  - GET `/api/classes`
  - POST `/api/classes`
  - GET `/api/classes/:id/attendance`

- Sessions:
  - GET `/api/sessions`
  - POST `/api/sessions`
  - PATCH `/api/sessions/:id`

- Attendance:
  - POST `/api/attendance/mark`
  - GET `/api/attendance/report`

- Reports:
  - GET `/api/reports/dashboard`
  - GET `/api/reports/attendance`
  - GET `/api/reports/class/:id`

## Project Structure

```
├── prisma/               # Database schema and migrations
├── src/
│   ├── middleware/       # Express middleware
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── server.js        # Main application file
├── tests/               # Test files
└── docker-compose.yml   # Docker compose configuration
```

## Testing

Run tests with:
```bash
pnpm test
```

## Contributing

1. Create a feature branch
2. Commit changes
3. Push to the branch
4. Create a Pull Request

## License

MIT License

## Support

For support, contact the development team or create an issue in the repository.