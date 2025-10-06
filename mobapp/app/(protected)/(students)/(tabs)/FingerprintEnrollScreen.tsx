import { useState, useEffect, useRef } from "react"
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  Animated,
  Dimensions
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "@/context/AuthContext"
import { biometricService } from "@/services/biometric"
import { router } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const { width } = Dimensions.get('window')

export default function FingerprintEnrollScreen() {
  const { user } = useAuth()
  const insets = useSafeAreaInsets()
  const [biometricSupport, setBiometricSupport] = useState(null)
  const [enrolling, setEnrolling] = useState(false)
  const [enrolled, setEnrolled] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const scaleAnim = useRef(new Animated.Value(0.8)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const progressAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    checkBiometricSupport()
    checkEnrollmentStatus()
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()

    // Pulse animation for fingerprint icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  const checkBiometricSupport = async () => {
    const support = await biometricService.checkBiometricSupport()
    setBiometricSupport(support)
  }

  const checkEnrollmentStatus = async () => {
    try {
      const status = await biometricService.checkEnrollmentStatus(user.id)
      if (status.success && status.enrolled) {
        setEnrolled(true)
        setCurrentStep(2)
        progressAnim.setValue(1)
      }
    } catch (error) {
      console.error("Check enrollment status error:", error)
    }
  }

  const handleEnrollment = async () => {
    setEnrolling(true)
    setCurrentStep(1)

    // Animate progress
    Animated.timing(progressAnim, {
      toValue: 0.5,
      duration: 500,
      useNativeDriver: false,
    }).start()

    try {
      const result = await biometricService.enrollFingerprint(user.id)

      if (result.success) {
        setCurrentStep(2)
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }).start()

        setEnrolled(true)
        Alert.alert(
          "Success!", 
          result.message || "Fingerprint enrolled successfully!", 
          [
            {
              text: "Done",
              onPress: () => router.back(),
            },
          ]
        )
      } else {
        setCurrentStep(0)
        progressAnim.setValue(0)
        Alert.alert("Enrollment Failed", result.error || "Failed to enroll fingerprint")
      }
    } catch (error) {
      console.error("Enrollment error:", error)
      setCurrentStep(0)
      progressAnim.setValue(0)
      Alert.alert("Error", "An unexpected error occurred during enrollment")
    } finally {
      setEnrolling(false)
    }
  }

  const testBiometric = async () => {
    try {
      const result = await biometricService.authenticateAsync({
        promptMessage: "Test your biometric authentication",
      })

      Alert.alert(
        "Test Result",
        result.success 
          ? "Biometric authentication successful!" 
          : `Authentication failed: ${result.error}`,
      )
    } catch (error) {
      Alert.alert("Test Failed", error.message)
    }
  }

  if (!biometricSupport) {
    return (
      <View style={styles.loadingContainer}>
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <LinearGradient
            colors={["#667eea", "#764ba2"]}
            style={styles.loadingGradient}
          >
            <Ionicons name="finger-print" size={48} color="#fff" />
          </LinearGradient>
        </Animated.View>
        <Text style={styles.loadingText}>Checking biometric support...</Text>
      </View>
    )
  }

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <LinearGradient
        colors={["#667eea", "#764ba2", "#f093fb"]}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <BlurView intensity={20} tint="light" style={styles.backBlur}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </BlurView>
        </TouchableOpacity>

        <Animated.View 
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <Animated.View 
            style={[
              styles.fingerprintContainer,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
              style={styles.fingerprintCircle}
            >
              <Ionicons name="finger-print" size={80} color="#fff" />
            </LinearGradient>
          </Animated.View>
          
          <Text style={styles.title}>Biometric Setup</Text>
          <Text style={styles.subtitle}>
            Secure your attendance with fingerprint or face recognition
          </Text>
        </Animated.View>

        {/* Wave Effect */}
        <View style={styles.waveContainer}>
          <View style={[styles.wave, styles.wave1]} />
          <View style={[styles.wave, styles.wave2]} />
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Device Support Status */}
        <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="phone-portrait-outline" size={24} color="#667eea" />
            <Text style={styles.sectionTitle}>Device Support</Text>
          </View>

          <View style={styles.supportCard}>
            <LinearGradient
              colors={["#ffffff", "#f8fafc"]}
              style={styles.supportCardGradient}
            >
              <View style={styles.supportItem}>
                <View 
                  style={[
                    styles.supportIconContainer,
                    { backgroundColor: biometricSupport.hasHardware ? '#dcfce7' : '#fee2e2' }
                  ]}
                >
                  <Ionicons
                    name={biometricSupport.hasHardware ? "checkmark" : "close"}
                    size={20}
                    color={biometricSupport.hasHardware ? "#16a34a" : "#dc2626"}
                  />
                </View>
                <View style={styles.supportTextContainer}>
                  <Text style={styles.supportLabel}>Biometric Hardware</Text>
                  <Text style={styles.supportValue}>
                    {biometricSupport.hasHardware ? "Available" : "Not Available"}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.supportItem}>
                <View 
                  style={[
                    styles.supportIconContainer,
                    { backgroundColor: biometricSupport.isEnrolled ? '#dcfce7' : '#fee2e2' }
                  ]}
                >
                  <Ionicons
                    name={biometricSupport.isEnrolled ? "checkmark" : "close"}
                    size={20}
                    color={biometricSupport.isEnrolled ? "#16a34a" : "#dc2626"}
                  />
                </View>
                <View style={styles.supportTextContainer}>
                  <Text style={styles.supportLabel}>Device Setup</Text>
                  <Text style={styles.supportValue}>
                    {biometricSupport.isEnrolled ? "Configured" : "Not Configured"}
                  </Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.supportItem}>
                <View style={[styles.supportIconContainer, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="information" size={20} color="#2563eb" />
                </View>
                <View style={styles.supportTextContainer}>
                  <Text style={styles.supportLabel}>Supported Types</Text>
                  <Text style={styles.supportValue}>
                    {biometricService.getBiometricTypeString(biometricSupport.supportedTypes)}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Dev Mode Warning */}
        {process.env.EXPO_PUBLIC_DEV_MODE === "true" && (
          <View style={styles.devSection}>
            <LinearGradient
              colors={["#fef3c7", "#fde68a"]}
              style={styles.devGradient}
            >
              <View style={styles.devIconContainer}>
                <Ionicons name="code-slash" size={24} color="#92400e" />
              </View>
              <View style={styles.devContent}>
                <Text style={styles.devTitle}>Development Mode</Text>
                <Text style={styles.devText}>
                  Running in dev mode. Biometric operations will be simulated.
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Setup Progress */}
        {enrolling && (
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>Enrollment Progress</Text>
            <View style={styles.progressBar}>
              <Animated.View 
                style={[
                  styles.progressFill,
                  { width: progressWidth }
                ]}
              >
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressGradient}
                />
              </Animated.View>
            </View>
            <View style={styles.stepsContainer}>
              {['Ready', 'Scanning', 'Complete'].map((step, index) => (
                <View 
                  key={index}
                  style={[
                    styles.stepItem,
                    currentStep >= index && styles.stepActive
                  ]}
                >
                  <View style={styles.stepDot} />
                  <Text style={styles.stepLabel}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={24} color="#667eea" />
            <Text style={styles.sectionTitle}>How It Works</Text>
          </View>

          <View style={styles.instructionsContainer}>
            {[
              {
                icon: "settings-outline",
                color: "#3b82f6",
                title: "Enable Biometrics",
                description: "Ensure biometric authentication is set up in your device settings"
              },
              {
                icon: "finger-print",
                color: "#8b5cf6",
                title: "Enroll Your Data",
                description: "Tap the enroll button below to register your biometric data"
              },
              {
                icon: "shield-checkmark",
                color: "#10b981",
                title: "Secure Attendance",
                description: "Use your biometric to quickly mark attendance in class"
              }
            ].map((instruction, index) => (
              <View key={index} style={styles.instructionCard}>
                <View style={styles.instructionLeft}>
                  <View 
                    style={[
                      styles.instructionNumber,
                      { backgroundColor: instruction.color + '20' }
                    ]}
                  >
                    <Text style={[styles.instructionNumberText, { color: instruction.color }]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View 
                    style={[
                      styles.instructionIconContainer,
                      { backgroundColor: instruction.color + '20' }
                    ]}
                  >
                    <Ionicons name={instruction.icon} size={24} color={instruction.color} />
                  </View>
                </View>
                <View style={styles.instructionRight}>
                  <Text style={styles.instructionTitle}>{instruction.title}</Text>
                  <Text style={styles.instructionDescription}>{instruction.description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {!enrolled && (
            <TouchableOpacity
              style={[
                styles.enrollButton,
                (!biometricSupport.isSupported && process.env.EXPO_PUBLIC_DEV_MODE !== "true") && styles.buttonDisabled,
                enrolling && styles.buttonDisabled,
              ]}
              onPress={handleEnrollment}
              disabled={(!biometricSupport.isSupported && process.env.EXPO_PUBLIC_DEV_MODE !== "true") || enrolling}
            >
              <LinearGradient
                colors={enrolling || (!biometricSupport.isSupported && process.env.EXPO_PUBLIC_DEV_MODE !== "true")
                  ? ['#9ca3af', '#6b7280'] 
                  : ['#667eea', '#764ba2']
                }
                style={styles.enrollButtonGradient}
              >
                <Ionicons 
                  name={enrolling ? "hourglass-outline" : "finger-print"} 
                  size={24} 
                  color="white" 
                />
                <Text style={styles.enrollButtonText}>
                  {enrolling ? "Enrolling..." : "Enroll Biometric"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.testButton} 
            onPress={testBiometric}
          >
            <Ionicons name="play-circle-outline" size={24} color="#667eea" />
            <Text style={styles.testButtonText}>Test Biometric</Text>
          </TouchableOpacity>
        </View>

        {/* Warning Message */}
        {!biometricSupport.isSupported && process.env.EXPO_PUBLIC_DEV_MODE !== "true" && (
          <View style={styles.warningSection}>
            <LinearGradient
              colors={["#fef3c7", "#fde68a"]}
              style={styles.warningGradient}
            >
              <View style={styles.warningIconContainer}>
                <Ionicons name="warning" size={32} color="#f59e0b" />
              </View>
              <View style={styles.warningContent}>
                <Text style={styles.warningTitle}>Setup Required</Text>
                <Text style={styles.warningText}>
                  Biometric authentication is not available on this device. Please set up 
                  fingerprint or face recognition in your device settings first.
                </Text>
              </View>
            </LinearGradient>
          </View>
        )}

        {/* Success Message */}
        {enrolled && (
          <View style={styles.successSection}>
            <LinearGradient
              colors={["#dcfce7", "#bbf7d0"]}
              style={styles.successGradient}
            >
              <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
              <Text style={styles.successTitle}>Enrollment Successful!</Text>
              <Text style={styles.successText}>
                You can now use biometric authentication to mark attendance
              </Text>
            </LinearGradient>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  loadingGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    position: 'relative',
    overflow: 'hidden',
  },
  backButton: {
    marginBottom: 20,
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
  },
  backBlur: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerContent: {
    alignItems: "center",
    zIndex: 2,
  },
  fingerprintContainer: {
    marginBottom: 20,
  },
  fingerprintCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.3)",
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.95)",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  waveContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 10,
    zIndex: 1,
  },
  wave: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 10,
    backgroundColor: "#fafafa",
  },
  wave1: {
    bottom: -10,
    opacity: 0.5,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    transform: [{ scaleX: 1.2 }],
  },
  wave2: {
    bottom: 0,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  supportCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  supportCardGradient: {
    padding: 20,
  },
  supportItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  supportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportTextContainer: {
    flex: 1,
  },
  supportLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 2,
  },
  supportValue: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#e2e8f0",
    marginVertical: 16,
  },
  devSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  devGradient: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  devIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(146, 64, 14, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  devContent: {
    flex: 1,
  },
  devTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#92400e",
    marginBottom: 4,
  },
  devText: {
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
  },
  progressSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
  },
  progressGradient: {
    flex: 1,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepItem: {
    alignItems: 'center',
    opacity: 0.4,
  },
  stepActive: {
    opacity: 1,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#667eea',
    marginBottom: 4,
  },
  stepLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  instructionsContainer: {
    gap: 12,
  },
  instructionCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    gap: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  instructionLeft: {
    alignItems: 'center',
    gap: 8,
  },
  instructionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionNumberText: {
    fontSize: 16,
    fontWeight: "800",
  },
  instructionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionRight: {
    flex: 1,
    justifyContent: 'center',
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  instructionDescription: {
    fontSize: 14,
    color: "#64748b",
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  enrollButton: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
    elevation: 1,
  },
  enrollButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  enrollButtonText: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
  },
  testButton: {
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#667eea",
    gap: 10,
  },
  testButtonText: {
    color: "#667eea",
    fontSize: 17,
    fontWeight: "700",
  },
  warningSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  warningGradient: {
    flexDirection: "row",
    padding: 20,
    gap: 16,
  },
  warningIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningContent: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#92400e",
    marginBottom: 6,
  },
  warningText: {
    fontSize: 14,
    color: "#92400e",
    lineHeight: 20,
  },
  successSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  successGradient: {
    alignItems: 'center',
    padding: 32,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#166534",
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    fontSize: 15,
    color: "#166534",
    textAlign: 'center',
    lineHeight: 22,
  },
})