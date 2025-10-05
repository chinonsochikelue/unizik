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

  
  console.log("Params here:", classId, sessionId, params)
  const [classData, setClassData] = useState(null)
  const [activeSession, setActiveSession] = useState(null)
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

   const loadData = async () => {
    if (!classId) return
    try {
      // Load class data
      const classResponse = await apiService.get(`/classes/${classId}`)
      setClassData(classResponse.data.class)

      // Check for active session
      const sessionResponse = await apiService.get(`/sessions/class/${classId}/active`)
      const session = sessionResponse.data.session
      setActiveSession(session)

      // Load attendance if session exists
      if (session) {
        const attendanceResponse = await apiService.get(`/attendance/session/${session.id}`)
        setAttendance(attendanceResponse.data.attendance || [])
      }
    } catch (error) {
      console.error("Error loading data:", error)
      Alert.alert("Error", "Failed to fetch class or session data. Please try again later.")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }
  
    useEffect(() => {
    loadData()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }
           
  // Validate params
  if (!classId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
        <Ionicons name="alert-circle" size={48} color="#dc2626" />
        <Text style={{ fontSize: 18, color: '#dc2626', marginTop: 16, textAlign: 'center' }}>
          Error: Class ID is missing or invalid. Please try again from the class list.
        </Text>
      </View>
    )
  }
  console.log("Params:", params)


  const startSession = async () => {
    try {
      const response = await apiService.post("/sessions/start", { classId })
      setActiveSession(response.data.session)
      Alert.alert(
        "Session Started",
        `Session Code: ${response.data.session.code}\nStudents can now mark their attendance.`,
        [
          {
            text: "OK",
            onPress: () => {
              router.replace({ pathname: "SessionScreen", params: { classId, sessionId: response.data.session.id } })
            },
          },
        ]
      )
    } catch (error) {
      console.error("Error starting session:", error)
      Alert.alert("Error", error.response?.data?.error || "Failed to start session")
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
          try {
            await apiService.put(`/sessions/${activeSession.id}/stop`)
            setActiveSession(null)
            Alert.alert("Success", "Attendance session stopped", [
              {
                text: "OK",
                onPress: () => {
                  router.replace({ pathname: "SessionScreen", params: { classId } })
                },
              },
            ])
          } catch (error) {
            console.error("Error stopping session:", error)
            Alert.alert("Error", "Failed to stop session")
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
        <Text>Loading...</Text>
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
      </View>

      {activeSession ? (
        <View style={styles.sessionCard}>
          <View style={styles.sessionHeader}>
            <View style={styles.sessionInfo}>
              <Text style={styles.sessionTitle}>Active Session</Text>
              <Text style={styles.sessionCode}>Code: {activeSession.code}</Text>
              <Text style={styles.sessionTime}>Started: {new Date(activeSession.startTime).toLocaleTimeString()}</Text>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
