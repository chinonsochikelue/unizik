import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useBiometric } from '@/hooks/useBiometric';
import { useAttendance } from '@/hooks/useAttendance';
import { useRouter } from 'expo-router';

export default function SessionJoin() {
  const { user, isAuthenticated } = useAuth();
    const navigation = useRouter()
  const { authenticateWithBiometric, simulateBiometricAuth, isScanning } = useBiometric();
  const { joinSessionAndMarkAttendance, activeSessions, loading: attendanceLoading } = useAttendance();
  
  const [sessionCode, setSessionCode] = useState('');
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState(null);

  // Handle session code input and initiate biometric flow
  const handleJoinSession = useCallback(async () => {
    if (!sessionCode.trim()) {
      Alert.alert('Error', 'Please enter a session code');
      return;
    }

    if (!isAuthenticated) {
      Alert.alert('Error', 'Please login to continue');
      return;
    }

    // Show biometric authentication modal
    setShowBiometricModal(true);
  }, [sessionCode, isAuthenticated]);

  // Handle biometric authentication and attendance marking
  const handleBiometricAuth = useCallback(async () => {
    try {
      // Authenticate with biometric (real fingerprint or simulated)
      const biometricToken = await authenticateWithBiometric() || simulateBiometricAuth();
      
      if (!biometricToken) {
        setShowBiometricModal(false);
        return;
      }

      // Call integrated attendance marking
      const result = await joinSessionAndMarkAttendance(sessionCode, biometricToken);
      
      if (result.success) {
        setAttendanceResult(result.data);
        setShowBiometricModal(false);
        
        // Show success message
        Alert.alert(
          '🎉 Attendance Marked Successfully!',
          `Class: ${result.data.session.class.name}\n` +
          `Status: ${result.data.attendance.status}\n` +
          `${result.data.attendance.minutesLate > 0 ? `Minutes Late: ${result.data.attendance.minutesLate}` : 'On Time!'}`,
          [
            {
              text: 'View History',
              onPress: () => navigation.push('AttendanceHistory')
            },
            {
              text: 'OK',
              onPress: () => {
                setSessionCode('');
                setAttendanceResult(null);
              },
              style: 'default'
            }
          ]
        );
      } else {
        setShowBiometricModal(false);
        
        // Show error with specific messaging
        let errorTitle = 'Attendance Failed';
        let errorMessage = result.error || 'Failed to mark attendance';
        
        if (result.code === 'ALREADY_MARKED') {
          errorTitle = 'Already Marked';
          errorMessage = 'You have already marked attendance for this session.';
        } else if (result.code === 'SESSION_NOT_FOUND') {
          errorTitle = 'Invalid Session';
          errorMessage = 'Session code is invalid or has expired.';
        } else if (result.code === 'FINGERPRINT_NOT_ENROLLED') {
          errorTitle = 'Fingerprint Required';
          errorMessage = 'Please enroll your fingerprint in settings first.';
        }
        
        Alert.alert(errorTitle, errorMessage);
      }
    } catch (error) {
      setShowBiometricModal(false);
      console.error('Biometric authentication error:', error);
      Alert.alert('Error', 'Biometric authentication failed. Please try again.');
    }
  }, [sessionCode, authenticateWithBiometric, simulateBiometricAuth, joinSessionAndMarkAttendance, navigation]);

  const handleCancelBiometric = useCallback(() => {
    setShowBiometricModal(false);
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="finger-print" size={64} color="#2196F3" />
        <Text style={styles.title}>Mark Attendance</Text>
        <Text style={styles.subtitle}>
          Enter session code and scan your fingerprint
        </Text>
      </View>

      {/* Active Sessions Display */}
      {activeSessions.length > 0 && (
        <View style={styles.activeSessionsContainer}>
          <Text style={styles.sectionTitle}>Active Sessions</Text>
          {activeSessions.map((session, index) => (
            <View key={session.id} style={styles.sessionCard}>
              <View style={styles.sessionHeader}>
                <Ionicons name="school-outline" size={20} color="#4CAF50" />
                <Text style={styles.sessionClassName}>{session.class.name}</Text>
              </View>
              <View style={styles.sessionDetails}>
                <Text style={styles.sessionCode}>Code: {session.code}</Text>
                <Text style={styles.sessionTime}>
                  Started: {new Date(session.startTime).toLocaleTimeString()}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.quickJoinButton}
                onPress={() => {
                  setSessionCode(session.code);
                  handleJoinSession();
                }}
              >
                <Ionicons name="flash" size={16} color="#FFF" />
                <Text style={styles.quickJoinText}>Quick Join</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Manual Session Code Entry */}
      <View style={styles.form}>
        <Text style={styles.label}>Session Code</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter session code"
          value={sessionCode}
          onChangeText={setSessionCode}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleJoinSession}
        />

        <TouchableOpacity
          style={[styles.joinButton, (attendanceLoading || isScanning) && styles.buttonDisabled]}
          onPress={handleJoinSession}
          disabled={attendanceLoading || isScanning}
        >
          {attendanceLoading || isScanning ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="finger-print" size={20} color="#FFF" />
              <Text style={styles.joinButtonText}>Scan & Mark Attendance</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Attendance Result Display */}
      {attendanceResult && (
        <View style={styles.resultContainer}>
          <View style={styles.successCard}>
            <Ionicons name="checkmark-circle" size={40} color="#4CAF50" />
            <Text style={styles.successTitle}>Attendance Marked!</Text>
            <Text style={styles.successDetails}>
              Class: {attendanceResult.session.class.name}
            </Text>
            <Text style={styles.successDetails}>
              Status: {attendanceResult.attendance.status}
            </Text>
            {attendanceResult.attendance.minutesLate > 0 && (
              <Text style={styles.lateWarning}>
                {attendanceResult.attendance.minutesLate} minutes late
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Information */}
      <View style={styles.info}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#2196F3" />
          <Text style={styles.infoText}>
            • Get session code from your teacher{"\n"}
            • Your fingerprint will be scanned for verification{"\n"}
            • Attendance is marked automatically after authentication
          </Text>
        </View>
      </View>

      {/* Biometric Authentication Modal */}
      <Modal
        visible={showBiometricModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelBiometric}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.biometricModal}>
            <View style={styles.biometricHeader}>
              <Ionicons 
                name={isScanning ? "finger-print" : "finger-print"} 
                size={80} 
                color={isScanning ? "#FF9800" : "#2196F3"} 
              />
              <Text style={styles.biometricTitle}>
                {isScanning ? "Scanning..." : "Biometric Authentication"}
              </Text>
              <Text style={styles.biometricSubtitle}>
                {isScanning 
                  ? "Please keep your finger on the sensor"
                  : "Place your finger on the sensor to mark attendance"
                }
              </Text>
            </View>
            
            <View style={styles.biometricActions}>
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricAuth}
                disabled={isScanning || attendanceLoading}
              >
                {isScanning || attendanceLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="finger-print" size={20} color="#FFF" />
                    <Text style={styles.biometricButtonText}>Start Scan</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelBiometric}
                disabled={isScanning || attendanceLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  
  // Active Sessions
  activeSessionsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  sessionCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionClassName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  sessionDetails: {
    marginBottom: 12,
  },
  sessionCode: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '500',
    marginBottom: 4,
  },
  sessionTime: {
    fontSize: 12,
    color: '#666',
  },
  quickJoinButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  quickJoinText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Form
  form: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  joinButton: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  joinButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Results
  resultContainer: {
    marginBottom: 20,
  },
  successCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 10,
    marginBottom: 10,
  },
  successDetails: {
    fontSize: 14,
    color: '#388E3C',
    marginBottom: 5,
  },
  lateWarning: {
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '500',
    marginTop: 5,
  },
  
  // Info
  info: {
    marginBottom: 20,
  },
  infoCard: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
  
  // Biometric Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  biometricModal: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxWidth: 350,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  biometricHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  biometricTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  biometricSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  biometricActions: {
    gap: 15,
  },
  biometricButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  biometricButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
});
