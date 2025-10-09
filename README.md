# 🎓 Unizik Attendance Management System - Mobile App

[![React Native](https://img.shields.io/badge/React%20Native-0.81.4-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-~54.0.10-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-~5.9.2-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive, modern React Native mobile application for managing student attendance at the Nnamdi Azikiwe University, Awka (UNIZIK || NAU). Built with Expo SDK and featuring advanced biometric authentication, real-time attendance tracking, and multi-role support for students, teachers, and administrators.

## 🌟 Features

### 🔐 **Advanced Authentication**
- JWT-based secure authentication with refresh tokens
- Biometric authentication (Fingerprint, Face ID, Iris)
- Multi-role support (Students, Teachers, Administrators)
- Cross-platform secure storage

### 📊 **Real-time Attendance System**
- Live session monitoring with auto-refresh
- QR code-based session joining
- Biometric verification for attendance marking
- Real-time attendance status updates

### 🎨 **Modern User Experience**
- Clean, intuitive interface with dark/light theme support
- Cross-platform compatibility (iOS, Android, Web)
- Interactive charts and analytics
- Smooth animations and haptic feedback

### 📈 **Analytics & Reporting**
- Comprehensive attendance statistics
- Class performance analytics
- Historical attendance data visualization
- Export functionality for reports

### 📡 **Offline Capabilities**
- Local data persistence with AsyncStorage
- Queue system for pending operations
- Automatic synchronization when online
- Offline attendance marking support

### 🔔 **Additional Features**
- Push notifications for session updates
- Class management and enrollment
- Profile management and settings
- Multi-language support preparation

---

## 🏗️ System Architecture

### High-Level Architecture

```mermaid
graph TB
    subgraph "Frontend - React Native App"
        A[Mobile App] --> B[Expo Router]
        A --> C[Auth Context]
        A --> D[Custom Hooks]
        A --> E[UI Components]
    end
    
    subgraph "Backend Services"
        F[REST API Server]
        G[Database]
        H[Authentication Service]
    end
    
    subgraph "External Services"
        I[Biometric Hardware]
        J[Push Notifications]
    end
    
    A --> F
    C --> H
    D --> I
    F --> G
    A --> J
```

### Authentication Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Login     │───▶│    JWT      │───▶│  Protected  │
│  Screen     │    │ Validation  │    │   Routes    │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Biometric   │    │ Secure      │    │  Role-based │
│  Verify     │    │  Storage    │    │   Access    │
└─────────────┘    └─────────────┘    └─────────────┘
```

### Data Flow Architecture

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ UI Component│───▶│ Custom Hook │───▶│ API Service │
└─────────────┘    └─────────────┘    └─────────────┘
       ▲                   ▲                   │
       │                   │                   ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Context   │◀───│ Local State │◀───│ HTTP Client │
│  Provider   │    │  Manager    │    │  (Axios)    │
└─────────────┘    └─────────────┘    └─────────────┘
```

---

## 🛠️ Technology Stack

### Core Framework
- **React Native** `0.81.4` - Cross-platform mobile development
- **Expo SDK** `~54.0.10` - Development platform and tools
- **TypeScript** `~5.9.2` - Type-safe JavaScript development
- **React** `19.1.0` - UI library with latest features

### Navigation & State Management
- **Expo Router** `~6.0.8` - File-based routing system
- **React Context API** - Global state management
- **React Navigation** `^7.1.8` - Navigation components

### UI & Design
- **React Native StyleSheet** - Component styling
- **Expo Linear Gradient** `~15.0.7` - Beautiful gradients
- **React Native Gesture Handler** `~2.28.0` - Touch interactions
- **React Native Reanimated** `~4.1.1` - Smooth animations
- **Expo Haptics** `~15.0.7` - Haptic feedback

### Data Visualization
- **React Native Chart Kit** `^6.12.0` - Chart components
- **React Native Gifted Charts** `^1.4.64` - Advanced charting
- **React Native SVG** `15.12.1` - Vector graphics

### Authentication & Security
- **Expo Local Authentication** `~17.0.7` - Biometric authentication
- **Expo Secure Store** `^15.0.7` - Secure key-value storage
- **JWT** - JSON Web Tokens for authentication

### Storage & Persistence
- **AsyncStorage** `^2.2.0` - Cross-platform local storage
- **Expo SQLite** (planned) - Local database

### Network & Communication
- **Axios** `^1.12.2` - HTTP client with interceptors
- **Expo Linking** `~8.0.8` - Deep linking support

### Development Tools
- **ESLint** `^9.25.0` - Code linting
- **Metro** `^0.83.3` - JavaScript bundler
- **TypeScript Config** - Type checking configuration

---

## 📁 Project Structure

```
mobapp/
├── 📱 app/                          # Application screens (Expo Router)
│   ├── 🔐 (auth)/                  # Authentication flow
│   │   ├── _layout.tsx             # Auth layout wrapper
│   │   ├── login.jsx               # Login screen
│   │   └── signup.jsx              # Registration screen
│   ├── 🔒 (protected)/             # Protected routes (authenticated users)
│   │   ├── _layout.tsx             # Protected layout wrapper
│   │   ├── modal.tsx               # Modal screens
│   │   ├── 👑 (admin)/             # Administrator dashboard
│   │   │   ├── AdminDashboard.jsx  # Main admin interface
│   │   │   ├── ClassManagement.jsx # Class creation/management
│   │   │   ├── Reports.jsx         # System-wide reports
│   │   │   ├── SystemSettings.jsx  # System configuration
│   │   │   └── UserManagement.jsx  # User administration
│   │   ├── ✅ (attendance)/        # Attendance features
│   │   │   ├── AttendanceScreen.jsx# Attendance marking
│   │   │   └── SessionScreen.jsx   # Session management
│   │   ├── 👤 (common)/            # Shared user features
│   │   │   └── ProfileScreen.jsx   # User profile management
│   │   ├── 📊 (reports)/           # Reporting features
│   │   │   ├── ClassReport.jsx     # Class-specific reports
│   │   │   └── ReportsScreen.jsx   # Report dashboard
│   │   ├── 🎓 (students)/          # Student-specific features
│   │   │   └── (tabs)/             # Student tab navigation
│   │   │       ├── _layout.jsx     # Tab layout
│   │   │       ├── index.jsx       # Student dashboard
│   │   │       ├── AttendanceScreen.jsx # Student attendance
│   │   │       └── FingerprintEnrollScreen.jsx # Biometric setup
│   │   ├── 👨‍🏫 (teachers)/          # Teacher-specific features
│   │   │   ├── ClassListScreen.jsx # Teacher's classes
│   │   │   ├── SessionScreen.jsx   # Session management
│   │   │   └── TeacherDashboard.jsx# Teacher dashboard
│   │   └── 📑 (tabs)/              # Main app navigation
│   │       ├── _layout.jsx         # Tab layout configuration
│   │       ├── explore.tsx         # Discovery/browse screen
│   │       └── index.jsx           # Home dashboard
│   ├── _layout.tsx                 # Root layout (theme, providers)
│   ├── +not-found.tsx              # 404 error screen
│   └── LoadingScreen.tsx           # App loading screen
├── 🎨 assets/                      # Static assets
│   └── images/                     # App icons and images
├── 🧩 components/                  # Reusable UI components
│   ├── AttendanceHistory.tsx       # Attendance list component
│   ├── ClassCard.tsx               # Class display card
│   ├── external-link.tsx           # External link handler
│   ├── haptic-tab.tsx              # Tab with haptic feedback
│   ├── hello-wave.tsx              # Animated welcome component
│   ├── parallax-scroll-view.tsx    # Parallax scrolling
│   ├── themed-text.tsx             # Theme-aware text component
│   ├── themed-view.tsx             # Theme-aware view component
│   └── ui/                         # Advanced UI components
│       ├── collapsible.tsx         # Collapsible sections
│       ├── icon-symbol.ios.tsx     # iOS-specific icons
│       └── icon-symbol.tsx         # Cross-platform icons
├── 📊 constants/                   # Application constants
│   ├── Colors.js                   # Color definitions
│   └── theme.ts                    # Theme configuration
├── 🌐 context/                     # React Context providers
│   └── AuthContext.js              # Authentication state management
├── 🎣 hooks/                       # Custom React hooks
│   ├── use-color-scheme.ts         # Color scheme detection
│   ├── use-color-scheme.web.ts     # Web-specific color scheme
│   ├── use-theme-color.ts          # Dynamic theme colors
│   ├── useAttendance.js            # Attendance operations
│   └── useBiometric.js             # Biometric authentication
├── 🔧 services/                    # External service integrations
│   ├── api.js                      # HTTP API client
│   └── biometric.js                # Biometric service wrapper
├── 🛠️ utils/                       # Utility functions
│   └── storage.js                  # Cross-platform storage
├── 📜 scripts/                     # Build and utility scripts
│   └── reset-project.js            # Project reset utility
├── ⚙️ Configuration Files
│   ├── app.json                    # Expo configuration
│   ├── package.json                # Dependencies and scripts
│   ├── tsconfig.json               # TypeScript configuration
│   ├── eslint.config.js            # ESLint rules
│   ├── pnpm-lock.yaml              # Dependency lock file
│   └── .gitignore                  # Git ignore rules
└── 📖 README.md                    # Project documentation
```

---

## 🔗 API Architecture & Endpoints

### Base Configuration
```javascript
API_BASE_URL: https://unizik.onrender.com/api
Timeout: 10 seconds
Authentication: Bearer Token (JWT)
```

### Authentication Endpoints

#### 🔐 User Authentication
```http
POST /auth/login
  Body: { email: string, password: string }
  Response: { accessToken: string, refreshToken: string, user: UserObject }

POST /auth/register
  Body: { email: string, password: string, name: string, role: string }
  Response: { success: boolean, message: string }

POST /auth/refresh
  Body: { refreshToken: string }
  Response: { accessToken: string }

POST /auth/logout
  Body: { refreshToken: string }
  Response: { success: boolean }
```

### Class Management Endpoints

#### 📚 Class Operations
```http
GET /classes/browse?search={query}&department={dept}&page={n}&limit={n}
  Response: { classes: ClassObject[], pagination: PaginationObject }

GET /classes/my-classes
  Response: { classes: ClassObject[] }

GET /classes (for teachers)
  Response: { classes: ClassObject[] }

GET /classes/{classId}
  Response: { class: ClassObject }

POST /classes/enroll
  Body: { classId: string, classCode?: string }
  Response: { success: boolean, message: string }

POST /classes/join-by-invite
  Body: { inviteCode: string }
  Response: { success: boolean, class: ClassObject }

POST /classes/{classId}/invite-code
  Body: { expiresInHours: number }
  Response: { inviteCode: string, expiresAt: string }
```

#### 👥 Class Members Management
```http
GET /classes/{classId}/available-students?search={query}
  Response: { students: StudentObject[] }

POST /classes/{classId}/students
  Body: { studentId: string }
  Response: { success: boolean }

DELETE /classes/{classId}/students/{studentId}
  Response: { success: boolean }

GET /classes/teachers (admin only)
  Response: { teachers: TeacherObject[] }

PUT /classes/{classId}
  Body: { teacherId?: string, ...updateData }
  Response: { class: ClassObject }
```

### Session & Attendance Endpoints

#### ✅ Attendance Management
```http
GET /sessions/active
  Response: { sessions: SessionObject[] }

POST /sessions/join
  Body: { sessionCode: string }
  Response: { success: boolean, session: SessionObject }

POST /sessions/join-and-mark-attendance
  Body: { sessionCode: string, biometricToken: string }
  Response: { success: boolean, attendance: AttendanceObject, message: string }
```

#### 📊 Attendance History
```http
GET /attendance/student/history?classId={id}&startDate={date}&endDate={date}&page={n}&limit={n}
  Response: { attendance: AttendanceObject[], pagination: PaginationObject }

GET /attendance/student/summary
  Response: { totalClasses: number, attended: number, rate: number }

GET /attendance/student/class/{classId}
  Response: { attendance: AttendanceObject[], stats: StatsObject }
```

### Biometric Authentication Endpoints

#### 👆 Fingerprint Management
```http
POST /fingerprints/enroll
  Body: { templateData: string }
  Response: { success: boolean, fingerprint: FingerprintObject }

GET /fingerprints/status
  Response: { enrolled: boolean, active: boolean, enrolledAt: string }

POST /dev/fingerprint-simulate (development only)
  Body: { studentId: string, action: 'enroll'|'verify' }
  Response: { success: boolean, confidence?: number, templateId?: string }
```

### Request/Response Interceptors

```javascript
// Automatic token refresh on 401 responses
// Request/response logging
// Error handling and user feedback
// Automatic retry logic for failed requests
```

---

## 🗄️ Data Models & Database Schema

### User Management

#### User Entity
```typescript
interface User {
  id: string
  email: string
  name: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  department?: string
  studentId?: string      // For students
  staffId?: string        // For teachers/admins
  profileImage?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

interface AuthTokens {
  accessToken: string     // JWT with 1 hour expiry
  refreshToken: string    // 30 days expiry
  tokenType: 'Bearer'
  expiresIn: number
}
```

#### User Profile Storage
```javascript
// Secure Storage Keys
StorageKeys = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken', 
  USER_DATA: 'userData',
  BIOMETRIC_ENROLLED: 'biometricEnrolled'
}
```

### Academic Structure

#### Class Entity
```typescript
interface Class {
  id: string
  name: string
  code: string            // e.g., "CSC301"
  description?: string
  department: string
  semester: string        // e.g., "2023/2024 First Semester"
  teacherId: string
  teacher?: User
  students: User[]        // Enrolled students
  maxStudents?: number
  classCode?: string      // For student enrollment
  inviteCode?: string     // Temporary invite code
  inviteExpiry?: Date
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface ClassEnrollment {
  id: string
  classId: string
  studentId: string
  enrolledAt: Date
  status: 'ACTIVE' | 'INACTIVE' | 'DROPPED'
}
```

### Attendance System

#### Session Entity
```typescript
interface AttendanceSession {
  id: string
  classId: string
  class?: Class
  teacherId: string
  sessionCode: string     // 6-digit code for joining
  title: string
  description?: string
  startTime: Date
  endTime: Date
  isActive: boolean       // Currently accepting attendance
  allowLateMarking: boolean
  lateThresholdMinutes: number
  location?: string
  attendanceCount: number
  createdAt: Date
  updatedAt: Date
}

interface Attendance {
  id: string
  sessionId: string
  session?: AttendanceSession
  studentId: string
  student?: User
  markedAt: Date
  status: 'PRESENT' | 'LATE' | 'ABSENT'
  biometricVerified: boolean
  biometricToken?: string
  location?: string       // GPS coordinates if available
  deviceInfo?: string
  ipAddress?: string
  createdAt: Date
}
```

### Biometric Authentication

#### Biometric Data
```typescript
interface BiometricProfile {
  id: string
  userId: string
  templateData: string    // Encrypted biometric template
  biometricType: 'FINGERPRINT' | 'FACE_ID' | 'IRIS'
  isActive: boolean
  enrolledAt: Date
  lastUsedAt?: Date
  deviceId: string
  confidence: number      // Last verification confidence score
}

interface BiometricVerification {
  id: string
  userId: string
  sessionId?: string
  biometricToken: string  // Unique token for this verification
  confidence: number      // Verification confidence (0-1)
  verifiedAt: Date
  deviceInfo: string
  success: boolean
}
```

### Analytics & Reporting

#### Attendance Statistics
```typescript
interface AttendanceStats {
  userId: string
  classId?: string        // Class-specific or overall stats
  totalSessions: number
  attendedSessions: number
  lateSessions: number
  absentSessions: number
  attendanceRate: number  // Percentage (0-100)
  period: {
    startDate: Date
    endDate: Date
  }
  lastUpdated: Date
}

interface ClassAnalytics {
  classId: string
  totalStudents: number
  averageAttendance: number
  sessionsHeld: number
  topAttenders: User[]    // Best attendance students
  attendanceTrends: {
    date: Date
    rate: number
  }[]
}
```

### Local Storage Schema

#### AsyncStorage Structure
```javascript
// Offline data persistence
LocalStorageSchema = {
  // Authentication
  'auth.tokens': 'AuthTokens',
  'auth.user': 'User',
  
  // App state
  'app.theme': 'light' | 'dark',
  'app.language': 'en' | 'ig',
  'app.onboarded': boolean,
  
  // Cached data
  'cache.classes': 'Class[]',
  'cache.attendance': 'Attendance[]',
  'cache.sessions': 'AttendanceSession[]',
  
  // Offline queue
  'queue.attendance': 'PendingAttendance[]',
  'queue.api_calls': 'PendingApiCall[]',
  
  // Settings
  'settings.notifications': boolean,
  'settings.biometric_enabled': boolean,
  'settings.auto_sync': boolean
}
```

---

## 🚀 Getting Started

### System Requirements

- **Node.js** `>=18.0.0` (LTS recommended)
- **pnpm** `>=8.0.0` (Package manager)
- **Git** for version control
- **Expo CLI** for development tools
- **Android Studio** (for Android development)
- **Xcode** (for iOS development - macOS only)
- **VS Code** (recommended IDE)

### Development Environment Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/chinonsochikelue/unizik.git
cd unizik/mobapp
```

#### 2. Install Dependencies
```bash
# Install pnpm globally if not already installed
npm install -g pnpm

# Install project dependencies
pnpm install

# Verify installation
pnpm list
```

#### 3. Environment Configuration
```bash
# Create environment file
cp .env.example .env

# Edit .env with your configuration
```

**Environment Variables:**
```env
# API Configuration
EXPO_PUBLIC_API_URL=https://unizik.onrender.com/api
EXPO_PUBLIC_DEV_API_URL=http://localhost:3000/api

# App Environment
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_DEV_MODE=true

# Features
EXPO_PUBLIC_BIOMETRIC_ENABLED=true
EXPO_PUBLIC_OFFLINE_ENABLED=true
EXPO_PUBLIC_ANALYTICS_ENABLED=false

# Development Tools
EXPO_PUBLIC_DEBUG_MODE=true
EXPO_PUBLIC_LOG_LEVEL=debug
```

#### 4. Start Development Server
```bash
# Start Expo development server
pnpm start

# Or start with specific platform
pnpm run ios     # iOS Simulator
pnpm run android # Android Emulator
pnpm run web     # Web Browser
```

#### 5. IDE Setup (VS Code)

**Recommended Extensions:**
```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "expo.vscode-expo-tools",
    "ms-vscode.vscode-react-native"
  ]
}
```

### Development Workflow

#### Code Quality Tools
```bash
# Run linting
pnpm run lint

