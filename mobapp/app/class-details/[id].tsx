import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { BlurView } from 'expo-blur'
import { apiService } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useBiometric } from '@/context/BiometricContext'

interface ClassDetails {
  id: string
  name: string
  description?: string
  teacher: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  students: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
  }>
  sessions: Array<{
    id: string
    code: string
    startTime: string
    endTime?: string
    isActive: boolean
  }>
}

export default function ClassDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { user } = useAuth()
  const { generateBiometricToken } = useBiometric()
  
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [isEnrolled, setIsEnrolled] = useState(false)

  useEffect(() => {
    if (id) {
      loadClassDetails()
    }
  }, [id])

  const loadClassDetails = async () => {
    if (!id) return

    try {
      setLoading(true)
      const response = await apiService.getClassDetails(id)
      const details = response.data.class
      setClassDetails(details)
      
      // Check if user is enrolled
      const userIsEnrolled = details.students?.some(
        (student: any) => student.id === user?.id
      ) || false
      setIsEnrolled(userIsEnrolled)
    } catch (error: any) {
      console.error('Load class details error:', error)
      Alert.alert('Error', 'Failed to load class details. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadClassDetails()
  }

  const handleEnroll = async () => {
    if (!classDetails || !user || actionLoading) return

    Alert.alert(
      'Enroll in Class',
      `Do you want to enroll in ${classDetails.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enroll',
          onPress: async () => {
            setActionLoading(true)
            try {
              await apiService.enrollInClass({ classId: classDetails.id })
              
              Alert.alert(
                'Success!',
                `You have successfully enrolled in ${classDetails.name}`,
                [{ text: 'OK', onPress: () => loadClassDetails() }]
              )
            } catch (error: any) {
              console.error('Enroll error:', error)
              const errorMessage = error.response?.data?.error || 'Failed to enroll in class'
              Alert.alert('Enrollment Failed', errorMessage)
            } finally {
              setActionLoading(false)
            }
          }
        }
      ]
    )
  }

  const handleJoinActiveSession = async () => {
    if (!classDetails || !user || actionLoading) return

    const activeSession = classDetails.sessions.find(s => s.isActive)
    if (!activeSession) return

    setActionLoading(true)

    try {
      // Generate biometric token
      const biometricToken = await generateBiometricToken()
      
      if (!biometricToken) {
        Alert.alert('Authentication Required', 'Biometric authentication is required to join sessions.')
        return
      }

      const response = await apiService.joinSessionAndMarkAttendance(
        activeSession.code,
        biometricToken
      )

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

      // Refresh class details
      loadClassDetails()
    } catch (error: any) {
      console.error('Join session error:', error)
      const errorMessage = error.response?.data?.error || 'Failed to join session'
      Alert.alert('Join Session Failed', errorMessage)
    } finally {
      setActionLoading(false)
    }
  }

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>Class Details</Text>
        <Text style={styles.headerSubtitle}>
          {classDetails ? classDetails.name : 'Loading...'}
        </Text>
      </View>
    </View>
  )

  const renderClassInfo = () => {
    if (!classDetails) return null

    const activeSession = classDetails.sessions.find(s => s.isActive)

    return (
      <View style={styles.infoCard}>
        <BlurView intensity={80} tint="light" style={styles.cardBlur}>
          <View style={styles.cardContent}>
            {/* Class Name */}
            <Text style={styles.className}>{classDetails.name}</Text>

            {/* Teacher Info */}
            <View style={styles.teacherContainer}>
              <Ionicons name="person-outline" size={20} color="#667eea" />
              <Text style={styles.teacherText}>
                {classDetails.teacher.firstName} {classDetails.teacher.lastName}
              </Text>
            </View>

            {/* Description */}
            {classDetails.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.descriptionText}>
                  {classDetails.description}
                </Text>
              </View>
            )}

            {/* Stats */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={24} color="#10b981" />
                <Text style={styles.statNumber}>{classDetails.students.length}</Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
              
              <View style={styles.statDivider} />
              
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={24} color="#667eea" />
                <Text style={styles.statNumber}>{classDetails.sessions.length}</Text>
                <Text style={styles.statLabel}>Sessions</Text>
              </View>
            </View>

            {/* Active Session Banner */}
            {activeSession && (
              <View style={styles.activeSessionBanner}>
                <LinearGradient
                  colors={['#10b981', '#059669']}
                  style={styles.sessionBannerGradient}
                >
                  <View style={styles.sessionInfo}>
                    <Ionicons name="radio-outline" size={20} color="#fff" />
                    <View>
                      <Text style={styles.sessionTitle}>Live Session Active</Text>
                      <Text style={styles.sessionCode}>Code: {activeSession.code}</Text>
                    </View>
                  </View>
                  
                  {isEnrolled && (
                    <TouchableOpacity
                      style={styles.joinSessionButton}
                      onPress={handleJoinActiveSession}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.joinSessionText}>Join Now</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </LinearGradient>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {!isEnrolled ? (
                <TouchableOpacity
                  style={styles.enrollButton}
                  onPress={handleEnroll}
                  disabled={actionLoading}
                >
                  <LinearGradient
                    colors={['#667eea', '#764ba2']}
                    style={styles.buttonGradient}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="add-circle-outline" size={24} color="#fff" />
                        <Text style={styles.buttonText}>Enroll in Class</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              ) : (
                <View style={styles.enrolledContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  <Text style={styles.enrolledText}>You are enrolled in this class</Text>
                </View>
              )}
            </View>
          </View>
        </BlurView>
      </View>
    )
  }

  const renderRecentSessions = () => {
    if (!classDetails || classDetails.sessions.length === 0) return null

    const recentSessions = classDetails.sessions
      .slice(0, 5)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

    return (
      <View style={styles.sessionsCard}>
        <Text style={styles.sectionsTitle}>Recent Sessions</Text>
        
        {recentSessions.map((session, index) => (
          <View key={session.id} style={styles.sessionItem}>
            <View style={styles.sessionLeft}>
              <View style={[
                styles.sessionStatus,
                { backgroundColor: session.isActive ? '#10b981' : '#94a3b8' }
              ]} />
              <View>
                <Text style={styles.sessionCodeText}>#{session.code}</Text>
                <Text style={styles.sessionTimeText}>
                  {new Date(session.startTime).toLocaleDateString()} at{' '}
                  {new Date(session.startTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            </View>
            
            <Text style={[
              styles.sessionStatusText,
              { color: session.isActive ? '#10b981' : '#64748b' }
            ]}>
              {session.isActive ? 'Active' : 'Ended'}
            </Text>
          </View>
        ))}
      </View>
    )
  }

  if (loading && !classDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient
          colors={['#667eea', '#764ba2', '#f093fb']}
          style={styles.backgroundGradient}
        />
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Loading class details...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.backgroundGradient}
      />

      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
      >
        {renderClassInfo()}
        {renderRecentSessions()}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 20,
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  infoCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    marginBottom: 20,
  },
  cardBlur: {
    flex: 1,
  },
  cardContent: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  className: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 16,
  },
  teacherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  teacherText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '600',
  },
  descriptionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginTop: 8,
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
    marginHorizontal: 20,
  },
  activeSessionBanner: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  sessionBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  sessionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  sessionCode: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  joinSessionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinSessionText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
  },
  actionButtons: {
    gap: 12,
  },
  enrollButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  enrolledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#dcfce7',
    borderRadius: 16,
    gap: 8,
  },
  enrolledText: {
    fontSize: 16,
    color: '#16a34a',
    fontWeight: '700',
  },
  sessionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  sectionsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 16,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  sessionStatus: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sessionCodeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  sessionTimeText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  sessionStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
})