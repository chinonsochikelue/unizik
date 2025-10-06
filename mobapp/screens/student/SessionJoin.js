import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { apiService } from '@/services/api';

export default function SessionJoin({ navigation }) {
  const { user, isAuthenticated } = useAuth();
  const [sessionCode, setSessionCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinSession = async () => {
    if (!sessionCode.trim()) {
      Alert.alert('Error', 'Please enter a session code');
      return;
    }

    if (!isAuthenticated) {
      Alert.alert('Error', 'Please login to continue');
      return;
    }

    setLoading(true);
    try {
      const response = await apiService.post('/sessions/join', {
        sessionCode: sessionCode.toUpperCase()
      });

      const result = response.data;
      Alert.alert(
        'Success',
        result.message || 'Successfully joined session',
        [
          {
            text: 'OK',
            onPress: () => {
              setSessionCode('');
              // Navigate back or to attendance screen
              navigation?.goBack();
            }
          }
        ]
      );
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to join session';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="enter-outline" size={64} color="#2196F3" />
        <Text style={styles.title}>Join Session</Text>
        <Text style={styles.subtitle}>
          Enter the session code provided by your teacher
        </Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Session Code</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter session code"
          value={sessionCode}
          onChangeText={setSessionCode}
          autoCapitalize="characters"
          autoCorrect={false}
          returnKeyType="done"
          onSubmitEditing={handleJoinSession}
        />

        <TouchableOpacity
          style={[styles.joinButton, loading && styles.buttonDisabled]}
          onPress={handleJoinSession}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="enter-outline" size={20} color="#FFF" />
              <Text style={styles.joinButtonText}>Join Session</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.info}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={24} color="#2196F3" />
          <Text style={styles.infoText}>
            Ask your teacher for the session code to join the current class session.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
  },
  joinButton: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  joinButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
});