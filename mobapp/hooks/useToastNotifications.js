import { useCallback } from 'react'
import { useToast } from '@/context/ToastContext'
import { Platform } from 'react-native'

export const useToastNotifications = () => {
  const toast = useToast()

  // Authentication notifications
  const showLoginSuccess = useCallback((userName) => {
    return toast.showSuccess(`Welcome back, ${userName}!`, {
      title: 'Login Successful',
      duration: 3000
    })
  }, [toast])

  const showLoginError = useCallback((error) => {
    return toast.showError(error, {
      title: 'Login Failed',
      duration: 4000
    })
  }, [toast])

  const showLogoutSuccess = useCallback(() => {
    return toast.showSuccess('You have been logged out successfully', {
      title: 'Logged Out',
      duration: 2500
    })
  }, [toast])

  const showRegistrationSuccess = useCallback((userName) => {
    return toast.showSuccess(`Account created successfully! Welcome ${userName}`, {
      title: 'Registration Complete',
      duration: 4000
    })
  }, [toast])

  const showRegistrationError = useCallback((error) => {
    return toast.showError(error, {
      title: 'Registration Failed',
      duration: 4000
    })
  }, [toast])

  // Form validation notifications
  const showValidationError = useCallback((message) => {
    return toast.showWarning(message, {
      title: 'Validation Error',
      duration: 3000
    })
  }, [toast])

  const showRequiredFields = useCallback(() => {
    return toast.showWarning('Please fill in all required fields', {
      title: 'Missing Information',
      duration: 3000
    })
  }, [toast])

  // API notifications
  const showNetworkError = useCallback(() => {
    return toast.showError('Please check your internet connection and try again', {
      title: 'Connection Error',
      duration: 4000
    })
  }, [toast])

  const showServerError = useCallback() => {
    return toast.showError('Something went wrong. Please try again later', {
      title: 'Server Error',
      duration: 4000
    })
  }, [toast])

  // Success operations
  const showSaveSuccess = useCallback((itemName = 'Item') => {
    return toast.showSuccess(`${itemName} saved successfully`, {
      duration: 2500
    })
  }, [toast])

  const showDeleteSuccess = useCallback((itemName = 'Item') => {
    return toast.showSuccess(`${itemName} deleted successfully`, {
      duration: 2500
    })
  }, [toast])

  const showUpdateSuccess = useCallback((itemName = 'Item') => {
    return toast.showSuccess(`${itemName} updated successfully`, {
      duration: 2500
    })
  }, [toast])

  // Attendance specific notifications
  const showAttendanceMarked = useCallback((status = 'Present') => {
    const message = status === 'LATE' ? 'Attendance marked as late' : 'Attendance marked successfully'
    const type = status === 'LATE' ? 'warning' : 'success'
    
    return toast.addToast({
      message,
      title: 'Attendance Recorded',
      type,
      duration: 3000
    })
  }, [toast])

  const showSessionJoined = useCallback((className) => {
    return toast.showSuccess(`Successfully joined ${className}`, {
      title: 'Session Joined',
      duration: 3000
    })
  }, [toast])

  const showBiometricError = useCallback((error) => {
    return toast.showError(error, {
      title: 'Biometric Authentication Failed',
      duration: 4000
    })
  }, [toast])

  // Loading states (for longer operations)
  const showProcessing = useCallback((message = 'Processing...') => {
    return toast.addToast({
      message,
      type: 'info',
      title: 'Please Wait',
      duration: 0 // Don't auto-dismiss
    })
  }, [toast])

  const dismissProcessing = useCallback((toastId) => {
    if (toastId) {
      toast.removeToast(toastId)
    }
  }, [toast])

  // Platform specific behaviors
  const showPlatformMessage = useCallback((message, options = {}) => {
    const platformOptions = {
      ...options,
      // Longer duration on web since there's no haptic feedback
      duration: Platform.OS === 'web' ? (options.duration || 4000) : (options.duration || 3000)
    }
    
    return toast.addToast({
      message,
      ...platformOptions
    })
  }, [toast])

  return {
    // Raw toast methods
    ...toast,
    
    // Authentication
    showLoginSuccess,
    showLoginError,
    showLogoutSuccess,
    showRegistrationSuccess,
    showRegistrationError,

    // Validation
    showValidationError,
    showRequiredFields,

    // API
    showNetworkError,
    showServerError,

    // CRUD operations
    showSaveSuccess,
    showDeleteSuccess,
    showUpdateSuccess,

    // Attendance specific
    showAttendanceMarked,
    showSessionJoined,
    showBiometricError,

    // Loading states
    showProcessing,
    dismissProcessing,

    // Platform specific
    showPlatformMessage
  }
}

export default useToastNotifications