"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from "react-native"
import { LineChart, BarChart, PieChart } from "react-native-chart-kit"
import { Ionicons } from "@expo/vector-icons"
import { apiService } from "@/services/api"

const { width } = Dimensions.get("window")

const AdminDashboard = ({ navigation }) => {
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const response = await apiService.get("/reports/dashboard")
      if (response.success) {
        setDashboardData(response.data)
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadDashboardData()
  }

  const StatCard = ({ title, value, icon, color, onPress }) => (
    <TouchableOpacity style={[styles.statCard, { borderLeftColor: color }]} onPress={onPress}>
      <View style={styles.statContent}>
        <View style={styles.statText}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={styles.statValue}>{value}</Text>
        </View>
        <Ionicons name={icon} size={32} color={color} />
      </View>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading dashboard...</Text>
      </View>
    )
  }

  const attendanceData = {
    labels: dashboardData?.attendanceTrend?.labels || [],
    datasets: [
      {
        data: dashboardData?.attendanceTrend?.data || [],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  }

  const classDistribution = {
    labels: dashboardData?.classDistribution?.labels || [],
    datasets: [
      {
        data: dashboardData?.classDistribution?.data || [],
      },
    ],
  }

  const roleDistribution = dashboardData?.roleDistribution || []

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Admin Dashboard</Text>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Total Students"
          value={dashboardData?.totalStudents || 0}
          icon="people"
          color="#3b82f6"
          onPress={() => navigation.navigate("UserManagement", { role: "STUDENT" })}
        />
        <StatCard
          title="Total Teachers"
          value={dashboardData?.totalTeachers || 0}
          icon="school"
          color="#10b981"
          onPress={() => navigation.navigate("UserManagement", { role: "TEACHER" })}
        />
        <StatCard
          title="Active Classes"
          value={dashboardData?.totalClasses || 0}
          icon="library"
          color="#f59e0b"
          onPress={() => navigation.navigate("ClassManagement")}
        />
        <StatCard
          title="Today's Sessions"
          value={dashboardData?.todaySessions || 0}
          icon="time"
          color="#ef4444"
          onPress={() => navigation.navigate("SessionManagement")}
        />
      </View>

      {/* Attendance Trend Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Attendance Trend (Last 7 Days)</Text>
        <LineChart
          data={attendanceData}
          width={width - 40}
          height={220}
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: "6",
              strokeWidth: "2",
              stroke: "#22c55e",
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Class Distribution Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Students per Class</Text>
        <BarChart
          data={classDistribution}
          width={width - 40}
          height={220}
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          style={styles.chart}
        />
      </View>

      {/* Role Distribution Pie Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>User Role Distribution</Text>
        <PieChart
          data={roleDistribution}
          width={width - 40}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="count"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
        />
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("UserManagement")}>
            <Ionicons name="people" size={24} color="#3b82f6" />
            <Text style={styles.actionText}>Manage Users</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("Reports")}>
            <Ionicons name="analytics" size={24} color="#10b981" />
            <Text style={styles.actionText}>View Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => navigation.navigate("SystemSettings")}>
            <Ionicons name="settings" size={24} color="#f59e0b" />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    margin: 20,
    marginBottom: 10,
  },
  statsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statText: {
    flex: 1,
  },
  statTitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  chartContainer: {
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
  chartTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 15,
  },
  chart: {
    borderRadius: 16,
  },
  actionsContainer: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
  },
})

export default AdminDashboard