# Fix linting issues
pnpm run lint --fix

# Type checking
pnpm run type-check

# Run tests (when implemented)
pnpm run test
```

#### Building for Production

##### Android Build
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Create Android build
eas build --platform android --profile production
```

##### iOS Build
```bash
# Create iOS build (requires macOS)
eas build --platform ios --profile production

# For App Store submission
eas submit --platform ios
```

##### Web Deployment
```bash
# Build for web
pnpm run build --preview web

# Deploy to Netlify/Vercel
# (follow platform-specific instructions)
```

### Device Testing

#### Physical Device Testing
1. Install **Expo Go** app from App Store/Play Store
2. Scan QR code from development server
3. Test biometric features on real hardware

#### Simulator Testing
```bash
# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android
```

---

## 🔧 Advanced Features Documentation

### 🔐 Biometric Authentication System

#### Implementation Architecture
```typescript
// Biometric Service Flow
Biometric Authentication Process:
1. Device Capability Check → 2. User Enrollment → 3. Template Storage → 4. Verification

// Security Features
- Hardware-backed keystore integration
- Template data encryption
- Failed attempt tracking
- Fallback authentication methods
```

#### Usage Examples
```typescript
// Check biometric support
const { isSupported, supportedTypes } = await biometricService.checkBiometricSupport()

// Enroll fingerprint
const enrollment = await biometricService.enrollFingerprint(userId)

// Verify for attendance
const verification = await biometricService.verifyFingerprint(userId)
if (verification.success) {
  await markAttendance(sessionCode, verification.token)
}
```

