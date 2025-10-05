import { createContext, useContext, useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { apiService } from "../services/api"

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
      const token = await AsyncStorage.getItem("accessToken")
      const userData = await AsyncStorage.getItem("userData")

      if (token && userData) {
        const parsedUser = JSON.parse(userData)
        setAccessToken(token)
        setUser(parsedUser)
        apiService.setAuthToken(token)
      }
    } catch (error) {
      console.error("Error checking auth state:", error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      const response = await apiService.post("/auth/login", {
        email,
        password,
      })

      const { accessToken, refreshToken, user } = response.data

      // Store tokens and user data
      await AsyncStorage.setItem("accessToken", accessToken)
      await AsyncStorage.setItem("refreshToken", refreshToken)
      await AsyncStorage.setItem("userData", JSON.stringify(user))

      // Update state
      setAccessToken(accessToken)
      setUser(user)
      apiService.setAuthToken(accessToken)

      return { success: true }
    } catch (error) {
      console.error("Login error:", error)
      return {
        success: false,
        error: error.response?.data?.error || "Login failed",
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

  const logout = async () => {
    try {
      const refreshToken = await AsyncStorage.getItem("refreshToken")

      if (refreshToken) {
        await apiService.post("/auth/logout", { refreshToken })
      }
    } catch (error) {
      console.error("Logout error:", error)
    } finally {
      // Clear local storage regardless of API call success
      await AsyncStorage.multiRemove(["accessToken", "refreshToken", "userData"])
      setAccessToken(null)
      setUser(null)
      apiService.setAuthToken(null)
    }
  }

  const refreshToken = async () => {
    try {
      const storedRefreshToken = await AsyncStorage.getItem("refreshToken")

      if (!storedRefreshToken) {
        throw new Error("No refresh token available")
      }

      const response = await apiService.post("/auth/refresh", {
        refreshToken: storedRefreshToken,
      })

      const { accessToken } = response.data

      await AsyncStorage.setItem("accessToken", accessToken)
      setAccessToken(accessToken)
      apiService.setAuthToken(accessToken)

      return accessToken
    } catch (error) {
      console.error("Token refresh error:", error)
      await logout()
      throw error
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
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
