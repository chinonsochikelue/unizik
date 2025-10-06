"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, RefreshControl } from "react-native"
import { LineChart, BarChart, PieChart } from "react-native-gifted-charts"
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
      if (response.data?.success) {
        setDashboardData(response.data.data)
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

  const attendanceData = (dashboardData?.attendanceTrend?.data || []).map((value, index) => ({
    value: value,
    label: dashboardData?.attendanceTrend?.labels?.[index] || "",
  }))

  const classDistributionData = (dashboardData?.classDistribution?.data || []).map((value, index) => ({
    value: value,
    label: dashboardData?.classDistribution?.labels?.[index] || "",
    frontColor: "#3b82f6",
  }))

  const roleDistributionData = (dashboardData?.roleDistribution || []).map((item, index) => ({
    value: item.count,
    color: item.color,
    text: `${item.name}\n${item.count}`,
  }))

  const hasValidData = (data) => data && Array.isArray(data) && data.length > 0

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
          title="Total Admins"
          value={dashboardData?.totalAdmins || 0}
          icon="shield"
          color="#8b5cf6"
          onPress={() => navigation.navigate("UserManagement", { role: "ADMIN" })}
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
        {hasValidData(attendanceData) ? (
          <LineChart
            data={attendanceData}
            width={width - 80}
            height={220}
            color="#22c55e"
            thickness={3}
            curved
            dataPointsColor="#22c55e"
            dataPointsRadius={6}
            spacing={50}
            backgroundColor="#ffffff"
            hideRules
            xAxisColor="#e5e7eb"
            yAxisColor="#e5e7eb"
            yAxisTextStyle={{ color: "#6b7280" }}
            xAxisLabelTextStyle={{ color: "#6b7280", fontSize: 10 }}
            noOfSections={5}
            maxValue={100}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No attendance data available</Text>
          </View>
        )}
      </View>

      {/* Class Distribution Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Students per Class</Text>
        {hasValidData(classDistributionData) ? (
          <BarChart
            data={classDistributionData}
            width={width - 80}
            height={220}
            barWidth={30}
            spacing={20}
            roundedTop
            roundedBottom
            hideRules
            xAxisThickness={1}
            yAxisThickness={1}
            xAxisColor="#e5e7eb"
            yAxisColor="#e5e7eb"
            yAxisTextStyle={{ color: "#6b7280" }}
            xAxisLabelTextStyle={{ color: "#6b7280", fontSize: 10, textAlign: "center" }}
            noOfSections={5}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No class distribution data available</Text>
          </View>
        )}
      </View>

      {/* Role Distribution Pie Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>User Role Distribution</Text>
        {hasValidData(roleDistributionData) ? (
          <View style={styles.pieChartWrapper}>
            <PieChart
              data={roleDistributionData}
              radius={100}
              showText
              textColor="#ffffff"
              textSize={12}
              focusOnPress
              showValuesAsLabels
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="pie-chart-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyStateText}>No role distribution data available</Text>
          </View>
        )}
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
  pieChartWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
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
