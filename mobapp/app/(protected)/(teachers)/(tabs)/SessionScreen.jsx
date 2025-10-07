"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "@/context/AuthContext"
import { apiService } from "@/services/api"
import { useLocalSearchParams, useRouter } from "expo-router"

export default function SessionScreen() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useLocalSearchParams()
  const classId = params.classId
  const sessionId = params.sessionId

  console.log("SessionScreen Params:", { classId, sessionId, params })
  
  const [classData, setClassData] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [debugInfo, setDebugInfo] = useState("")

  const loadData = async () => {
    if (!classId) {
      console.log("❌ No classId provided")
      setDebugInfo("No classId provided")
      return
    }
    
    try {
      console.log("📡 Loading data for class:", classId)
      setDebugInfo("Loading data...")

      // Load class data
      console.log("1. Loading class data...")
      const classResponse = await apiService.get(`/classes/${classId}`)
      console.log("✅ Class data loaded:", classResponse.data)
      setClassData(classResponse.data.class)

      // Check for active session - try multiple approaches
      console.log("2. Checking for active session...")
      
      let session = null
      
      // Approach 1: Check specific class active session
      try {
        console.log("2a. Trying /sessions/class/${classId}/active...")
        const sessionResponse = await apiService.get(`/sessions/class/${classId}/active`)
        console.log("✅ Class active session response:", sessionResponse.data)
        session = sessionResponse.data.session
        setDebugInfo(session ? `Active session found: ${session.code}` : "No active session for this class")
      } catch (error) {
        console.log("❌ Class active session failed:", error.response?.data)
        setDebugInfo(`Class active session error: ${error.response?.data?.error || error.message}`)
        
        // Approach 2: Get all active sessions and find one for this class
        try {
          console.log("2b. Trying /sessions/active (all active sessions)...")
          const allActiveResponse = await apiService.get('/sessions/active')
          console.log("✅ All active sessions response:", allActiveResponse.data)
          
          const allActiveSessions = allActiveResponse.data
          if (Array.isArray(allActiveSessions)) {
            session = allActiveSessions.find(s => s.class?.id === classId)
            console.log(session ? "✅ Found matching session in active list" : "❌ No matching session in active list")
            setDebugInfo(session ? 
              `Found session via active list: ${session.code}` : 
              `No session for this class in ${allActiveSessions.length} active sessions`)
          }
        } catch (allActiveError) {
          console.log("❌ All active sessions failed:", allActiveError.response?.data)
          setDebugInfo(`All active sessions error: ${allActiveError.response?.data?.error || allActiveError.message}`)
        }
      }

      setActiveSession(session)

      // Load attendance if session exists
      if (session) {
        console.log("3. Loading attendance for session:", session.id)
        try {
          const attendanceResponse = await apiService.get(`/attendance/session/${session.id}`)
          console.log("✅ Attendance loaded:", attendanceResponse.data)
          setAttendance(attendanceResponse.data.attendance || [])
          setDebugInfo(`Session: ${session.code}, Attendance: ${attendanceResponse.data.attendance?.length || 0} records`)
        } catch (attendanceError) {
          console.log("❌ Attendance loading failed:", attendanceError.response?.data)
          setAttendance([])
          setDebugInfo(`Session: ${session.code}, Attendance load failed: ${attendanceError.response?.data?.error}`)
        }
      } else {
        console.log("3. No active session found, clearing attendance")
        setAttendance([])
      }

    } catch (error) {
      console.error("❌ Error loading data:", error)
      const errorMsg = error.response?.data?.error || error.message
      Alert.alert("Error", `Failed to load class data: ${errorMsg}`)
      setDebugInfo(`Load error: ${errorMsg}`)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }
  
  useEffect(() => {
    loadData()
  }, [classId])

  const onRefresh = () => {
    console.log("🔄 Refreshing data...")
    setRefreshing(true)
    loadData()
  }
           
  // Validate params
  if (!classId) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color="#dc2626" />
        <Text style={styles.errorTitle}>Missing Class ID</Text>
        <Text style={styles.errorText}>
          Error: Class ID is missing or invalid. Please try again from the class list.
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const startSession = async () => {
    console.log("🚀 Starting session for class:", classId)
    setDebugInfo("Starting session...")
    
    try {
      const response = await apiService.post("/sessions/start", { classId })
      console.log("✅ Session started:", response.data)
      
      const newSession = response.data.session
      setActiveSession(newSession)
      setDebugInfo(`Session started successfully: ${newSession.code}`)
      
      // Update the route parameters to include sessionId
      router.setParams({ sessionId: newSession.id })
      
      Alert.alert(
        "Session Started",
        `Session Code: ${newSession.code}\nStudents can now mark their attendance.`,
        [
          {
            text: "OK",
            onPress: () => {
              // Refresh data to load attendance
              onRefresh()
            },
          },
        ]
      )
    } catch (error) {
      console.error("❌ Error starting session:", error)
      const errorMsg = error.response?.data?.error || error.message
      setDebugInfo(`Start session error: ${errorMsg}`)
      
      if (errorMsg.includes("already an active session")) {
        Alert.alert(
          "Session Already Active", 
          "There is already an active session for this class. Would you like to refresh to see it?",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Refresh", onPress: onRefresh }
          ]
        )
      } else {
        Alert.alert("Error", `Failed to start session: ${errorMsg}`)
      }
    }
  }

  const stopSession = async () => {
    if (!activeSession) return

    Alert.alert("Stop Session", "Are you sure you want to stop the attendance session?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Stop",
        style: "destructive",
        onPress: async () => {
          console.log("🛑 Stopping session:", activeSession.id)
          setDebugInfo("Stopping session...")
          
          try {
            await apiService.put(`/sessions/${activeSession.id}/stop`)
            console.log("✅ Session stopped")
            
            setActiveSession(null)
            setAttendance([])
            setDebugInfo("Session stopped successfully")
            
            // Clear sessionId from route parameters
            router.setParams({ sessionId: undefined })
            
            Alert.alert("Success", "Attendance session stopped")
          } catch (error) {
            console.error("❌ Error stopping session:", error)
            const errorMsg = error.response?.data?.error || error.message
            setDebugInfo(`Stop session error: ${errorMsg}`)
            Alert.alert("Error", `Failed to stop session: ${errorMsg}`)
          }
        },
      },
    ])
  }

  const getAttendanceStats = () => {
    if (!classData || !attendance) return { present: 0, absent: 0, rate: 0 }

    const totalStudents = classData.students?.length || 0
    const presentCount = attendance.filter((a) => a.status === "PRESENT").length
    const absentCount = totalStudents - presentCount
    const rate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0

    return { present: presentCount, absent: absentCount, rate }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading session data...</Text>
        <Text style={styles.debugText}>{debugInfo}</Text>
      </View>
    )
  }

  const stats = getAttendanceStats()

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.className}>{classData?.name}</Text>
        <Text style={styles.classDescription}>{classData?.description}</Text>
        {__DEV__ && (
          <Text style={styles.debugText}>Debug: {debugInfo}</Text>
        )}
      </View>

      {activeSession ? (
        <View style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionTitle}>Active Session</Text>
              <Text style={styles.sessionCode}>Code: {activeSession.code}</Text>
              <Text style={styles.sessionTime}>
                Started: {new Date(activeSession.startTime).toLocaleTimeString()}
              </Text>
              <Text style={styles.sessionTime}>
                Expires: {new Date(activeSession.expiresAt).toLocaleTimeString()}
              </Text>
            </View>
            <TouchableOpacity style={styles.stopButton} onPress={stopSession}>
              <Ionicons name="stop-circle" size={20} color="white" />
              <Text style={styles.stopButtonText}>Stop</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.present}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.absent}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.rate}%</Text>
              <Text style={styles.statLabel}>Rate</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.noSessionCard}>
          <Ionicons name="time-outline" size={48} color="#64748b" />
          <Text style={styles.noSessionTitle}>No Active Session</Text>
          <Text style={styles.noSessionText}>
            Start an attendance session to allow students to mark their attendance
          </Text>
          <TouchableOpacity style={styles.startButton} onPress={startSession}>
            <Ionicons name="play-circle" size={20} color="white" />
            <Text style={styles.startButtonText}>Start Session</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Students ({classData?.students?.length || 0})</Text>

        {classData?.students?.map((student) => {
          const studentAttendance = attendance.find((a) => a.student.id === student.id)
          const isPresent = studentAttendance?.status === "PRESENT"

          return (
            <View key={student.id} style={styles.studentCard}>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.name}</Text>
                <Text style={styles.studentEmail}>{student.email}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: isPresent ? "#dcfce7" : "#fef2f2" }]}>
                <Text style={[styles.statusText, { color: isPresent ? "#16a34a" : "#dc2626" }]}>
                  {isPresent ? "Present" : "Absent"}
                </Text>
              </View>
            </View>
          )
        })}

        {(!classData?.students || classData.students.length === 0) && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#64748b" />
            <Text style={styles.emptyText}>No students enrolled</Text>
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
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 10,
  },
  debugText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
    fontStyle: "italic",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#dc2626",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    backgroundColor: "white",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  className: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  classDescription: {
    fontSize: 16,
    color: "#64748b",
  },
  sessionCard: {
    backgroundColor: "white",
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  sessionCode: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "500",
    marginBottom: 2,
  },
  sessionTime: {
    fontSize: 14,
    color: "#64748b",
  },
  stopButton: {
    backgroundColor: "#dc2626",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  stopButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
  },
  noSessionCard: {
    backgroundColor: "white",
    margin: 16,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  noSessionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
  },
  noSessionText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 24,
  },
  startButton: {
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  startButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
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
  studentCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1e293b",
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 14,
    color: "#64748b",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
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