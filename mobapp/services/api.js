import axios from "axios"
import Storage from "../utils/storage"

const API_BASE_URL = "https://unizik.onrender.com/api" || "http://localhost:3000/api"

class ApiService {
  constructor() {
    this.client = axios.create({
      // baseURL: "http://localhost:3001/api", // Updated to match backend server
      // baseURL: "http://10.25.29.152:3001/api",
      baseURL: API_BASE_URL,
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
            const refreshToken = await Storage.getItem("refreshToken")

            if (refreshToken) {
              const response = await this.client.post("/auth/refresh", {
                refreshToken,
              })

              const { accessToken } = response.data
              await Storage.setItem("accessToken", accessToken)

              // Update authorization header
              this.setAuthToken(accessToken)
              originalRequest.headers.Authorization = `Bearer ${accessToken}`

              return this.client(originalRequest)
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError)
            // Clear tokens and redirect to login
            await Storage.multiRemove(["accessToken", "refreshToken", "userData"])
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

  // Student Attendance History APIs
  async getStudentAttendanceHistory({ classId, startDate, endDate, page = 1, limit = 10 } = {}) {
    const params = new URLSearchParams()
    if (classId) params.append('classId', classId)
    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    
    return this.get(`/attendance/student/history?${params.toString()}`)
  }

  async getStudentAttendanceSummary() {
    return this.get('/attendance/student/summary')
  }

  async getStudentClassAttendance(classId) {
    return this.get(`/attendance/student/class/${classId}`)
  }

  // Teacher Roster & Attendance Report APIs
  async getClassRoster(classId) {
    return this.get(`/classes/${classId}/roster`)
  }

  async getClassAttendanceReport(classId, params = {}) {
    const queryParams = new URLSearchParams()
    if (params.startDate) queryParams.append('startDate', params.startDate)
    if (params.endDate) queryParams.append('endDate', params.endDate)
    if (params.format) queryParams.append('format', params.format) // 'json', 'csv', 'pdf'
    
    return this.get(`/classes/${classId}/attendance-report?${queryParams.toString()}`)
  }

  async getClassSessions(classId, params = {}) {
    const queryParams = new URLSearchParams()
    if (params.startDate) queryParams.append('startDate', params.startDate)
    if (params.endDate) queryParams.append('endDate', params.endDate)
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    
    return this.get(`/classes/${classId}/sessions?${queryParams.toString()}`)
  }

  async exportAttendanceReport(classId, format = 'csv', params = {}) {
    const queryParams = new URLSearchParams()
    queryParams.append('format', format)
    if (params.startDate) queryParams.append('startDate', params.startDate)
    if (params.endDate) queryParams.append('endDate', params.endDate)
    
    return this.get(`/classes/${classId}/attendance-report/export?${queryParams.toString()}`, {
      responseType: format === 'pdf' ? 'blob' : 'blob'
    })
  }

  async getStudentAttendanceDetails(classId, studentId, params = {}) {
    const queryParams = new URLSearchParams()
    if (params.startDate) queryParams.append('startDate', params.startDate)
    if (params.endDate) queryParams.append('endDate', params.endDate)
    
    return this.get(`/classes/${classId}/students/${studentId}/attendance?${queryParams.toString()}`)
  }

  async updateStudentRosterStatus(classId, studentId, status) {
    return this.put(`/classes/${classId}/students/${studentId}`, { status })
  }

  async bulkUpdateRoster(classId, updates) {
    return this.put(`/classes/${classId}/roster/bulk-update`, { updates })
  }

  // Teacher session management
  async createAttendanceSession(classId, sessionData) {
    return this.post(`/classes/${classId}/sessions`, sessionData)
  }

  async endAttendanceSession(sessionId) {
    return this.put(`/sessions/${sessionId}/end`)
  }

  async getSessionAttendance(sessionId) {
    return this.get(`/sessions/${sessionId}/attendance`)
  }
}

export const apiService = new ApiService()