#### Development Mode Simulation
```javascript
// For testing without biometric hardware
if (process.env.EXPO_PUBLIC_DEV_MODE === 'true') {
  // 90% success rate simulation
  const simulatedResult = await biometricService.simulateAuthentication()
}
```

### 📊 Real-time Attendance System

#### Live Session Monitoring
```typescript
// Auto-refresh every 15 seconds
const useAttendance = () => {
  const [activeSessions, setActiveSessions] = useState([])
  
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActiveSessions()
    }, 15000)
    
    return () => clearInterval(interval)
  }, [])
}
```

#### Session Code Generation
```javascript
// 6-digit alphanumeric codes
SessionCode Format: ABC123
- Expires after session ends
- Unique per session
- Case-insensitive input
```

#### Attendance Status Logic
```typescript
type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT'

// Status determination
function determineStatus(markedTime: Date, sessionStart: Date, lateThreshold: number): AttendanceStatus {
  const minutesLate = (markedTime.getTime() - sessionStart.getTime()) / (1000 * 60)
  
  if (minutesLate <= 0) return 'PRESENT'
  if (minutesLate <= lateThreshold) return 'LATE'
  return 'ABSENT' // Auto-marked if session ends
}
```

### 📱 Cross-Platform Storage

#### Storage Strategy
```typescript
// Platform-specific implementations
class Storage {
  static async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key)
    } else {
      return await AsyncStorage.getItem(key)
    }
  }
}

// Usage patterns
- Secure data: Use SecureStore (tokens, biometric data)
- App state: Use AsyncStorage (themes, settings)
- Cache: Use AsyncStorage with expiry logic
```

