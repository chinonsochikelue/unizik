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
import { ClassCard } from '@/components/ClassCard'

interface ClassData {
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

export default function MyClassesScreen() {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const loadMyClasses = async () => {
    setLoading(true)
    try {
      const response = await apiService.getMyClasses()
      setClasses(response.data)
    } catch (error: any) {
      console.error('Load my classes error:', error)
      const errorMessage = error.response?.data?.error || 'Failed to load your classes'
      Alert.alert('Error', errorMessage)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadMyClasses()
  }, [])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    loadMyClasses()
  }, [])

  const handleJoinSuccess = () => {
    // Refresh the list to update session status
    handleRefresh()
  }

  const handleBrowseClasses = () => {
    router.push('/(tabs)/browse-classes')
  }

  const handleJoinClass = () => {
    router.push('/(protected)/(students)/join-class')
  }

  const getActiveSessionsCount = () => {
    return classes.filter(cls => cls.activeSession).length
  }

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#6366f1', '#8b5cf6']}
        style={styles.headerGradient}
      />
      
      <SafeAreaView style={styles.headerContent}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.title}>My Classes</Text>
            <Text style={styles.subtitle}>
              {classes.length} enrolled • {getActiveSessionsCount()} active sessions
            </Text>
          </View>
          
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleJoinClass}
              activeOpacity={0.8}
            >
              <BlurView intensity={80} tint="light" style={styles.headerButtonBlur}>
                <Ionicons name="enter-outline" size={22} color="#6366f1" />
              </BlurView>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleBrowseClasses}
              activeOpacity={0.8}
            >
              <BlurView intensity={80} tint="light" style={styles.headerButtonBlur}>
                <Ionicons name="search-outline" size={22} color="#6366f1" />
              </BlurView>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={handleJoinClass}
            activeOpacity={0.8}
          >
            <BlurView intensity={80} tint="light" style={styles.quickActionBlur}>
              <View style={styles.quickActionContent}>
                <Ionicons name="radio-outline" size={24} color="#10b981" />
                <Text style={styles.quickActionTitle}>Join Session</Text>
                <Text style={styles.quickActionSubtitle}>Enter session code</Text>
              </View>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={handleBrowseClasses}
            activeOpacity={0.8}
          >
            <BlurView intensity={80} tint="light" style={styles.quickActionBlur}>
              <View style={styles.quickActionContent}>
                <Ionicons name="add-circle-outline" size={24} color="#667eea" />
                <Text style={styles.quickActionTitle}>Browse Classes</Text>
                <Text style={styles.quickActionSubtitle}>Find new classes</Text>
              </View>
            </BlurView>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="school-outline" size={80} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>No Classes Enrolled</Text>
      <Text style={styles.emptySubtitle}>
        You haven't enrolled in any classes yet. Browse available classes or join with a code.
      </Text>
      
      <View style={styles.emptyActions}>
        <TouchableOpacity
          style={styles.emptyActionButton}
          onPress={handleBrowseClasses}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.emptyButtonGradient}
          >
            <Ionicons name="search-outline" size={20} color="#fff" />
            <Text style={styles.emptyButtonText}>Browse Classes</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.emptyActionButton}
          onPress={handleJoinClass}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.emptyButtonGradient}
          >
            <Ionicons name="enter-outline" size={20} color="#fff" />
            <Text style={styles.emptyButtonText}>Join with Code</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )

  const renderClass = ({ item }: { item: ClassData }) => {
    // Ensure item exists and has required fields
    if (!item || !item.id || !item.name) {
      console.warn('Invalid class item:', item)
      return null
    }
    
    return (
      <ClassCard
        classData={item}
        isEnrolled={true}
        onJoinSuccess={handleJoinSuccess}
        showJoinButton={true}
      />
    )
  }

  if (loading && classes.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#6366f1" />
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
            colors={['#6366f1']}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
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
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    // Individual button styles if needed
  },
  headerButtonBlur: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  quickAction: {
    flex: 1,
  },
  quickActionBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  quickActionContent: {
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  quickActionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 8,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
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
  emptyActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  emptyActionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '700',
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