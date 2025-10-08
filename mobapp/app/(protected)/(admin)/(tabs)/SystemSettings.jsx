"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Switch, Alert } from "react-native"
import { Ionicons } from "@expo/vector-icons"
import { apiService } from "@/services/api"

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    systemName: "Student Attendance System",
    allowSelfRegistration: false,
    sessionTimeout: 120,
    biometricRequired: true,
    emailNotifications: true,
    backupFrequency: "daily",
    maxLoginAttempts: 3,
    passwordMinLength: 8,
  })
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const response = await apiService.get("/admin/settings")
      if (response.success) {
        setSettings(response.data)
      }
    } catch (error) {
      console.error("Error loading settings:", error)
    }
  }

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const saveSettings = async () => {
    setLoading(true)
    try {
      const response = await apiService.put("/admin/settings", settings)
      if (response.success) {
        Alert.alert("Success", "Settings saved successfully")
        setHasChanges(false)
      }
    } catch (error) {
      console.error("Error saving settings:", error)
      Alert.alert("Error", "Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  const resetToDefaults = () => {
    Alert.alert("Reset Settings", "Are you sure you want to reset all settings to defaults?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset",
        style: "destructive",
        onPress: () => {
          setSettings({
            systemName: "Student Attendance System",
            allowSelfRegistration: false,
            sessionTimeout: 120,
            biometricRequired: true,
            emailNotifications: true,
            backupFrequency: "daily",
            maxLoginAttempts: 3,
            passwordMinLength: 8,
          })
          setHasChanges(true)
        },
      },
    ])
  }

  const SettingItem = ({ title, description, children }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <View style={styles.settingControl}>{children}</View>
    </View>
  )

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>System Settings</Text>
        {hasChanges && (
          <TouchableOpacity style={styles.saveButton} onPress={saveSettings} disabled={loading}>
            <Ionicons name="save" size={20} color="#ffffff" />
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* General Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>

        <SettingItem title="System Name" description="Display name for the application">
          <TextInput
            style={styles.textInput}
            value={settings.systemName}
            onChangeText={(value) => updateSetting("systemName", value)}
            placeholder="System Name"
          />
        </SettingItem>

        <SettingItem title="Allow Self Registration" description="Allow users to register themselves">
          <Switch
            value={settings.allowSelfRegistration}
            onValueChange={(value) => updateSetting("allowSelfRegistration", value)}
            trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
            thumbColor={settings.allowSelfRegistration ? "#ffffff" : "#f3f4f6"}
          />
        </SettingItem>

        <SettingItem title="Session Timeout" description="Auto-logout time in minutes (0 = never)">
          <TextInput
            style={styles.numberInput}
            value={settings.sessionTimeout.toString()}
            onChangeText={(value) => updateSetting("sessionTimeout", Number.parseInt(value) || 0)}
            keyboardType="numeric"
            placeholder="120"
          />
        </SettingItem>
      </View>

      {/* Security Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Security</Text>

        <SettingItem title="Biometric Required" description="Require biometric authentication for attendance">
          <Switch
            value={settings.biometricRequired}
            onValueChange={(value) => updateSetting("biometricRequired", value)}
            trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
            thumbColor={settings.biometricRequired ? "#ffffff" : "#f3f4f6"}
          />
        </SettingItem>

        <SettingItem title="Max Login Attempts" description="Maximum failed login attempts before lockout">
          <TextInput
            style={styles.numberInput}
            value={settings.maxLoginAttempts.toString()}
            onChangeText={(value) => updateSetting("maxLoginAttempts", Number.parseInt(value) || 3)}
            keyboardType="numeric"
            placeholder="3"
          />
        </SettingItem>

        <SettingItem title="Password Min Length" description="Minimum password length requirement">
          <TextInput
            style={styles.numberInput}
            value={settings.passwordMinLength.toString()}
            onChangeText={(value) => updateSetting("passwordMinLength", Number.parseInt(value) || 8)}
            keyboardType="numeric"
            placeholder="8"
          />
        </SettingItem>
      </View>

      {/* Notification Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>

        <SettingItem title="Email Notifications" description="Send email notifications for important events">
          <Switch
            value={settings.emailNotifications}
            onValueChange={(value) => updateSetting("emailNotifications", value)}
            trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
            thumbColor={settings.emailNotifications ? "#ffffff" : "#f3f4f6"}
          />
        </SettingItem>
      </View>

      {/* Backup Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Backup & Maintenance</Text>

        <SettingItem title="Backup Frequency" description="How often to backup system data">
          <View style={styles.pickerContainer}>
            {["daily", "weekly", "monthly"].map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[styles.pickerOption, settings.backupFrequency === freq && styles.selectedOption]}
                onPress={() => updateSetting("backupFrequency", freq)}
              >
                <Text style={[styles.pickerText, settings.backupFrequency === freq && styles.selectedText]}>
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SettingItem>
      </View>

      {/* System Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Actions</Text>

        <TouchableOpacity style={styles.actionButton} onPress={resetToDefaults}>
          <Ionicons name="refresh" size={20} color="#f59e0b" />
          <Text style={styles.actionButtonText}>Reset to Defaults</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.dangerButton]}
          onPress={() => {
            Alert.alert(
              "Clear All Data",
              "This will permanently delete all system data. This action cannot be undone.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Clear Data",
                  style: "destructive",
                  onPress: () => {
                    // Implement data clearing logic
                    Alert.alert("Feature", "Data clearing will be implemented in production")
                  },
                },
              ],
            )
          }}
        >
          <Ionicons name="trash" size={20} color="#ef4444" />
          <Text style={[styles.actionButtonText, styles.dangerText]}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      {/* System Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Information</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>Version: 1.0.0</Text>
          <Text style={styles.infoText}>Build: 2025.01.15</Text>
          <Text style={styles.infoText}>Database: Connected</Text>
          <Text style={styles.infoText}>Last Backup: Today, 3:00 AM</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: "#ffffff",
    fontWeight: "500",
    marginLeft: 4,
  },
  section: {
    backgroundColor: "#ffffff",
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 14,
    color: "#6b7280",
  },
  settingControl: {
    alignItems: "flex-end",
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    minWidth: 150,
  },
  numberInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    width: 80,
    textAlign: "center",
  },
  pickerContainer: {
    flexDirection: "row",
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
    marginLeft: 4,
  },
  selectedOption: {
    backgroundColor: "#3b82f6",
  },
  pickerText: {
    fontSize: 14,
    color: "#6b7280",
  },
  selectedText: {
    color: "#ffffff",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  dangerButton: {
    borderBottomWidth: 0,
  },
  actionButtonText: {
    fontSize: 16,
    color: "#374151",
    marginLeft: 10,
  },
  dangerText: {
    color: "#ef4444",
  },
  infoContainer: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 15,
  },
  infoText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
})

export default SystemSettings
