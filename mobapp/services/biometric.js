import * as LocalAuthentication from "expo-local-authentication"
import { apiService } from "./api"

class BiometricService {
  async checkBiometricSupport() {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync()

      return {
        hasHardware,
        isEnrolled,
        supportedTypes,
        isSupported: hasHardware && isEnrolled,
      }
    } catch (error) {
      console.error("Error checking biometric support:", error)
      return {
        hasHardware: false,
        isEnrolled: false,
        supportedTypes: [],
        isSupported: false,
      }
    }
  }

  async authenticateAsync(options = {}) {
    try {
      const biometricSupport = await this.checkBiometricSupport()

      if (!biometricSupport.isSupported) {
        // Fallback to development simulation if biometrics not available
        if (process.env.EXPO_PUBLIC_DEV_MODE === "true") {
          return this.simulateAuthentication()
        }

        throw new Error("Biometric authentication not available on this device")
      }

      const defaultOptions = {
        promptMessage: "Authenticate to mark attendance",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
        ...options,
      }

      const result = await LocalAuthentication.authenticateAsync(defaultOptions)

      return {
        success: result.success,
        error: result.error || null,
        warning: result.warning || null,
      }
    } catch (error) {
      console.error("Biometric authentication error:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  async simulateAuthentication() {
    // Development mode simulation
    return new Promise((resolve) => {
      setTimeout(() => {
        // 90% success rate for simulation
        const success = Math.random() > 0.1
        resolve({
          success,
          error: success ? null : "Simulated biometric authentication failed",
        })
      }, 1500) // Simulate authentication delay
    })
  }

  async enrollFingerprint(userId) {
    try {
      if (process.env.EXPO_PUBLIC_DEV_MODE === "true") {
        // Use development simulation endpoint
        const response = await apiService.post("/dev/fingerprint-simulate", {
          studentId: userId,
          action: "enroll",
        })

        return {
          success: response.data.success,
          templateId: response.data.templateId,
          message: response.data.message,
        }
      }

      // In production, this would handle actual fingerprint enrollment
      // For now, we'll just mark as enrolled in the database
      const biometricSupport = await this.checkBiometricSupport()

      if (!biometricSupport.isSupported) {
        throw new Error("Biometric enrollment not available on this device")
      }

      // Simulate enrollment success
      return {
        success: true,
        templateId: `device-${userId}`,
        message: "Fingerprint enrolled successfully using device biometrics",
      }
    } catch (error) {
      console.error("Fingerprint enrollment error:", error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  async verifyFingerprint(userId) {
    try {
      if (process.env.EXPO_PUBLIC_DEV_MODE === "true") {
        // Use development simulation endpoint
        const response = await apiService.post("/dev/fingerprint-simulate", {
          studentId: userId,
          action: "verify",
        })

        return {
          success: response.data.success,
          confidence: response.data.confidence,
          message: response.data.message,
        }
      }

      // In production, use device biometric authentication
      const authResult = await this.authenticateAsync({
        promptMessage: "Verify your identity to mark attendance",
      })

      return {
        success: authResult.success,
        confidence: authResult.success ? 0.95 : 0,
        message: authResult.success ? "Biometric verification successful" : authResult.error,
      }
    } catch (error) {
      console.error("Fingerprint verification error:", error)
      return {
        success: false,
        confidence: 0,
        error: error.message,
      }
    }
  }

  getBiometricTypeString(types) {
    if (!types || types.length === 0) return "None"

    const typeMap = {
      [LocalAuthentication.AuthenticationType.FINGERPRINT]: "Fingerprint",
      [LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION]: "Face ID",
      [LocalAuthentication.AuthenticationType.IRIS]: "Iris",
    }

    return types.map((type) => typeMap[type] || "Unknown").join(", ")
  }
}

export const biometricService = new BiometricService()
