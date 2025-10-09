import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function StudentDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { 
    activeSessions, 
    attendanceHistory, 
    loading, 
    error,
    refresh,
    getAttendanceStats
  } = useAttendance();
  
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  const stats = getAttendanceStats();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const navigateToSessionJoin = () => {
    router.push('/(protected)/(students)/SessionJoin');
  };

  const navigateToAttendanceHistory = () => {
    router.push('/(protected)/(students)/AttendanceHistory');
  };

  // Extract unique classes from attendance history
  const enrolledClasses = [...new Map(
    attendanceHistory.map(record => [
      record.session.class.id,
      {
        id: record.session.class.id,
        name: record.session.class.name,
      }
    ])
  ).values()];

  if (loading && attendanceHistory.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#2196F3']}
          tintColor="#2196F3" 
        />
      }
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Welcome Header */}
        <View style={styles.welcomeHeader}>
          <Text style={styles.welcomeText}>Welcome back, {user?.lastName}{" "}{user?.firstName}!</Text>
          <TouchableOpacity 
            style={styles.markAttendanceButton}
            onPress={navigateToSessionJoin}
          >
            <Ionicons name="finger-print" size={20} color="#FFF" />
            <Text style={styles.markAttendanceText}>Mark Attendance</Text>
          </TouchableOpacity>
        </View>

        {/* Active Sessions Alert */}
        {activeSessions.length > 0 && (
          <TouchableOpacity 
            style={styles.activeSessionsAlert}
            onPress={navigateToSessionJoin}
          >
            <View style={styles.alertIcon}>
              <Ionicons name="radio" size={24} color="#FF5722" />
            </View>
            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>
                {activeSessions.length} Active Session{activeSessions.length > 1 ? 's' : ''}
              </Text>
              <Text style={styles.alertSubtitle}>
                Tap to mark attendance now
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#FF5722" />
          </TouchableOpacity>
        )}
        
        {/* Statistics Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#2196F3' }]}>
            <Ionicons name="school-outline" size={30} color="#FFF" />
            <Text style={styles.statValue}>{enrolledClasses.length}</Text>
            <Text style={styles.statLabel}>Classes</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="checkmark-circle-outline" size={30} color="#FFF" />
            <Text style={styles.statValue}>{stats?.present || 0}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#FF9800' }]}>
            <Ionicons name="time-outline" size={30} color="#FFF" />
            <Text style={styles.statValue}>{stats?.late || 0}</Text>
            <Text style={styles.statLabel}>Late</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#9C27B0' }]}>
            <Ionicons name="trending-up-outline" size={30} color="#FFF" />
            <Text style={styles.statValue}>{stats?.attendanceRate || 0}%</Text>
            <Text style={styles.statLabel}>Rate</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={navigateToSessionJoin}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#2196F3' }]}>
              <Ionicons name="qr-code" size={24} color="#FFF" />
            </View>
            <Text style={styles.actionText}>Join Session</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={navigateToAttendanceHistory}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="calendar" size={24} color="#FFF" />
            </View>
            <Text style={styles.actionText}>View History</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Attendance */}
        {attendanceHistory.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Attendance</Text>
              <TouchableOpacity onPress={navigateToAttendanceHistory}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            
            {attendanceHistory.slice(0, 3).map((record) => (
              <View key={record.id} style={styles.attendanceCard}>
                <View style={styles.attendanceInfo}>
                  <Text style={styles.attendanceClass}>{record.session.class.name}</Text>
                  <Text style={styles.attendanceDate}>
                    {new Date(record.markedAt).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[
                  styles.statusBadge, 
                  { backgroundColor: record.status === 'PRESENT' ? '#4CAF50' : 
                                   record.status === 'LATE' ? '#FF9800' : '#F44336' }
                ]}>
                  <Text style={styles.statusText}>{record.status}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* My Classes */}
        {enrolledClasses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Classes</Text>
            {enrolledClasses.map((classItem) => (
              <View key={classItem.id} style={styles.classCard}>
                <Ionicons name="book" size={20} color="#2196F3" />
                <Text style={styles.className}>{classItem.name}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={20} color="#F44336" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  content: {
    padding: 20,
  },
  
  // Welcome Header
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  markAttendanceButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  markAttendanceText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Active Sessions Alert
  activeSessionsAlert: {
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#FF5722',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  alertIcon: {
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5722',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 14,
    color: '#FF8A65',
  },
  
  // Statistics
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  
  // Sections
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
  },
  
  // Attendance Cards
  attendanceCard: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  attendanceInfo: {
    flex: 1,
  },
  attendanceClass: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  attendanceDate: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Class Cards
  classCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  
  // Error
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 10,
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
