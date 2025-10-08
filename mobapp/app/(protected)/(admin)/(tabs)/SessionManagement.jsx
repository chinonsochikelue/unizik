"use client"

import { useState, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  RefreshControl,
  Switch,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { apiService } from "@/services/api"

const SessionManagement = ({ navigation }) => {
  const [sessions, setSessions] = useState([])
  const [filteredSessions, setFilteredSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("ALL")
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedSession, setSelectedSession] = useState(null)

  useEffect(() => {
    loadSessions()
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSessions, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterSessions()
  }, [sessions, searchQuery, selectedFilter])

  const loadSessions = async () => {
    try {
      const response = await apiService.get("/admin/sessions")
      if (response.data?.success) {
        setSessions(response.data.data)
      }
    } catch (error) {
      console.error("Error loading sessions:", error)
      Alert.alert("Error", "Failed to load sessions")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterSessions = () => {
    let filtered = sessions

    if (selectedFilter !== "ALL") {
      if (selectedFilter === "ACTIVE") {
        filtered = filtered.filter((session) => session.isActive)
      } else if (selectedFilter === "ENDED") {
        filtered = filtered.filter((session) => !session.isActive)
      } else if (selectedFilter === "TODAY") {
        const today = new Date().toDateString()
        filtered = filtered.filter((session) => new Date(session.startTime).toDateString() === today)
      }
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (session) =>
          session.class?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          session.class?.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          session.teacher?.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          session.teacher?.lastName.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredSessions(filtered)
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadSessions()
  }

  const handleEndSession = async (sessionId) => {
    try {
      const response = await apiService.post(`/admin/sessions/${sessionId}/end`)
      if (response.data?.success) {
        Alert.alert("Success", "Session ended successfully")
        loadSessions()
      }
    } catch (error) {
      console.error("Error ending session:", error)
      const message = error.response?.data?.message || "Failed to end session"
      Alert.alert("Error", message)
    }
  }

  const handleViewDetails = (session) => {
    setSelectedSession(session)
    setModalVisible(true)
  }

  const formatDateTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getSessionDuration = (startTime, endTime) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const duration = Math.floor((end - start) / 1000 / 60) // minutes
    
    if (duration < 60) {
      return `${duration}m`
    } else {
      const hours = Math.floor(duration / 60)
      const minutes = duration % 60
      return `${hours}h ${minutes}m`
    }
  }

  const getStatusColor = (isActive) => {
    return isActive ? "#22c55e" : "#6b7280"
  }

  const renderSession = ({ item }) => (
    <View style={styles.sessionCard}>
      <View style={styles.sessionHeader}>
        <View style={styles.sessionInfo}>
          <Text style={styles.className}>{item.class?.name}</Text>
          <Text style={styles.classCode}>{item.class?.code}</Text>
          <Text style={styles.teacherName}>
            {item.teacher?.firstName} {item.teacher?.lastName}
          </Text>
        </View>
        <View style={styles.sessionStatus}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.isActive) }]} />
          <Text style={[styles.statusText, { color: getStatusColor(item.isActive) }]}>
            {item.isActive ? "ACTIVE" : "ENDED"}
          </Text>
        </View>
      </View>
      
      <View style={styles.sessionDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="time" size={16} color="#6b7280" />
          <Text style={styles.detailText}>Started: {formatDateTime(item.startTime)}</Text>
        </View>
        {item.endTime && (
          <View style={styles.detailItem}>
            <Ionicons name="flag" size={16} color="#6b7280" />
            <Text style={styles.detailText}>Ended: {formatDateTime(item.endTime)}</Text>
          </View>
        )}
        <View style={styles.detailItem}>
          <Ionicons name="hourglass" size={16} color="#6b7280" />
          <Text style={styles.detailText}>Duration: {getSessionDuration(item.startTime, item.endTime)}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="people" size={16} color="#6b7280" />
          <Text style={styles.detailText}>Attendance: {item.attendanceCount || 0} students</Text>
        </View>
      </View>

      <View style={styles.sessionActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleViewDetails(item)}>
          <Ionicons name="eye" size={20} color="#3b82f6" />
        </TouchableOpacity>
        {item.isActive && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              Alert.alert(
                "End Session",
                `Are you sure you want to end the session for ${item.class?.name}?`,
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "End Session",
                    style: "destructive",
                    onPress: () => handleEndSession(item.id),
                  },
                ]
              )
            }}
          >
            <Ionicons name="stop" size={20} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Session Management</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadSessions}>
          <Ionicons name="refresh" size={24} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search sessions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <View style={styles.filterContainer}>
          {["ALL", "ACTIVE", "ENDED", "TODAY"].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[styles.filterButton, selectedFilter === filter && styles.activeFilter]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[styles.filterText, selectedFilter === filter && styles.activeFilterText]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Sessions List */}
      <FlatList
        data={filteredSessions}
        renderItem={renderSession}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No sessions found</Text>
          </View>
        }
      />

      {/* Session Details Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Session Details</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedSession && (
              <View style={styles.modalBody}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Class Information</Text>
                  <Text style={styles.modalText}>Name: {selectedSession.class?.name}</Text>
                  <Text style={styles.modalText}>Code: {selectedSession.class?.code}</Text>
                  <Text style={styles.modalText}>
                    Teacher: {selectedSession.teacher?.firstName} {selectedSession.teacher?.lastName}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Session Details</Text>
                  <Text style={styles.modalText}>Started: {formatDateTime(selectedSession.startTime)}</Text>
                  {selectedSession.endTime && (
                    <Text style={styles.modalText}>Ended: {formatDateTime(selectedSession.endTime)}</Text>
                  )}
                  <Text style={styles.modalText}>
                    Duration: {getSessionDuration(selectedSession.startTime, selectedSession.endTime)}
                  </Text>
                  <Text style={styles.modalText}>Status: {selectedSession.isActive ? "Active" : "Ended"}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Attendance</Text>
                  <Text style={styles.modalText}>Total Attendance: {selectedSession.attendanceCount || 0}</Text>
                </View>
              </View>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  refreshButton: {
    padding: 8,
  },
  searchContainer: {
    padding: 20,
    backgroundColor: "#ffffff",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 8,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
  },
  activeFilter: {
    backgroundColor: "#3b82f6",
  },
  filterText: {
    fontSize: 14,
    color: "#6b7280",
  },
  activeFilterText: {
    color: "#ffffff",
  },
  listContainer: {
    padding: 20,
  },
  sessionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sessionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  sessionInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  classCode: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "500",
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 14,
    color: "#6b7280",
  },
  sessionStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  sessionDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
  },
  sessionActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 500,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  modalBody: {
    marginBottom: 20,
  },
  modalSection: {
    marginBottom: 15,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  modalActions: {
    alignItems: "center",
  },
  modalButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  modalButtonText: {
    color: "#ffffff",
    fontWeight: "500",
    fontSize: 16,
  },
})

export default SessionManagement