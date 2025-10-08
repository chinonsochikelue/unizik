import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { apiService } from '../services/api';

interface AttendanceRecord {
  id: string;
  sessionId: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  markedAt: string;
  notes?: string;
  session: {
    id: string;
    code: string;
    startTime: string;
    endTime?: string;
    class: {
      id: string;
      name: string;
      code: string;
    };
  };
}

interface AttendanceSummary {
  totalSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  excusedCount: number;
  attendanceRate: number;
}

interface AttendanceHistoryProps {
  classId?: string; // Optional: to filter by specific class
}

export default function AttendanceHistory({ classId }: AttendanceHistoryProps) {
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadAttendanceHistory = async (pageNum: number = 1, refresh: boolean = false) => {
    try {
      if (pageNum === 1) {
        setLoading(true);
      }

      const params = {
        page: pageNum,
        limit: 20,
        ...(classId && { classId }),
      };

      const response = await apiService.getStudentAttendanceHistory(params);
      const newRecords = response.data.attendance || [];
      
      if (refresh || pageNum === 1) {
        setAttendanceHistory(newRecords);
      } else {
        setAttendanceHistory(prev => [...prev, ...newRecords]);
      }

      setHasMore(newRecords.length === 20);
      setPage(pageNum);
      
      // Load summary if it's the first page
      if (pageNum === 1) {
        loadSummary();
      }
    } catch (error) {
      console.error('Error loading attendance history:', error);
      Alert.alert('Error', 'Failed to load attendance history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadSummary = async () => {
    try {
      const response = classId 
        ? await apiService.getStudentClassAttendance(classId)
        : await apiService.getStudentAttendanceSummary();
      
      setSummary(response.data.summary || response.data);
    } catch (error) {
      console.error('Error loading attendance summary:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAttendanceHistory(1, true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      loadAttendanceHistory(page + 1);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAttendanceHistory(1, true);
    }, [classId])
  );

  const getStatusColor = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'PRESENT':
        return '#22c55e';
      case 'LATE':
        return '#f59e0b';
      case 'ABSENT':
        return '#ef4444';
      case 'EXCUSED':
        return '#6366f1';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: AttendanceRecord['status']) => {
    switch (status) {
      case 'PRESENT':
        return 'checkmark-circle';
      case 'LATE':
        return 'time';
      case 'ABSENT':
        return 'close-circle';
      case 'EXCUSED':
        return 'shield-checkmark';
      default:
        return 'help-circle';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const renderAttendanceRecord = ({ item }: { item: AttendanceRecord }) => {
    const { date, time } = formatDateTime(item.session.startTime);
    const markedTime = formatDateTime(item.markedAt);

    return (
      <TouchableOpacity
        style={styles.recordCard}
        onPress={() => {
          setSelectedRecord(item);
          setModalVisible(true);
        }}
      >
        <View style={styles.recordHeader}>
          <View style={styles.classInfo}>
            <Text style={styles.className}>{item.session.class.name}</Text>
            <Text style={styles.classCode}>{item.session.class.code}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Ionicons
              name={getStatusIcon(item.status)}
              size={16}
              color="white"
              style={styles.statusIcon}
            />
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.recordDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="time" size={16} color="#6b7280" />
            <Text style={styles.detailText}>{time}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="code" size={16} color="#6b7280" />
            <Text style={styles.detailText}>Session: {item.session.code}</Text>
          </View>
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Notes:</Text>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderSummary = () => {
    if (!summary) return null;

    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Attendance Summary</Text>
        
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, styles.presentCard]}>
            <Text style={styles.summaryNumber}>{summary.presentCount}</Text>
            <Text style={styles.summaryLabel}>Present</Text>
          </View>
          
          <View style={[styles.summaryCard, styles.absentCard]}>
            <Text style={styles.summaryNumber}>{summary.absentCount}</Text>
            <Text style={styles.summaryLabel}>Absent</Text>
          </View>
          
          <View style={[styles.summaryCard, styles.lateCard]}>
            <Text style={styles.summaryNumber}>{summary.lateCount}</Text>
            <Text style={styles.summaryLabel}>Late</Text>
          </View>
          
          <View style={[styles.summaryCard, styles.excusedCard]}>
            <Text style={styles.summaryNumber}>{summary.excusedCount}</Text>
            <Text style={styles.summaryLabel}>Excused</Text>
          </View>
        </View>

        <View style={styles.attendanceRateContainer}>
          <Text style={styles.attendanceRateLabel}>Attendance Rate</Text>
          <Text style={styles.attendanceRateValue}>
            {(summary.attendanceRate * 100).toFixed(1)}%
          </Text>
        </View>
      </View>
    );
  };

  const renderDetailModal = () => {
    if (!selectedRecord) return null;

    const sessionTime = formatDateTime(selectedRecord.session.startTime);
    const markedTime = formatDateTime(selectedRecord.markedAt);

    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Attendance Details</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Class Information</Text>
                <Text style={styles.modalText}>{selectedRecord.session.class.name}</Text>
                <Text style={styles.modalSubText}>{selectedRecord.session.class.code}</Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Session Details</Text>
                <Text style={styles.modalText}>Code: {selectedRecord.session.code}</Text>
                <Text style={styles.modalText}>Date: {sessionTime.date}</Text>
                <Text style={styles.modalText}>Time: {sessionTime.time}</Text>
                {selectedRecord.session.endTime && (
                  <Text style={styles.modalText}>
                    Ended: {formatDateTime(selectedRecord.session.endTime).time}
                  </Text>
                )}
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Attendance Status</Text>
                <View style={styles.modalStatusContainer}>
                  <Ionicons
                    name={getStatusIcon(selectedRecord.status)}
                    size={24}
                    color={getStatusColor(selectedRecord.status)}
                  />
                  <Text style={[styles.modalStatusText, { color: getStatusColor(selectedRecord.status) }]}>
                    {selectedRecord.status}
                  </Text>
                </View>
                <Text style={styles.modalText}>
                  Marked at: {markedTime.date} {markedTime.time}
                </Text>
              </View>

              {selectedRecord.notes && (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>Notes</Text>
                  <Text style={styles.modalText}>{selectedRecord.notes}</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={attendanceHistory}
        renderItem={renderAttendanceRecord}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderSummary}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No attendance records found</Text>
            <Text style={styles.emptySubText}>
              Your attendance history will appear here once you start attending classes
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        contentContainerStyle={attendanceHistory.length === 0 ? styles.emptyListContainer : undefined}
        showsVerticalScrollIndicator={false}
      />

      {renderDetailModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  summaryContainer: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    width: '48%',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  presentCard: {
    backgroundColor: '#dcfce7',
  },
  absentCard: {
    backgroundColor: '#fee2e2',
  },
  lateCard: {
    backgroundColor: '#fef3c7',
  },
  excusedCard: {
    backgroundColor: '#e0e7ff',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  attendanceRateContainer: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  attendanceRateLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  attendanceRateValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 4,
  },
  recordCard: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  classCode: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  recordDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
  notesContainer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#4b5563',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '90%',
    maxHeight: '80%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalText: {
    fontSize: 16,
    color: '#1f2937',
    marginBottom: 4,
  },
  modalSubText: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalStatusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});