#### Data Synchronization
```javascript
// Offline queue management
OfflineQueue = {
  // Queue pending API calls
  queueApiCall(endpoint, method, data) {
    const queueItem = { endpoint, method, data, timestamp: Date.now() }
    this.addToQueue(queueItem)
  },
  
  // Process queue when online
  async processQueue() {
    const queue = await this.getQueue()
    for (const item of queue) {
      try {
        await api[item.method](item.endpoint, item.data)
        this.removeFromQueue(item.id)
      } catch (error) {
        // Retry logic or user notification
      }
    }
  }
}
```

### 🎨 Theme System

#### Dynamic Theming
```typescript
// Theme configuration
interface Theme {
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    text: string
    error: string
    success: string
    warning: string
  }
  spacing: {
    xs: number
    sm: number
    md: number
    lg: number
    xl: number
  }
  typography: {
    heading: TextStyle
    body: TextStyle
    caption: TextStyle
  }
}

// Usage in components
const ThemedComponent = () => {
  const { colors } = useTheme()
  return (
    <View style={{ backgroundColor: colors.surface }}>
      <ThemedText>Themed content</ThemedText>
    </View>
  )
}
```

### 📈 Analytics & Performance

#### Performance Monitoring
```typescript
// Custom hooks for performance tracking
const usePerformanceTracking = (screenName: string) => {
  useEffect(() => {
    const startTime = Date.now()
    
    return () => {
      const loadTime = Date.now() - startTime
      analyticsService.trackScreenLoad(screenName, loadTime)
    }
  }, [])
}

// Memory usage monitoring
const useMemoryWarning = () => {
  useEffect(() => {
    const handleMemoryWarning = () => {
      // Clear caches, optimize memory
      cacheService.clearExpiredItems()
    }
    
    AppState.addEventListener('memoryWarning', handleMemoryWarning)
    return () => AppState.removeEventListener('memoryWarning', handleMemoryWarning)
  }, [])
}
```

