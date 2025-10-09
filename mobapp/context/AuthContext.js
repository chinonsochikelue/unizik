import { createContext, useContext, useEffect, useState } from "react"
import { Platform } from "react-native"
import { router } from "expo-router"
import Storage from "../utils/storage"
import { apiService } from "../services/api"
import { performWebLogout } from "../utils/webLogout"

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accessToken, setAccessToken] = useState(null)

  useEffect(() => {
    checkAuthState()
  }, [])

  const checkAuthState = async () => {
    try {
      const token = await Storage.getItem("accessToken")
      const userData = await Storage.getItem("userData")

      if (token && userData) {
        const parsedUser = JSON.parse(userData)
        setAccessToken(token)
        setUser(parsedUser)
        apiService.setAuthToken(token)
        // Also store with 'token' key for backward compatibility
        await Storage.setItem("token", token)
      }
    } catch (error) {
      console.error("Error checking auth state:", error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password, showToast = null) => {
    try {
      const response = await apiService.post("/auth/login", {
        email,
        password,
      })

      const { accessToken, refreshToken, user } = response.data

      // Store tokens and user data
      await Storage.setItem("accessToken", accessToken)
      await Storage.setItem("token", accessToken) // For backward compatibility
      await Storage.setItem("refreshToken", refreshToken)
      await Storage.setItem("userData", JSON.stringify(user))

      // Update state
      setAccessToken(accessToken)
      setUser(user)
      apiService.setAuthToken(accessToken)

      // Show success toast if available
      if (showToast) {
        showToast.showSuccess(`Welcome back, ${user.firstName}!`, {
          title: 'Login Successful'
        })
      }

      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      const errorMessage = error.response?.data?.error || "Login failed"
      
      // Show error toast if available
      if (showToast) {
        showToast.showError(errorMessage, {
          title: 'Login Failed'
        })
      }
      
      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await apiService.post("/auth/register", userData)
      return { success: true, data: response.data }
    } catch (error) {
      console.error("Registration error:", error)
      return {
        success: false,
        error: error.response?.data?.error || "Registration failed",
      }
    }
  }

  const logout = async (showToast = null) => {
    try {
      const refreshToken = await Storage.getItem("refreshToken")

      if (refreshToken) {
        await apiService.post("/auth/logout", { refreshToken })
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear local storage regardless of API call success
      await Storage.multiRemove(["accessToken", "token", "refreshToken", "userData"])
      setAccessToken(null)
      setUser(null)
      apiService.setAuthToken(null)
      
      // Handle platform-specific logout
      if (Platform.OS === 'web') {
        console.log('Performing web logout...')
        
        try {
          // Use specialized web logout utility
          await performWebLogout(showToast)
        } catch (webError) {
          console.error('Web logout utility failed:', webError)
          
          // Simple fallback for web
          if (showToast) {
            showToast.showSuccess('You have been logged out successfully', {
              title: 'Logged Out'
            })
          }
          
          // Force a simple page reload after a delay
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              console.log('Fallback: reloading page for logout')
              window.location.href = '/'
            }
          }, showToast ? 2000 : 500)
        }
      } else {
        // Mobile logout
        console.log('Performing mobile logout...')
        
        if (showToast) {
          showToast.showSuccess('You have been logged out successfully', {
            title: 'Logged Out'
          })
        }
        
        try {
          router.replace('/(auth)/login')
        } catch (routerError) {
          console.error('Mobile logout navigation error:', routerError)
          // Mobile fallback - try different routes
          try {
            router.push('/(auth)/login')
          } catch (fallbackError) {
            console.error('Mobile fallback navigation also failed:', fallbackError)
          }
        }
      }
    }
  }

  const refreshToken = async () => {
    try {
      const storedRefreshToken = await Storage.getItem("refreshToken")

      if (!storedRefreshToken) {
        throw new Error("No refresh token available")
      }

      const response = await apiService.post("/auth/refresh", {
        refreshToken: storedRefreshToken,
      })

      const { accessToken } = response.data

      await Storage.setItem("accessToken", accessToken)
      await Storage.setItem("token", accessToken) // For backward compatibility
      setAccessToken(accessToken)
      apiService.setAuthToken(accessToken)

      return accessToken
    } catch (error) {
      console.error("Token refresh error:", error)
      await logout()
      throw error
    }
  }

  const updateUser = async (updatedUserData) => {
    try {
      // Update user state
      setUser(updatedUserData)
      
      // Update stored user data
      await Storage.setItem("userData", JSON.stringify(updatedUserData))
      
      return { success: true }
    } catch (error) {
      console.error("Error updating user:", error)
      return { success: false, error: "Failed to update user data" }
    }
  }

  const value = {
    user,
    loading,
    accessToken,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
