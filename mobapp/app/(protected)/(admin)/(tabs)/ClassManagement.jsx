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

const ClassManagement = ({ navigation }) => {
  const [classes, setClasses] = useState([])
  const [filteredClasses, setFilteredClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [modalVisible, setModalVisible] = useState(false)
  const [editingClass, setEditingClass] = useState(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  })

  useEffect(() => {
    loadClasses()
  }, [])

  useEffect(() => {
    filterClasses()
  }, [classes, searchQuery])

  const loadClasses = async () => {
    try {
      const response = await apiService.get("/classes")
      if (response.success) {
        setClasses(response.data)
      }
    } catch (error) {
      console.error("Error loading classes:", error)
      Alert.alert("Error", "Failed to load classes")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterClasses = () => {
    let filtered = classes

    if (searchQuery) {
      filtered = filtered.filter(
        (cls) =>
          cls.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          cls.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (cls.description && cls.description.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    setFilteredClasses(filtered)
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadClasses()
  }

  const openCreateModal = () => {
    setEditingClass(null)
    setFormData({
      name: "",
      code: "",
      description: "",
    })
    setModalVisible(true)
  }

  const openEditModal = (cls) => {
    setEditingClass(cls)
    setFormData({
      name: cls.name,
      code: cls.code,
      description: cls.description || "",
    })
    setModalVisible(true)
  }

  const handleSave = async () => {
    try {
      if (editingClass) {
        const response = await apiService.put(`/classes/${editingClass.id}`, formData)
        if (response.success) {
          Alert.alert("Success", "Class updated successfully")
          loadClasses()
        }
      } else {
        const response = await apiService.post("/classes", formData)
        if (response.success) {
          Alert.alert("Success", "Class created successfully")
          loadClasses()
        }
      }
      setModalVisible(false)
    } catch (error) {
      console.error("Error saving class:", error)
      Alert.alert("Error", "Failed to save class")
    }
  }

  const handleDelete = (cls) => {
    Alert.alert("Confirm Delete", `Are you sure you want to delete ${cls.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const response = await apiService.delete(`/classes/${cls.id}`)
            if (response.success) {
              Alert.alert("Success", "Class deleted successfully")
              loadClasses()
            }
          } catch (error) {
            console.error("Error deleting class:", error)
            Alert.alert("Error", "Failed to delete class")
          }
        },
      },
    ])
  }

  const renderClass = ({ item }) => (
    <View style={styles.classCard}>
      <View style={styles.classInfo}>
        <Text style={styles.className}>{item.name}</Text>
        <Text style={styles.classCode}>{item.code}</Text>
        {item.description && <Text style={styles.classDescription}>{item.description}</Text>}
        <View style={styles.classStats}>
          <View style={styles.statItem}>
            <Ionicons name="people" size={16} color="#6b7280" />
            <Text style={styles.statText}>{item.studentCount || 0} students</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="person" size={16} color="#6b7280" />
            <Text style={styles.statText}>
              {item.teacher ? `${item.teacher.firstName} ${item.teacher.lastName}` : "No teacher"}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.classActions}>
        <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(item)}>
          <Ionicons name="create" size={20} color="#3b82f6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(item)}>
          <Ionicons name="trash" size={20} color="#ef4444" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate("ClassDetails", { classId: item.id })}
        >
          <Ionicons name="eye" size={20} color="#10b981" />
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Class Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
          <Ionicons name="add" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#6b7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search classes..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Classes List */}
      <FlatList
        data={filteredClasses}
        renderItem={renderClass}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Create/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingClass ? "Edit Class" : "Create Class"}</Text>

            <TextInput
              style={styles.input}
              placeholder="Class Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <TextInput
              style={styles.input}
              placeholder="Class Code"
              value={formData.code}
              onChangeText={(text) => setFormData({ ...formData, code: text })}
              autoCapitalize="characters"
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={3}
            />

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
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 8,
    fontSize: 16,
  },
  listContainer: {
    padding: 20,
  },
  classCard: {
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
  classInfo: {
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
  classDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
  },
  classStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  statText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },
  classActions: {
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
  textArea: {
    height: 80,
    textAlignVertical: "top",
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

export default ClassManagement
