// app/(auth)/_layout.tsx
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function AuthLayout() {
  const { user } = useAuth();

  // If user is logged in, redirect to appropriate dashboard
  if (user) {
    switch (user.role) {
      case 'STUDENT':
        return <Redirect href="./(protected)/(students)/(tabs)/index" />;
      case 'TEACHER':
        return <Redirect href="./(protected)/(teachers)/(tabs)/ClassListScreen.tsx" />;
      case 'ADMIN':
        return <Redirect href="./(protected)/(admin)/(tabs)/index" />;
      default:
        return <Redirect href="./(protected)/(students)/(tabs)/index.tsx" />;
    }
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: '#101010',
        },
      }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}