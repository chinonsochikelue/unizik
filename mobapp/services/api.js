import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api"

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: "http://10.86.133.152:3000/api",
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
    })

    this.setupInterceptors()
  }

  setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error("Request error:", error)
        return Promise.reject(error)
      },
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`)
        return response
      },
      async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true

          try {
            const refreshToken = await AsyncStorage.getItem("refreshToken")

            if (refreshToken) {
              const response = await this.client.post("/auth/refresh", {
                refreshToken,
              })

              const { accessToken } = response.data
              await AsyncStorage.setItem("accessToken", accessToken)

              // Update authorization header
              this.setAuthToken(accessToken)
              originalRequest.headers.Authorization = `Bearer ${accessToken}`

              return this.client(originalRequest)
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError)
            // Clear tokens and redirect to login
            await AsyncStorage.multiRemove(["accessToken", "refreshToken", "userData"])
          }
        }

        console.error("API Error:", error.response?.data || error.message)
        return Promise.reject(error)
      },
    )
  }

  setAuthToken(token) {
    if (token) {
      this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`
    } else {
      delete this.client.defaults.headers.common["Authorization"]
    }
  }

  // HTTP methods
  get(url, config = {}) {
    return this.client.get(url, config)
  }

  post(url, data = {}, config = {}) {
    return this.client.post(url, data, config)
  }

  put(url, data = {}, config = {}) {
    return this.client.put(url, data, config)
  }

  delete(url, config = {}) {
    return this.client.delete(url, config)
  }
}

export const apiService = new ApiService()
