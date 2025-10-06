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
import { apiService } from '@/services/api';

const { width } = Dimensions.get('window');

export default function StudentDashboard() {
  const { user, isAuthenticated } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadDashboardData();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const loadDashboardData = async () => {
    try {
      if (!isAuthenticated) {
        Alert.alert('Error', 'Please login to continue');
        return;
      }

      // Fetch attendance history to calculate statistics
      const attendanceResponse = await apiService.get('/attendance/history');
      const attendanceHistory = attendanceResponse.data;
        
      // Extract enrolled classes from attendance history
      const enrolledClasses = [...new Map(
        attendanceHistory.map(record => [
          record.session.class.id,
          {
            id: record.session.class.id,
            name: record.session.class.name,
            code: record.session.class.code,
            teacher: record.session.class.teacher
          }
        ])
      ).values()];

      // Calculate statistics
      const totalSessions = attendanceHistory.length;
      const presentSessions = attendanceHistory.filter(record => record.status === 'present').length;
      const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

      setDashboardData({
        enrolledClasses,
        totalClasses: enrolledClasses.length,
        totalSessions,
        presentSessions,
        attendanceRate,
        absentSessions: totalSessions - presentSessions,
        recentAttendance: attendanceHistory.slice(0, 5)
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.welcomeText}>Welcome back!</Text>
        
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#2196F3' }]}>
            <Ionicons name="book-outline" size={30} color="#FFF" />
            <Text style={styles.statValue}>{dashboardData?.totalClasses || 0}</Text>
            <Text style={styles.statLabel}>Enrolled Classes</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: '#4CAF50' }]}>
            <Ionicons name="checkmark-circle-outline" size={30} color="#FFF" />
            <Text style={styles.statValue}>{dashboardData?.attendanceRate || 0}%</Text>
            <Text style={styles.statLabel}>Attendance Rate</Text>
          </View>
        </View>

        {dashboardData?.enrolledClasses?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Classes</Text>
            {dashboardData.enrolledClasses.map((classItem) => (
              <View key={classItem.id} style={styles.classCard}>
                <Text style={styles.className}>{classItem.name}</Text>
                <Text style={styles.classCode}>Code: {classItem.code}</Text>
              </View>
            ))}
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
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 12,
    color: '#FFF',
    marginTop: 5,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  classCard: {
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  classCode: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});