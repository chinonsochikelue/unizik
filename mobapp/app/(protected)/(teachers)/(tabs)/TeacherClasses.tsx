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
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { BlurView } from 'expo-blur'
import { apiService } from '@/services/api'

interface TeacherClassData {
  id: string
  name: string
  code?: string
  description?: string
  students: Array<{
    id: string
    firstName: string
    lastName: string
    email: string
  }>
  activeSession?: {
    id: string
    code: string
    startTime: string
    isActive: boolean
  } | null
  _count?: {
    students: number
    sessions: number
  }
}

export default function TeacherClassesScreen() {
  const [classes, setClasses] = useState<TeacherClassData[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadTeacherClasses()
  }, [])

  const loadTeacherClasses = async () => {
    setLoading(true)
    try {
      const response = await apiService.getTeacherClasses()
      setClasses(response.data || [])
    } catch (error: any) {
      console.error('Load teacher classes error:', error)
      const errorMessage = error.response?.data?.error || 'Failed to load your classes'
      Alert.alert('Error', errorMessage)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    loadTeacherClasses()
  }, [])

  const handleClassPress = (classItem: TeacherClassData) => {
    router.push(`/teacher-class-details/${classItem.id}`)
  }

  const handleCreateSession = (classItem: TeacherClassData) => {
    router.push(`/create-session/${classItem.id}`)
  }

  const getActiveSessionsCount = () => {
    return classes.filter(cls => cls.activeSession).length
  }

  const getTotalStudentsCount = () => {
    return classes.reduce((total, cls) => total + (cls._count?.students || 0), 0)
  }

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#f093fb', '#f5576c']}
        style={styles.headerGradient}
      />
      
      <SafeAreaView style={styles.headerContent}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.title}>My Classes</Text>
            <Text style={styles.subtitle}>
              {classes.length} classes • {getTotalStudentsCount()} students • {getActiveSessionsCount()} active
            </Text>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <BlurView intensity={80} tint="light" style={styles.statBlur}>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{classes.length}</Text>
                <Text style={styles.statLabel}>Classes</Text>
              </View>
            </BlurView>
          </View>

          <View style={styles.statCard}>
            <BlurView intensity={80} tint="light" style={styles.statBlur}>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{getTotalStudentsCount()}</Text>
                <Text style={styles.statLabel}>Students</Text>
              </View>
            </BlurView>
          </View>

          <View style={styles.statCard}>
            <BlurView intensity={80} tint="light" style={styles.statBlur}>
              <View style={styles.statContent}>
                <Text style={styles.statNumber}>{getActiveSessionsCount()}</Text>
                <Text style={styles.statLabel}>Live Sessions</Text>
              </View>
            </BlurView>
          </View>
        </View>
      </SafeAreaView>
    </View>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="school-outline" size={80} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>No Classes Assigned</Text>
      <Text style={styles.emptySubtitle}>
        You don't have any classes assigned to you yet. Contact your administrator to get classes assigned.
      </Text>
      
      <TouchableOpacity
        style={styles.contactButton}
        onPress={() => Alert.alert('Contact Admin', 'Please contact your system administrator to get classes assigned to your account.')}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.contactGradient}
        >
          <Ionicons name="mail-outline" size={20} color="#fff" />
          <Text style={styles.contactButtonText}>Contact Admin</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )

  const renderClass = ({ item }: { item: TeacherClassData }) => (
    <TouchableOpacity
      style={styles.classCard}
      onPress={() => handleClassPress(item)}
      activeOpacity={0.9}
    >
      <BlurView intensity={95} tint="light" style={styles.classCardBlur}>
        <View style={styles.classCardContent}>
          {/* Class Header */}
          <View style={styles.classHeader}>
            <View style={styles.classInfo}>
              <Text style={styles.className}>{item.name}</Text>
              {item.code && (
                <Text style={styles.classCode}>{item.code}</Text>
              )}
            </View>
            
            {item.activeSession && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}
          </View>

          {/* Class Stats */}
          <View style={styles.classStats}>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={16} color="#64748b" />
              <Text style={styles.statText}>{item._count?.students || 0} students</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={16} color="#64748b" />
              <Text style={styles.statText}>{item._count?.sessions || 0} sessions</Text>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.classActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCreateSession(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={18} color="#f093fb" />
              <Text style={styles.actionText}>Start Session</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleClassPress(item)}
              activeOpacity={0.8}
            >
              <Ionicons name="eye-outline" size={18} color="#667eea" />
              <Text style={styles.actionText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </BlurView>
    </TouchableOpacity>
  )

  if (loading && classes.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#f093fb" />
          <Text style={styles.loadingText}>Loading your classes...</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={classes}
        renderItem={renderClass}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#f093fb']}
            progressBackgroundColor="#fff"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={classes.length === 0 ? styles.emptyContainer : styles.listContainer}
      />
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
    color: '#f093fb',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#475569',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  contactButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  contactGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  contactButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
  },
  classCard: {
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
  classCardBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  classCardContent: {
    padding: 20,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
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
    color: '#f093fb',
    backgroundColor: 'rgba(240, 147, 251, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#22c55e',
  },
  classStats: {
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
  classActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
    flex: 0.48,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
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