import axios from "axios"
import AsyncStorage from "@react-native-async-storage/async-storage"

const API_BASE_URL = "https://unizik.onrender.com/api" || "http://localhost:3000/api"

class ApiService {
  constructor() {
    this.client = axios.create({
      // baseURL: "http://localhost:3001/api", // Updated to match backend server
      baseURL: "http://10.25.29.152:3000/api",
      // baseURL: API_BASE_URL,
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

  // Class Management APIs
  async browseClasses({ search = '', department = '', page = 1, limit = 10 } = {}) {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (department) params.append('department', department)
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    
    return this.get(`/classes/browse?${params.toString()}`)
  }

  async getMyClasses() {
    return this.get('/classes/my-classes')
  }

  // Teacher Classes API
  async getTeacherClasses() {
    return this.get('/classes') // This endpoint filters by teacher automatically
  }

  async getClassDetails(classId) {
    return this.get(`/classes/${classId}`)
  }

  async enrollInClass({ classId, classCode }) {
    return this.post('/classes/enroll', { classId, classCode })
  }

  async joinByInviteCode(inviteCode) {
    return this.post('/classes/join-by-invite', { inviteCode })
  }

  async generateInviteCode(classId, expiresInHours = 24) {
    return this.post(`/classes/${classId}/invite-code`, { expiresInHours })
  }

  async joinSession(sessionCode) {
    return this.post('/sessions/join', { sessionCode })
  }

  async joinSessionAndMarkAttendance(sessionCode, biometricToken) {
    return this.post('/sessions/join-and-mark-attendance', { 
      sessionCode, 
      biometricToken 
    })
  }

  async getActiveSessions() {
    return this.get('/sessions/active')
  }

  async getAvailableStudents(classId, search = '') {
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    return this.get(`/classes/${classId}/available-students?${params.toString()}`)
  }

  async addStudentToClass(classId, studentId) {
    return this.post(`/classes/${classId}/students`, { studentId })
  }

  async removeStudentFromClass(classId, studentId) {
    return this.delete(`/classes/${classId}/students/${studentId}`)
  }

  // Admin APIs for class/teacher management
  async getAllTeachers() {
    return this.get('/classes/teachers')
  }

  async updateClass(classId, data) {
    return this.put(`/classes/${classId}`, data)
  }

  async assignTeacherToClass(classId, teacherId) {
    return this.put(`/classes/${classId}`, { teacherId })
  }
}

export const apiService = new ApiService()
