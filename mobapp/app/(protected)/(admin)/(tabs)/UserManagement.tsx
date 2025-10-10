"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
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
  ActivityIndicator,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { apiService } from "@/services/api"
import { useRouter } from "expo-router"

// Types
interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: UserRole
  studentId?: string
  teacherId?: string
}

type UserRole = "ADMIN" | "TEACHER" | "STUDENT"
type FilterRole = UserRole | "ALL"

interface FormData {
  firstName: string
  lastName: string
  email: string
  role: UserRole
  studentId: string
  teacherId: string
}

// Constants
const ROLES: FilterRole[] = ["ALL", "ADMIN", "TEACHER", "STUDENT"]
const USER_ROLES: UserRole[] = ["ADMIN", "TEACHER", "STUDENT"]
const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "#ef4444",
  TEACHER: "#10b981",
  STUDENT: "#3b82f6",
}

const INITIAL_FORM_DATA: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  role: "STUDENT",
  studentId: "",
  teacherId: "",
}

const UserManagement = () => {
  const router = useRouter()
  
  // State
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState<FilterRole>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      return (params.get("role") as FilterRole) || "ALL"
    }
    return "ALL"
  })
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA)
  const [saveLoading, setSaveLoading] = useState(false)

  // Load users on mount and when filters change
  useEffect(() => {
    loadUsers()
  }, [])

  // Memoized filtered users
  const filteredUsers = useMemo(() => {
    let filtered = users

    if (selectedRole !== "ALL") {
      filtered = filtered.filter((user) => user.role === selectedRole)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (user) =>
          user.firstName.toLowerCase().includes(query) ||
          user.lastName.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.studentId?.toLowerCase().includes(query) ||
          user.teacherId?.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [users, searchQuery, selectedRole])

  // Load users function
  const loadUsers = useCallback(async () => {
    try {
      const params: Record<string, any> = {
        limit: 100,
      }
      
      if (selectedRole !== "ALL") {
        params.role = selectedRole
      }
      
      if (searchQuery.trim()) {
        params.search = searchQuery
      }

      const response = await apiService.get("/admin/users", { params })
      
      if (response.data?.success) {
        setUsers(response.data.data || [])
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error) {
      console.error("Error loading users:", error)
      Alert.alert(
        "Error",
        "Failed to load users. Please try again.",
        [{ text: "OK" }]
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [selectedRole, searchQuery])

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadUsers()
  }, [loadUsers])

  // Modal handlers
  const openCreateModal = useCallback(() => {
    setEditingUser(null)
    setFormData(INITIAL_FORM_DATA)
    setModalVisible(true)
  }, [])

  const openEditModal = useCallback((user: User) => {
    setEditingUser(user)
    setFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      studentId: user.studentId || "",
      teacherId: user.teacherId || "",
    })
    setModalVisible(true)
  }, [])

  const closeModal = useCallback(() => {
    setModalVisible(false)
    setEditingUser(null)
    setFormData(INITIAL_FORM_DATA)
  }, [])

  // Form validation
  const validateForm = useCallback((): string | null => {
    if (!formData.firstName.trim()) {
      return "First name is required"
    }
    if (!formData.lastName.trim()) {
      return "Last name is required"
    }
    if (!formData.email.trim()) {
      return "Email is required"
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return "Please enter a valid email address"
    }
    if (formData.role === "STUDENT" && !formData.studentId.trim()) {
      return "Student ID is required"
    }
    if (formData.role === "TEACHER" && !formData.teacherId.trim()) {
      return "Teacher ID is required"
    }
    return null
  }, [formData])

  // Save handler
  const handleSave = useCallback(async () => {
    const validationError = validateForm()
    if (validationError) {
      Alert.alert("Validation Error", validationError)
      return
    }

    setSaveLoading(true)
    try {
      const payload = { ...formData }
      
      // Clean up role-specific IDs
      if (formData.role !== "STUDENT") {
        delete payload.studentId
      }
      if (formData.role !== "TEACHER") {
        delete payload.teacherId
      }

      let response
      if (editingUser) {
        response = await apiService.put(`/admin/users/${editingUser.id}`, payload)
      } else {
        response = await apiService.post("/admin/users", payload)
      }

      if (response.data?.success) {
        Alert.alert(
          "Success",
          `User ${editingUser ? "updated" : "created"} successfully`
        )
        closeModal()
        loadUsers()
      } else {
        throw new Error("Invalid response format")
      }
    } catch (error: any) {
      console.error("Error saving user:", error)
      const message = error.response?.data?.message || 
        `Failed to ${editingUser ? "update" : "create"} user`
      Alert.alert("Error", message)
    } finally {
      setSaveLoading(false)
    }
  }, [formData, editingUser, validateForm, closeModal, loadUsers])

  // Delete handler
  const handleDelete = useCallback((user: User) => {
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await apiService.delete(`/admin/users/${user.id}`)
              if (response.data?.success) {
                Alert.alert("Success", "User deleted successfully")
                loadUsers()
              } else {
                throw new Error("Invalid response format")
              }
            } catch (error: any) {
              console.error("Error deleting user:", error)
              const message = error.response?.data?.message || "Failed to delete user"
              Alert.alert("Error", message)
            }
          },
        },
      ]
    )
  }, [loadUsers])

  // View details handler
  const handleViewDetails = useCallback((user: User) => {
    router.push(`/user-details/${user.id}`)
  }, [router])

  // Form field updater
  const updateFormField = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Render user card
  const renderUser = useCallback(({ item }: { item: User }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.userEmail} numberOfLines={1}>
          {item.email}
        </Text>
        <View style={styles.userDetails}>
          <View style={[styles.roleBadge, { backgroundColor: ROLE_COLORS[item.role] }]}>
            <Text style={styles.roleText}>{item.role}</Text>
          </View>
          {item.studentId && (
            <Text style={styles.userId} numberOfLines={1}>
              ID: {item.studentId}
            </Text>
          )}
          {item.teacherId && (
            <Text style={styles.userId} numberOfLines={1}>
              ID: {item.teacherId}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleViewDetails(item)}
          accessibilityLabel="View details"
        >
          <Ionicons name="eye-outline" size={20} color="#10b981" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => openEditModal(item)}
          accessibilityLabel="Edit user"
        >
          <Ionicons name="create-outline" size={20} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDelete(item)}
          accessibilityLabel="Delete user"
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  ), [handleViewDetails, openEditModal, handleDelete])

  // Loading state
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={openCreateModal}
          accessibilityLabel="Add new user"
        >
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#6b7280" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.filterContainer}>
          {ROLES.map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.filterButton, selectedRole === role && styles.activeFilter]}
              onPress={() => setSelectedRole(role)}
              accessibilityLabel={`Filter by ${role}`}
            >
              <Text style={[styles.filterText, selectedRole === role && styles.activeFilterText]}>
                {role}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={[
          styles.listContainer,
          filteredUsers.length === 0 && styles.emptyListContainer,
        ]}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No users found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || selectedRole !== "ALL"
                ? "Try adjusting your filters"
                : "Add your first user to get started"}
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Create/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingUser ? "Edit User" : "Create User"}
              </Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={formData.firstName}
                onChangeText={(text) => updateFormField("firstName", text)}
                autoCapitalize="words"
                editable={!saveLoading}
              />

              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={formData.lastName}
                onChangeText={(text) => updateFormField("lastName", text)}
                autoCapitalize="words"
                editable={!saveLoading}
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                value={formData.email}
                onChangeText={(text) => updateFormField("email", text)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!saveLoading}
              />

              <Text style={styles.sectionLabel}>Role</Text>
              <View style={styles.roleSelector}>
                {USER_ROLES.map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleOption, formData.role === role && styles.selectedRole]}
                    onPress={() => updateFormField("role", role)}
                    disabled={saveLoading}
                  >
                    <Text
                      style={[
                        styles.roleOptionText,
                        formData.role === role && styles.selectedRoleText,
                      ]}
                    >
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {formData.role === "STUDENT" && (
                <TextInput
                  style={styles.input}
                  placeholder="Student ID"
                  value={formData.studentId}
                  onChangeText={(text) => updateFormField("studentId", text)}
                  autoCapitalize="characters"
                  editable={!saveLoading}
                />
              )}

              {formData.role === "TEACHER" && (
                <TextInput
                  style={styles.input}
                  placeholder="Teacher ID"
                  value={formData.teacherId}
                  onChangeText={(text) => updateFormField("teacherId", text)}
                  autoCapitalize="characters"
                  editable={!saveLoading}
                />
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeModal}
                disabled={saveLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSave}
                disabled={saveLoading}
              >
                {saveLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
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
  centerContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  addButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    padding: 10,
  },
  searchContainer: {
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
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
    paddingHorizontal: 8,
    fontSize: 16,
    color: "#1f2937",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  filterButton: {
    flex: 1,
    // paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  activeFilter: {
    backgroundColor: "#3b82f6",
  },
  filterText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
  },
  activeFilterText: {
    color: "#ffffff",
    fontWeight: "600",
  },
  listContainer: {
    padding: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
    textAlign: "center",
  },
  userCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  userInfo: {
    flex: 1,
    marginRight: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  userDetails: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  userId: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  userActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 500,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
  },
  closeButton: {
    padding: 4,
  },
  formContainer: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    fontSize: 16,
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },
  roleSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 8,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedRole: {
    backgroundColor: "#dbeafe",
    borderColor: "#3b82f6",
  },
  roleOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  selectedRoleText: {
    color: "#3b82f6",
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  saveButton: {
    backgroundColor: "#3b82f6",
  },
  cancelButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 16,
  },
  saveButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16,
  },
})

export default UserManagement