---

## 🚨 Troubleshooting & Common Issues

### Development Issues

#### Metro Bundler Problems
```bash
# Clear Metro cache
npx expo start --clear

# Reset Metro completely
npx expo start --reset-cache

# Clear all caches
rm -rf node_modules/.cache
npx expo start --clear
```

#### Dependency Conflicts
```bash
# Clear node modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Force reinstall specific packages
pnpm add react-native@0.81.4 --force

# Check for peer dependency issues
pnpm list --depth=0
```

#### TypeScript Issues
```bash
# Restart TypeScript server in VS Code
Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server"

# Check TypeScript configuration
npx tsc --noEmit

# Update TypeScript definitions
pnpm add -D @types/react@latest @types/react-native@latest
```

### Runtime Issues

#### Authentication Problems
```javascript
// Debug authentication flow
const debugAuth = async () => {
  console.log('Stored tokens:', await Storage.getItem('accessToken'))
  console.log('User data:', await Storage.getItem('userData'))
  console.log('API headers:', apiService.client.defaults.headers.common)
}

// Clear auth state
const resetAuth = async () => {
  await Storage.multiRemove(['accessToken', 'refreshToken', 'userData'])
  // Restart app
}
```

#### Biometric Issues
```javascript
// Check biometric availability
const diagnoseBiometric = async () => {
  const hasHardware = await LocalAuthentication.hasHardwareAsync()
  const isEnrolled = await LocalAuthentication.isEnrolledAsync()
  const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync()
  
  console.log({ hasHardware, isEnrolled, supportedTypes })
}

// Fallback for unsupported devices
if (!biometricSupport.isSupported) {
  // Use PIN/password fallback
  // Or simulated authentication in development
}
```

