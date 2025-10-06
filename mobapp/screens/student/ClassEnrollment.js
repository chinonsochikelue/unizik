import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';

export default function ClassEnrollment() {
  const { user, isAuthenticated } = useAuth();
  const [enrolledClasses, setEnrolledClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrollModalVisible, setEnrollModalVisible] = useState(false);
  const [classCode, setClassCode] = useState('');
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    loadEnrolledClasses();
  }, []);

  const loadEnrolledClasses = async () => {
    try {
      if (!isAuthenticated) return;

      // Fetch attendance history to get enrolled classes
      const response = await apiService.get('/attendance/history');
      const attendanceHistory = response.data;
        
      // Extract unique enrolled classes from attendance history
      const enrolled = [...new Map(
        attendanceHistory.map(record => [
          record.session.class.id,
          {
            id: record.session.class.id,
            name: record.session.class.name,
            code: record.session.class.code,
            teacher: record.session.class.teacher,
            totalSessions: attendanceHistory.filter(r => r.session.class.id === record.session.class.id).length,
            presentSessions: attendanceHistory.filter(r => 
              r.session.class.id === record.session.class.id && r.status === 'present'
            ).length
          }
        ])
      ).values()];

      setEnrolledClasses(enrolled);
    } catch (error) {
      console.error('Error loading enrolled classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollByCode = async () => {
    if (!classCode.trim()) {
      Alert.alert('Error', 'Please enter a class code');
      return;
    }

    setEnrolling(true);
    try {
      const response = await apiService.post('/classes/enroll', {
        classCode: classCode.toUpperCase()
      });

      const result = response.data;
      Alert.alert('Success', `Successfully enrolled in ${result.class.name}`);
      setEnrollModalVisible(false);
      setClassCode('');
      await loadEnrolledClasses();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to enroll in class';
      Alert.alert('Error', errorMessage);
    } finally {
      setEnrolling(false);
    }
  };

  const calculateAttendanceRate = (classItem) => {
    if (classItem.totalSessions === 0) return 0;
    return Math.round((classItem.presentSessions / classItem.totalSessions) * 100);
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 80) return '#4CAF50';
    if (rate >= 60) return '#FF9800';
    return '#F44336';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading Classes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>My Classes</Text>
            <Text style={styles.headerSubtitle}>
              {enrolledClasses.length} enrolled classes
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setEnrollModalVisible(true)}
          >
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {enrolledClasses.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="book-outline" size={60} color="#ccc" />
            <Text style={styles.emptyStateText}>No enrolled classes</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the + button to enroll in a class
            </Text>
          </View>
        ) : (
          enrolledClasses.map((classItem) => {
            const attendanceRate = calculateAttendanceRate(classItem);
            return (
              <View key={classItem.id} style={styles.classCard}>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{classItem.name}</Text>
                  <Text style={styles.classCode}>Code: {classItem.code}</Text>
                  {classItem.teacher && (
                    <Text style={styles.teacherName}>
                      {classItem.teacher.firstName} {classItem.teacher.lastName}
                    </Text>
                  )}
                </View>
                
                <View style={styles.classStats}>
                  <View style={[
                    styles.attendanceRate,
                    { backgroundColor: getAttendanceColor(attendanceRate) }
                  ]}>
                    <Text style={styles.attendanceRateText}>
                      {attendanceRate}%
                    </Text>
                  </View>
                  <Text style={styles.sessionsText}>
                    {classItem.presentSessions}/{classItem.totalSessions} sessions
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Enrollment Modal */}
      <Modal
        visible={enrollModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEnrollModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enroll in Class</Text>
              <TouchableOpacity 
                onPress={() => setEnrollModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              Enter the class code provided by your instructor.
            </Text>
            
            <TextInput
              style={styles.codeInput}
              placeholder="Enter class code"
              value={classCode}
              onChangeText={setClassCode}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEnrollModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.enrollButton]}
                onPress={handleEnrollByCode}
                disabled={enrolling}
              >
                {enrolling ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.enrollButtonText}>Enroll</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    marginTop: 10,
    color: '#666',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 50,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#999',
    marginTop: 10,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
    textAlign: 'center',
  },
  classCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  classCode: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 14,
    color: '#2196F3',
  },
  classStats: {
    alignItems: 'center',
  },
  attendanceRate: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginBottom: 4,
  },
  attendanceRateText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  sessionsText: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  enrollButton: {
    backgroundColor: '#2196F3',
    marginLeft: 10,
  },
  enrollButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});