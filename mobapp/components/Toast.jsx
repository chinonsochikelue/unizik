import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Platform,
  Dimensions
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useToast } from '@/context/ToastContext'

const { width: screenWidth } = Dimensions.get('window')

const Toast = ({ toast }) => {
  const { removeToast } = useToast()
  const insets = useSafeAreaInsets()
  const translateY = useRef(new Animated.Value(-100)).current
  const opacity = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        tension: 100,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.9,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      removeToast(toast.id)
    })
  }

  const getToastConfig = (type) => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle',
          colors: ['#10b981', '#059669'],
          backgroundColor: '#ecfdf5',
          borderColor: '#10b981',
          textColor: '#065f46',
          iconColor: '#10b981'
        }
      case 'error':
        return {
          icon: 'close-circle',
          colors: ['#ef4444', '#dc2626'],
          backgroundColor: '#fef2f2',
          borderColor: '#ef4444',
          textColor: '#991b1b',
          iconColor: '#ef4444'
        }
      case 'warning':
        return {
          icon: 'warning',
          colors: ['#f59e0b', '#d97706'],
          backgroundColor: '#fffbeb',
          borderColor: '#f59e0b',
          textColor: '#92400e',
          iconColor: '#f59e0b'
        }
      case 'info':
      default:
        return {
          icon: 'information-circle',
          colors: ['#3b82f6', '#2563eb'],
          backgroundColor: '#eff6ff',
          borderColor: '#3b82f6',
          textColor: '#1e40af',
          iconColor: '#3b82f6'
        }
    }
  }

  const config = getToastConfig(toast.type)

  const ToastContent = () => (
    <View style={[styles.content, { backgroundColor: config.backgroundColor }]}>
      <View style={styles.iconContainer}>
        <Ionicons 
          name={config.icon} 
          size={24} 
          color={config.iconColor} 
        />
      </View>
      
      <View style={styles.textContainer}>
        {toast.title && (
          <Text style={[styles.title, { color: config.textColor }]}>
            {toast.title}
          </Text>
        )}
        <Text style={[styles.message, { color: config.textColor }]}>
          {toast.message}
        </Text>
      </View>

      <TouchableOpacity 
        onPress={handleDismiss} 
        style={styles.closeButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons 
          name="close" 
          size={20} 
          color={config.textColor} 
        />
      </TouchableOpacity>
    </View>
  )

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          transform: [
            { translateY },
            { scale }
          ],
          opacity,
        },
      ]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView 
          intensity={90} 
          tint="light" 
          style={[styles.blurContainer, { borderColor: config.borderColor }]}
        >
          <ToastContent />
        </BlurView>
      ) : (
        <LinearGradient
          colors={['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.85)']}
          style={[styles.gradientContainer, { borderColor: config.borderColor }]}
        >
          <ToastContent />
        </LinearGradient>
      )}

      {/* Progress bar for timed toasts */}
      {toast.duration > 0 && (
        <View style={styles.progressContainer}>
          <View 
            style={[styles.progressBar, { backgroundColor: config.iconColor }]}
          />
        </View>
      )}
    </Animated.View>
  )
}

const ToastContainer = () => {
  const { toasts } = useToast()

  return (
    <View style={styles.toastContainer} pointerEvents="box-none">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  blurContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }
    }),
  },
  gradientContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  iconContainer: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  progressBar: {
    height: '100%',
    width: '100%',
  },
})

export default ToastContainer