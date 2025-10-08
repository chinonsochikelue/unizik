import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  SafeAreaView,
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
}

interface BrowseResponse {
  classes: ClassData[]
  totalClasses: number
  currentPage: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export default function BrowseClassesScreen() {
  const [classes, setClasses] = useState<ClassData[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [hasNextPage, setHasNextPage] = useState(false)
  const [totalClasses, setTotalClasses] = useState(0)

  const loadClasses = async (page: number = 1, search: string = '', append: boolean = false) => {
    if (page === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const response = await apiService.browseClasses({
        search: search.trim(),
        page,
        limit: 10,
      })

      const data: BrowseResponse = response.data
      
      // Debug: Log the actual API response structure
      console.log('API Response:', JSON.stringify(data, null, 2))
      
      // Ensure classes array exists and has proper structure
      if (!data.classes || !Array.isArray(data.classes)) {
        console.warn('Invalid API response structure:', data)
        throw new Error('Invalid response format')
      }
      
      // Debug: Log the first class structure
      if (data.classes.length > 0) {
        console.log('First class structure:', JSON.stringify(data.classes[0], null, 2))
      }
      
      if (append) {
        setClasses(prev => [...prev, ...data.classes])
      } else {
        setClasses(data.classes)
      }
      
      setCurrentPage(data.currentPage)
      setHasNextPage(data.hasNextPage)
      setTotalClasses(data.totalClasses)
    } catch (error: any) {
      console.error('Browse classes error:', error)
      const errorMessage = error.response?.data?.error || 'Failed to load classes'
      Alert.alert('Error', errorMessage)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadClasses(1, searchQuery)
  }, [])

  const handleSearch = useCallback((text: string) => {
    setSearchQuery(text)
    setCurrentPage(1)
    loadClasses(1, text)
  }, [])

  const handleRefresh = useCallback(() => {
    setRefreshing(true)
    setCurrentPage(1)
    loadClasses(1, searchQuery)
  }, [searchQuery])

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !loadingMore && !loading) {
      const nextPage = currentPage + 1
      loadClasses(nextPage, searchQuery, true)
    }
  }, [hasNextPage, loadingMore, loading, currentPage, searchQuery])

  const handleEnrollSuccess = () => {
    // Refresh the list to update enrollment status
    handleRefresh()
  }

  const handleJoinClass = () => {
    router.push('/(protected)/(students)/join-class')
  }

  const renderHeader = () => (
    <View style={styles.header}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.headerGradient}
      />
      
      <SafeAreaView style={styles.headerContent}>
        <View style={styles.headerTop}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Browse Classes</Text>
            <Text style={styles.subtitle}>
              {totalClasses} classes available for enrollment
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.joinButton}
            onPress={handleJoinClass}
            activeOpacity={0.8}
          >
            <BlurView intensity={80} tint="light" style={styles.joinButtonBlur}>
              <Ionicons name="add-circle-outline" size={24} color="#667eea" />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <BlurView intensity={80} tint="light" style={styles.searchBlur}>
            <View style={styles.searchContent}>
              <Ionicons name="search-outline" size={20} color="#64748b" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search classes..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={handleSearch}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => handleSearch('')}
                  style={styles.clearButton}
                >
                  <Ionicons name="close-circle" size={20} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
          </BlurView>
        </View>
      </SafeAreaView>
    </View>
  )

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="school-outline" size={80} color="#cbd5e1" />
      <Text style={styles.emptyTitle}>
        {searchQuery ? 'No classes found' : 'No classes available'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'Try adjusting your search terms'
          : 'Check back later for new classes'
        }
      </Text>
      {searchQuery && (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={() => handleSearch('')}
        >
          <Text style={styles.clearSearchText}>Clear Search</Text>
        </TouchableOpacity>
      )}
    </View>
  )

  const renderFooter = () => {
    if (!loadingMore) return null
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#667eea" />
        <Text style={styles.loadingText}>Loading more classes...</Text>
      </View>
    )
  }

  const renderClass = ({ item }: { item: ClassData }) => {
    // Ensure item exists and has required fields
    if (!item || !item.id || !item.name) {
      console.warn('Invalid class item:', item)
      return null
    }
    
    return (
      <ClassCard
        classData={item}
        isEnrolled={false}
        onEnrollSuccess={handleEnrollSuccess}
        showJoinButton={false}
      />
    )
  }

  if (loading && classes.length === 0) {
    return (
      <View style={styles.container}>
        {renderHeader()}
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color="#667eea" />
          <Text style={styles.loadingText}>Loading classes...</Text>
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
        ListFooterComponent={renderFooter}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#667eea']}
            progressBackgroundColor="#fff"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
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
  joinButton: {
    marginLeft: 16,
  },
  joinButtonBlur: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  searchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  clearButton: {
    padding: 4,
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
    paddingVertical: 80,
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
    marginBottom: 32,
  },
  clearSearchButton: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  clearSearchText: {
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
  footerLoader: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
})