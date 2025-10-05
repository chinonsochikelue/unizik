// app/(protected)/(teachers)/_layout.tsx
import { Stack, Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/theme';
import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme.web';

export default function TeacherLayout() {
  const colorScheme = useColorScheme();
    const { user } = useAuth();

  if (user?.role !== 'TEACHER') {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
          screenOptions={{
            tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
            headerShown: false,
            tabBarButton: HapticTab,
            tabBarStyle: {
              backgroundColor: '#101010',
              borderTopColor: '#202020',
            },
          }}>
      {/* <Stack.Screen
        name="TeacherDashboard"
        options={{
          title: 'Teacher Dashboard',
          headerShown: true,
        }}
      /> */}
      <Stack.Screen
        name="ClassListScreen"
        options={{
          title: 'My Classes',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="SessionScreen"
        options={{
          title: 'Session',
          headerShown: true,
        }}
      />
    </Tabs>
  );
}