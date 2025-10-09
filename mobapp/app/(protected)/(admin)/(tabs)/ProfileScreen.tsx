import { useState, useEffect, useRef, use } from "react"
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ScrollView,
  Animated,
  Pressable,
  Platform
} from "react-native"
import { LinearGradient } from "expo-linear-gradient"
import { BlurView } from "expo-blur"
import { Ionicons } from "@expo/vector-icons"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/context/ToastContext"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useRouter } from "expo-router"

export default function ProfileScreen() {
  const { user, logout } = useAuth()
  const toast = useToast()
  const navigation = useRouter();
  const insets = useSafeAreaInsets()
  const [showActions, setShowActions] = useState(false)
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(30)).current
  const scaleAnim = useRef(new Animated.Value(0.9)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // For web, show a simple confirmation
      if (confirm('Are you sure you want to logout?')) {
        logout(toast)
      }
    } else {
      // For mobile, use native Alert
      Alert.alert(
        "Logout", 
        "Are you sure you want to logout?", 
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Logout", 
            style: "destructive", 
            onPress: async () => {
              await logout(toast)
            }
          },
        ]
      )
    }
  }

  const getRoleBadgeColor = (role: string) => {
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

  const getAvatarGradient = (role: string) => {
    switch (role) {
      case "ADMIN":
        return ["#f87171", "#dc2626"]
      case "TEACHER":
        return ["#60a5fa", "#2563eb"]
      case "STUDENT":
        return ["#34d399", "#10b981"]
      default:
        return ["#94a3b8", "#64748b"]
    }
  }

  return (
    <View style={styles.container}>
      {/* Enhanced Header with Gradient */}

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
      <LinearGradient
        colors={getAvatarGradient(user?.role)}
        style={[styles.header, { paddingTop: insets.top + 20 }]}
      >
        {/* Background Orbs */}
        <View style={[styles.orb, styles.orb1]} />
        <View style={[styles.orb, styles.orb2]} />

        <Animated.View 
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Avatar with Gradient */}
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={["rgba(255,255,255,0.3)", "rgba(255,255,255,0.1)"]}
              style={styles.avatarCircle}
            >
              <Text style={styles.avatarText}>
                {user?.name?.[0]?.toUpperCase()}
              </Text>
            </LinearGradient>
            
            {/* Role Badge on Avatar */}
            <View style={styles.roleBadgeOnAvatar}>
              <LinearGradient
                colors={getRoleBadgeColor(user?.role)}
                style={styles.roleIconContainer}
              >
                <Ionicons name={getRoleIcon(user?.role)} size={16} color="#fff" />
              </LinearGradient>
            </View>
          </View>

          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          
          {/* Role Badge */}
          <BlurView intensity={20} tint="light" style={styles.roleBadge}>
            <Ionicons name={getRoleIcon(user?.role)} size={14} color="#fff" />
            <Text style={styles.roleText}>{user?.role}</Text>
          </BlurView>
        </Animated.View>

        {/* Wave Effect */}
        <View style={styles.waveContainer}>
          <View style={[styles.wave, styles.wave1]} />
          <View style={[styles.wave, styles.wave2]} />
        </View>
      </LinearGradient>
        {/* Stats Cards */}
        <Animated.View 
          style={[
            styles.statsContainer,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.statCard}>
            <LinearGradient
              colors={["#ffffff", "#f8fafc"]}
              style={styles.statCardGradient}
            >
              <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="calendar-outline" size={24} color="#2563eb" />
              </View>
              <Text style={styles.statValue}>
                {user?.createdAt 
                  ? Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                  : 0}
              </Text>
              <Text style={styles.statLabel}>Days Active</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={["#ffffff", "#f8fafc"]}
              style={styles.statCardGradient}
            >
              <View style={[styles.statIconContainer, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="checkmark-circle-outline" size={24} color="#10b981" />
              </View>
              <Text style={styles.statValue}>95%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={["#ffffff", "#f8fafc"]}
              style={styles.statCardGradient}
            >
              <View style={[styles.statIconContainer, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="trophy-outline" size={24} color="#f59e0b" />
              </View>
              <Text style={styles.statValue}>A+</Text>
              <Text style={styles.statLabel}>Grade</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Account Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={24} color="#667eea" />
            <Text style={styles.sectionTitle}>Account Information</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: '#dbeafe' }]}>
                <Ionicons name="person-outline" size={20} color="#2563eb" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Full Name</Text>
                <Text style={styles.infoValue}>{user?.name}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: '#fce7f3' }]}>
                <Ionicons name="mail-outline" size={20} color="#ec4899" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email Address</Text>
                <Text style={styles.infoValue}>{user?.email}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="shield-outline" size={20} color="#10b981" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Role</Text>
                <Text style={styles.infoValue}>{user?.role}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="calendar-outline" size={20} color="#f59e0b" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Member Since</Text>
                <Text style={styles.infoValue}>
                  {user?.createdAt 
                    ? new Date(user.createdAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })
                    : "N/A"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="options-outline" size={24} color="#667eea" />
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>

          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={["#667eea", "#764ba2"]}
                style={styles.actionGradient}
              >
                <Ionicons name="settings-outline" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionLabel}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => navigation.push("SystemSettings")}>
              <LinearGradient
                colors={["#f093fb", "#f5576c"]}
                style={styles.actionGradient}
              >
                <Ionicons name="notifications-outline" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionLabel}>Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={["#4facfe", "#00f2fe"]}
                style={styles.actionGradient}
              >
                <Ionicons name="help-circle-outline" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionLabel}>Help</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <LinearGradient
                colors={["#43e97b", "#38f9d7"]}
                style={styles.actionGradient}
              >
                <Ionicons name="information-circle-outline" size={24} color="#fff" />
              </LinearGradient>
              <Text style={styles.actionLabel}>About</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list-outline" size={24} color="#667eea" />
            <Text style={styles.sectionTitle}>Preferences</Text>
          </View>

          <View style={styles.settingsList}>
            <Pressable 
              style={({ pressed }) => [
                styles.settingItem,
                pressed && styles.settingPressed
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: '#ede9fe' }]}>
                  <Ionicons name="moon-outline" size={20} color="#8b5cf6" />
                </View>
                <Text style={styles.settingText}>Dark Mode</Text>
              </View>
              <Ionicons name="toggle" size={32} color="#94a3b8" />
            </Pressable>

            <Pressable 
              style={({ pressed }) => [
                styles.settingItem,
                pressed && styles.settingPressed
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: '#fce7f3' }]}>
                  <Ionicons name="notifications-outline" size={20} color="#ec4899" />
                </View>
                <Text style={styles.settingText}>Push Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </Pressable>

            <Pressable 
              style={({ pressed }) => [
                styles.settingItem,
                pressed && styles.settingPressed
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: '#dbeafe' }]}>
                  <Ionicons name="lock-closed-outline" size={20} color="#2563eb" />
                </View>
                <Text style={styles.settingText}>Privacy & Security</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
            </Pressable>

            <Pressable 
              style={({ pressed }) => [
                styles.settingItem,
                pressed && styles.settingPressed
              ]}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.settingIconContainer, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="language-outline" size={20} color="#10b981" />
                </View>
                <Text style={styles.settingText}>Language</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>English</Text>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
        >
          <LinearGradient
            colors={["#fee2e2", "#fecaca"]}
            style={styles.logoutGradient}
          >
            <Ionicons name="log-out-outline" size={24} color="#dc2626" />
            <Text style={styles.logoutText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* App Version */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Unizik v1.0.0</Text>
          <Text style={styles.footerSubtext}>Made with care</Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    position: 'relative',
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.2,
  },
  orb1: {
    width: 200,
    height: 200,
    top: -50,
    right: -50,
    backgroundColor: '#fff',
  },
  orb2: {
    width: 150,
    height: 150,
    bottom: 20,
    left: -40,
    backgroundColor: '#fff',
  },
  headerContent: {
    alignItems: "center",
    zIndex: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "800",
    color: "#fff",
  },
  roleBadgeOnAvatar: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#fff',
  },
  roleIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: "rgba(255,255,255,0.95)",
    marginBottom: 12,
    fontWeight: "500",
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    overflow: 'hidden',
  },
  roleText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: -30,
    marginBottom: 20,
    gap: 12,
    zIndex: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statCardGradient: {
    padding: 16,
    alignItems: 'center',
    marginTop: 30,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1e293b",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "600",
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 2,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '23%',
    alignItems: 'center',
  },
  actionGradient: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  actionLabel: {
    fontSize: 11,
    color: "#334155",
    fontWeight: "600",
    marginTop: 8,
    textAlign: 'center',
  },
  settingsList: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  settingPressed: {
    backgroundColor: '#f8fafc',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  logoutButton: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: "#dc2626",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  logoutGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  logoutText: {
    fontSize: 17,
    color: "#dc2626",
    fontWeight: "700",
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "600",
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 12,
    color: "#cbd5e1",
  },
})