#### Network Connection Issues
```javascript
// Network debugging
const debugNetwork = () => {
  console.log('API Base URL:', apiService.client.defaults.baseURL)
  console.log('Network state:', NetInfo.fetch())
  console.log('Request timeout:', apiService.client.defaults.timeout)
}

// Retry failed requests
const retryWithBackoff = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)))
    }
  }
}
```

### Production Issues

#### Performance Optimization
```javascript
// Image optimization
import { Image } from 'expo-image'

// Use optimized image component
<Image
  source={{ uri: imageUrl }}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>

// List performance
import { FlashList } from '@shopify/flash-list'

// Use FlashList for better performance
<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={80}
  keyExtractor={keyExtractor}
/>
```

#### Memory Management
```javascript
// Component cleanup
const useCleanup = () => {
  useEffect(() => {
    return () => {
      // Cancel pending requests
      // Clear timers
      // Remove listeners
    }
  }, [])
}

// Cache management
const manageCacheSize = () => {
  const MAX_CACHE_SIZE = 50 * 1024 * 1024 // 50MB
  
  if (cacheSize > MAX_CACHE_SIZE) {
    clearOldestCacheEntries()
  }
}
```

### Platform-Specific Issues

#### iOS Issues
```bash
# Pod installation problems
cd ios && pod install

# Clean iOS build
cd ios && xcodebuild clean

# Update iOS deployment target
# Edit ios/mobapp/Info.plist
```

