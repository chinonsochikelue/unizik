import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { BlurView } from 'expo-blur'
import { apiService } from '@/services/api'
import { useAuth } from '@/context/AuthContext'
import { useBiometric } from '@/hooks/useBiometric'

export default function JoinClassScreen() {
  const { user } = useAuth()
  const { authenticateWithBiometric } = useBiometric()
  const [activeTab, setActiveTab] = useState<'session' | 'invite'>('session')
  const [sessionCode, setSessionCode] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)

  const handleJoinSession = async () => {
    if (!sessionCode.trim() || !user || loading) return

    setLoading(true)

    try {
      // Generate biometric token for session joining
      const biometricToken = await authenticateWithBiometric()
      
      if (!biometricToken) {
        Alert.alert('Authentication Required', 'Biometric authentication is required to join sessions.')
        return
      }

      const response = await apiService.joinSessionAndMarkAttendance(
        sessionCode.trim().toUpperCase(),
        biometricToken
      )

      Alert.alert(
        'Success!',
        'You have successfully joined the session and your attendance has been marked.',
        [
          { 
            text: 'View My Classes', 
            onPress: () => {
              router.back()
              router.push('/(tabs)/MyClasses')
            }
          },
          { 
            text: 'View Attendance', 
            onPress: () => {
              router.back()
              router.push('/(tabs)/AttendanceScreen')
            }
          },
          { 
            text: 'OK', 
            onPress: () => router.back(),
            style: 'default'
          }
        ]
      )

      setSessionCode('')
    } catch (error: any) {
      console.error('Join session error:', error)
      const errorMessage = error.response?.data?.error || 'Failed to join session'
      Alert.alert('Join Session Failed', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinByInvite = async () => {
    if (!inviteCode.trim() || !user || loading) return

    setLoading(true)

    try {
      const response = await apiService.joinByInviteCode(inviteCode.trim())

      Alert.alert(
        'Success!',
        `You have successfully enrolled in the class.`,
        [
          { 
            text: 'View My Classes', 
            onPress: () => {
              router.back()
              router.push('/(tabs)/MyClasses')
            }
          },
          { 
            text: 'OK', 
            onPress: () => router.back(),
            style: 'default'
          }
        ]
      )

      setInviteCode('')
    } catch (error: any) {
      console.error('Join by invite error:', error)
      const errorMessage = error.response?.data?.error || 'Failed to join class'
      Alert.alert('Join Class Failed', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const formatCode = (text: string, maxLength: number) => {
    return text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, maxLength)
  }

  const handleSessionCodeChange = (text: string) => {
    setSessionCode(formatCode(text, 8))
  }

  const handleInviteCodeChange = (text: string) => {
    setInviteCode(formatCode(text, 20))
  }

  const renderTabButton = (tab: 'session' | 'invite', title: string, icon: string) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.activeTab]}
      onPress={() => setActiveTab(tab)}
      activeOpacity={0.7}
    >
      <Ionicons 
        name={icon as any} 
        size={24} 
        color={activeTab === tab ? '#667eea' : '#94a3b8'} 
      />
      <Text style={[
        styles.tabText, 
        activeTab === tab && styles.activeTabText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  )

  const renderSessionCodeForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="radio-outline" size={60} color="#10b981" />
      </View>
      
      <Text style={styles.formTitle}>Join Active Session</Text>
      <Text style={styles.formSubtitle}>
        Enter the session code provided by your teacher to join the live class and mark your attendance
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Session Code</Text>
        <TextInput
          style={styles.codeInput}
          value={sessionCode}
          onChangeText={handleSessionCodeChange}
          placeholder="ABC123"
          placeholderTextColor="#94a3b8"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
        />
        <Text style={styles.helpText}>
          Enter the 6-8 character code displayed by your teacher
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.joinButton, !sessionCode.trim() && styles.disabledButton]}
        onPress={handleJoinSession}
        disabled={!sessionCode.trim() || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={!sessionCode.trim() ? ['#94a3b8', '#64748b'] : ['#10b981', '#059669']}
          style={styles.buttonGradient}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
              <Text style={styles.buttonText}>Join Session & Mark Attendance</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )

  const renderInviteCodeForm = () => (
    <View style={styles.formContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name="mail-outline" size={60} color="#667eea" />
      </View>
      
      <Text style={styles.formTitle}>Join by Invitation</Text>
      <Text style={styles.formSubtitle}>
        Enter the invitation code shared by your teacher to enroll in the class
      </Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Invitation Code</Text>
        <TextInput
          style={styles.codeInput}
          value={inviteCode}
          onChangeText={handleInviteCodeChange}
          placeholder="CLASS-ABC123XYZ"
          placeholderTextColor="#94a3b8"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={20}
        />
        <Text style={styles.helpText}>
          Enter the invitation code shared by your teacher
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.joinButton, !inviteCode.trim() && styles.disabledButton]}
        onPress={handleJoinByInvite}
        disabled={!inviteCode.trim() || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={!inviteCode.trim() ? ['#94a3b8', '#64748b'] : ['#667eea', '#764ba2']}
          style={styles.buttonGradient}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles.buttonText}>Enroll in Class</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.backgroundGradient}
      />

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Join Class</Text>
              <Text style={styles.headerSubtitle}>
                Enter a code to join a class or session
              </Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <BlurView intensity={80} tint="light" style={styles.formBlur}>
              <View style={styles.formContent}>
                {/* Tabs */}
                <View style={styles.tabContainer}>
                  {renderTabButton('session', 'Session Code', 'radio-outline')}
                  {renderTabButton('invite', 'Invitation', 'mail-outline')}
                </View>

                {/* Form Content */}
                {activeTab === 'session' ? renderSessionCodeForm() : renderInviteCodeForm()}

                {/* Alternative Action */}
                <View style={styles.alternativeContainer}>
                  <Text style={styles.alternativeText}>
                    Don't have a code?{' '}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => {
                      router.back()
                      router.push('/(tabs)/BrowseClasses')
                    }}
                  >
                    <Text style={styles.alternativeLink}>Browse Classes</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 30,
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
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
  formCard: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  formBlur: {
    flex: 1,
  },
  formContent: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    padding: 6,
    marginBottom: 32,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94a3b8',
  },
  activeTabText: {
    color: '#667eea',
  },
  formContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  formSubtitle: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  codeInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    letterSpacing: 2,
  },
  helpText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '500',
  },
  joinButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  disabledButton: {
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  alternativeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  alternativeText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },
  alternativeLink: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '700',
  },
})