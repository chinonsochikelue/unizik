import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { BlurView } from 'expo-blur'
import { apiService } from '@/services/api'
import { useBiometric } from '@/hooks/useBiometric'

const { width } = Dimensions.get('window')

interface ClassDetailsData {
  id: string
  name: string
  code: string
  description?: string
  teacher?: {
    id: string
    firstName: string
    lastName: string
    email: string
  } | null
  sessions: Array<{
    id: string
    code: string
    startTime: string
    endTime?: string
    isActive: boolean
  }>
  students: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
  }>
  _count?: {
    students: number
    sessions: number
  }
}

export default function ClassDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [classData, setClassData] = useState<ClassDetailsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const { authenticateWithBiometric } = useBiometric()

  useEffect(() => {
    if (id) {
      loadClassDetails()
    }
  }, [id])

  const loadClassDetails = async () => {
    if (!id) return

    setLoading(true)
    try {
      const response = await apiService.getClassDetails(id)
      const data = response.data.class || response.data
      setClassData(data)
      
      // Check if current user is enrolled by checking if their ID is in the students array
      // This would need the current user's ID from auth context
      // For now, we'll assume not enrolled
      setIsEnrolled(false)
    } catch (error: any) {
      console.error('Load class details error:', error)
      const errorMessage = error.response?.data?.error || 'Failed to load class details'
      Alert.alert('Error', errorMessage)
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleEnroll = async () => {
    if (!classData || enrolling) return

    Alert.alert(
      'Enroll in Class',
      `Do you want to enroll in "${classData.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enroll',
          onPress: async () => {
            setEnrolling(true)
            try {
              await apiService.enrollInClass({ classId: classData.id })
              
              Alert.alert(
                'Success!',
                `You have successfully enrolled in "${classData.name}".`,
                [
                  {
                    text: 'View My Classes',
                    onPress: () => {
                      router.back()
                      router.push('/(tabs)/my-classes')
                    }
                  },
                  { 
                    text: 'OK', 
                    onPress: () => {
                      setIsEnrolled(true)
                      loadClassDetails() // Refresh data
                    }
                  }
                ]
              )
            } catch (error: any) {
              console.error('Enrollment error:', error)
              const errorMessage = error.response?.data?.error || 'Failed to enroll in class'
              Alert.alert('Enrollment Failed', errorMessage)
            } finally {
              setEnrolling(false)
            }
          }
        }
      ]
    )
  }

  const handleJoinSession = async (sessionCode: string) => {
    try {
      const biometricToken = await authenticateWithBiometric()
      
      if (!biometricToken) {
        Alert.alert('Authentication Required', 'Biometric authentication is required to join sessions.')
        return
      }

      await apiService.joinSessionAndMarkAttendance(sessionCode, biometricToken)

      Alert.alert(
        'Success!',
        'You have successfully joined the session and your attendance has been marked.',
        [
          {
            text: 'View Attendance',
            onPress: () => router.push('/(tabs)/attendance')
          },
          { text: 'OK', style: 'default' }
        ]
      )
    } catch (error: any) {
      console.error('Join session error:', error)
      const errorMessage = error.response?.data?.error || 'Failed to join session'
      Alert.alert('Join Session Failed', errorMessage)
    }
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.headerGradient}
      />
      
      <SafeAreaView style={styles.headerContent}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <BlurView intensity={80} tint="light" style={styles.backButtonBlur}>
              <Ionicons name="arrow-back" size={24} color="#667eea" />
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => router.push('/(protected)/(students)/join-class')}
            activeOpacity={0.7}
          >
            <BlurView intensity={80} tint="light" style={styles.backButtonBlur}>
              <Ionicons name="enter-outline" size={24} color="#667eea" />
            </BlurView>
          </TouchableOpacity>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.className}>{classData?.name}</Text>
          <Text style={styles.classCode}>{classData?.code}</Text>
          
          <View style={styles.teacherInfo}>
            <Ionicons name="person-outline" size={18} color="rgba(255, 255, 255, 0.9)" />
            <Text style={styles.teacherName}>
              {classData?.teacher ? 
                `${classData.teacher.firstName} ${classData.teacher.lastName}` : 
                'No instructor assigned'
              }
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  )

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <BlurView intensity={95} tint="light" style={styles.statsBlur}>
        <View style={styles.statsContent}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{classData?.students?.length || 0}</Text>
            <Text style={styles.statLabel}>Students</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {classData?.sessions?.filter(s => s.isActive).length || 0}
            </Text>
            <Text style={styles.statLabel}>Active Sessions</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{classData?.sessions?.length || 0}</Text>
            <Text style={styles.statLabel}>Total Sessions</Text>
          </View>
        </View>
      </BlurView>
    </View>
  )

  const renderDescription = () => {
    if (!classData?.description) return null

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About This Class</Text>
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{classData.description}</Text>
        </View>
      </View>
    )
  }

  const renderTeacherDetails = () => {
    if (!classData?.teacher) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Instructor</Text>
          <View style={styles.teacherCard}>
            <View style={styles.teacherAvatar}>
              <Ionicons name="person" size={32} color="#94a3b8" />
            </View>
            <View style={styles.teacherDetails}>
              <Text style={styles.teacherCardName}>No instructor assigned</Text>
              <Text style={styles.teacherCardEmail}>-</Text>
            </View>
          </View>
        </View>
      )
    }
    
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Instructor</Text>
        <View style={styles.teacherCard}>
          <View style={styles.teacherAvatar}>
            <Ionicons name="person" size={32} color="#667eea" />
          </View>
          <View style={styles.teacherDetails}>
            <Text style={styles.teacherCardName}>
              {classData.teacher.firstName} {classData.teacher.lastName}
            </Text>
            <Text style={styles.teacherCardEmail}>{classData.teacher.email}</Text>
          </View>
        </View>
      </View>
    )
  }

  const renderActiveSessions = () => {
    const activeSessions = classData?.sessions?.filter(s => s.isActive) || []
    
    if (activeSessions.length === 0) return null

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Active Sessions</Text>
        {activeSessions.map((session, index) => (
          <View key={session.id} style={styles.sessionCard}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.sessionGradient}
            />
            <View style={styles.sessionContent}>
              <View style={styles.sessionInfo}>
                <View style={styles.sessionHeader}>
                  <View style={styles.sessionStatus}>
                    <View style={styles.liveDot} />
                    <Text style={styles.liveText}>Live Session</Text>
                  </View>
                  <Text style={styles.sessionCode}>{session.code}</Text>
                </View>
                
                <Text style={styles.sessionTime}>
                  Started: {new Date(session.startTime).toLocaleTimeString()}
                </Text>
              </View>
              
              {isEnrolled && (
                <TouchableOpacity
                  style={styles.joinSessionButton}
                  onPress={() => handleJoinSession(session.code)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="radio-outline" size={18} color="#10b981" />
                  <Text style={styles.joinSessionText}>Join</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}
      </View>
    )
  }

  const renderActionButton = () => {
    if (isEnrolled) return null

    return (
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.enrollButton}
          onPress={handleEnroll}
          disabled={enrolling}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.enrollGradient}
          >
            {enrolling ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <Text style={styles.enrollButtonText}>Enroll in Class</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    )
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading class details...</Text>
        </View>
      </View>
    )
  }

  if (!classData) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={80} color="#ef4444" />
          <Text style={styles.errorText}>Class not found</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadClassDetails}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {renderHeader()}
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {renderStats()}
        {renderDescription()}
        {renderTeacherDetails()}
        {renderActiveSessions()}
        {renderActionButton()}
      </ScrollView>
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
    paddingBottom: 40,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButton: {
    // Button styles
  },
  headerActionButton: {
    // Button styles
  },
  backButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  headerInfo: {
    alignItems: 'center',
  },
  className: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  classCode: {
    fontSize: 16,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  teacherName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  statsContainer: {
    marginHorizontal: 16,
    marginTop: -20,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  statsBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  statsContent: {
    flexDirection: 'row',
    paddingVertical: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '900',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 16,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 16,
  },
  descriptionContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  description: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
    fontWeight: '500',
  },
  teacherCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    gap: 16,
  },
  teacherAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  teacherDetails: {
    flex: 1,
  },
  teacherCardName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  teacherCardEmail: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  sessionCard: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  sessionGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
  },
  sessionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingLeft: 20,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  sessionCode: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sessionTime: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  joinSessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  joinSessionText: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '700',
  },
  actionContainer: {
    marginHorizontal: 16,
    marginTop: 8,
  },
  enrollButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  enrollGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  enrollButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  loadingContainer: {
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
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ef4444',
    marginTop: 24,
    marginBottom: 32,
  },
  retryButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
})