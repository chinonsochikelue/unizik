import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import { apiService } from '@/services/api'
import { useToast } from '@/context/ToastContext'

interface ClassItem {
  id: string
  name: string
  code: string
  description: string
  studentCount: number
  _count?: {
    students: number
  }
}

export default function ClassSelectorScreen() {
  const { targetScreen } = useLocalSearchParams<{ targetScreen: string }>()
  const insets = useSafeAreaInsets()
  const toast = useToast()

  const [classes, setClasses] = useState<ClassItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    try {
      const response = await apiService.getTeacherClasses()
      setClasses(response.data || [])
    } catch (error) {
      console.error('Error loading classes:', error)
      toast.showError('Failed to load classes')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadClasses()
  }

  const handleClassSelect = (classItem: ClassItem) => {
    const targetRoute = targetScreen === 'roster' ? 'ClassRoster' : 'AttendanceReport'
    router.push(`/(protected)/(teachers)/(tabs)/${targetRoute}?classId=${classItem.id}`)
  }

  const getScreenTitle = () => {
    switch (targetScreen) {
      case 'roster':
        return 'Select Class for Roster'
      case 'report':
        return 'Select Class for Report'
      default:
        return 'Select a Class'
    }
  }

  const getScreenDescription = () => {
    switch (targetScreen) {
      case 'roster':
        return 'Choose a class to manage student enrollment and view roster details'
      case 'report':
        return 'Choose a class to generate attendance reports and analytics'
      default:
        return 'Choose a class to continue'
    }
  }

  const renderClassCard = ({ item }: { item: ClassItem }) => (
    <TouchableOpacity 
      style={styles.classCard}
      onPress={() => handleClassSelect(item)}
    >
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.cardGradient}
      >
        <View style={styles.cardContent}>
          <View style={styles.classInfo}>
            <Text style={styles.className}>{item.name}</Text>
            <Text style={styles.classCode}>{item.code}</Text>
            <Text style={styles.classDescription}>{item.description}</Text>
            
            <View style={styles.studentCountContainer}>
              <Ionicons name="people-outline" size={16} color="#64748b" />
              <Text style={styles.studentCount}>
                {item._count?.students || item.studentCount || 0} students
              </Text>
            </View>
          </View>
          
          <View style={styles.cardAction}>
            <View style={styles.actionButton}>
              <Ionicons 
                name={targetScreen === 'roster' ? 'people' : 'analytics'} 
                size={24} 
                color="#3b82f6" 
              />
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading classes...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8']}
        style={styles.header}
      >
        <View style={[styles.headerContent, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{getScreenTitle()}</Text>
            <Text style={styles.headerSubtitle}>{getScreenDescription()}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Classes List */}
      <FlatList
        data={classes}
        renderItem={renderClassCard}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="school-outline" size={64} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No Classes Found</Text>
            <Text style={styles.emptySubtitle}>
              You haven't been assigned to any classes yet
            </Text>
          </View>
        }
      />
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  classCard: {
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 20,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  classCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 8,
  },
  classDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 20,
  },
  studentCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentCount: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 6,
  },
  cardAction: {
    alignItems: 'center',
    marginLeft: 16,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#64748b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});