import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import { useToast } from '@/context/ToastContext'

const ToastTest = () => {
  const toast = useToast()

  const testSuccess = () => {
    toast.showSuccess('This is a success message!', {
      title: 'Success'
    })
  }

  const testError = () => {
    toast.showError('This is an error message!', {
      title: 'Error'
    })
  }

  const testWarning = () => {
    toast.showWarning('This is a warning message!', {
      title: 'Warning'
    })
  }

  const testInfo = () => {
    toast.showInfo('This is an info message!', {
      title: 'Information'
    })
  }

  const testCustom = () => {
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Toast Test - {Platform.OS}</Text>
      
      <TouchableOpacity style={[styles.button, styles.successButton]} onPress={testSuccess}>
        <Text style={styles.buttonText}>Test Success Toast</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.errorButton]} onPress={testError}>
        <Text style={styles.buttonText}>Test Error Toast</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.warningButton]} onPress={testWarning}>
        <Text style={styles.buttonText}>Test Warning Toast</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.infoButton]} onPress={testInfo}>
        <Text style={styles.buttonText}>Test Info Toast</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={[styles.button, styles.customButton]} onPress={testCustom}>
        <Text style={styles.buttonText}>Test Custom Toast</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 8,
    minWidth: 200,
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
})

export default ToastTest