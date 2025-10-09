import React, { createContext, useContext, useState, useCallback } from 'react'
import { Platform } from 'react-native'

// Import Sonner for web
let toast = null
if (Platform.OS === 'web') {
  try {
    const sonner = require('sonner')
    toast = sonner.toast
    console.log('Sonner toast loaded successfully')
  } catch (error) {
    console.warn('Sonner not available:', error)
  }
}

const ToastContext = createContext({})

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((toastData) => {
    // Use Sonner for web
    if (Platform.OS === 'web' && toast) {
      const message = toastData.message || ''
      const options = {
        description: toastData.title || undefined,
        duration: toastData.duration || 3000,
        action: toastData.action ? {
          label: toastData.action.label,
          onClick: toastData.action.onPress
        } : undefined
      }

      switch (toastData.type) {
        case 'success':
          return toast.success(message, options)
        case 'error':
          return toast.error(message, options)
        case 'warning':
          return toast.warning(message, options)
        case 'info':
        default:
          return toast.info(message, options)
      }
    }

    // Use native system for mobile
    const id = Math.random().toString(36).substr(2, 9)
    const newToast = {
      id,
      title: toastData.title || '',
      message: toastData.message || '',
      type: toastData.type || 'info', // 'success', 'error', 'warning', 'info'
      duration: toastData.duration || 3000,
      action: toastData.action || null,
      ...toastData
    }

    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    if (newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, newToast.duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    if (Platform.OS === 'web' && toast) {
      // Sonner handles removal automatically, but we can dismiss manually if needed
      try {
        toast.dismiss(id)
      } catch (error) {
        console.warn('Could not dismiss toast:', error)
      }
      return
    }
    
    // Native system
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    if (Platform.OS === 'web' && toast) {
      toast.dismiss()
      return
    }
    
    setToasts([])
  }, [])

  // Convenience methods
  const showSuccess = useCallback((message, options = {}) => {
    return addToast({
      message,
      type: 'success',
      ...options
    })
  }, [addToast])

  const showError = useCallback((message, options = {}) => {
    return addToast({
      message,
      type: 'error',
      duration: 4000, // Error messages stay longer
      ...options
    })
  }, [addToast])

  const showWarning = useCallback((message, options = {}) => {
    return addToast({
      message,
      type: 'warning',
      ...options
    })
  }, [addToast])

  const showInfo = useCallback((message, options = {}) => {
    return addToast({
      message,
      type: 'info',
      ...options
    })
  }, [addToast])

  const value = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}