"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from "react-native"
import { LineChart, BarChart } from "react-native-gifted-charts"
import { Ionicons } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { apiService } from "@/services/api"
import * as FileSystem from "expo-file-system"
import * as Sharing from "expo-sharing"

const { width } = Dimensions.get("window")

const Reports = () => {
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  const [endDate, setEndDate] = useState(new Date())
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [selectedReport, setSelectedReport] = useState("attendance")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadReportData()
  }, [startDate, endDate, selectedReport])

  const loadReportData = async () => {
    setLoading(true)
    setRefreshing(true)
    try {
      const params = {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        type: selectedReport,
      }

      const response = await apiService.get("/admin/reports", { params })
      if (response.data?.success) {
        setReportData(response.data.data)
      }
    } catch (error) {
      console.error("Error loading report data:", error)
      Alert.alert("Error", "Failed to load report data")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const exportReport = async () => {
    try {
      const params = {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        type: selectedReport,
        format: "csv",
      }

      const response = await apiService.get("/admin/reports/export", { params })
      if (response.data?.success) {
        const csvContent = response.data.data.csvData
        const fileName = `${selectedReport}_report_${startDate.toISOString().split("T")[0]}_to_${
          endDate.toISOString().split("T")[0]
        }.csv`

        const fileUri = FileSystem.documentDirectory + fileName
        await FileSystem.writeAsStringAsync(fileUri, csvContent)

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri)
        } else {
          Alert.alert("Success", `Report saved to ${fileUri}`)
        }
      }
    } catch (error) {
      console.error("Error exporting report:", error)
      Alert.alert("Error", "Failed to export report")
    }
  }

  const ReportTypeButton = ({ type, title, icon, active, onPress }) => (
    <TouchableOpacity style={[styles.reportTypeButton, active && styles.activeReportType]} onPress={onPress}>
      <Ionicons name={icon} size={24} color={active ? "#ffffff" : "#6b7280"} />
      <Text style={[styles.reportTypeText, active && styles.activeReportTypeText]}>{title}</Text>
    </TouchableOpacity>
  )

  const StatCard = ({ title, value, subtitle, color }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  )

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const attendanceChartData = (reportData?.chartData?.attendanceRates || []).map((value, index) => ({
    value: value,
    label: reportData?.chartData?.labels?.[index] || "",
  }))

  const classChartData = (reportData?.chartData?.classAttendance || []).map((value, index) => ({
    value: value,
    label: reportData?.chartData?.classLabels?.[index] || "",
    frontColor: "#3b82f6",
  }))

  const hasValidData = (data) => data && Array.isArray(data) && data.length > 0

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Reports & Analytics</Text>

      {/* Date Range Selector */}
      <View style={styles.dateContainer}>
        <Text style={styles.sectionTitle}>Date Range</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowStartPicker(true)}>
            <Ionicons name="calendar" size={20} color="#3b82f6" />
            <Text style={styles.dateText}>{formatDate(startDate)}</Text>
          </TouchableOpacity>
          <Text style={styles.dateSeparator}>to</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowEndPicker(true)}>
            <Ionicons name="calendar" size={20} color="#3b82f6" />
            <Text style={styles.dateText}>{formatDate(endDate)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Report Type Selector */}
      <View style={styles.reportTypesContainer}>
        <Text style={styles.sectionTitle}>Report Type</Text>
        <View style={styles.reportTypes}>
          <ReportTypeButton
            type="attendance"
            title="Attendance"
            icon="checkmark-circle"
            active={selectedReport === "attendance"}
            onPress={() => setSelectedReport("attendance")}
          />
          <ReportTypeButton
            type="classes"
            title="Classes"
            icon="library"
            active={selectedReport === "classes"}
            onPress={() => setSelectedReport("classes")}
          />
          <ReportTypeButton
            type="users"
            title="Users"
            icon="people"
            active={selectedReport === "users"}
            onPress={() => setSelectedReport("users")}
          />
        </View>
      </View>

      {/* Export Button */}
      <TouchableOpacity style={styles.exportButton} onPress={exportReport}>
        <Ionicons name="download" size={20} color="#ffffff" />
        <Text style={styles.exportText}>Export Report</Text>
      </TouchableOpacity>

      {/* Summary Stats */}
      {reportData && (
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Summary</Text>
          <StatCard
            title="Overall Attendance Rate"
            value={`${reportData.summary?.overallAttendanceRate || 0}%`}
            subtitle={`${reportData.summary?.totalPresent || 0} of ${reportData.summary?.totalSessions || 0} sessions`}
            color="#22c55e"
          />
          <StatCard
            title="Active Classes"
            value={reportData.summary?.activeClasses || 0}
            subtitle={`${reportData.summary?.totalStudents || 0} total students`}
            color="#3b82f6"
          />
          <StatCard
            title="Average Session Attendance"
            value={`${reportData.summary?.averageSessionAttendance || 0}%`}
            subtitle={`${reportData.summary?.totalSessions || 0} sessions analyzed`}
            color="#f59e0b"
          />
        </View>
      )}

      {/* Charts */}
      {reportData?.chartData && (
        <>
          {selectedReport === "attendance" && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Attendance Trend</Text>
              {hasValidData(attendanceChartData) ? (
                <LineChart
                  data={attendanceChartData}
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
                  <Text style={styles.emptyStateText}>No attendance data available for this period</Text>
                </View>
              )}
            </View>
          )}

          {selectedReport === "classes" && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Class Attendance Comparison</Text>
              {hasValidData(classChartData) ? (
                <BarChart
                  data={classChartData}
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
                  <Text style={styles.emptyStateText}>No class data available for this period</Text>
                </View>
              )}
            </View>
          )}
        </>
      )}

      {/* Detailed Data Table */}
      {reportData?.detailedData && (
        <View style={styles.tableContainer}>
          <Text style={styles.sectionTitle}>Detailed Data</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              {reportData.detailedData.headers?.map((header, index) => (
                <Text key={index} style={styles.tableHeaderText}>
                  {header}
                </Text>
              ))}
            </View>
            {reportData.detailedData.rows?.slice(0, 10).map((row, index) => (
              <View key={index} style={styles.tableRow}>
                {row.map((cell, cellIndex) => (
                  <Text key={cellIndex} style={styles.tableCellText}>
                    {cell}
                  </Text>
                ))}
              </View>
            ))}
            {reportData.detailedData.rows?.length > 10 && (
              <Text style={styles.moreDataText}>... and {reportData.detailedData.rows.length - 10} more rows</Text>
            )}
          </View>
        </View>
      )}

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowStartPicker(false)
            if (selectedDate) {
              setStartDate(selectedDate)
            }
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowEndPicker(false)
            if (selectedDate) {
              setEndDate(selectedDate)
            }
          }}
        />
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    margin: 20,
    marginBottom: 10,
  },
  dateContainer: {
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
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 12,
    flex: 1,
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: "#374151",
  },
  dateSeparator: {
    marginHorizontal: 15,
    fontSize: 16,
    color: "#6b7280",
  },
  reportTypesContainer: {
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
  reportTypes: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  reportTypeButton: {
    flex: 1,
    alignItems: "center",
    padding: 15,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  activeReportType: {
    backgroundColor: "#3b82f6",
  },
  reportTypeText: {
    marginTop: 5,
    fontSize: 12,
    color: "#6b7280",
  },
  activeReportTypeText: {
    color: "#ffffff",
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    margin: 20,
    marginTop: 0,
    borderRadius: 12,
    padding: 15,
  },
  exportText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
  statsContainer: {
    margin: 20,
    marginTop: 0,
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
  statTitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
    color: "#9ca3af",
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
  tableContainer: {
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
  table: {
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  tableHeaderText: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  tableCellText: {
    flex: 1,
    padding: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  moreDataText: {
    padding: 12,
    fontSize: 14,
    color: "#9ca3af",
    fontStyle: "italic",
    textAlign: "center",
  },
})

export default Reports
