import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { apiService } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useBiometric } from '@/context/BiometricContext'
import ClassCard from '@/components/ClassCard'

interface ClassItem {
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

export default function MyClassesScreen() {
  const { user } = useAuth()
  const { generateBiometricToken } = useBiometric()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      loadMyClasses()
    }
  }, [user])

  const loadMyClasses = async () => {
    try {
      setLoading(true)
      const response = await apiService.getMyClasses()
      setClasses(response.data || [])
    } catch (error: any) {
      console.error('Load my classes error:', error)
      Alert.alert('Error', 'Failed to load your classes. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    loadMyClasses()
  }

  const handleJoinSession = async (classItem: ClassItem) => {
    if (!classItem.activeSession || !user || joiningSessionId) return

    setJoiningSessionId(classItem.activeSession.id)

    try {
      // Generate biometric token
      const biometricToken = await generateBiometricToken()
      
      if (!biometricToken) {
        Alert.alert('Authentication Required', 'Biometric authentication is required to join sessions.')
        return
      }

      const response = await apiService.joinSessionAndMarkAttendance(
        classItem.activeSession.code,
        biometricToken
      )

      Alert.alert(
        'Success!',
        `You have successfully joined the session for ${classItem.name} and your attendance has been marked.`,
        [
          { 
            text: 'View Attendance', 
            onPress: () => router.push('/(tabs)/attendance')
          },
          { text: 'OK', style: 'default' }
        ]
      )

      // Refresh the classes list to update session status
      loadMyClasses()
    } catch (error: any) {
      console.error('Join session error:', error)
      const errorMessage = error.response?.data?.error || 'Failed to join session'
      Alert.alert('Join Session Failed', errorMessage)
    } finally {
      setJoiningSessionId(null)
    }
  }

  const handleClassPress = (classItem: ClassItem) => {
    router.push(`/class-details/${classItem.id}`)
  }

  const handleBrowseClasses = () => {
    router.push('/(tabs)/browse-classes')
  }

  const handleJoinWithCode = () => {
    router.push('/join-class')
  }

  const renderClassCard = ({ item }: { item: ClassItem }) => (
    <ClassCard
      classItem={item}
      onPress={() => handleClassPress(item)}
      onJoinSession={() => handleJoinSession(item)}
      isEnrolled={true}
      showJoinButton={!!item.activeSession}
      loading={joiningSessionId === item.activeSession?.id}
    />
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="book-outline" size={80} color="#94a3b8" />
      <Text style={styles.emptyTitle}>No Classes Enrolled</Text>
      <Text style={styles.emptySubtitle}>
        You haven't enrolled in any classes yet. Browse available classes or join with a session code.
      </Text>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleBrowseClasses}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.buttonGradient}
          >
            <Ionicons name="search-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Browse Classes</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.secondaryButton} onPress={handleJoinWithCode}>
          <Text style={styles.secondaryButtonText}>Join with Code</Text>
          <Ionicons name="keypad-outline" size={16} color="#667eea" />
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderHeader = () => (
    <View style={styles.headerActions}>
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{classes.length}</Text>
          <Text style={styles.statLabel}>Enrolled Classes</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {classes.filter(c => c.activeSession).length}
          </Text>
          <Text style={styles.statLabel}>Active Sessions</Text>
        </View>
      </View>
      
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton} onPress={handleJoinWithCode}>
          <Ionicons name="keypad-outline" size={20} color="#667eea" />
          <Text style={styles.actionButtonText}>Join with Code</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleBrowseClasses}>
          <Ionicons name="add-outline" size={20} color="#667eea" />
          <Text style={styles.actionButtonText}>Browse Classes</Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Classes</Text>
          <Text style={styles.headerSubtitle}>
            {user?.firstName}, manage your enrolled courses
          </Text>
        </View>
      </LinearGradient>

      {/* Classes List */}
      <FlatList
        data={classes}
        renderItem={renderClassCard}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
        ListEmptyComponent={!loading ? renderEmptyState : null}
        ListHeaderComponent={classes.length > 0 ? renderHeader : null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={classes.length === 0 ? styles.emptyContainer : styles.listContainer}
      />

      {/* Loading Overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading your classes...</Text>
        </View>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    alignItems: 'center',
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
  listContainer: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  actionButtons: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#667eea',
    borderRadius: 12,
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  headerActions: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
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
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
})