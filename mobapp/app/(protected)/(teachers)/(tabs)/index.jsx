"use client"

import { useState, useEffect, useRef } from "react"
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  Animated,
  Easing
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "@/context/AuthContext"
import { apiService } from "@/services/api"
import { useRouter } from "expo-router"

export default function TeacherDashboard() {
  const { user } = useAuth()
  const navigation = useRouter()
  const [classes, setClasses] = useState([])
  const [activeSessions, setActiveSessions] = useState([])
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    activeSessions: 0,
    todayAttendance: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // Animation values
  const spinValue = useRef(new Animated.Value(0)).current
  const pulseValue = useRef(new Animated.Value(1)).current
  const fadeValue = useRef(new Animated.Value(0)).current

  useEffect(() => {
    loadDashboardData()
    startLoadingAnimations()
  }, [])
  
  const startLoadingAnimations = () => {
    // Spinning animation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start()
    
    // Pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseValue, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start()
    
    // Fade in animation
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start()
  }

  const loadDashboardData = async () => {
    try {
      const [classesResponse, dashboardResponse] = await Promise.all([
        apiService.get("/sessions/teacher/classes"),
        apiService.get("/reports/teacher/dashboard"),
      ])

      const teacherClasses = classesResponse.data.classes || []
      setClasses(teacherClasses)

      // Get dashboard stats from new endpoint
      const dashboardData = dashboardResponse.data
      setStats({
        totalClasses: dashboardData.stats.totalClasses,
        totalStudents: dashboardData.stats.totalStudents,
        activeSessions: dashboardData.stats.activeSessions,
        todayAttendance: dashboardData.stats.todayAttendance,
      })

      // Set active sessions from classes with active sessions
      const activeClasses = teacherClasses.filter((cls) => 
        dashboardData.classes.find((c) => c.id === cls.id && c.hasActiveSession)
      )
      setActiveSessions(activeClasses)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
      
      // Fallback to old method if new endpoint fails
      try {
        const classesResponse = await apiService.get("/sessions/teacher/classes")
        const teacherClasses = classesResponse.data.classes || []
        setClasses(teacherClasses)
        
        const totalStudents = teacherClasses.reduce((sum, cls) => sum + (cls._count?.students || 0), 0)
        
        setStats({
          totalClasses: teacherClasses.length,
          totalStudents,
          activeSessions: 0,
          todayAttendance: 0,
        })
      } catch (fallbackError) {
        console.error("Fallback error:", fallbackError)
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadDashboardData()
  }

  if (loading) {
    const spin = spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg']
    })
    
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={[
          styles.loadingContent,
          { opacity: fadeValue }
        ]}>
          {/* Animated Logo */}
          <View style={styles.loadingIconContainer}>
            <Animated.View style={[
              styles.loadingIcon,
              { transform: [{ scale: pulseValue }] }
            ]}>
              <Ionicons name="school" size={40} color="#2563eb" />
            </Animated.View>
            <Animated.View style={[
              styles.loadingRing,
              { transform: [{ rotate: spin }] }
            ]} />
          </View>
          
          <Text style={styles.loadingTitle}>Loading Dashboard</Text>
          <Text style={styles.loadingSubtitle}>Preparing your classes...</Text>
          
          {/* Skeleton Cards */}
          <View style={styles.skeletonStatsRow}>
            <View style={styles.skeletonStatCard} />
            <View style={styles.skeletonStatCard} />
            <View style={styles.skeletonStatCard} />
          </View>
        </Animated.View>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.name}>{user?.name}</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="school-outline" size={24} color="#2563eb" />
          <Text style={styles.statNumber}>{stats.totalClasses}</Text>
          <Text style={styles.statLabel}>My Classes</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={24} color="#16a34a" />
          <Text style={styles.statNumber}>{stats.totalStudents}</Text>
          <Text style={styles.statLabel}>Total Students</Text>
        </View>

        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={24} color="#f59e0b" />
          <Text style={styles.statNumber}>{stats.activeSessions}</Text>
          <Text style={styles.statLabel}>Active Sessions</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.push("ClassListScreen")}>
          <View style={styles.actionIcon}>
            <Ionicons name="add-circle" size={24} color="#2563eb" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Start Attendance Session</Text>
            <Text style={styles.actionSubtitle}>Begin taking attendance for a class</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.actionIcon}>
            <Ionicons name="people" size={24} color="#16a34a" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Manage Students</Text>
            <Text style={styles.actionSubtitle}>View and manage class enrollment</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard}>
          <View style={styles.actionIcon}>
            <Ionicons name="analytics" size={24} color="#f59e0b" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>View Reports</Text>
            <Text style={styles.actionSubtitle}>Check attendance statistics</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Classes</Text>
        {classes.length > 0 ? (
          classes.map((classItem) => (
            <TouchableOpacity
              key={classItem.id}
              style={styles.classCard}
              onPress={() => navigation.push({
                pathname: "/SessionScreen",
                params: {
                  // sessionId: response.data.session.id,
                  classId: classItem.id,
                }
              })}
            >
              <View style={styles.classInfo}>
                <Text style={styles.className}>{classItem.name}</Text>
                <Text style={styles.classDescription}>{classItem.description}</Text>
                <Text style={styles.classStudents}>{classItem._count?.students || 0} students enrolled</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#64748b" />
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={48} color="#64748b" />
            <Text style={styles.emptyText}>No classes assigned</Text>
          </View>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingContent: {
    alignItems: "center",
    width: "100%",
  },
  loadingIconContainer: {
    position: "relative",
    marginBottom: 32,
  },
  loadingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2563eb",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 2,
  },
  loadingRing: {
    position: "absolute",
    top: -10,
    left: -10,
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#e0e7ff",
    borderTopColor: "#2563eb",
    zIndex: 1,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
    textAlign: "center",
  },
  loadingSubtitle: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 32,
  },
  skeletonStatsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    paddingHorizontal: 16,
  },
  skeletonStatCard: {
    flex: 1,
    height: 80,
    backgroundColor: "white",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    backgroundColor: "white",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginTop: 12,
  },
  greeting: {
    fontSize: 16,
    color: "#64748b",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    textAlign: "center",
  },
  section: {
    backgroundColor: "white",
    marginTop: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  classCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  classDescription: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 2,
  },
  classStudents: {
    fontSize: 12,
    color: "#94a3b8",
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    marginTop: 12,
  },
})
