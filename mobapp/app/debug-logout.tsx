import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { performWebLogout, clearWebStorage, isWebPlatform } from '@/utils/webLogout'

export default function DebugLogoutScreen() {
  const insets = useSafeAreaInsets()
  const { user, logout } = useAuth()
  const toast = useToast()

  const testWebLogout = async () => {
    try {
      console.log('Testing web logout utility directly...')
      await performWebLogout(toast)
    } catch (error) {
      console.error('Direct web logout test failed:', error)
      toast.showError('Web logout test failed')
    }
  }

  const testAuthContextLogout = async () => {
    try {
      console.log('Testing AuthContext logout...')
      await logout(toast)
    } catch (error) {
      console.error('AuthContext logout test failed:', error)
      toast.showError('AuthContext logout test failed')
    }
  }

  const testStorageClear = () => {
    try {
      console.log('Testing storage clear...')
      clearWebStorage()
      toast.showSuccess('Storage cleared successfully')
    } catch (error) {
      console.error('Storage clear test failed:', error)
      toast.showError('Storage clear test failed')
    }
  }

  const testSimpleReload = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      toast.showInfo('Reloading page in 2 seconds...')
      setTimeout(() => {
        window.location.reload()
      }, 2000)
    } else {
      toast.showWarning('Reload test only works on web')
    }
  }

  const testSimpleRedirect = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      toast.showInfo('Redirecting to root in 2 seconds...')
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } else {
      toast.showWarning('Redirect test only works on web')
    }
  }

  const showSystemInfo = () => {
    const info = `
Platform: ${Platform.OS}
Is Web: ${isWebPlatform()}
Current URL: ${typeof window !== 'undefined' ? window.location.href : 'N/A'}
Current Path: ${typeof window !== 'undefined' ? window.location.pathname : 'N/A'}
User: ${user ? `${user.name} (${user.role})` : 'Not logged in'}
    `
    
    if (Platform.OS === 'web') {
      alert(info)
    } else {
      Alert.alert('System Info', info)
    }
  }

  const TestButton = ({ 
    title, 
    description, 
    onPress, 
    color = '#3b82f6',
    icon = 'flask'
  }: {
    title: string
    description: string
    onPress: () => void
    color?: string
    icon?: string
  }) => (
    <TouchableOpacity style={styles.testButton} onPress={onPress}>
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        style={styles.buttonGradient}
      >
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <View style={styles.buttonContent}>
          <Text style={styles.buttonTitle}>{title}</Text>
          <Text style={styles.buttonDescription}>{description}</Text>
        </View>
        <Ionicons name="play" size={16} color="#94a3b8" />
      </LinearGradient>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#dc2626', '#b91c1c']}
        style={styles.header}
      >
        <View style={[styles.headerContent, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Logout Debug</Text>
          <Text style={styles.headerSubtitle}>
            Test different logout methods and web navigation
          </Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* System Info */}
        <TestButton
          title="Show System Info"
          description="Display platform and user information"
          onPress={showSystemInfo}
          color="#64748b"
          icon="information-circle"
        />

        {/* Storage Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Tests</Text>
          
          <TestButton
            title="Clear Web Storage"
            description="Clear localStorage, sessionStorage, and cookies"
            onPress={testStorageClear}
            color="#f59e0b"
            icon="trash"
          />
        </View>

        {/* Logout Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logout Tests</Text>
          
          <TestButton
            title="AuthContext Logout"
            description="Test the main logout function from AuthContext"
            onPress={testAuthContextLogout}
            color="#dc2626"
            icon="log-out"
          />
          
          <TestButton
            title="Direct Web Logout"
            description="Test the web logout utility directly"
            onPress={testWebLogout}
            color="#dc2626"
            icon="exit"
          />
        </View>

        {/* Navigation Tests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Navigation Tests</Text>
          
          <TestButton
            title="Simple Page Reload"
            description="Test basic window.location.reload()"
            onPress={testSimpleReload}
            color="#2563eb"
            icon="refresh"
          />
          
          <TestButton
            title="Redirect to Root"
            description="Test redirect to root with window.location.href"
            onPress={testSimpleRedirect}
            color="#2563eb"
            icon="home"
          />
        </View>

        {/* Current Status */}
        <View style={styles.statusContainer}>
          <Text style={styles.statusTitle}>Current Status</Text>
          <Text style={styles.statusText}>Platform: {Platform.OS}</Text>
          <Text style={styles.statusText}>Web Platform: {isWebPlatform() ? 'Yes' : 'No'}</Text>
          <Text style={styles.statusText}>User: {user ? `${user.name} (${user.role})` : 'Not logged in'}</Text>
          {Platform.OS === 'web' && typeof window !== 'undefined' && (
            <>
              <Text style={styles.statusText}>Current URL: {window.location.href}</Text>
              <Text style={styles.statusText}>Current Path: {window.location.pathname}</Text>
            </>
          )}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  testButton: {
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonGradient: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  buttonContent: {
    flex: 1,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  buttonDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 16,
  },
  statusContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
});