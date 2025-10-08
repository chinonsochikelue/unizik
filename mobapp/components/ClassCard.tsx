import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'

interface ClassCardProps {
  classItem: {
    id: string
    name: string
    description?: string
    teacher: {
      id: string
      firstName: string
      lastName: string
      email: string
    }
    _count?: {
      students: number
      sessions: number
    }
    activeSession?: {
      id: string
      code: string
      startTime: string
      isActive: boolean
    } | null
  }
  onPress?: () => void
  onEnroll?: () => void
  onJoinSession?: () => void
  isEnrolled?: boolean
  showEnrollButton?: boolean
  showJoinButton?: boolean
  loading?: boolean
}

export const ClassCard: React.FC<ClassCardProps> = ({
  classItem,
  onPress,
  onEnroll,
  onJoinSession,
  isEnrolled = false,
  showEnrollButton = false,
  showJoinButton = false,
  loading = false,
}) => {
  const handleEnroll = () => {
    if (loading) return
    
    Alert.alert(
      'Enroll in Class',
      `Do you want to enroll in ${classItem.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Enroll', onPress: onEnroll },
      ]
    )
  }

  const handleJoinSession = () => {
    if (loading || !classItem.activeSession) return
    
    Alert.alert(
      'Join Active Session',
      `Join the active session for ${classItem.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Join', onPress: onJoinSession },
      ]
    )
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={loading}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.8)']}
        style={styles.cardGradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.classInfo}>
            <Text style={styles.className} numberOfLines={2}>
              {classItem.name}
            </Text>
            <Text style={styles.teacherName}>
              {classItem.teacher.firstName} {classItem.teacher.lastName}
            </Text>
          </View>
          
          {isEnrolled && (
            <View style={styles.enrolledBadge}>
              <Ionicons name="checkmark-circle" size={20} color="#10b981" />
              <Text style={styles.enrolledText}>Enrolled</Text>
            </View>
          )}
        </View>

        {/* Description */}
        {classItem.description && (
          <Text style={styles.description} numberOfLines={3}>
            {classItem.description}
          </Text>
        )}

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Ionicons name="people-outline" size={16} color="#64748b" />
            <Text style={styles.statText}>
              {classItem._count?.students || 0} students
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={16} color="#64748b" />
            <Text style={styles.statText}>
              {classItem._count?.sessions || 0} sessions
            </Text>
          </View>
        </View>

        {/* Active Session Banner */}
        {classItem.activeSession && (
          <View style={styles.activeSessionBanner}>
            <LinearGradient
              colors={['#10b981', '#059669']}
              style={styles.sessionGradient}
            >
              <Ionicons name="radio-outline" size={16} color="#fff" />
              <Text style={styles.activeSessionText}>
                Live Session: {classItem.activeSession.code}
              </Text>
              {showJoinButton && (
                <TouchableOpacity 
                  style={styles.joinButton}
                  onPress={handleJoinSession}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.joinButtonText}>Join</Text>
                  )}
                </TouchableOpacity>
              )}
            </LinearGradient>
          </View>
        )}

        {/* Action Buttons */}
        {showEnrollButton && !isEnrolled && (
          <TouchableOpacity 
            style={styles.enrollButton}
            onPress={handleEnroll}
            disabled={loading}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.enrollGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="add-circle-outline" size={20} color="#fff" />
                  <Text style={styles.enrollButtonText}>Enroll</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </LinearGradient>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardGradient: {
    padding: 20,
    borderRadius: 16,
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
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  enrolledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  enrolledText: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  stats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  activeSessionBanner: {
    marginTop: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sessionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 8,
  },
  activeSessionText: {
    flex: 1,
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  joinButtonText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  enrollButton: {
    marginTop: 16,
    borderRadius: 10,
    overflow: 'hidden',
  },
  enrollGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  enrollButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '600',
  },
})

export default ClassCard