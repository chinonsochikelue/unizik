"use client"

import { Tabs, Redirect } from "expo-router"
import { useAuth } from "@/context/AuthContext"
import { Colors } from "@/constants/theme"
import { HapticTab } from "@/components/haptic-tab"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { Ionicons } from "@expo/vector-icons"

export default function TeacherTabsLayout() {
  const colorScheme = useColorScheme()
  const { user } = useAuth()

  if (user?.role !== "TEACHER") {
    return <Redirect href="/(auth)/login" />
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: "#101010",
          borderTopColor: "#202020",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => <Ionicons name="speedometer" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ClassListScreen"
        options={{
          title: "My Classes",
          tabBarIcon: ({ color }) => <Ionicons name="list" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="SessionScreen"
        options={{
          title: "Session",
          tabBarIcon: ({ color }) => <Ionicons name="time" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="ProfileScreen"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <Ionicons name="person" size={28} color={color} />,
        }}
      />
    </Tabs>
  )
}
