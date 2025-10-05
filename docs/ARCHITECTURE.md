# System Architecture

## Overview

The Unizik Attendance Management System is built using a microservices-based architecture with the following main components:

```mermaid
graph TB
    MobileApp[Mobile App] --> API[Backend API]
    WebApp[Web Dashboard] --> API
    API --> DB[(MongoDB)]
    API --> Cache[(Redis Cache)]
    API --> Storage[(File Storage)]
```

## Core Components

### 1. Mobile Application
- React Native + Expo application
- Handles student and teacher interactions
- Manages biometric authentication
- Provides real-time attendance tracking

### 2. Backend API
- Node.js + Express application
- RESTful API design
- JWT-based authentication
- Real-time WebSocket connections

### 3. Database
- MongoDB for persistent storage
- Prisma as ORM
- Redis for caching and real-time features

## System Design Patterns

### Authentication Flow
```mermaid
sequenceDiagram
    participant User
    participant App
    participant API
    participant DB
    
    User->>App: Enter Credentials
    App->>API: Login Request
    API->>DB: Validate Credentials
    DB-->>API: User Data
    API-->>App: JWT Token
    App->>App: Store Token
```

### Attendance Marking Flow
```mermaid
sequenceDiagram
    participant Student
    participant App
    participant API
    participant DB
    
    Student->>App: Mark Attendance
    App->>API: POST /attendance
    API->>DB: Store Attendance
    DB-->>API: Confirmation
    API-->>App: Success Response
    App->>Student: Confirmation
```

### Real-time Updates Flow
```mermaid
sequenceDiagram
    participant Teacher
    participant App
    participant WebSocket
    participant API
    participant DB
    
    Teacher->>App: Start Session
    App->>WebSocket: Connect
    WebSocket->>API: Subscribe to Updates
    API->>DB: Monitor Changes
    DB-->>API: Changes
    API-->>WebSocket: Push Updates
    WebSocket-->>App: Real-time Updates
```

## Security Architecture

### Authentication
- JWT-based token system
- Refresh token rotation
- Biometric authentication integration
- Role-based access control (RBAC)

### Data Protection
- End-to-end encryption for sensitive data
- Secure storage of biometric templates
- Rate limiting and request throttling
- Input validation and sanitization

## Performance Optimization

### Caching Strategy
- Redis cache for frequent queries
- In-memory caching for session data
- Cache invalidation patterns
- Response caching

### Database Optimization
- Indexed queries
- Connection pooling
- Query optimization
- Data partitioning

## Scalability

### Horizontal Scaling
- Load balancer configuration
- Multiple API instances
- Database replication
- Cache distribution

### Vertical Scaling
- Resource optimization
- Memory management
- Connection pooling
- Query optimization