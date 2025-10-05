import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function ProtectedIndex() {
  const { user } = useAuth();

  switch (user?.role) {
    case 'STUDENT':
      return <Redirect href="/(protected)/(students)/(tabs)" />;
    case 'TEACHER':
      return <Redirect href="/(protected)/(teachers)/(tabs)" />;
    case 'ADMIN':
      return <Redirect href="/(protected)/(admin)/(tabs)" />;
    default:
      return <Redirect href="/(auth)/login" />;
  }
}