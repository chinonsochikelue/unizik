import { Platform } from 'react-native'

export const performWebLogout = async (showToast = null) => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return false
  }

  try {
    console.log('Starting web logout process...')
    
    // Clear all storage first
    clearAllWebStorage()
    
    // Show logout toast if available
    if (showToast) {
      showToast.showSuccess('You have been logged out successfully', {
        title: 'Logged Out'
      })
    }

    // Simple and reliable navigation approach
    const timeoutDelay = showToast ? 2000 : 500
    
    setTimeout(() => {
      try {
        console.log('Attempting web logout redirect...')
        
        // Method 1: Try direct route change
        if (window.location.pathname.includes('protected')) {
          // If we're in a protected route, force navigation to login
          window.location.href = '/(auth)/login'
          return
        }
        
        // Method 2: Force a full page reload to root
        window.location.href = '/'
        
      } catch (error) {
        console.error('Navigation failed, forcing reload:', error)
        // Final fallback - just reload the page
        window.location.reload(true)
      }
    }, timeoutDelay)

    return true
  } catch (error) {
    console.error('Web logout error:', error)
    // Emergency fallback
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.location.reload(true)
      }, 100)
    }
    return false
  }
}

export const isWebPlatform = () => {
  return Platform.OS === 'web' && typeof window !== 'undefined'
}

const clearAllWebStorage = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return

  try {
    console.log('Clearing web storage...')
    
    // Clear localStorage items
    const itemsToRemove = ['accessToken', 'refreshToken', 'userData', 'token']
    itemsToRemove.forEach(item => {
      try {
        localStorage.removeItem(item)
      } catch (e) {
        console.warn(`Failed to remove ${item} from localStorage:`, e)
      }
    })
    
    // Clear sessionStorage
    try {
      sessionStorage.clear()
    } catch (e) {
      console.warn('Failed to clear sessionStorage:', e)
    }
    
    // Clear auth-related cookies
    try {
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
      })
    } catch (e) {
      console.warn('Failed to clear cookies:', e)
    }
    
    console.log('Web storage cleared successfully')
  } catch (error) {
    console.error('Error clearing web storage:', error)
  }
}

export const clearWebStorage = () => {
  clearAllWebStorage()
}

export default performWebLogout