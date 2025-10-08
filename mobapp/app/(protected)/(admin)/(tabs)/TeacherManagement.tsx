import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Modal,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { apiService } from '@/services/api'

interface Teacher {
  id: string
  firstName: string
  lastName: string
  email: string
  teacherId?: string
  teachingClasses: Array<{
    id: string
    name: string
    code: string
  }>
  _count: {
    teachingClasses: number
  }
}

interface Class {
  id: string
  name: string
  code: string
  teacherId?: string
  teacher?: {
    firstName: string
    lastName: string
  } | null
}

export default function TeacherManagementScreen() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedClass, setSelectedClass] = useState<Class | null>(null)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [teachersResponse, classesResponse] = await Promise.all([
        apiService.getAllTeachers(),
        apiService.get('/classes') // Get all classes
      ])
      
      setTeachers(teachersResponse.data.teachers || [])
      setClasses(classesResponse.data || [])
    } catch (error: any) {
      console.error('Load data error:', error)
      const errorMessage = error.response?.data?.error || 'Failed to load data'
      Alert.alert('Error', errorMessage)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    loadData()
  }, [])

  const handleAssignClass = (classItem: Class) => {
    setSelectedClass(classItem)
    setModalVisible(true)
  }

  const assignTeacherToClass = async (teacher: Teacher) => {
    if (!selectedClass || assigning) return

    setAssigning(true)
    try {
      await apiService.assignTeacherToClass(selectedClass.id, teacher.id)
      
      Alert.alert(
        'Success!',
        `${selectedClass.name} has been assigned to ${teacher.firstName} ${teacher.lastName}`
      )
      
      // Refresh data
      await loadData()
      setModalVisible(false)
      setSelectedClass(null)
    } catch (error: any) {
      console.error('Assign teacher error:', error)
      const errorMessage = error.response?.data?.error || 'Failed to assign teacher'
      Alert.alert('Assignment Failed', errorMessage)
    } finally {
      setAssigning(false)
    }
  }

  const getUnassignedClasses = () => {
    return classes.filter(cls => !cls.teacherId)
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      />
      
      <SafeAreaView style={styles.headerContent}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Teacher Management</Text>
            <Text style={styles.subtitle}>
              {teachers.length} teachers • {getUnassignedClasses().length} unassigned classes
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <BlurView intensity={80} tint="light" style={styles.statBlur}>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{teachers.length}</Text>
                <Text style={styles.statLabel}>Teachers</Text>
              </View>
            </BlurView>
          </View>

          <View style={styles.statCard}>
            <BlurView intensity={80} tint="light" style={styles.statBlur}>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{classes.length}</Text>
                <Text style={styles.statLabel}>Total Classes</Text>
              </View>
            </BlurView>
          </View>

          <View style={styles.statCard}>
            <BlurView intensity={80} tint="light" style={styles.statBlur}>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{getUnassignedClasses().length}</Text>
                <Text style={styles.statLabel}>Unassigned</Text>
              </View>
            </BlurView>
          </View>
        </View>
      </SafeAreaView>
    </View>
  )

  const renderUnassignedClasses = () => {
    const unassignedClasses = getUnassignedClasses()
    
    if (unassignedClasses.length === 0) return null

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unassigned Classes</Text>
        {unassignedClasses.map((classItem) => (
          <View key={classItem.id} style={styles.classCard}>
            <View style={styles.classInfo}>
              <Text style={styles.className}>{classItem.name}</Text>
              <Text style={styles.classCode}>{classItem.code}</Text>
            </View>
            
            <TouchableOpacity
              style={styles.assignButton}
              onPress={() => handleAssignClass(classItem)}
              activeOpacity={0.8}
            >
              <Ionicons name="person-add-outline" size={16} color="#667eea" />
              <Text style={styles.assignButtonText}>Assign Teacher</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    )
  }

  const renderTeacher = ({ item }: { item: Teacher }) => (
    <View style={styles.teacherCard}>
      <View style={styles.teacherHeader}>
        <View style={styles.teacherInfo}>
          <Text style={styles.teacherName}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={styles.teacherEmail}>{item.email}</Text>
          {item.teacherId && (
            <Text style={styles.teacherIdText}>ID: {item.teacherId}</Text>
          )}
        </View>
        
        <View style={styles.teacherStats}>
          <Text style={styles.classCount}>{item._count.teachingClasses}</Text>
          <Text style={styles.classCountLabel}>Classes</Text>
        </View>
      </View>

      {item.teachingClasses.length > 0 && (
        <View style={styles.assignedClasses}>
          <Text style={styles.assignedTitle}>Assigned Classes:</Text>
          {item.teachingClasses.map((cls, index) => (
            <View key={cls.id} style={styles.assignedClass}>
              <Text style={styles.assignedClassName}>{cls.name}</Text>
              <Text style={styles.assignedClassCode}>{cls.code}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )

  const renderTeacherModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              Assign Teacher to "{selectedClass?.name}"
            </Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={teachers}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.teacherOption}
                onPress={() => assignTeacherToClass(item)}
                disabled={assigning}
                activeOpacity={0.7}
              >
                <View style={styles.teacherOptionInfo}>
                  <Text style={styles.teacherOptionName}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <Text style={styles.teacherOptionEmail}>{item.email}</Text>
                  <Text style={styles.teacherOptionClasses}>
                    Currently teaching {item._count.teachingClasses} classes
                  </Text>
                </View>
                
                {assigning ? (
                  <ActivityIndicator size="small" color="#667eea" />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                )}
              </TouchableOpacity>
            )}
            style={styles.teacherList}
          />
        </View>
      </View>
    </Modal>
  )

  if (loading) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading teacher data...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={teachers}
        renderItem={renderTeacher}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() => (
          <>
            {renderHeader()}
            {renderUnassignedClasses()}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Teachers</Text>
            </View>
          </>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#667eea']}
            progressBackgroundColor="#fff"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
      
      {renderTeacherModal()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    position: 'relative',
    paddingBottom: 20,
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  headerTop: {
    marginBottom: 24,
  },
  headerText: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
  },
  statBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  statContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 16,
  },
  classCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  classCode: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  assignButtonText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  teacherCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  teacherHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  teacherEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  teacherIdText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  teacherStats: {
    alignItems: 'center',
  },
  classCount: {
    fontSize: 24,
    fontWeight: '900',
    color: '#667eea',
  },
  classCountLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  assignedClasses: {
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  assignedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  assignedClass: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  assignedClassName: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  assignedClassCode: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  teacherList: {
    maxHeight: 400,
  },
  teacherOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  teacherOptionInfo: {
    flex: 1,
  },
  teacherOptionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  teacherOptionEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  teacherOptionClasses: {
    fontSize: 12,
    color: '#94a3b8',
  },
  listContainer: {
    paddingBottom: 20,
  },
  centerLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
})