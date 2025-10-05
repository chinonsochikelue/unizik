# Mobile App Architecture

## Overview

The mobile application is built using React Native and Expo, following modern architectural patterns and best practices for scalable mobile applications.

## Technology Stack

### Core Technologies
- **React Native**: Cross-platform mobile framework
- **Expo**: Development platform and tools
- **TypeScript**: Type-safe JavaScript
- **Expo Router**: File-based routing
- **Zustand**: State management
- **React Query**: Server state management
- **Axios**: HTTP client
- **react-native-chart-kit**: Data visualization
- **expo-local-authentication**: Biometric authentication

### Development Tools
- **ESLint**: Code linting
- **Prettier**: Code formatting
- **Jest**: Testing framework
- **React Native Testing Library**: Component testing
- **Husky**: Git hooks
- **Commitlint**: Commit message linting

## Application Structure

```
mobapp/
├── .env
├── .expo/
│   ├── devices.json
│   ├── README.md
│   └── types/
│       └── router.d.ts
├── .gitignore
├── .vscode/
│   ├── extensions.json
│   └── settings.json
├── .expo/web/cache/production/images/favicon/...
├── app.json
├── app/
│   ├── _layout.tsx
│   ├── +not-found.tsx
│   ├── LoadingScreen.tsx
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (protected)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── modal.tsx
│   │   ├── (admin)/
│   │   │   ├── _layout.tsx
│   │   │   └── (tabs)/
│   │   │       ├── _layout.tsx
│   │   │       ├── ClassManagement.jsx
│   │   │       ├── index.tsx
│   │   │       ├── ProfileScreen.jsx
│   │   │       ├── Reports.jsx
│   │   │       ├── SystemSettings.jsx
│   │   │       └── UserManagement.jsx
│   │   ├── (students)/
│   │   │   ├── _layout.tsx
│   │   │   └── (tabs)/
│   │   │       ├── _layout.jsx
│   │   │       ├── AttendanceScreen.jsx
│   │   │       ├── FingerprintEnrollScreen.jsx
│   │   │       ├── index.tsx
│   │   │       └── ProfileScreen.jsx
│   │   └── (teachers)/
│   │       ├── _layout.tsx
│   │       └── (tabs)/
│   │           ├── _layout.tsx
│   │           ├── ClassListScreen.jsx
│   │           ├── ProfileScreen.tsx
│   │           ├── SessionScreen.jsx
│   │           └── TeacherDashboard.jsx
├── assets/
│   └── images/
│       ├── _layout.tsx
│       ├── 1.png
│       ├── android-icon-background.png
│       ├── android-icon-foreground.png
│       ├── android-icon-monochrome.png
│       ├── favicon.png
│       ├── icon.png
│       ├── partial-react-logo.png
│       ├── react-logo.png
│       ├── react-logo@2x.png
│       ├── react-logo@3x.png
│       ├── splash-icon.png
├── components/
│   ├── external-link.tsx
│   ├── haptic-tab.tsx
│   ├── hello-wave.tsx
│   ├── parallax-scroll-view.tsx
│   ├── themed-text.tsx
│   ├── themed-view.tsx
│   └── ui/
│       ├── collapsible.tsx
│       ├── icon-symbol.ios.tsx
│       └── icon-symbol.tsx
├── constants/
│   └── theme.ts
├── context/
│   └── AuthContext.js
├── hooks/
│   ├── use-color-scheme.ts
│   └── use-color-scheme.web.ts
├── package.json
├── pnpm-lock.yaml
├── README.md
├── structure.md
├── scripts/
│   └── reset-project.js
├── services/
│   ├── api.js
│   └── biometric.js
├── tsconfig.json
├── utils/
└── eslint.config.js

## Core Features

### Authentication System

```typescript
// services/auth.ts
interface AuthService {
  login(credentials: Credentials): Promise<AuthResponse>
  signup(userData: UserData): Promise<AuthResponse>
  refreshToken(): Promise<string>
  logout(): Promise<void>
}

