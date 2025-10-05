import { useAuth } from "@/context/AuthContext"
import { router } from "expo-router"
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
  Dimensions,
  Pressable
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { Image } from "expo-image"

const { width } = Dimensions.get('window')

export default function LoginScreen() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)
  const { login } = useAuth()
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

    // Pulse animation for logo
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

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields")
      return
    }

    setLoading(true)
    const result = await login(email, password)
    setLoading(false)

    if (!result.success) {
      Alert.alert("Login Failed", result.error)
    }
  }

  const fillDemoCredentials = (role: string) => {
    switch (role) {
      case "admin":
        setEmail("admin@example.com")
        setPassword("Admin123!")
        break
      case "teacher":
        setEmail("teacher@example.com")
        setPassword("Teacher123!")
        break
      case "student":
        setEmail("student1@example.com")
        setPassword("Student123!")
        break
    }
  }

  const getDemoRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return ["#dc2626", "#b91c1c"]
      case "teacher":
        return ["#2563eb", "#1d4ed8"]
      case "student":
        return ["#10b981", "#059669"]
      default:
        return ["#64748b", "#475569"]
    }
  }

  const getDemoRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return "shield-checkmark"
      case "teacher":
        return "school"
      case "student":
        return "book"
      default:
        return "person"
    }
  }

  return (
    <View style={styles.container}>
      {/* Animated Background Gradient */}
      <LinearGradient
        colors={["#667eea", "#764ba2", "#f093fb"]}
        style={styles.backgroundGradient}
      >
        {/* Floating Orbs */}
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
          {/* Logo and Header */}
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
                <Image source={require('../../assets/images/icon.png')} style={{width: 100, height: 60}} />
                {/* <Ionicons name="finger-print" size={60} color="#fff" /> */}
              </LinearGradient>
            </View>
            <Text style={styles.appName}>Unizik</Text>
            <Text style={styles.tagline}>Discipline, Self-Reliance and Excellence</Text>
          </Animated.View>

          {/* Login Form Card */}
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
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue</Text>

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
                      value={email}
                      onChangeText={setEmail}
                      placeholder="your.email@example.com"
                      placeholderTextColor="#94a3b8"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      onFocus={() => setFocusedInput('email')}
                      onBlur={() => setFocusedInput(null)}
                    />
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
                      value={password}
                      onChangeText={setPassword}
                      placeholder="Enter your password"
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
                </View>

                {/* Forgot Password */}
                <TouchableOpacity style={styles.forgotPassword}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.buttonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={loading ? ['#9ca3af', '#6b7280'] : ['#667eea', '#764ba2']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.loginGradient}
                  >
                    {loading ? (
                      <Ionicons name="hourglass-outline" size={24} color="#fff" />
                    ) : (
                      <Ionicons name="log-in-outline" size={24} color="#fff" />
                    )}
                    <Text style={styles.loginButtonText}>
                      {loading ? "Signing In..." : "Sign In"}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Demo Accounts */}
                <View style={styles.demoContainer}>
                  <View style={styles.demoHeader}>
                    <View style={styles.divider} />
                    <Text style={styles.demoTitle}>Quick Demo Login</Text>
                    <View style={styles.divider} />
                  </View>

                  <View style={styles.demoGrid}>
                    {['admin', 'teacher', 'student'].map((role) => (
                      <Pressable
                        key={role}
                        style={({ pressed }) => [
                          styles.demoCard,
                          pressed && styles.demoCardPressed
                        ]}
                        onPress={() => fillDemoCredentials(role)}
                      >
                        <LinearGradient
                          colors={getDemoRoleColor(role)}
                          style={styles.demoGradient}
                        >
                          <View style={styles.demoIconContainer}>
                            <Ionicons 
                              name={getDemoRoleIcon(role)} 
                              size={24} 
                              color="#fff" 
                            />
                          </View>
                          <Text style={styles.demoRoleText}>
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </Text>
                          <View style={styles.demoArrow}>
                            <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.8)" />
                          </View>
                        </LinearGradient>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {/* Sign Up Link */}
                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>Don't have an account? </Text>
                  <TouchableOpacity onPress={() => router.push('/signup')}>
                    <Text style={styles.signupLink}>Sign Up</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </BlurView>
          </Animated.View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Secure • Fast • Reliable</Text>
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
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 8,
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
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748b",
    marginBottom: 32,
    fontWeight: "500",
  },
  inputContainer: {
    marginBottom: 20,
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
    height: 56,
    gap: 12,
  },
  inputWrapperFocused: {
    borderColor: '#667eea',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
    fontWeight: "500",
  },
  eyeButton: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#667eea',
    fontSize: 14,
    fontWeight: '600',
  },
  loginButton: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loginGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  demoContainer: {
    marginTop: 8,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  demoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  demoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  demoCard: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  demoCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  demoGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  demoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  demoRoleText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },
  demoArrow: {
    opacity: 0.8,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  signupText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
  },
  signupLink: {
    fontSize: 15,
    color: '#667eea',
    fontWeight: '700',
  },
  footer: {
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
})