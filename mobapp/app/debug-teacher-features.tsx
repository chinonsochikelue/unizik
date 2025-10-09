import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function DebugTeacherFeaturesScreen() {
  const insets = useSafeAreaInsets()

  const navigateToClassSelector = (targetScreen: string) => {
    router.push(`/(protected)/(teachers)/(tabs)/ClassSelector?targetScreen=${targetScreen}`)
  }

  const navigateDirectToFeature = (screen: string, classId?: string) => {
    if (classId) {
      router.push(`/(protected)/(teachers)/(tabs)/${screen}?classId=${classId}`)
    } else {
      Alert.prompt(
        'Enter Class ID',
        'Please enter a class ID to test with:',
        (text) => {
          if (text) {
            router.push(`/(protected)/(teachers)/(tabs)/${screen}?classId=${text}`)
          }
        }
      )
    }
  }

  const TestCard = ({ 
    title, 
    description, 
    icon, 
    color, 
    onPress 
  }: {
    title: string
    description: string
    icon: string
    color: string
    onPress: () => void
  }) => (
    <TouchableOpacity style={styles.testCard} onPress={onPress}>
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.cardGradient}
      >
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
      </LinearGradient>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#3b82f6', '#1d4ed8']}
        style={styles.header}
      >
        <View style={[styles.headerContent, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Teacher Features Test</Text>
          <Text style={styles.headerSubtitle}>
            Test navigation and functionality for teacher features
          </Text>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Class Selector Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Class Selector Navigation</Text>
          <Text style={styles.sectionDescription}>
            Test the new class selector screen that lets teachers choose a class before accessing features
          </Text>
          
          <TestCard
            title="Class Selector for Roster"
            description="Choose a class and navigate to roster management"
            icon="people-outline"
            color="#16a34a"
            onPress={() => navigateToClassSelector('roster')}
          />
          
          <TestCard
            title="Class Selector for Reports"
            description="Choose a class and navigate to attendance reports"
            icon="analytics-outline"
            color="#f59e0b"
            onPress={() => navigateToClassSelector('report')}
          />
        </View>

        {/* Direct Navigation Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Direct Feature Access</Text>
          <Text style={styles.sectionDescription}>
            Test direct navigation to teacher features (requires class ID)
          </Text>
          
          <TestCard
            title="Class Roster Direct"
            description="Go directly to class roster with a specific class ID"
            icon="people"
            color="#16a34a"
            onPress={() => navigateDirectToFeature('ClassRoster')}
          />
          
          <TestCard
            title="Attendance Report Direct"
            description="Go directly to attendance report with a specific class ID"
            icon="analytics"
            color="#f59e0b"
            onPress={() => navigateDirectToFeature('AttendanceReport')}
          />
        </View>

        {/* Teacher Dashboard */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dashboard Access</Text>
          <Text style={styles.sectionDescription}>
            Navigate to teacher dashboard with updated quick actions
          </Text>
          
          <TestCard
            title="Teacher Dashboard"
            description="View dashboard with new quick action buttons"
            icon="speedometer"
            color="#3b82f6"
            onPress={() => router.push('/(protected)/(teachers)/(tabs)/')}
          />
        </View>

        {/* Test Sample IDs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Test with Sample IDs</Text>
          <Text style={styles.sectionDescription}>
            Use these for quick testing if you have sample data
          </Text>
          
          <TestCard
            title="Test with Class ID: 'class-001'"
            description="Quick test roster with sample class ID"
            icon="flask"
            color="#8b5cf6"
            onPress={() => navigateDirectToFeature('ClassRoster', 'class-001')}
          />
          
          <TestCard
            title="Test with Class ID: 'class-002'"
            description="Quick test reports with sample class ID"
            icon="flask-outline"
            color="#ec4899"
            onPress={() => navigateDirectToFeature('AttendanceReport', 'class-002')}
          />
        </View>
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
    alignSelf: 'flex-start',
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 16,
  },
  testCard: {
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});