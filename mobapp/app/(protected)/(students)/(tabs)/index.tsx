import { useState, useEffect, useRef } from "react"
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  Animated,
  TouchableOpacity,
  Dimensions,
  Pressable
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "@/context/AuthContext"
import { apiService } from "@/services/api"
import { router } from "expo-router"

const { width } = Dimensions.get('window')

export default function StudentDashboard() {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [classes, setClasses] = useState([])
  const [recentAttendance, setRecentAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'overview' | 'classes' | 'attendance'>('overview')
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    loadDashboardData()
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [classesResponse, attendanceResponse] = await Promise.all([
        apiService.get("/classes"),
        apiService.get(`/attendance/history/${user.id}?limit=5`),
      ])

      setClasses(classesResponse.data.classes || [])
      setRecentAttendance(attendanceResponse.data.attendance || [])
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadDashboardData()
  }

  const getAttendanceRate = () => {
    if (recentAttendance.length === 0) return 0
    const presentCount = recentAttendance.filter((a) => a.status === "PRESENT").length
    return Math.round((presentCount / recentAttendance.length) * 100)
  }

  const getTodayClasses = () => {
    // Mock: In real app, filter by today's schedule
    return classes.slice(0, 3)
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            style={styles.loadingGradient}
          >
            <Ionicons name="school" size={48} color="#fff" />
          </LinearGradient>
        </Animated.View>
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header with Glassmorphism */}
      <Animated.View 
        style={[
          styles.headerContainer, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={["#667eea", "#764ba2", "#f093fb"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Animated Background Orbs */}
          <Animated.View style={[styles.orb, styles.orb1]} />
          <Animated.View style={[styles.orb, styles.orb2]} />
          
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>Good {new Date().toLocaleString('default', { hour: 'numeric', minute: 'numeric', hour12: true })} ☀️</Text>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.subtitle}>Let&apos;s make today productive!</Text>
              </View>
              <TouchableOpacity 
                style={styles.avatarContainer}
                onPress={() => router.push('/(protected)/(common)/ProfileScreen')}
              >
                <LinearGradient
                  colors={["#fbbf24", "#f59e0b"]}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
            
            {/* Stats Cards with Glass Effect */}
            <View style={styles.statsContainer}>
              <BlurView intensity={30} tint="light" style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <LinearGradient colors={["#3b82f6", "#2563eb"]} style={styles.statIconGradient}>
                    <Ionicons name="book" size={20} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={styles.statNumber}>{classes.length}</Text>
                <Text style={styles.statLabel}>Active Classes</Text>
              </BlurView>

              <BlurView intensity={30} tint="light" style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <LinearGradient colors={["#10b981", "#059669"]} style={styles.statIconGradient}>
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={styles.statNumber}>{getAttendanceRate()}%</Text>
                <Text style={styles.statLabel}>Attendance</Text>
              </BlurView>

              <BlurView intensity={30} tint="light" style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <LinearGradient colors={["#f59e0b", "#d97706"]} style={styles.statIconGradient}>
                    <Ionicons name="trophy" size={20} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={styles.statNumber}>A+</Text>
                <Text style={styles.statLabel}>Grade</Text>
              </BlurView>
            </View>
          </View>

          {/* Wave SVG Effect */}
          <View style={styles.waveContainer}>
            <View style={[styles.wave, styles.wave1]} />
            <View style={[styles.wave, styles.wave2]} />
            <View style={[styles.wave, styles.wave3]} />
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#667eea"
          />
        }
      >
        {/* Quick Actions */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/AttendanceScreen')}
            >
              <LinearGradient colors={["#8b5cf6", "#7c3aed"]} style={styles.actionGradient}>
                <Ionicons name="qr-code" size={28} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionText}>Mark Attendance</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionCard}
              onPress={() => router.push('/FingerprintEnrollScreen')}
            >
              <LinearGradient colors={["#ec4899", "#db2777"]} style={styles.actionGradient}>
                <Ionicons name="finger-print" size={28} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionText}>Enroll Biometric</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <LinearGradient colors={["#06b6d4", "#0891b2"]} style={styles.actionGradient}>
                <Ionicons name="document-text" size={28} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionText}>View Reports</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <LinearGradient colors={["#f59e0b", "#d97706"]} style={styles.actionGradient}>
                <Ionicons name="calendar" size={28} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionText}>Schedule</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Today's Classes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Classes</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All →</Text>
            </TouchableOpacity>
          </View>
          
          {getTodayClasses().length > 0 ? (
            getTodayClasses().map((classItem, index) => (
              <Pressable 
                key={classItem.id} 
                style={({ pressed }) => [
                  styles.modernClassCard,
                  pressed && styles.cardPressed
                ]}
              >
                <LinearGradient
                  colors={["#ffffff", "#f8fafc"]}
                  style={styles.classCardGradient}
                >
                  <View style={styles.classCardLeft}>
                    <View style={[styles.classColorBar, { backgroundColor: getClassColor(index) }]} />
                    <View style={styles.classCardContent}>
                      <Text style={styles.modernClassName}>{classItem.name}</Text>
                      <View style={styles.classMetaRow}>
                        <Ionicons name="person-outline" size={14} color="#64748b" />
                        <Text style={styles.classTeacherModern}>{classItem.teacher?.name}</Text>
                      </View>
                      <View style={styles.classMetaRow}>
                        <Ionicons name="people-outline" size={14} color="#64748b" />
                        <Text style={styles.classStudentsModern}>
                          {classItem._count?.students} students
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.classCardRight}>
                    <View style={[styles.timeChip, { backgroundColor: getClassColor(index) + '20' }]}>
                      <Ionicons name="time-outline" size={12} color={getClassColor(index)} />
                      <Text style={[styles.timeText, { color: getClassColor(index) }]}>
                        {getRandomTime()}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
                  </View>
                </LinearGradient>
              </Pressable>
            ))
          ) : (
            <View style={styles.modernEmptyState}>
              <LinearGradient
                colors={["#f1f5f9", "#e2e8f0"]}
                style={styles.emptyStateGradient}
              >
                <Ionicons name="calendar-outline" size={48} color="#94a3b8" />
                <Text style={styles.emptyText}>No classes today</Text>
                <Text style={styles.emptySubtext}>Enjoy your free time! 🎉</Text>
              </LinearGradient>
            </View>
          )}
        </View>

        {/* Recent Attendance with Timeline */}
        <View style={[styles.section, { marginBottom: 24 }]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Attendance</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>View All →</Text>
            </TouchableOpacity>
          </View>
          
          {recentAttendance.length > 0 ? (
            <View style={styles.timelineContainer}>
              {recentAttendance.map((attendance, index) => (
                <View key={attendance.id} style={styles.timelineItem}>
                  <View style={styles.timeline}>
                    <View 
                      style={[
                        styles.timelineDot,
                        { 
                          backgroundColor: attendance.status === "PRESENT" ? "#10b981" : "#ef4444" 
                        }
                      ]} 
                    />
                    {index < recentAttendance.length - 1 && (
                      <View style={styles.timelineLine} />
                    )}
                  </View>
                  
                  <View style={styles.attendanceCardModern}>
                    <View style={styles.attendanceCardHeader}>
                      <Text style={styles.attendanceClassName}>
                        {attendance.session?.class?.name}
                      </Text>
                      <View
                        style={[
                          styles.modernStatusBadge,
                          { 
                            backgroundColor: attendance.status === "PRESENT" 
                              ? "#dcfce7" 
                              : "#fee2e2" 
                          },
                        ]}
                      >
                        <Ionicons 
                          name={attendance.status === "PRESENT" ? "checkmark-circle" : "close-circle"} 
                          size={14} 
                          color={attendance.status === "PRESENT" ? "#16a34a" : "#dc2626"}
                        />
                        <Text 
                          style={[
                            styles.modernStatusText, 
                            { color: attendance.status === "PRESENT" ? "#16a34a" : "#dc2626" }
                          ]}
                        >
                          {attendance.status}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.attendanceDateRow}>
                      <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                      <Text style={styles.attendanceDateModern}>
                        {new Date(attendance.markedAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Text>
                      <Text style={styles.attendanceTime}>
                        • {new Date(attendance.markedAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.modernEmptyState}>
              <LinearGradient
                colors={["#f1f5f9", "#e2e8f0"]}
                style={styles.emptyStateGradient}
              >
                <Ionicons name="finger-print-outline" size={48} color="#94a3b8" />
                <Text style={styles.emptyText}>No attendance records yet</Text>
                <Text style={styles.emptySubtext}>Start marking your attendance!</Text>
              </LinearGradient>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

// Helper functions
const getClassColor = (index: number) => {
  const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
  return colors[index % colors.length]
}

const getRandomTime = () => {
  const times = ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM']
  return times[Math.floor(Math.random() * times.length)]
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 30,
    backgroundColor: "#fafafa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  loadingGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  headerContainer: {
    height: 300,
    overflow: "hidden",
  },
  headerGradient: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.3,
  },
  orb1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
    backgroundColor: '#fbbf24',
  },
  orb2: {
    width: 200,
    height: 200,
    bottom: 50,
    left: -50,
    backgroundColor: '#ec4899',
  },
  headerContent: {
    flex: 1,
    padding: 20,
    zIndex: 2,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginBottom: 4,
    fontWeight: "500",
  },
  name: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.8)",
  },
  avatarContainer: {
    borderRadius: 25,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatarGradient: {
    width: 50,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statIconGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.95)",
    marginTop: 2,
    textAlign: "center",
    fontWeight: "500",
  },
  waveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    zIndex: 1,
  },
  wave: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: "#fafafa",
  },
  wave1: {
    bottom: -30,
    opacity: 0.5,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    transform: [{ scaleX: 1.3 }],
  },
  wave2: {
    bottom: -10,
    opacity: 0.7,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    transform: [{ scaleX: 1.15 }],
  },
  wave3: {
    bottom: 0,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: "transparent",
    marginTop: -18,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 18,
  },
  seeAll: {
    fontSize: 14,
    color: "#667eea",
    fontWeight: "600",
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: (width - 52) / 2,
    alignItems: 'center',
  },
  actionGradient: {
    width: '100%',
    height: 100,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#334155",
    textAlign: 'center',
  },
  modernClassCard: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  classCardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  classCardLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  classColorBar: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
  },
  classCardContent: {
    flex: 1,
  },
  modernClassName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 6,
  },
  classMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  classTeacherModern: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  classStudentsModern: {
    fontSize: 12,
    color: "#94a3b8",
  },
  classCardRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timeline: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: '#fff',
    elevation: 2,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e2e8f0',
    marginTop: 4,
  },
  attendanceCardModern: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  attendanceCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  attendanceClassName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },
  modernStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modernStatusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: 'capitalize',
  },
  attendanceDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attendanceDateModern: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  attendanceTime: {
    fontSize: 12,
    color: "#94a3b8",
  },
  modernEmptyState: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  emptyStateGradient: {
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 4,
  },
})