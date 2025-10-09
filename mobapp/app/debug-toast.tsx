import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform, ScrollView } from 'react-native'
import { useToast } from '@/context/ToastContext'
import { useAuth } from '@/context/AuthContext'
import { router } from 'expo-router'

export default function DebugToastScreen() {
  const toast = useToast()
  const { logout, user } = useAuth()

  const testSuccess = () => {
    console.log('Testing success toast...')
    toast.showSuccess('This is a success message!', {
      title: 'Success'
    })
  }

  const testError = () => {
    console.log('Testing error toast...')
    toast.showError('This is an error message!', {
      title: 'Error'
    })
  }

  const testWarning = () => {
    console.log('Testing warning toast...')
    toast.showWarning('This is a warning message!', {
      title: 'Warning'
    })
  }

  const testInfo = () => {
    console.log('Testing info toast...')
    toast.showInfo('This is an info message!', {
      title: 'Information'
    })
  }

  const testCustom = () => {
    console.log('Testing custom toast...')
    toast.addToast({
      title: 'Custom Toast',
      message: 'This is a custom toast with action',
      type: 'success',
      duration: 5000,
      action: {
        label: 'Action',
        onPress: () => {
          alert('Action pressed!')
        }
      }
    })
  }

  const testLogout = () => {
    console.log('Testing logout...')
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to test logout?')) {
        logout(toast)
      }
    } else {
      logout(toast)
    }
  }

  const goToLogin = () => {
    router.replace('/(auth)/login')
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>🧪 Toast & Logout Debug</Text>
        <Text style={styles.subtitle}>Platform: {Platform.OS}</Text>
        <Text style={styles.subtitle}>User: {user ? user.name : 'Not logged in'}</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Toast Tests</Text>
          
          <TouchableOpacity style={[styles.button, styles.successButton]} onPress={testSuccess}>
            <Text style={styles.buttonText}>✅ Test Success Toast</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.errorButton]} onPress={testError}>
            <Text style={styles.buttonText}>❌ Test Error Toast</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={testWarning}>
            <Text style={styles.buttonText}>⚠️ Test Warning Toast</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.infoButton]} onPress={testInfo}>
            <Text style={styles.buttonText}>ℹ️ Test Info Toast</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.customButton]} onPress={testCustom}>
            <Text style={styles.buttonText}>🎨 Test Custom Toast</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔓 Logout Tests</Text>
          
          <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={testLogout}>
            <Text style={styles.buttonText}>🚪 Test Logout</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.button, styles.navigationButton]} onPress={goToLogin}>
            <Text style={styles.buttonText}>🔄 Go to Login (Manual)</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 Instructions</Text>
          <Text style={styles.instruction}>1. Test each toast type</Text>
          <Text style={styles.instruction}>2. Verify Sonner toasts show on web</Text>
          <Text style={styles.instruction}>3. Test logout functionality</Text>
          <Text style={styles.instruction}>4. Check browser console for logs</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    maxWidth: 400,
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  successButton: {
    backgroundColor: '#10b981',
  },
  errorButton: {
    backgroundColor: '#ef4444',
  },
  warningButton: {
    backgroundColor: '#f59e0b',
  },
  infoButton: {
    backgroundColor: '#3b82f6',
  },
  customButton: {
    backgroundColor: '#8b5cf6',
  },
  logoutButton: {
    backgroundColor: '#dc2626',
  },
  navigationButton: {
    backgroundColor: '#6b7280',
  },
  instruction: {
    fontSize: 14,
    color: '#555',
    marginVertical: 2,
    paddingLeft: 8,
  },
})