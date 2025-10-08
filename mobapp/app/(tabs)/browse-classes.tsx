import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
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

export default function BrowseClassesScreen() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [enrollingId, setEnrollingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  })

  useEffect(() => {
    loadClasses(true)
  }, [])

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchQuery !== '') {
        loadClasses(true, searchQuery)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const loadClasses = async (reset = false, search = '') => {
    try {
      if (reset) {
        setLoading(true)
        setPagination(prev => ({ ...prev, page: 1 }))
      }

      const page = reset ? 1 : pagination.page + 1
      const response = await apiService.browseClasses({
        search,
        page,
        limit: 10,
      })

      const newClasses = response.data.classes || []
      const newPagination = response.data.pagination

      setClasses(prev => reset ? newClasses : [...prev, ...newClasses])
      setPagination(newPagination)
    } catch (error: any) {
      console.error('Load classes error:', error)
      Alert.alert('Error', 'Failed to load classes. Please try again.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setSearchQuery('')
    loadClasses(true)
  }

  const handleLoadMore = () => {
    if (pagination.page < pagination.totalPages && !loading) {
      loadClasses(false, searchQuery)
    }
  }

  const handleEnroll = async (classItem: ClassItem) => {
    if (!user || enrollingId) return

    setEnrollingId(classItem.id)
    
    try {
      const response = await apiService.enrollInClass({ 
        classId: classItem.id 
      })

      Alert.alert(
        'Success!',
        `You have successfully enrolled in ${classItem.name}`,
        [
          { 
            text: 'View My Classes', 
            onPress: () => router.push('/(tabs)/my-classes')
          },
          { text: 'OK', style: 'default' }
        ]
      )

      // Update local state to show enrolled
      setClasses(prev => 
        prev.map(c => 
          c.id === classItem.id 
            ? { ...c, _count: { ...c._count, students: (c._count?.students || 0) + 1 } }
            : c
        )
      )
    } catch (error: any) {
      console.error('Enroll error:', error)
      const errorMessage = error.response?.data?.error || 'Failed to enroll in class'
      Alert.alert('Enrollment Failed', errorMessage)
    } finally {
      setEnrollingId(null)
    }
  }

  const handleClassPress = (classItem: ClassItem) => {
    router.push(`/class-details/${classItem.id}`)
  }

  const clearSearch = () => {
    setSearchQuery('')
    loadClasses(true)
  }

  const renderClassCard = ({ item }: { item: ClassItem }) => (
    <ClassCard
      classItem={item}
      onPress={() => handleClassPress(item)}
      onEnroll={() => handleEnroll(item)}
      showEnrollButton={true}
      loading={enrollingId === item.id}
    />
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="school-outline" size={80} color="#94a3b8" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No Classes Found' : 'No Classes Available'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? `No classes found matching "${searchQuery}"`
          : 'Check back later for new classes to enroll in'
        }
      </Text>
      {searchQuery && (
        <TouchableOpacity style={styles.clearSearchButton} onPress={clearSearch}>
          <Text style={styles.clearSearchText}>Clear Search</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  const renderFooter = () => {
    if (loading && !refreshing && classes.length > 0) {
      return (
        <View style={styles.loadingFooter}>
          <ActivityIndicator size="small" color="#667eea" />
        </View>
      )
    }
    return null
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Browse Classes</Text>
          <Text style={styles.headerSubtitle}>Discover and enroll in new courses</Text>
        </View>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search classes by name or description..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

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
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={!loading ? renderEmptyState : null}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={classes.length === 0 ? styles.emptyContainer : styles.listContainer}
      />

      {/* Loading Overlay */}
      {loading && classes.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading classes...</Text>
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
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
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
  },
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#667eea',
    borderRadius: 8,
  },
  clearSearchText: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingFooter: {
    paddingVertical: 20,
    alignItems: 'center',
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