#### Android Issues
```bash
# Gradle issues
cd android && ./gradlew clean

# Update Android SDK
# Check android/build.gradle for SDK versions

# Permission issues
# Check android/app/src/main/AndroidManifest.xml
```

#### Web Issues
```bash
# Web bundling issues
npx expo export:web

# Check web compatibility
# Some React Native components don't work on web
```

---

## 🔒 Security & Privacy

### Security Measures

#### Authentication Security
- JWT tokens with short expiry (1 hour)
- Refresh token rotation
- Secure token storage (Keychain/Keystore)
- Biometric authentication integration
- Failed attempt tracking and lockout

#### Data Protection
- End-to-end encryption for sensitive data
- HTTPS-only API communication
- Certificate pinning (production)
- Input validation and sanitization
- SQL injection prevention

#### Privacy Compliance
- Minimal data collection
- User consent for biometric data
- Data anonymization for analytics
- GDPR-compliant data handling
- User data export/deletion rights

### Security Best Practices

```typescript
// Secure API communication
const secureApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  }
})

// Input validation
const validateInput = (input: string, type: 'email' | 'password' | 'code') => {
  const patterns = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    code: /^[A-Z0-9]{6}$/
  }
  return patterns[type].test(input)
}

// Secure storage wrapper
const SecureStorage = {
  async setItem(key: string, value: string, requireAuth = false) {
    const options = {
      requireAuthentication: requireAuth,
      authenticationPrompt: 'Authenticate to access secure data'
    }
    return await SecureStore.setItemAsync(key, value, options)
  }
}
```

---

## 📊 Monitoring & Analytics

### Performance Monitoring

#### Key Metrics
- App startup time
- Screen loading time
- API response time
- Memory usage
- Crash rates
- User engagement

#### Implementation
```typescript
// Custom analytics service
class AnalyticsService {
  async trackEvent(event: string, properties: Record<string, any>) {
    if (!__DEV__) {
      // Send to analytics service (Firebase, Mixpanel, etc.)
      await this.sendToAnalytics(event, properties)
    }
  }
  
  async trackScreenView(screenName: string, timeSpent: number) {
    await this.trackEvent('screen_view', {
      screen_name: screenName,
      time_spent: timeSpent
    })
  }
  
  async trackUserAction(action: string, context: string) {
    await this.trackEvent('user_action', {
      action,
      context,
      timestamp: Date.now()
    })
  }
}
```

### Error Tracking

```typescript
// Global error boundary
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to crash reporting service
    crashlytics().recordError(error)
    
    // Send to custom error tracking
    errorTrackingService.logError(error, {
      component: errorInfo.componentStack,
      userId: this.context.user?.id
    })
  }
}

// API error tracking
axios.interceptors.response.use(
  response => response,
  error => {
    errorTrackingService.logApiError(error, {
      endpoint: error.config?.url,
      method: error.config?.method,
      statusCode: error.response?.status
    })
    return Promise.reject(error)
  }
)
```

---

## 🚀 Deployment & Distribution

### Build Configuration

#### Production Build Setup
```json
// app.json - Production configuration
{
  "expo": {
    "name": "Unizik Attendance",
    "slug": "unizik-attendance",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "extra": {
      "eas": {
        "projectId": "your-project-id"
      }
    }
  }
}
```

#### EAS Build Configuration
```json
// eas.json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Deployment Pipeline

#### Automated Deployment
```yaml
# .github/workflows/deploy.yml
name: Deploy App
on:
  push:
    branches: [main]
    
jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Run tests
        run: pnpm test
        
      - name: Build for production
        run: eas build --platform all --non-interactive
        
      - name: Submit to stores
        run: eas submit --platform all --non-interactive
```

### Release Management

#### Version Control Strategy
```bash
# Semantic versioning
# MAJOR.MINOR.PATCH
# 1.0.0 - Initial release
# 1.1.0 - New features
# 1.0.1 - Bug fixes

# Release branches
git checkout -b release/v1.1.0
# Update version in package.json and app.json
git commit -m "chore: bump version to 1.1.0"
git tag v1.1.0
```

#### Over-the-Air Updates
```bash
# Publish updates without app store review
eas update --branch production --message "Fix critical bug"

# Staged rollout
eas update --branch production --rollout 25% --message "New feature rollout"
```

---

## 👥 Contributing

### Development Workflow

1. **Fork & Clone**
   ```bash
   git clone https://github.com/chinonsochikelue/unizik.git
   cd unizik/mobapp
   ```

2. **Create Feature Branch**
   ```bash
   git checkout -b feature/attendance-analytics
   ```

3. **Development Setup**
   ```bash
   pnpm install
   cp .env.example .env
   pnpm start
   ```

4. **Code Standards**
   - Follow TypeScript best practices
   - Use ESLint and Prettier configurations
   - Write meaningful commit messages
   - Add tests for new features
   - Update documentation

5. **Submit Pull Request**
   - Ensure all tests pass
   - Update CHANGELOG.md
   - Request code review

### Code Style Guide

#### Component Structure
```typescript
// components/FeatureComponent.tsx
import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useTheme } from '@/hooks/useTheme'

interface Props {
  title: string
  onPress?: () => void
  variant?: 'primary' | 'secondary'
}

export const FeatureComponent: React.FC<Props> = ({ 
  title, 
  onPress, 
  variant = 'primary' 
}) => {
  const { colors } = useTheme()
  const [isPressed, setIsPressed] = useState(false)

  useEffect(() => {
    // Component logic
  }, [])

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {title}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
})
```

#### Commit Message Format
```
type(scope): description

feat(auth): add biometric authentication
fix(api): resolve token refresh issue
chore(deps): update expo sdk to 54.0.10
docs(readme): update installation instructions
```

---

## 📝 License

```
MIT License

Copyright (c) 2025 Chinonso Chikelue

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMplied, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 Support & Contact

### Getting Help

- 📚 **Documentation**: Check this README and inline code comments
- 🐛 **Bug Reports**: [Create an issue](https://github.com/chinonsochikelue/unizik/issues/new?template=bug_report.md)
- 💡 **Feature Requests**: [Create an issue](https://github.com/chinonsochikelue/unizik/issues/new?template=feature_request.md)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/chinonsochikelue/unizik/discussions)

### Contact Information

- **Development Team**: chinonsoneft@gmail.com

- **Technical Support**: chinonsoneft@gmail.com

- **Feedback**: chinonsoneft@gmail.com

- **Project Lead**: Chinonso Chikelue, Joshua Basil

---

## 🌐 Community

### Community

- 🌐 **Preview Website**: [https://unizik.vercel.app](https://unizik.vercel.app)
- 📱 **App Store**: [Coming Soon]
- 🤖 **Play Store**: [Coming Soon]

---

## 🗺️ Roadmap

### Version 1.1.0 (Q2 2025)
- [ ] Advanced analytics dashboard
- [ ] Bulk attendance import/export
- [ ] Parent/guardian portal integration
- [ ] Enhanced notification system

### Version 1.2.0 (Q3 2025)
- [ ] Geofencing for location-based attendance
- [ ] Integration with university portal
- [ ] Advanced reporting tools
- [ ] Offline-first architecture improvements
- [ ] Performance optimization

### Version 2.0.0 (Q4 2025)
- [ ] Redesigned user interface
- [ ] AI-powered attendance insights
- [ ] Integration with learning management system
- [ ] Advanced security features
- [ ] Web dashboard for administrators

---

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

### Available Scripts

**Backend**:
- `npm run dev` - Start development server
- `npm run start` - Start production server
- `npm test` - Run tests
- `npm run seed` - Seed database
- `npm run prisma:generate` - Generate Prisma client




**Built with ❤️ by the Chinonso Chikelue and Joshua Basil (Development Team)**

*Last updated: October 8th, 2025*
