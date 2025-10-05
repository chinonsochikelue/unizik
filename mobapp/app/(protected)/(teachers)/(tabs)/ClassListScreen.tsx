"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "@/context/AuthContext"
import { apiService } from "@/services/api"
import { useRouter } from "expo-router"

export default function ClassListScreen() {
  const { user } = useAuth()
    const navigation = useRouter();
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    try {
      const response = await apiService.get("/classes")
      setClasses(response.data.classes || [])
    } catch (error) {
      console.error("Error loading classes:", error)
      Alert.alert("Error", "Failed to load classes")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadClasses()
  }

  const startSession = async (classId, className) => {
    try {
      const response = await apiService.post("/sessions/start", { classId })

      Alert.alert(
        "Session Started",
        `Attendance session for ${className} has been started.\nSession Code: ${response.data.session.code}`,
        [
          {
            text: "OK",
            onPress: () =>
              navigation.push("SessionScreen", {
                sessionId: response.data.session.id,
                classId,
              }),
          },
        ],
      )
    } catch (error) {
      console.error("Error starting session:", error)
      Alert.alert("Error", error.response?.data?.error || "Failed to start session")
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading classes...</Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Classes</Text>
        <Text style={styles.subtitle}>Manage your classes and start attendance sessions</Text>
      </View>

      {classes.length > 0 ? (
        classes.map((classItem) => (
          <View key={classItem.id} style={styles.classCard}>
            <View style={styles.classHeader}>
              <View style={styles.classInfo}>
                <Text style={styles.className}>{classItem.name}</Text>
                <Text style={styles.classDescription}>{classItem.description}</Text>
              </View>
              <View style={styles.classStats}>
                <Text style={styles.statNumber}>{classItem._count?.students || 0}</Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
            </View>


            <View style={styles.classActions}>
              {classItem.activeSession ? (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => navigation.push("SessionScreen", {
                    sessionId: classItem.activeSession.id,
                    classId: classItem.id,
                  })}
                >
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>Session Active</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => startSession(classItem.id, classItem.name)}
                >
                  <Ionicons name="play-circle" size={20} color="white" />
                  <Text style={styles.primaryButtonText}>Start Session</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => navigation.push("SessionScreen", { classId: classItem.id })}
              >
                <Ionicons name="people" size={20} color="#2563eb" />
                <Text style={styles.secondaryButtonText}>View Students</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.classFooter}>
              <View style={styles.footerItem}>
                <Ionicons name="calendar-outline" size={16} color="#64748b" />
                <Text style={styles.footerText}>Created {new Date(classItem.createdAt).toLocaleDateString()}</Text>
              </View>
              <View style={styles.footerItem}>
                <Ionicons name="time-outline" size={16} color="#64748b" />
                <Text style={styles.footerText}>{classItem._count?.sessions || 0} sessions</Text>
              </View>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="school-outline" size={64} color="#64748b" />
          <Text style={styles.emptyTitle}>No Classes Assigned</Text>
          <Text style={styles.emptyText}>Contact your administrator to get classes assigned to your account.</Text>
        </View>
      )}
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
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#64748b",
  },
  classCard: {
    backgroundColor: "white",
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  classHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  classInfo: {
    flex: 1,
    marginRight: 16,
  },
  className: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  classDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  classStats: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563eb",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  classActions: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#2563eb",
    gap: 8,
  },
  secondaryButtonText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "600",
  },
  classFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: "#64748b",
  },
  emptyState: {
    alignItems: "center",
    padding: 48,
    marginTop: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 24,
  },
})
