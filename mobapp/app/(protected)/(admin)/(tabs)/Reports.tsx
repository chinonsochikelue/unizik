"use client"

import { useState, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from "react-native"
import { LineChart, BarChart } from "react-native-chart-kit"
import { Ionicons } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { api } from "@/services/api"
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

  useEffect(() => {
    loadReportData()
  }, [startDate, endDate, selectedReport])

  const loadReportData = async () => {
    setLoading(true)
    try {
      const params = {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
        type: selectedReport,
      }

      const response = await api.get("/reports/detailed", { params })
      if (response.success) {
        setReportData(response.data)
      }
    } catch (error) {
      console.error("Error loading report data:", error)
      Alert.alert("Error", "Failed to load report data")
    } finally {
      setLoading(false)
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

      const response = await api.get("/reports/export", { params })
      if (response.success) {
        // Create CSV content
        const csvContent = response.data.csvData
        const fileName = `${selectedReport}_report_${startDate.toISOString().split("T")[0]}_to_${
          endDate.toISOString().split("T")[0]
        }.csv`

        // Save file
        const fileUri = FileSystem.documentDirectory + fileName
        await FileSystem.writeAsStringAsync(fileUri, csvContent)

        // Share file
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

  const attendanceChartData = {
    labels: reportData?.chartData?.labels || [],
    datasets: [
      {
        data: reportData?.chartData?.attendanceRates || [],
        color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  }

  const classChartData = {
    labels: reportData?.chartData?.classLabels || [],
    datasets: [
      {
        data: reportData?.chartData?.classAttendance || [],
      },
    ],
  }

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
              <LineChart
                data={attendanceChartData}
                width={width - 40}
                height={220}
                chartConfig={{
                  backgroundColor: "#ffffff",
                  backgroundGradientFrom: "#ffffff",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 1,
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
          )}

          {selectedReport === "classes" && (
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Class Attendance Comparison</Text>
              <BarChart
                data={classChartData}
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
