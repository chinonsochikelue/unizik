# Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- MongoDB Atlas account (for production database)
- Node.js 18+ (for local development)
- Expo CLI (for React Native development)

## Environment Setup

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/attendance_system"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-here"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Encryption
ENCRYPTION_KEY="your-32-character-encryption-key"

# Development
DEV_MODE=false
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
EXPO_PUBLIC_API_URL=https://your-api-domain.com/api
EXPO_PUBLIC_DEV_MODE=false
```

## Docker Deployment

### 1. Build and Run with Docker Compose

```bash
# Clone the repository
git clone <repository-url>
cd student-attendance-system

# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 2. Individual Service Deployment

#### Backend Only
```bash
cd backend
docker build -t attendance-backend .
docker run -p 3000:3000 --env-file .env attendance-backend
```

#### Frontend Only
```bash
cd frontend
docker build -t attendance-frontend .
docker run -p 19006:19006 attendance-frontend
```

## Production Deployment

### 1. Backend Deployment (Node.js)

#### Using PM2
```bash
# Install PM2 globally
npm install -g pm2

# Navigate to backend directory
cd backend

# Install dependencies
npm install --production

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database (optional)
npm run seed

# Start with PM2
pm2 start src/server.js --name "attendance-api"

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Using Docker in Production
```bash
# Build production image
docker build -t attendance-backend:prod .

# Run with production environment
docker run -d \
  --name attendance-api \
  -p 3000:3000 \
  --env-file .env.production \
  --restart unless-stopped \
  attendance-backend:prod
```

### 2. Frontend Deployment

#### Build for Production
```bash
cd frontend

# Install dependencies
npm install

# Build for production
expo build:web

# The built files will be in the web-build directory
# Deploy these files to your web server (Nginx, Apache, etc.)
```

#### Mobile App Deployment
```bash
# Build for Android
expo build:android

# Build for iOS
expo build:ios

# Or use EAS Build (recommended)
npm install -g @expo/eas-cli
eas build --platform all
```

## Database Setup

### MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist your IP addresses
5. Get the connection string
6. Update the `DATABASE_URL` in your `.env` file

### Local MongoDB Setup

```bash
# Using Docker
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:latest

# Connection string for local MongoDB
DATABASE_URL="mongodb://admin:password@localhost:27017/attendance_system?authSource=admin"
```

## Nginx Configuration

Create an Nginx configuration file for the backend API:

```nginx
server {
    listen 80;
    server_name your-api-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## SSL Certificate Setup

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-api-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Health Checks

The backend includes health check endpoints:

- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system status

## Monitoring

### Backend Monitoring
```bash
# View PM2 status
pm2 status

# View logs
pm2 logs attendance-api

# Monitor resources
pm2 monit
```

### Docker Monitoring
```bash
# View container status
docker ps

# View logs
docker logs attendance-backend

# Monitor resources
docker stats
```

## Backup Strategy

### Database Backup
```bash
# MongoDB backup
mongodump --uri="mongodb+srv://username:password@cluster.mongodb.net/attendance_system" --out=backup/

# Restore
mongorestore --uri="mongodb+srv://username:password@cluster.mongodb.net/attendance_system" backup/attendance_system/
```

### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/attendance_system_$DATE"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
mongodump --uri="$DATABASE_URL" --out=$BACKUP_DIR

# Compress backup
tar -czf "$BACKUP_DIR.tar.gz" -C /backups "attendance_system_$DATE"

# Remove uncompressed backup
rm -rf $BACKUP_DIR

# Keep only last 7 days of backups
find /backups -name "attendance_system_*.tar.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR.tar.gz"
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check MongoDB Atlas IP whitelist
   - Verify connection string format
   - Ensure database user has proper permissions

2. **JWT Token Issues**
   - Verify JWT_SECRET is set and consistent
   - Check token expiration settings
   - Ensure proper token format in requests

3. **CORS Issues**
   - Update CORS configuration in backend
   - Verify frontend API URL configuration

4. **Mobile App Issues**
   - Check Expo configuration
   - Verify API URL is accessible from mobile device
   - Test biometric authentication on physical device

### Logs and Debugging

```bash
# Backend logs
tail -f backend/logs/app.log

# Docker logs
docker logs -f attendance-backend

# PM2 logs
pm2 logs attendance-api --lines 100
