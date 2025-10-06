import { Tabs, Redirect } from 'expo-router';
import React from 'react';
import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import { Foundation, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function StudentTabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();

  // Only allow students
  if (user?.role !== 'STUDENT') {
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
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => (
            <Foundation size={28} name="home" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="AttendanceScreen"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons size={28} name="account-multiple-check-outline" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="FingerprintEnrollScreen"
        options={{
          title: 'Enroll',
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="finger-print-sharp" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="person" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="ClassEnrollment"
        options={{
          title: 'Classes',
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons size={28} name="book-multiple" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}