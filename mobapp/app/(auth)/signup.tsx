import { useState, useRef, useEffect } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Pressable
} from "react-native"
import { Picker } from "@react-native-picker/picker"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "@/context/AuthContext"
import { router } from "expo-router"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Image } from "expo-image"

export default function SignupScreen() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT",
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)
  const { register } = useAuth()
  const insets = useSafeAreaInsets()

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(50)).current
  const logoScale = useRef(new Animated.Value(0.8)).current
  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()

    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  const handleRegister = async () => {
    const { firstName, lastName, email, password, confirmPassword, role } = formData

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match")
      return
    }

    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters long")
      return
    }

    // Check password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$.,!%*?&])[A-Za-z\d@$.,!%*?&]/
    if (!passwordRegex.test(password)) {
      Alert.alert(
        "Error", 
        "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character (@$.,!%*?&)"
      )
      return
    }

    setLoading(true)
    const result = await register({ firstName, lastName, email, password, role })
    setLoading(false)

    if (result.success) {
      Alert.alert(
        "Success", 
        "Account created successfully! Please sign in.", 
        [{ text: "OK", onPress: () => router.push("/login") }]
      )
    } else {
      Alert.alert("Registration Failed", result.error)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return ["#dc2626", "#b91c1c"]
      case "TEACHER":
        return ["#2563eb", "#1d4ed8"]
      case "STUDENT":
        return ["#10b981", "#059669"]
      default:
        return ["#64748b", "#475569"]
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "shield-checkmark"
      case "TEACHER":
        return "school"
      case "STUDENT":
        return "book"
      default:
        return "person"
    }
  }

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, label: '', color: '#e2e8f0' }
    
    let score = 0
    let label = 'Very Weak'
    let color = '#ef4444'
    
    // Length check
    if (password.length >= 8) score += 25
    
    // Lowercase check
    if (/[a-z]/.test(password)) score += 25
    
    // Uppercase check  
    if (/[A-Z]/.test(password)) score += 25
    
    // Number check
    if (/\d/.test(password)) score += 12.5
    
    // Special character check (backend specific characters)
    if (/[@$.,!%*?&]/.test(password)) score += 12.5
    
    if (score >= 100) {
      label = 'Strong'
      color = '#10b981'
    } else if (score >= 75) {
      label = 'Good'
      color = '#3b82f6'
    } else if (score >= 50) {
      label = 'Fair'
      color = '#f59e0b'
    } else if (score >= 25) {
      label = 'Weak'
      color = '#ef4444'
    }
    
    return { strength: score, label, color }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <View style={styles.container}>
      {/* Background Gradient */}
      <LinearGradient
        colors={["#667eea", "#764ba2", "#f093fb"]}
        style={styles.backgroundGradient}
      >
        <Animated.View style={[styles.orb, styles.orb1, { transform: [{ scale: pulseAnim }] }]} />
        <Animated.View style={[styles.orb, styles.orb2]} />
        <Animated.View style={[styles.orb, styles.orb3]} />
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContainer, { paddingTop: insets.top + 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <Animated.View 
            style={[
              styles.headerContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: logoScale }]
              }
            ]}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
                style={styles.logoCircle}
              >
                <Image
                  source={require("../../assets/images/logo.png")}
                  style={styles.logoImage}
                />
                {/* <Ionicons name="person-add" size={60} color="#fff" /> */}
              </LinearGradient>
            </View>
            <Text style={styles.appName}>Create Your Unizik Account</Text>
            <Text style={styles.tagline}>Discipline, Self-Reliance and Excellence</Text>
          </Animated.View>

          {/* Form Card */}
          <Animated.View 
            style={[
              styles.formCard,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <BlurView intensity={80} tint="light" style={styles.formBlur}>
              <View style={styles.formContent}>
                <Text style={styles.title}>Create Account</Text>
                <Text style={styles.subtitle}>Fill in your details to get started</Text>

                {/* First Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>First Name</Text>
                  <View 
                    style={[
                      styles.inputWrapper,
                      focusedInput === 'firstName' && styles.inputWrapperFocused
                    ]}
                  >
                    <Ionicons 
                      name="person-outline" 
                      size={20} 
                      color={focusedInput === 'firstName' ? "#667eea" : "#94a3b8"} 
                    />
                    <TextInput
                      style={styles.input}
                      value={formData.firstName}
                      onChangeText={(value) => updateFormData("firstName", value)}
                      placeholder="John"
                      placeholderTextColor="#94a3b8"
                      autoCapitalize="words"
                      onFocus={() => setFocusedInput('firstName')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                </View>

                {/* Last Name Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Last Name</Text>
                  <View 
                    style={[
                      styles.inputWrapper,
                      focusedInput === 'lastName' && styles.inputWrapperFocused
                    ]}
                  >
                    <Ionicons 
                      name="person-outline" 
                      size={20} 
                      color={focusedInput === 'lastName' ? "#667eea" : "#94a3b8"} 
                    />
                    <TextInput
                      style={styles.input}
                      value={formData.lastName}
                      onChangeText={(value) => updateFormData("lastName", value)}
                      placeholder="Doe"
                      placeholderTextColor="#94a3b8"
                      autoCapitalize="words"
                      onFocus={() => setFocusedInput('lastName')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                </View>

                {/* Email Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Email Address</Text>
                  <View 
                    style={[
                      styles.inputWrapper,
                      focusedInput === 'email' && styles.inputWrapperFocused
                    ]}
                  >
                    <Ionicons 
                      name="mail-outline" 
                      size={20} 
                      color={focusedInput === 'email' ? "#667eea" : "#94a3b8"} 
                    />
                    <TextInput
                      style={styles.input}
                      value={formData.email}
                      onChangeText={(value) => updateFormData("email", value)}
                      placeholder="john@example.com"
                      placeholderTextColor="#94a3b8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setFocusedInput('email')}
                      onBlur={() => setFocusedInput(null)}
                    />
                  </View>
                </View>

                {/* Role Selection */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Select Your Role</Text>
                  <View style={styles.roleGrid}>
                    {['STUDENT', 'TEACHER'].map((role) => (
                      <Pressable
                        key={role}
                        style={[
                          styles.roleCard,
                          formData.role === role && styles.roleCardSelected
                        ]}
                        onPress={() => updateFormData("role", role)}
                      >
                        <LinearGradient
                          colors={formData.role === role 
                            ? getRoleColor(role) 
                            : ['#f8fafc', '#f1f5f9']
                          }
                          style={styles.roleGradient}
                        >
                          <Ionicons 
                            name={getRoleIcon(role)} 
                            size={24} 
                            color={formData.role === role ? "#fff" : "#64748b"} 
                          />
                          <Text style={[
                            styles.roleText,
                            formData.role === role && styles.roleTextSelected
                          ]}>
                            {role.charAt(0) + role.slice(1).toLowerCase()}
                          </Text>
                          {formData.role === role && (
                            <View style={styles.checkmark}>
                              <Ionicons name="checkmark-circle" size={20} color="#fff" />
                            </View>
                          )}
                        </LinearGradient>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Password</Text>
                  <View 
                    style={[
                      styles.inputWrapper,
                      focusedInput === 'password' && styles.inputWrapperFocused
                    ]}
                  >
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={20} 
                      color={focusedInput === 'password' ? "#667eea" : "#94a3b8"} 
                    />
                    <TextInput
                      style={styles.input}
                      value={formData.password}
                      onChangeText={(value) => updateFormData("password", value)}
                      placeholder="8+ chars, A-z, 0-9, @$.,!%*?&"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      onFocus={() => setFocusedInput('password')}
                      onBlur={() => setFocusedInput(null)}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color="#94a3b8" 
                      />
                    </TouchableOpacity>
                  </View>
                  
                  {/* Password Requirements */}
                  <Text style={styles.requirementsText}>
                    Must include: lowercase, uppercase, number, special character (@$.,!%*?&)
                  </Text>
                  
                  {/* Password Strength Indicator */}
                  {formData.password.length > 0 && (
                    <View style={styles.strengthContainer}>
                      <View style={styles.strengthBar}>
                        <View 
                          style={[
                            styles.strengthFill,
                            { 
                              width: `${passwordStrength.strength}%`,
                              backgroundColor: passwordStrength.color 
                            }
                          ]} 
                        />
                      </View>
                      <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
                        {passwordStrength.label}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Confirm Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <View 
                    style={[
                      styles.inputWrapper,
                      focusedInput === 'confirmPassword' && styles.inputWrapperFocused,
                      formData.confirmPassword && formData.password !== formData.confirmPassword && styles.inputWrapperError
                    ]}
                  >
                    <Ionicons 
                      name="lock-closed-outline" 
                      size={20} 
                      color={focusedInput === 'confirmPassword' ? "#667eea" : "#94a3b8"} 
                    />
                    <TextInput
                      style={styles.input}
                      value={formData.confirmPassword}
                      onChangeText={(value) => updateFormData("confirmPassword", value)}
                      placeholder="Re-enter your password"
                      placeholderTextColor="#94a3b8"
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      onFocus={() => setFocusedInput('confirmPassword')}
                      onBlur={() => setFocusedInput(null)}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={styles.eyeButton}
                    >
                      <Ionicons 
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color="#94a3b8" 
                      />
                    </TouchableOpacity>
                  </View>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <Text style={styles.errorText}>Passwords do not match</Text>
                  )}
                </View>

                {/* Register Button */}
                <TouchableOpacity
                  style={[styles.registerButton, loading && styles.buttonDisabled]}
                  onPress={handleRegister}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={loading ? ['#9ca3af', '#6b7280'] : ['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.registerGradient}
                  >
                    {loading ? (
                      <Ionicons name="hourglass-outline" size={24} color="#fff" />
                    ) : (
                      <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
                    )}
                    <Text style={styles.registerButtonText}>
                      {loading ? "Creating Account..." : "Create Account"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Sign In Link */}
                <View style={styles.signinContainer}>
                  <Text style={styles.signinText}>Already have an account? </Text>
                  <TouchableOpacity onPress={() => router.push('/login')}>
                    <Text style={styles.signinLink}>Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>By signing up, you agree to our Terms & Privacy Policy</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.2,
  },
  orb1: {
    width: 300,
    height: 300,
    top: -100,
    right: -100,
    backgroundColor: '#fbbf24',
  },
  orb2: {
    width: 200,
    height: 200,
    bottom: 100,
    left: -50,
    backgroundColor: '#ec4899',
  },
  orb3: {
    width: 150,
    height: 150,
    top: 200,
    left: 50,
    backgroundColor: '#8b5cf6',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 6,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  appName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  formCard: {
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  formBlur: {
    overflow: 'hidden',
  },
  formContent: {
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 24,
    fontWeight: "500",
  },
  inputContainer: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 54,
    gap: 12,
  },
  inputWrapperFocused: {
    borderColor: '#667eea',
    backgroundColor: '#fff',
  },
  inputWrapperError: {
    borderColor: '#ef4444',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1e293b',
    fontWeight: "500",
  },
  eyeButton: {
    padding: 4,
  },
  roleGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  roleCard: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  roleCardSelected: {
    elevation: 4,
  },
  roleGradient: {
    padding: 14,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  roleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  roleTextSelected: {
    color: '#fff',
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  strengthContainer: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
    fontWeight: '500',
  },
  requirementsText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
    fontWeight: '400',
    lineHeight: 16,
  },
  registerButton: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  registerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  signinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signinText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  signinLink: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 18,
  },
  logoImage: {
    width: 100,
    height: 60,
    resizeMode: 'contain',
  },
})