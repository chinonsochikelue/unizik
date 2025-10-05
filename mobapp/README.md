# Unizik Attendance Management System - Mobile App

A modern React Native mobile application for managing student attendance, built with Expo and TypeScript.

## Features

- 🔐 Secure Authentication
- 🎨 Modern UI with Custom Components
- 📱 Cross-platform (iOS, Android, Web)
- 📊 Interactive Dashboard
- 👆 Biometric Authentication
- 📈 Real-time Analytics
- 🌓 Dark/Light Theme Support
- 📡 Offline Support
- 🔔 Push Notifications

## Tech Stack

- **Framework**: React Native
- **SDK**: Expo
- **Navigation**: Expo Router
- **State Management**: React Context
- **UI Components**: Custom Components + Native Base
- **Charts**: react-native-chart-kit
- **API Client**: Axios
- **Authentication**: JWT + Secure Store
- **Styling**: React Native StyleSheet

## Prerequisites

- Node.js (v18 or higher)
- pnpm (Package Manager)
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

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

   Configure the following in your `.env`:
   ```env
   EXPO_PUBLIC_API_URL=http://localhost:3000/api
   EXPO_PUBLIC_APP_ENV=development
   ```

4. Start the development server:

   ```bash
   pnpm run start
   ```

5. Run on specific platforms:

   ```bash
   # iOS
   pnpm run ios

   # Android
   pnpm run android

   # Web
   pnpm run web
   ```

## Project Structure

```text
├── app/                    # Main application screens
│   ├── (auth)/            # Authentication screens
│   └── (protected)/       # Protected routes
│       ├── (admin)/       # Admin screens
│       ├── (students)/    # Student screens
│       └── (teachers)/    # Teacher screens
├── assets/                # Static assets
├── components/            # Reusable components
├── constants/             # App constants
├── context/              # React Context providers
├── hooks/                # Custom React hooks
├── services/             # API services
└── utils/                # Utility functions
```

## Key Features Documentation

### Authentication Flow

The app uses JWT-based authentication with secure storage:
- Login/Signup screens in `app/(auth)/`
- Token management in `context/AuthContext.js`
- Secure storage using Expo SecureStore

### Navigation Structure

Using Expo Router for type-safe navigation:
- Protected routes in `app/(protected)/`
- Tab navigation in `app/(protected)/(tabs)/`
- Modal screens in `app/(protected)/modal.tsx`

### Dashboard Analytics

Interactive charts and statistics:
- Line charts for attendance trends
- Bar charts for class distribution
- Pie charts for role distribution
- Real-time updates

### Offline Support

The app maintains functionality without internet:
- Local data persistence
- Queue system for pending actions
- Auto-sync when connection restored

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow React Native best practices
- Use functional components with hooks
- Implement proper error handling
- Write meaningful comments

### Component Structure

```typescript
import { View } from 'react-native'
import { styles } from './styles'

interface Props {
  // Define prop types
}

export const MyComponent: React.FC<Props> = ({ ...props }) => {
  // Component logic
  return <View />
}
```

## Deployment

### Expo Build

1. Configure app.json:
```json
{
  "expo": {
    "name": "Unizik Attendance",
    "slug": "unizik-attendance",
    "version": "1.0.0"
  }
}
```

2. Create a build:

   ```bash
   eas build --platform ios
   eas build --platform android
   ```

### Publishing

1. Create a release:

   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

## Troubleshooting

Common issues and solutions:

1. Metro bundler issues:

   ```bash
   expo start --clear
   ```

2. Dependencies issues:

   ```bash
   pnpm install --force
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License

## Support

For support:
- Create an issue in the repository
- Contact the development team
- Check the [documentation](./docs)
