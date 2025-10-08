import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { router } from 'expo-router'
import { apiService } from '@/services/api'
import { useBiometric } from '@/hooks/useBiometric'

interface ClassCardProps {
  classData: {
    id: string
    name: string
    code?: string
    description?: string
    teacher?: {
      id: string
      firstName: string
      lastName: string
      email: string
    } | null
    _count?: {
      students: number
      sessions: number
    }
    activeSession?: {
      id: string
      code: string
      startTime: string
      isActive: boolean
    }
  }
  isEnrolled?: boolean
  onEnrollSuccess?: () => void
  onJoinSuccess?: () => void
  showJoinButton?: boolean
}

export function ClassCard({ 
  classData, 
  isEnrolled = false, 
  onEnrollSuccess,
  onJoinSuccess,
  showJoinButton = false 
}: ClassCardProps) {
  const [enrolling, setEnrolling] = useState(false)
  const [joining, setJoining] = useState(false)
  const { authenticateWithBiometric } = useBiometric()

  const handleEnroll = async () => {
    if (enrolling) return

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
                    onPress: () => router.push('/(tabs)/my-classes')
                  },
                  { text: 'OK', style: 'default' }
                ]
              )
              
              onEnrollSuccess?.()
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

  const handleJoinSession = async () => {
    if (!classData.activeSession || joining) return

    setJoining(true)
    try {
      // Require biometric authentication for session joining
      const biometricToken = await authenticateWithBiometric()
      
      if (!biometricToken) {
        Alert.alert('Authentication Required', 'Biometric authentication is required to join sessions.')
        return
      }

      await apiService.joinSessionAndMarkAttendance(
        classData.activeSession.code,
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
      
      onJoinSuccess?.()
    } catch (error: any) {
      console.error('Join session error:', error)
      const errorMessage = error.response?.data?.error || 'Failed to join session'
      Alert.alert('Join Session Failed', errorMessage)
    } finally {
      setJoining(false)
    }
  }

  const handleViewDetails = () => {
    router.push(`/class-details/${classData.id}`)
  }

  const getGradientColors = () => {
    if (isEnrolled) {
      return classData.activeSession 
        ? ['#10b981', '#059669'] // Green for active session
        : ['#6366f1', '#4f46e5'] // Purple for enrolled
    }
    return ['#667eea', '#764ba2'] // Blue for available
  }

  const renderActionButton = () => {
    if (isEnrolled && classData.activeSession && showJoinButton) {
      return (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleJoinSession}
          disabled={joining}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.buttonGradient}
          >
            {joining ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="radio-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>Join Session</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )
    }

    if (!isEnrolled) {
      return (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleEnroll}
          disabled={enrolling}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.buttonGradient}
          >
            {enrolling ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#fff" />
                <Text style={styles.buttonText}>Enroll</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      )
    }

    return null
  }

  const getStatusIndicator = () => {
    if (isEnrolled && classData.activeSession) {
      return (
        <View style={[styles.statusBadge, styles.activeBadge]}>
          <View style={styles.pulsingDot} />
          <Text style={styles.statusText}>Live Session</Text>
        </View>
      )
    }
    
    if (isEnrolled) {
      return (
        <View style={[styles.statusBadge, styles.enrolledBadge]}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={[styles.statusText, { color: '#10b981' }]}>Enrolled</Text>
        </View>
      )
    }

    return null
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleViewDetails}
      activeOpacity={0.9}
    >
      <BlurView intensity={95} tint="light" style={styles.cardBlur}>
        <LinearGradient
          colors={[...getGradientColors(), 'transparent']}
          style={styles.cardGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        
        <View style={styles.cardContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.classInfo}>
              <Text style={styles.className} numberOfLines={2}>
                {classData.name}
              </Text>
              {classData.code && (
                <Text style={styles.classCode}>{classData.code}</Text>
              )}
            </View>
            
            {getStatusIndicator()}
          </View>

          {/* Teacher Info */}
          <View style={styles.teacherSection}>
            <Ionicons name="person-outline" size={18} color="#64748b" />
            <Text style={styles.teacherName}>
              {classData.teacher ? 
                `${classData.teacher.firstName} ${classData.teacher.lastName}` : 
                'No instructor assigned'
              }
            </Text>
          </View>

          {/* Description */}
          {classData.description && (
            <Text style={styles.description} numberOfLines={2}>
              {classData.description}
            </Text>
          )}

          {/* Stats */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={16} color="#64748b" />
              <Text style={styles.statText}>
                {classData._count?.students || 0} students
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={16} color="#64748b" />
              <Text style={styles.statText}>
                {classData._count?.sessions || 0} sessions
              </Text>
            </View>
          </View>

          {/* Action Button */}
          {renderActionButton()}
        </View>
      </BlurView>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  cardBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  cardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    opacity: 0.1,
  },
  cardContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  classInfo: {
    flex: 1,
    marginRight: 12,
  },
  className: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 4,
  },
  classCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#667eea',
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  activeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  enrolledBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  teacherSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
})