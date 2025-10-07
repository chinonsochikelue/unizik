import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export const useAttendance = () => {
  const [activeSessions, setActiveSessions] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user, isAuthenticated } = useAuth();
  
  // Ref to store the polling interval
  const pollingInterval = useRef(null);

  // Fetch active sessions
  const fetchActiveSessions = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      setError(null);
      const response = await apiService.get('/sessions/active');
      const sessions = response.data || [];
      setActiveSessions(sessions);
      return sessions;
    } catch (error) {
      console.error('Error fetching active sessions:', error);
      const errorMessage = error.response?.data?.error || 'Failed to fetch sessions';
      setError(errorMessage);
      return [];
    }
  }, [isAuthenticated]);

  // Fetch attendance history
  const fetchAttendanceHistory = useCallback(async (limit = 20) => {
    if (!isAuthenticated) return;
    
    try {
      setError(null);
      const response = await apiService.get(`/attendance/history?limit=${limit}`);
      const history = response.data || [];
      setAttendanceHistory(history);
      return history;
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      const errorMessage = error.response?.data?.error || 'Failed to fetch attendance history';
      setError(errorMessage);
      return [];
    }
  }, [isAuthenticated]);

  // Join session and mark attendance (integrated flow)
  const joinSessionAndMarkAttendance = useCallback(async (sessionCode, biometricToken) => {
    if (!isAuthenticated || !user?.id) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.post('/sessions/join-and-mark-attendance', {
        sessionCode: sessionCode.toUpperCase(),
        biometricToken
      });

      const result = response.data;
      
      // Update active sessions and attendance history in real-time
      await Promise.all([
        fetchActiveSessions(),
        fetchAttendanceHistory()
      ]);
      
      return {
        success: true,
        data: result,
        message: result.message || 'Attendance marked successfully'
      };
    } catch (error) {
      console.error('Error joining session and marking attendance:', error);
      const errorData = error.response?.data;
      
      let errorMessage = 'Failed to mark attendance';
      let errorCode = null;
      
      if (errorData) {
        errorCode = errorData.code;
        errorMessage = errorData.error || errorMessage;
      }
      
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage,
        code: errorCode
      };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, fetchActiveSessions, fetchAttendanceHistory]);

  // Start real-time polling for active sessions
  const startPolling = useCallback((intervalMs = 15000) => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }
    
    // Initial fetch
    fetchActiveSessions();
    
    // Set up polling for real-time updates
    pollingInterval.current = setInterval(() => {
      fetchActiveSessions();
    }, intervalMs);
  }, [fetchActiveSessions]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  }, []);

  // Initialize data on mount and start real-time updates
  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveSessions();
      fetchAttendanceHistory();
      startPolling(15000); // Poll every 15 seconds for real-time updates
    }

    return () => {
      stopPolling(); // Cleanup on unmount
    };
  }, [isAuthenticated]);

  // Utility functions
  const getAttendanceStatus = useCallback((sessionId) => {
    return attendanceHistory.find(attendance => 
      attendance.session?.id === sessionId
    );
  }, [attendanceHistory]);

  const hasMarkedAttendance = useCallback((sessionId) => {
    return !!getAttendanceStatus(sessionId);
  }, [getAttendanceStatus]);

  const getAttendanceStats = useCallback(() => {
    if (!attendanceHistory.length) return null;

    const total = attendanceHistory.length;
    const present = attendanceHistory.filter(a => a.status === 'PRESENT').length;
    const late = attendanceHistory.filter(a => a.status === 'LATE').length;
    const attendanceRate = Math.round((present / total) * 100);

    return {
      total,
      present,
      late,
      attendanceRate
    };
  }, [attendanceHistory]);

  return {
    // Real-time state
    activeSessions,
    attendanceHistory,
    loading,
    error,
    
    // Actions
    joinSessionAndMarkAttendance,
    
    // Utilities
    getAttendanceStatus,
    hasMarkedAttendance,
    getAttendanceStats,
    
    // Manual refresh
    refresh: useCallback(async () => {
      await Promise.all([
        fetchActiveSessions(),
        fetchAttendanceHistory()
      ]);
    }, [fetchActiveSessions, fetchAttendanceHistory])
  };
};
