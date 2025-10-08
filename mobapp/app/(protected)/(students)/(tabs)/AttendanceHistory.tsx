import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AttendanceHistory from '../../../../components/AttendanceHistory';

export default function AttendanceHistoryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AttendanceHistory />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
});