// context/AuthContext.tsx
interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (credentials: Credentials) => Promise<void>
  logout: () => Promise<void>
}
```

### Navigation System

```typescript
// app/_layout.tsx
const RootLayout = () => {
  const { isAuthenticated } = useAuth()

  return (
    <Stack>
      {isAuthenticated ? (
        <Stack.Screen name="(protected)" options={{ headerShown: false }} />
      ) : (
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      )}
    </Stack>
  )
}
```

### Biometric Authentication

```typescript
// services/biometric.ts
class BiometricService {
  async authenticate(): Promise<boolean> {
    const available = await LocalAuthentication.hasHardwareAsync()
    if (!available) return false

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Verify your identity"
    })

    return result.success
  }
}
```

### State Management

```typescript
// stores/attendance.ts
interface AttendanceStore {
  sessions: Session[]
  currentSession: Session | null
  markAttendance: (sessionId: string) => Promise<void>
  loadSessions: () => Promise<void>
}

const useAttendanceStore = create<AttendanceStore>((set) => ({
  sessions: [],
  currentSession: null,
  markAttendance: async (sessionId) => {
    // Implementation
  },
  loadSessions: async () => {
    // Implementation
  }
}))
```

## UI Components

### Design System

```typescript
// constants/theme.ts
export const theme = {
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    background: '#f9fafb',
    text: '#111827',
    error: '#ef4444',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
    },
    body: {
      fontSize: 16,
      lineHeight: 24,
    },
  }
}
```

### Custom Components

```typescript
// components/Button.tsx
interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'secondary'
  loading?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
}) => {
  // Implementation
}
```

## API Integration

### API Service

```typescript
// services/api.ts
class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL,
      timeout: 10000,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      async (config) => {
        const token = await SecureStore.getItemAsync('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )
  }
}
```

### Data Fetching

```typescript
// hooks/useClasses.ts
export const useClasses = () => {
  return useQuery({
    queryKey: ['classes'],
    queryFn: () => apiService.get('/classes'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
```

## Offline Support

### Data Persistence

```typescript
// utils/storage.ts
class StorageService {
  async saveData(key: string, data: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(data))
    } catch (error) {
      console.error('Error saving data:', error)
    }
  }

  async getData(key: string): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Error reading data:', error)
      return null
    }
  }
}
```

### Queue System

```typescript
// services/queue.ts
interface QueueItem {
  id: string
  action: string
  data: any
  timestamp: number
}

class QueueService {
  async addToQueue(item: QueueItem): Promise<void> {
    const queue = await this.getQueue()
    queue.push(item)
    await this.saveQueue(queue)
  }

  async processQueue(): Promise<void> {
    const queue = await this.getQueue()
    for (const item of queue) {
      try {
        await this.processItem(item)
      } catch (error) {
        console.error('Error processing queue item:', error)
      }
    }
  }
}
```

## Testing

### Component Testing

```typescript
// components/__tests__/Button.test.tsx
describe('Button', () => {
  it('renders correctly', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    )
    expect(getByText('Test Button')).toBeTruthy()
  })

  it('handles press events', () => {
    const onPress = jest.fn()
    const { getByText } = render(
      <Button title="Test Button" onPress={onPress} />
    )
    fireEvent.press(getByText('Test Button'))
    expect(onPress).toHaveBeenCalled()
  })
})
```

### Integration Testing

```typescript
// services/__tests__/api.test.ts
describe('ApiService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('handles authentication', async () => {
    const api = new ApiService()
    const response = await api.login({
      email: 'test@example.com',
      password: 'password',
    })
    expect(response.token).toBeDefined()
  })
})
```

## Performance Optimization

### Image Optimization

```typescript
// components/OptimizedImage.tsx
export const OptimizedImage: React.FC<ImageProps> = ({ source, ...props }) => {
  const { width } = useWindowDimensions()
  
  return (
    <Image
      source={source}
      resizeMode="contain"
      resizeMethod="resize"
      progressiveRenderingEnabled
      {...props}
    />
  )
}
```

### Memory Management

```typescript
// hooks/useMemoryManagement.ts
export const useMemoryManagement = () => {
  useEffect(() => {
    const subscription = AppState.addEventListener('memoryWarning', () => {
      // Clear caches and unused resources
    })
    
    return () => {
      subscription.remove()
    }
  }, [])
}
```

## Error Handling

### Global Error Boundary

```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to monitoring service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorScreen error={this.state.error} />
    }

    return this.props.children
  }
}
```

### API Error Handling

```typescript
// utils/error-handler.ts
export const handleApiError = (error: any) => {
  if (axios.isAxiosError(error)) {
    switch (error.response?.status) {
      case 401:
        // Handle unauthorized
        break
      case 404:
        // Handle not found
        break
      default:
        // Handle other errors
    }
  }
  return error
}
```