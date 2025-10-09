import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Share,
  Platform
} from 'react-native'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { apiService } from '@/services/api'
import { useToast } from '@/context/ToastContext'

interface Student {
  id: string
  name: string
  email: string
  studentId: string
  profileImage?: string
  enrolledAt: string
  status: 'ACTIVE' | 'INACTIVE' | 'DROPPED'
  attendanceRate?: number
  lastAttended?: string
  totalSessions?: number
  presentSessions?: number
}

interface ClassInfo {
  id: string
  name: string
  code: string
  description: string
  studentCount: number
}

export default function ClassRosterScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>()
  const insets = useSafeAreaInsets()
  const toast = useToast()

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [showFilterModal, setShowFilterModal] = useState(false)
  const [addStudentEmail, setAddStudentEmail] = useState('')
  const [addingStudent, setAddingStudent] = useState(false)

  useEffect(() => {
    if (classId) {
      loadRosterData()
    }
  }, [classId])

  const loadRosterData = async () => {
    try {
      // Try to load class details first
      const classResponse = await apiService.getClassDetails(classId)
      setClassInfo(classResponse.data)

      // Try different endpoints for roster data
      let studentsData = []
      
      // First, try the specific roster endpoint
      try {
        const rosterResponse = await apiService.getClassRoster(classId)
        studentsData = rosterResponse.data.students || rosterResponse.data || []
      } catch (rosterError) {
        console.log('Roster endpoint not available, trying alternative...', rosterError.response?.status)
        
        // Fallback: try getting students from class details or other endpoints
        if (classResponse.data.students) {
          studentsData = classResponse.data.students
        } else {
          // If no students data available, create a mock structure for development
          console.log('No roster data available - using empty structure')
          
          // For development/demo purposes, add some mock students if none exist
          studentsData = [
            {
              id: 'mock-1',
              name: 'John Doe',
              email: 'john.doe@student.unizik.edu.ng',
              studentId: 'UNN/SCI/20/001',
              status: 'ACTIVE',
              enrolledAt: new Date().toISOString(),
              attendanceRate: 85,
              totalSessions: 10,
              presentSessions: 8
            },
            {
              id: 'mock-2',
              name: 'Jane Smith',
              email: 'jane.smith@student.unizik.edu.ng',
              studentId: 'UNN/SCI/20/002',
              status: 'ACTIVE',
              enrolledAt: new Date().toISOString(),
              attendanceRate: 92,
              totalSessions: 10,
              presentSessions: 9
            },
            {
              id: 'mock-3',
              name: 'Bob Johnson',
              email: 'bob.johnson@student.unizik.edu.ng',
              studentId: 'UNN/SCI/20/003',
              status: 'INACTIVE',
              enrolledAt: new Date().toISOString(),
              attendanceRate: 45,
              totalSessions: 10,
              presentSessions: 4
            }
          ]
          
          toast.showInfo('Using demo data - roster endpoints need to be implemented on the server')
        }
      }

      // Ensure students have the expected structure
      const processedStudents = studentsData.map(student => ({
        id: student.id || student.userId || Math.random().toString(),
        name: student.name || student.firstName || 'Unknown Student',
        email: student.email || 'no-email@example.com',
        studentId: student.studentId || student.id || 'N/A',
        profileImage: student.profileImage || student.avatar,
        enrolledAt: student.enrolledAt || student.createdAt || new Date().toISOString(),
        status: student.status || 'ACTIVE',
        attendanceRate: student.attendanceRate || 0,
        lastAttended: student.lastAttended,
        totalSessions: student.totalSessions || 0,
        presentSessions: student.presentSessions || 0
      }))

      setStudents(processedStudents)
    } catch (error) {
      console.error('Error loading roster data:', error)
      toast.showError('Failed to load class details')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadRosterData()
  }, [classId])

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.studentId.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = selectedFilter === 'ALL' || student.status === selectedFilter
    
    return matchesSearch && matchesFilter
  })

  const handleAddStudent = async () => {
    if (!addStudentEmail.trim()) {
      toast.showWarning('Please enter a student email')
      return
    }

    setAddingStudent(true)
    try {
      // First, search for the student by email
      const searchResponse = await apiService.getAvailableStudents(classId, addStudentEmail)
      const availableStudents = searchResponse.data.students || searchResponse.data || []
      
      const student = availableStudents.find(s => s.email.toLowerCase() === addStudentEmail.toLowerCase())
      
      if (!student) {
        toast.showError('Student not found or already enrolled')
        return
      }

      await apiService.addStudentToClass(classId, student.id)
      toast.showSuccess(`${student.name} added to class`)
      
      setAddStudentEmail('')
      setShowAddStudentModal(false)
      loadRosterData()
    } catch (error) {
      console.error('Error adding student:', error)
      
      if (error.response?.status === 404) {
        toast.showError('Student management feature is not yet implemented on the server')
      } else {
        toast.showError('Failed to add student to class')
      }
    } finally {
      setAddingStudent(false)
    }
  }

  const handleRemoveStudent = (student: Student) => {
    Alert.alert(
      'Remove Student',
      `Are you sure you want to remove ${student.name} from this class?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.removeStudentFromClass(classId, student.id)
              toast.showSuccess(`${student.name} removed from class`)
              loadRosterData()
            } catch (error) {
              console.error('Error removing student:', error)
              
              if (error.response?.status === 404) {
                toast.showError('Student removal feature is not yet implemented on the server')
              } else {
                toast.showError('Failed to remove student')
              }
            }
          }
        }
      ]
    )
  }

  const handleUpdateStudentStatus = async (student: Student, newStatus: 'ACTIVE' | 'INACTIVE') => {
    try {
      await apiService.updateStudentRosterStatus(classId, student.id, newStatus)
      toast.showSuccess(`Student status updated to ${newStatus.toLowerCase()}`)
      loadRosterData()
    } catch (error) {
      console.error('Error updating student status:', error)
      
      if (error.response?.status === 404) {
        toast.showError('Student status update feature is not yet implemented on the server')
      } else {
        toast.showError('Failed to update student status')
      }
    }
  }

  const handleExportRoster = async () => {
    try {
      const csvData = generateCSV(students)
      
      if (Platform.OS === 'web') {
        downloadCSV(csvData, `${classInfo?.code || 'class'}_roster.csv`)
      } else {
        await Share.share({
          message: csvData,
          title: `${classInfo?.name} Roster`
        })
      }
      
      toast.showSuccess('Roster exported successfully')
    } catch (error) {
      console.error('Error exporting roster:', error)
      toast.showError('Failed to export roster')
    }
  }

  const generateCSV = (studentData: Student[]) => {
    const headers = ['Name', 'Student ID', 'Email', 'Status', 'Enrolled Date', 'Attendance Rate']
    const csvRows = [headers.join(',')]
    
    studentData.forEach(student => {
      const row = [
        `"${student.name}"`,
        student.studentId,
        student.email,
        student.status,
        new Date(student.enrolledAt).toLocaleDateString(),
        `${student.attendanceRate || 0}%`
      ]
      csvRows.push(row.join(','))
    })
    
    return csvRows.join('\n')
  }

  const downloadCSV = (csvData: string, filename: string) => {
    const blob = new Blob([csvData], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#10b981'
      case 'INACTIVE': return '#f59e0b'
      case 'DROPPED': return '#ef4444'
      default: return '#64748b'
    }
  }

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return '#10b981'
    if (rate >= 60) return '#f59e0b'
    return '#ef4444'
  }

  const renderStudentItem = ({ item: student }: { item: Student }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <View style={styles.studentAvatar}>
          <Text style={styles.avatarText}>
            {student.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{student.name}</Text>
          <Text style={styles.studentId}>ID: {student.studentId}</Text>
          <Text style={styles.studentEmail}>{student.email}</Text>
        </View>
        
        <View style={styles.studentStats}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(student.status) }]}>
            <Text style={styles.statusText}>{student.status}</Text>
          </View>
          
          {student.attendanceRate !== undefined && (
            <View style={styles.attendanceRate}>
              <Text style={[styles.attendanceText, { color: getAttendanceColor(student.attendanceRate) }]}>
                {student.attendanceRate}%
              </Text>
              <Text style={styles.attendanceLabel}>Attendance</Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.studentActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => router.push(`/student-details/${student.id}?classId=${classId}`)}
        >
          <Ionicons name="eye-outline" size={20} color="#3b82f6" />
          <Text style={[styles.actionText, { color: '#3b82f6' }]}>View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleUpdateStudentStatus(
            student, 
            student.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
          )}
        >
          <Ionicons 
            name={student.status === 'ACTIVE' ? 'pause-outline' : 'play-outline'} 
            size={20} 
            color="#f59e0b" 
          />
          <Text style={[styles.actionText, { color: '#f59e0b' }]}>
            {student.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleRemoveStudent(student)}
        >
          <Ionicons name="trash-outline" size={20} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8']}
        style={styles.headerGradient}
      >
        <View style={[styles.headerContent, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Class Roster</Text>
            
            <TouchableOpacity onPress={handleExportRoster} style={styles.exportButton}>
              <Ionicons name="download-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {classInfo && (
            <View style={styles.classInfo}>
              <Text style={styles.className}>{classInfo.name}</Text>
              <Text style={styles.classCode}>{classInfo.code}</Text>
              <Text style={styles.studentCount}>{students.length} students enrolled</Text>
            </View>
          )}
        </View>
      </LinearGradient>
      
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search students..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#94a3b8"
          />
        </View>
        
        <TouchableOpacity 
          style={styles.filterButton} 
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="filter" size={20} color="#3b82f6" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddStudentModal(true)}
        >
          <Ionicons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading roster...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredStudents}
        renderItem={renderStudentItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Add Student Modal */}
      <Modal
        visible={showAddStudentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddStudentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} style={styles.modalBlur}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add Student</Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Enter student email"
                value={addStudentEmail}
                onChangeText={setAddStudentEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#94a3b8"
              />
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowAddStudentModal(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={handleAddStudent}
                  disabled={addingStudent}
                >
                  {addingStudent ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.confirmText}>Add Student</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowFilterModal(false)}
        >
          <View style={styles.filterModal}>
            <Text style={styles.filterTitle}>Filter Students</Text>
            
            {['ALL', 'ACTIVE', 'INACTIVE'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterOption,
                  selectedFilter === filter && styles.selectedFilterOption
                ]}
                onPress={() => {
                  setSelectedFilter(filter as any)
                  setShowFilterModal(false)
                }}
              >
                <Text style={[
                  styles.filterOptionText,
                  selectedFilter === filter && styles.selectedFilterText
                ]}>
                  {filter}
                </Text>
                {selectedFilter === filter && (
                  <Ionicons name="checkmark" size={20} color="#3b82f6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748b',
  },
  listContainer: {
    paddingBottom: 20,
  },
  header: {
    marginBottom: 16,
  },
  headerGradient: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  exportButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classInfo: {
    alignItems: 'center',
  },
  className: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  classCode: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
  },
  studentCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#1e293b',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  studentCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  studentAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#475569',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  studentId: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 12,
    color: '#94a3b8',
  },
  studentStats: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: 'white',
  },
  attendanceRate: {
    alignItems: 'center',
  },
  attendanceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  attendanceLabel: {
    fontSize: 10,
    color: '#94a3b8',
  },
  studentActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  actionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBlur: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1e293b',
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  filterModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
    textAlign: 'center',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedFilterOption: {
    backgroundColor: '#eff6ff',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#64748b',
  },
  selectedFilterText: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});