import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Share,
  Platform,
  Alert,
  Modal,
  TextInput
} from 'react-native'
import { Ionicons, MaterialIcons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { BlurView } from 'expo-blur'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import { apiService } from '@/services/api'
import { useToast } from '@/context/ToastContext'

interface AttendanceData {
  student: {
    id: string
    name: string
    studentId: string
    email: string
  }
  totalSessions: number
  presentSessions: number
  lateSessions: number
  absentSessions: number
  attendanceRate: number
  sessions: Array<{
    id: string
    date: string
    status: 'PRESENT' | 'LATE' | 'ABSENT'
    title: string
  }>
}

interface ClassInfo {
  id: string
  name: string
  code: string
  description: string
}

interface ReportSummary {
  totalStudents: number
  totalSessions: number
  averageAttendanceRate: number
  highestAttendance: number
  lowestAttendance: number
  studentsAbove80Percent: number
  studentsBelow60Percent: number
}

export default function AttendanceReportScreen() {
  const { classId } = useLocalSearchParams<{ classId: string }>()
  const insets = useSafeAreaInsets()
  const toast = useToast()

  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null)
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([])
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) // 30 days ago
  const [endDate, setEndDate] = useState(new Date())
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [showDateRangeModal, setShowDateRangeModal] = useState(false)

  useEffect(() => {
    if (classId) {
      loadReportData()
    }
  }, [classId, startDate, endDate])

  const loadReportData = async () => {
    try {
      // Try to load class details first
      const classResponse = await apiService.getClassDetails(classId)
      setClassInfo(classResponse.data)

      // Try to load attendance report
      try {
        const reportResponse = await apiService.getClassAttendanceReport(classId, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })

        setAttendanceData(reportResponse.data.attendanceData || reportResponse.data || [])
        setReportSummary(reportResponse.data.summary || {
          totalStudents: 0,
          totalSessions: 0,
          averageAttendanceRate: 0,
          highestAttendance: 0,
          lowestAttendance: 0,
          studentsAbove80Percent: 0,
          studentsBelow60Percent: 0
        })
      } catch (reportError) {
        console.log('Attendance report endpoint not available:', reportError.response?.status)
        
        // For now, show a message that this feature needs backend implementation
        if (reportError.response?.status === 404) {
          toast.showWarning('Attendance reports are not yet implemented on the server. This feature is coming soon!')
        }
        
        // Set mock data for UI development/testing
        const mockAttendanceData = [
          {
            student: {
              id: 'mock-1',
              name: 'John Doe',
              studentId: 'UNN/SCI/20/001',
              email: 'john.doe@student.unizik.edu.ng'
            },
            totalSessions: 10,
            presentSessions: 8,
            lateSessions: 1,
            absentSessions: 1,
            attendanceRate: 85,
            sessions: [
              { id: 'session-1', date: '2024-01-15', status: 'PRESENT', title: 'Introduction to React' },
              { id: 'session-2', date: '2024-01-22', status: 'PRESENT', title: 'State Management' },
              { id: 'session-3', date: '2024-01-29', status: 'LATE', title: 'Components' }
            ]
          },
          {
            student: {
              id: 'mock-2',
              name: 'Jane Smith',
              studentId: 'UNN/SCI/20/002',
              email: 'jane.smith@student.unizik.edu.ng'
            },
            totalSessions: 10,
            presentSessions: 9,
            lateSessions: 0,
            absentSessions: 1,
            attendanceRate: 92,
            sessions: [
              { id: 'session-1', date: '2024-01-15', status: 'PRESENT', title: 'Introduction to React' },
              { id: 'session-2', date: '2024-01-22', status: 'PRESENT', title: 'State Management' },
              { id: 'session-3', date: '2024-01-29', status: 'PRESENT', title: 'Components' }
            ]
          },
          {
            student: {
              id: 'mock-3',
              name: 'Bob Johnson',
              studentId: 'UNN/SCI/20/003',
              email: 'bob.johnson@student.unizik.edu.ng'
            },
            totalSessions: 10,
            presentSessions: 4,
            lateSessions: 1,
            absentSessions: 5,
            attendanceRate: 45,
            sessions: [
              { id: 'session-1', date: '2024-01-15', status: 'ABSENT', title: 'Introduction to React' },
              { id: 'session-2', date: '2024-01-22', status: 'PRESENT', title: 'State Management' },
              { id: 'session-3', date: '2024-01-29', status: 'LATE', title: 'Components' }
            ]
          }
        ]
        
        setAttendanceData(mockAttendanceData)
        setReportSummary({
          totalStudents: mockAttendanceData.length,
          totalSessions: 10,
          averageAttendanceRate: 74,
          highestAttendance: 92,
          lowestAttendance: 45,
          studentsAbove80Percent: 2,
          studentsBelow60Percent: 1
        })
      }
    } catch (error) {
      console.error('Error loading report data:', error)
      toast.showError('Failed to load class details')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    loadReportData()
  }, [classId, startDate, endDate])

  const handleExportReport = async (format: 'csv' | 'pdf') => {
    setExporting(true)
    try {
      if (format === 'csv') {
        const csvData = generateCSV(attendanceData)
        
        if (Platform.OS === 'web') {
          downloadFile(csvData, `${classInfo?.code}_attendance_report.csv`, 'text/csv')
        } else {
          await Share.share({
            message: csvData,
            title: `${classInfo?.name} Attendance Report`
          })
        }
      } else {
        // For PDF, we would need to call the backend export endpoint
        const response = await apiService.exportAttendanceReport(classId, format, {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        })

        if (Platform.OS === 'web') {
          const blob = new Blob([response.data], { type: 'application/pdf' })
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `${classInfo?.code}_attendance_report.pdf`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        }
      }
      
      toast.showSuccess('Report exported successfully')
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.showError('Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  const generateCSV = (data: AttendanceData[]) => {
    const headers = [
      'Student Name',
      'Student ID', 
      'Email',
      'Total Sessions',
      'Present',
      'Late',
      'Absent',
      'Attendance Rate (%)'
    ]
    
    const csvRows = [headers.join(',')]
    
    data.forEach(student => {
      const row = [
        `"${student.student.name}"`,
        student.student.studentId,
        student.student.email,
        student.totalSessions.toString(),
        student.presentSessions.toString(),
        student.lateSessions.toString(),
        student.absentSessions.toString(),
        student.attendanceRate.toFixed(1)
      ]
      csvRows.push(row.join(','))
    })
    
    return csvRows.join('\n')
  }

  const downloadFile = (data: string, filename: string, type: string) => {
    const blob = new Blob([data], { type })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return '#10b981'
    if (rate >= 60) return '#f59e0b'
    return '#ef4444'
  }

  const getAttendanceLabel = (rate: number) => {
    if (rate >= 80) return 'Excellent'
    if (rate >= 60) return 'Good'
    return 'Poor'
  }

  const renderSummaryCard = () => {
    if (!reportSummary) return null

    return (
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Report Summary</Text>
        
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{reportSummary.totalStudents}</Text>
            <Text style={styles.summaryLabel}>Total Students</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{reportSummary.totalSessions}</Text>
            <Text style={styles.summaryLabel}>Total Sessions</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: getAttendanceColor(reportSummary.averageAttendanceRate) }]}>
              {reportSummary.averageAttendanceRate.toFixed(1)}%
            </Text>
            <Text style={styles.summaryLabel}>Average Attendance</Text>
          </View>
          
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#10b981' }]}>
              {reportSummary.studentsAbove80Percent}
            </Text>
            <Text style={styles.summaryLabel}>Above 80%</Text>
          </View>
        </View>
      </View>
    )
  }

  const renderStudentReport = ({ item }: { item: AttendanceData }) => (
    <View style={styles.studentCard}>
      <View style={styles.studentHeader}>
        <View style={styles.studentInfo}>
          <Text style={styles.studentName}>{item.student.name}</Text>
          <Text style={styles.studentId}>ID: {item.student.studentId}</Text>
        </View>
        
        <View style={styles.attendanceStats}>
          <Text style={[styles.attendanceRate, { color: getAttendanceColor(item.attendanceRate) }]}>
            {item.attendanceRate.toFixed(1)}%
          </Text>
          <Text style={[styles.attendanceLabel, { color: getAttendanceColor(item.attendanceRate) }]}>
            {getAttendanceLabel(item.attendanceRate)}
          </Text>
        </View>
      </View>
      
      <View style={styles.sessionStats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.totalSessions}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>{item.presentSessions}</Text>
          <Text style={styles.statLabel}>Present</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>{item.lateSessions}</Text>
          <Text style={styles.statLabel}>Late</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#ef4444' }]}>{item.absentSessions}</Text>
          <Text style={styles.statLabel}>Absent</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.viewDetailsButton}
        onPress={() => router.push(`/student-attendance-details/${item.student.id}?classId=${classId}`)}
      >
        <Text style={styles.viewDetailsText}>View Details</Text>
        <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
      </TouchableOpacity>
    </View>
  )

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={['#6366f1', '#4338ca']}
        style={styles.headerGradient}
      >
        <View style={[styles.headerContent, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Attendance Report</Text>
            
            <TouchableOpacity 
              onPress={() => setShowDateRangeModal(true)} 
              style={styles.dateButton}
            >
              <Ionicons name="calendar-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {classInfo && (
            <View style={styles.classInfo}>
              <Text style={styles.className}>{classInfo.name}</Text>
              <Text style={styles.dateRange}>
                {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
      
      <View style={styles.exportSection}>
        <TouchableOpacity 
          style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
          onPress={() => handleExportReport('csv')}
          disabled={exporting}
        >
          <Ionicons name="download-outline" size={20} color="white" />
          <Text style={styles.exportText}>Export CSV</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
          onPress={() => handleExportReport('pdf')}
          disabled={exporting}
        >
          <Ionicons name="document-text-outline" size={20} color="white" />
          <Text style={styles.exportText}>Export PDF</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Generating report...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderSummaryCard()}
        
        <View style={styles.studentsSection}>
          <Text style={styles.sectionTitle}>Student Attendance Details</Text>
          
          {attendanceData.map((student, index) => (
            <View key={student.student.id}>
              {renderStudentReport({ item: student })}
            </View>
          ))}
          
          {attendanceData.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="analytics-outline" size={48} color="#94a3b8" />
              <Text style={styles.emptyText}>No attendance data found</Text>
              <Text style={styles.emptySubtext}>
                Try adjusting your date range or check if sessions have been conducted
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Date Range Modal */}
      <Modal
        visible={showDateRangeModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateRangeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={80} style={styles.modalBlur}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Date Range</Text>
              
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>Start Date</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.dateText}>{startDate.toLocaleDateString()}</Text>
                  <Ionicons name="calendar-outline" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.dateInputContainer}>
                <Text style={styles.dateLabel}>End Date</Text>
                <TouchableOpacity 
                  style={styles.dateInput}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={styles.dateText}>{endDate.toLocaleDateString()}</Text>
                  <Ionicons name="calendar-outline" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => setShowDateRangeModal(false)}
                >
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.confirmButton}
                  onPress={() => {
                    setShowDateRangeModal(false)
                    loadReportData()
                  }}
                >
                  <Text style={styles.confirmText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>

      {/* Date Pickers */}
      {showStartDatePicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartDatePicker(false)
            if (selectedDate) {
              setStartDate(selectedDate)
            }
          }}
          maximumDate={endDate}
        />
      )}
      
      {showEndDatePicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndDatePicker(false)
            if (selectedDate) {
              setEndDate(selectedDate)
            }
          }}
          minimumDate={startDate}
          maximumDate={new Date()}
        />
      )}
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
  header: {
    marginBottom: 20,
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
  dateButton: {
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
  dateRange: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  exportSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  exportButtonDisabled: {
    opacity: 0.5,
  },
  exportText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  summaryCard: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  studentsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  studentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  },
  attendanceStats: {
    alignItems: 'flex-end',
  },
  attendanceRate: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  attendanceLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
  },
  viewDetailsText: {
    color: '#3b82f6',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
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
  dateInputContainer: {
    marginBottom: 16,
  },
  dateLabel: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
  },
  dateText: {
    fontSize: 16,
    color: '#1e293b',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 20,
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
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});