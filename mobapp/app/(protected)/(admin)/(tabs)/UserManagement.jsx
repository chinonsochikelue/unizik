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
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { apiService } from "@/services/api"
import { useRouter } from "expo-router"

const UserManagement = () => {
  const navigation = useRouter()
  const params = new URLSearchParams(window.location.search)
  const initialRole = params.get("role") || "ALL"
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRole, setSelectedRole] = useState(initialRole || "ALL")
  const [modalVisible, setModalVisible] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    role: "STUDENT",
    studentId: "",
    teacherId: "",
  })

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchQuery, selectedRole])

  const loadUsers = async () => {
    try {
      const params = {
        role: selectedRole === "ALL" ? undefined : selectedRole,
        search: searchQuery || undefined,
        limit: 100
      }
      const response = await apiService.get("/admin/users", { params })
      if (response.data?.success) {
        setUsers(response.data.data)
      }
    } catch (error) {
      console.error("Error loading users:", error)
      Alert.alert("Error", "Failed to load users")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterUsers = () => {
    let filtered = users

    if (selectedRole !== "ALL") {
      filtered = filtered.filter((user) => user.role === selectedRole)
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (user.studentId && user.studentId.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (user.teacherId && user.teacherId.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    setFilteredUsers(filtered)
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadUsers()
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      role: "STUDENT",
      studentId: "",
      teacherId: "",
    })
    setModalVisible(true)
  }

  const openEditModal = (user) => {
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
  }

  const handleSave = async () => {
    try {
      if (editingUser) {
        // Update user
        const response = await apiService.put(`/admin/users/${editingUser.id}`, formData)
        if (response.data?.success) {
          Alert.alert("Success", "User updated successfully")
          loadUsers()
        }
      } else {
        // Create user
        const response = await apiService.post("/admin/users", formData)
        if (response.data?.success) {
          Alert.alert("Success", "User created successfully")
          loadUsers()
        }
      }
      setModalVisible(false)
    } catch (error) {
      console.error("Error saving user:", error)
      const message = error.response?.data?.message || "Failed to save user"
      Alert.alert("Error", message)
    }
  }

  const handleDelete = (user) => {
    Alert.alert("Confirm Delete", `Are you sure you want to delete ${user.firstName} ${user.lastName}?`, [
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
            }
          } catch (error) {
            console.error("Error deleting user:", error)
            const message = error.response?.data?.message || "Failed to delete user"
            Alert.alert("Error", message)
          }
        },
      },
    ])
  }

  const handleViewDetails = (user) => {
    navigation.push(`/user-details/${user.id}`)
  }

  const renderUser = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>
          {item.firstName} {item.lastName}
        </Text>
        <Text style={styles.userEmail}>{item.email}</Text>
        <View style={styles.userDetails}>
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
            <Text style={styles.roleText}>{item.role}</Text>
          </View>
          {item.studentId && <Text style={styles.userId}>ID: {item.studentId}</Text>}
          {item.teacherId && <Text style={styles.userId}>ID: {item.teacherId}</Text>}
        </View>
      </View>
      <View style={styles.userActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleViewDetails(item)}>
          <Ionicons name="eye-outline" size={20} color="#10b981" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(item)}>
          <Ionicons name="create" size={20} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
          <Ionicons name="trash" size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>
    </View>
  )

  const getRoleColor = (role) => {
    switch (role) {
      case "ADMIN":
        return "#ef4444"
      case "TEACHER":
        return "#10b981"
      case "STUDENT":
        return "#3b82f6"
      default:
        return "#6b7280"
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
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
          />
        </View>
        <View style={styles.filterContainer}>
          {["ALL", "ADMIN", "TEACHER", "STUDENT"].map((role) => (
            <TouchableOpacity
              key={role}
              style={[styles.filterButton, selectedRole === role && styles.activeFilter]}
              onPress={() => setSelectedRole(role)}
            >
              <Text style={[styles.filterText, selectedRole === role && styles.activeFilterText]}>{role}</Text>
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
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingUser ? "Edit User" : "Create User"}</Text>

            <TextInput
              style={styles.input}
              placeholder="First Name"
              value={formData.firstName}
              onChangeText={(text) => setFormData({ ...formData, firstName: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Last Name"
              value={formData.lastName}
              onChangeText={(text) => setFormData({ ...formData, lastName: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.roleSelector}>
              {["ADMIN", "TEACHER", "STUDENT"].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[styles.roleOption, formData.role === role && styles.selectedRole]}
                  onPress={() => setFormData({ ...formData, role })}
                >
                  <Text style={[styles.roleOptionText, formData.role === role && styles.selectedRoleText]}>{role}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {formData.role === "STUDENT" && (
              <TextInput
                style={styles.input}
                placeholder="Student ID"
                value={formData.studentId}
                onChangeText={(text) => setFormData({ ...formData, studentId: text })}
              />
            )}

            {formData.role === "TEACHER" && (
              <TextInput
                style={styles.input}
                placeholder="Teacher ID"
                value={formData.teacherId}
                onChangeText={(text) => setFormData({ ...formData, teacherId: text })}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save</Text>
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
  addButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
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
  userCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userInfo: {
    flex: 1,
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
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#ffffff",
  },
  userId: {
    fontSize: 12,
    color: "#6b7280",
  },
  userActions: {
    flexDirection: "row",
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
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
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  roleSelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  roleOption: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  selectedRole: {
    backgroundColor: "#3b82f6",
  },
  roleOptionText: {
    fontSize: 14,
    color: "#6b7280",
  },
  selectedRoleText: {
    color: "#ffffff",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  saveButton: {
    backgroundColor: "#3b82f6",
  },
  cancelButtonText: {
    color: "#6b7280",
    fontWeight: "500",
  },
  saveButtonText: {
    color: "#ffffff",
    fontWeight: "500",
  },
})

export default UserManagement
