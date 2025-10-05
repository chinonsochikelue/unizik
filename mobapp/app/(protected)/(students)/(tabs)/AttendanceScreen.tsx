import { useState, useEffect, useRef } from "react"
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  RefreshControl,
  Animated,
  Dimensions,
  Pressable
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "@/context/AuthContext"
import { apiService } from "@/services/api"
import { biometricService } from "@/services/biometric"
import { router } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width } = Dimensions.get('window')

export default function AttendanceScreen() {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [classes, setClasses] = useState([])
  const [activeSessions, setActiveSessions] = useState({})
  const [attendanceHistory, setAttendanceHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [markingAttendance, setMarkingAttendance] = useState(null)
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    loadData()
    
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()

    // Pulse animation for active sessions
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  const loadData = async () => {
    try {
      const [classesResponse, historyResponse] = await Promise.all([
        apiService.get("/classes"),
        apiService.get(`/attendance/history/${user.id}?limit=10`),
      ])

      const userClasses = classesResponse.data.classes || []
      setClasses(userClasses)
      setAttendanceHistory(historyResponse.data.attendance || [])

      // Check for active sessions
      const sessionPromises = userClasses.map(async (classItem) => {
        try {
          const response = await apiService.get(`/sessions/class/${classItem.id}/active`)
          return { classId: classItem.id, session: response.data.session }
        } catch (error) {
          return { classId: classItem.id, session: null }
        }
      })

      const sessionResults = await Promise.all(sessionPromises)
      const sessionsMap = {}
      sessionResults.forEach(({ classId, session }) => {
        if (session) {
          sessionsMap[classId] = session
        }
      })
      setActiveSessions(sessionsMap)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const markAttendance = async (classId, sessionId, className) => {
    setMarkingAttendance(sessionId)

    try {
      // Perform biometric authentication
      const biometricResult = await biometricService.verifyFingerprint(user.id)

      if (!biometricResult.success) {
        Alert.alert(
          "Authentication Failed", 
          biometricResult.error || "Please try again",
          [{ text: "OK", style: "default" }]
        )
        return
      }

      // Mark attendance
      const response = await apiService.post("/attendance/mark", {
        studentId: user.id,
        sessionId,
      })

      Alert.alert(
        "✅ Success!", 
        `Attendance marked for ${className}`,
        [{ text: "Great!", style: "default" }]
      )
      loadData()
    } catch (error) {
      console.error("Error marking attendance:", error)
      Alert.alert(
        "Error", 
        error.response?.data?.error || "Failed to mark attendance",
        [{ text: "Try Again", style: "cancel" }]
      )
    } finally {
      setMarkingAttendance(null)
    }
  }

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000)
    
    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
  }

  const getAttendanceStats = () => {
    const total = attendanceHistory.length
    const present = attendanceHistory.filter(a => a.status === "PRESENT").length
    const rate = total > 0 ? Math.round((present / total) * 100) : 0
    
    return { total, present, rate }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            style={styles.loadingGradient}
          >
            <Ionicons name="finger-print" size={48} color="#fff" />
          </LinearGradient>
        </Animated.View>
        <Text style={styles.loadingText}>Loading attendance...</Text>
      </View>
    )
  }

  const stats = getAttendanceStats()
  const activeSessionCount = Object.keys(activeSessions).length

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Attendance</Text>
            <Text style={styles.headerSubtitle}>
              {activeSessionCount > 0 
                ? `${activeSessionCount} active session${activeSessionCount > 1 ? 's' : ''}`
                : 'No active sessions'}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.biometricSetupButton}
            onPress={() => router.push('/FingerprintEnrollScreen')}
          >
            <BlurView intensity={20} tint="light" style={styles.biometricBlur}>
              <Ionicons name="finger-print" size={20} color="#fff" />
              <Text style={styles.biometricButtonText}>Setup</Text>
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <BlurView intensity={20} tint="light" style={styles.miniStatCard}>
            <Ionicons name="calendar-outline" size={16} color="#fff" />
            <Text style={styles.miniStatNumber}>{stats.total}</Text>
            <Text style={styles.miniStatLabel}>Total</Text>
          </BlurView>

          <BlurView intensity={20} tint="light" style={styles.miniStatCard}>
            <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
            <Text style={styles.miniStatNumber}>{stats.present}</Text>
            <Text style={styles.miniStatLabel}>Present</Text>
          </BlurView>

          <BlurView intensity={20} tint="light" style={styles.miniStatCard}>
            <Ionicons name="stats-chart-outline" size={16} color="#fff" />
            <Text style={styles.miniStatNumber}>{stats.rate}%</Text>
            <Text style={styles.miniStatLabel}>Rate</Text>
          </BlurView>
        </View>
      </LinearGradient>

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
        {/* Active Sessions */}
        <Animated.View 
          style={[
            styles.section, 
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Active Sessions</Text>
              <Text style={styles.sectionSubtitle}>
                Mark your attendance now
              </Text>
            </View>
            {activeSessionCount > 0 && (
              <Animated.View 
                style={[
                  styles.liveBadge,
                  { transform: [{ scale: pulseAnim }] }
                ]}
              >
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </Animated.View>
            )}
          </View>

          {activeSessionCount > 0 ? (
            classes
              .filter((classItem) => activeSessions[classItem.id])
              .map((classItem, index) => {
                const session = activeSessions[classItem.id]
                const isMarking = markingAttendance === session.id
                
                return (
                  <Pressable
                    key={classItem.id}
                    style={({ pressed }) => [
                      styles.activeSessionCard,
                      pressed && styles.cardPressed
                    ]}
                  >
                    <LinearGradient
                      colors={["#ffffff", "#f8fafc"]}
                      style={styles.sessionCardGradient}
                    >
                      {/* Color Accent */}
                      <View 
                        style={[
                          styles.sessionAccent,
                          { backgroundColor: getSessionColor(index) }
                        ]} 
                      />

                      <View style={styles.sessionCardContent}>
                        <View style={styles.sessionTopRow}>
                          <View style={styles.sessionInfo}>
                            <Text style={styles.sessionClassName}>
                              {classItem.name}
                            </Text>
                            <View style={styles.sessionMetaRow}>
                              <View style={styles.codeChip}>
                                <Ionicons name="key-outline" size={12} color="#667eea" />
                                <Text style={styles.sessionCode}>{session.code}</Text>
                              </View>
                              <View style={styles.timeChip}>
                                <Ionicons name="time-outline" size={12} color="#64748b" />
                                <Text style={styles.sessionTime}>
                                  {getTimeAgo(session.startTime)}
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Animated Fingerprint Icon */}
                          <Animated.View 
                            style={[
                              styles.fingerprintContainer,
                              { transform: [{ scale: pulseAnim }] }
                            ]}
                          >
                            <LinearGradient
                              colors={[getSessionColor(index), getSessionColor(index) + 'CC']}
                              style={styles.fingerprintGradient}
                            >
                              <Ionicons name="finger-print" size={28} color="#fff" />
                            </LinearGradient>
                          </Animated.View>
                        </View>

                        {/* Mark Attendance Button */}
                        <TouchableOpacity
                          style={[
                            styles.markAttendanceButton,
                            isMarking && styles.markingButton
                          ]}
                          onPress={() => markAttendance(classItem.id, session.id, classItem.name)}
                          disabled={isMarking}
                        >
                          <LinearGradient
                            colors={isMarking ? ['#9ca3af', '#6b7280'] : ['#10b981', '#059669']}
                            style={styles.markButtonGradient}
                          >
                            {isMarking ? (
                              <>
                                <Ionicons name="hourglass-outline" size={20} color="#fff" />
                                <Text style={styles.markButtonText}>Verifying...</Text>
                              </>
                            ) : (
                              <>
                                <Ionicons name="finger-print" size={20} color="#fff" />
                                <Text style={styles.markButtonText}>Mark Attendance</Text>
                              </>
                            )}
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </LinearGradient>
                  </Pressable>
                )
              })
          ) : (
            <View style={styles.modernEmptyState}>
              <LinearGradient
                colors={["#f1f5f9", "#e2e8f0"]}
                style={styles.emptyGradient}
              >
                <View style={styles.emptyIconContainer}>
                  <LinearGradient
                    colors={["#cbd5e1", "#94a3b8"]}
                    style={styles.emptyIconGradient}
                  >
                    <Ionicons name="time-outline" size={40} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={styles.emptyTitle}>No Active Sessions</Text>
                <Text style={styles.emptySubtext}>
                  Wait for your teacher to start an attendance session
                </Text>
              </LinearGradient>
            </View>
          )}
        </Animated.View>

        {/* Attendance History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Recent History</Text>
              <Text style={styles.sectionSubtitle}>
                Last {attendanceHistory.length} records
              </Text>
            </View>
            <TouchableOpacity style={styles.filterButton}>
              <Ionicons name="filter-outline" size={18} color="#667eea" />
            </TouchableOpacity>
          </View>

          {attendanceHistory.length > 0 ? (
            <View style={styles.historyTimeline}>
              {attendanceHistory.map((attendance, index) => (
                <View key={attendance.id} style={styles.historyTimelineItem}>
                  {/* Timeline */}
                  <View style={styles.timeline}>
                    <View 
                      style={[
                        styles.timelineDot,
                        { 
                          backgroundColor: attendance.status === "PRESENT" 
                            ? "#10b981" 
                            : "#ef4444" 
                        }
                      ]} 
                    />
                    {index < attendanceHistory.length - 1 && (
                      <View style={styles.timelineLine} />
                    )}
                  </View>

                  {/* History Card */}
                  <View style={styles.historyCard}>
                    <View style={styles.historyCardHeader}>
                      <Text style={styles.historyClassName}>
                        {attendance.session?.class?.name}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: attendance.status === "PRESENT" 
                              ? "#dcfce7" 
                              : "#fee2e2",
                          },
                        ]}
                      >
                        <Ionicons 
                          name={attendance.status === "PRESENT" 
                            ? "checkmark-circle" 
                            : "close-circle"
                          } 
                          size={12} 
                          color={attendance.status === "PRESENT" 
                            ? "#16a34a" 
                            : "#dc2626"
                          }
                        />
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color: attendance.status === "PRESENT" 
                                ? "#16a34a" 
                                : "#dc2626",
                            },
                          ]}
                        >
                          {attendance.status}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.historyDateRow}>
                      <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
                      <Text style={styles.historyDate}>
                        {new Date(attendance.markedAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </Text>
                      <Text style={styles.historyTime}>
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
                style={styles.emptyGradient}
              >
                <View style={styles.emptyIconContainer}>
                  <LinearGradient
                    colors={["#cbd5e1", "#94a3b8"]}
                    style={styles.emptyIconGradient}
                  >
                    <Ionicons name="calendar-outline" size={40} color="#fff" />
                  </LinearGradient>
                </View>
                <Text style={styles.emptyTitle}>No History Yet</Text>
                <Text style={styles.emptySubtext}>
                  Your attendance records will appear here
                </Text>
              </LinearGradient>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

// Helper function
const getSessionColor = (index: number) => {
  const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a']
  return colors[index % colors.length]
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  biometricSetupButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  biometricBlur: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    overflow: 'hidden',
  },
  biometricButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  miniStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  miniStatNumber: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginTop: 4,
  },
  miniStatLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
    fontWeight: "500",
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  liveText: {
    fontSize: 11,
    fontWeight: "800",
    color: '#dc2626',
  },
  activeSessionCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  sessionCardGradient: {
    position: 'relative',
  },
  sessionAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  sessionCardContent: {
    padding: 16,
    paddingLeft: 20,
  },
  sessionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionClassName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  sessionMetaRow: {
    flexDirection: 'row',
    gap: 8,
  },
  codeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ede9fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sessionCode: {
    fontSize: 12,
    fontWeight: "700",
    color: "#667eea",
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  sessionTime: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  fingerprintContainer: {
    marginLeft: 12,
  },
  fingerprintGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markAttendanceButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  markingButton: {
    opacity: 0.8,
  },
  markButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  markButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyTimeline: {
    paddingLeft: 8,
  },
  historyTimelineItem: {
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
  historyCard: {
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
  historyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyClassName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: 'capitalize',
  },
  historyDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyDate: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
  },
  historyTime: {
    fontSize: 12,
    color: "#94a3b8",
  },
  modernEmptyState: {
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 8,
  },
  emptyGradient: {
    alignItems: "center",
    padding: 40,
  },
  emptyIconContainer: {
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 16,
  },
  emptyIconGradient: {
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 6,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
  },
})