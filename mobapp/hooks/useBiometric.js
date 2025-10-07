import { useState, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export const useBiometric = () => {
  const [isScanning, setIsScanning] = useState(false);
  const { user } = useAuth();

  const checkBiometricSupport = useCallback(async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      return {
        hasHardware,
        supportedTypes,
        isEnrolled,
        isSupported: hasHardware && isEnrolled && supportedTypes.length > 0
      };
    } catch (error) {
      console.error('Biometric check error:', error);
      return {
        hasHardware: false,
        supportedTypes: [],
        isEnrolled: false,
        isSupported: false
      };
    }
  }, []);

  const authenticateWithBiometric = useCallback(async () => {
    setIsScanning(true);
    
    try {
      // Check biometric support
      const biometricInfo = await checkBiometricSupport();
      
      if (!biometricInfo.isSupported) {
        Alert.alert(
          'Biometric Authentication',
          'Biometric authentication is not available on this device or not set up.',
          [
            {
              text: 'Use Simulated Auth',
              onPress: () => {
                // For demo purposes, return simulated biometric token
                const simulatedToken = `bio-${user?.id}-${Date.now()}`;
                return simulatedToken;
              }
            }
          ]
        );
        return null;
      }

      // Perform biometric authentication
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Scan your fingerprint to mark attendance',
        subtitle: 'Biometric authentication required',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false
      });

      if (result.success) {
        // Generate biometric token with user ID and timestamp
        const biometricToken = `bio-${user?.id}-${Date.now()}`;
        return biometricToken;
      } else {
        const errorMessages = {
          'user_cancel': 'Authentication was cancelled',
          'user_fallback': 'User chose fallback authentication',
          'system_cancel': 'Authentication was cancelled by system',
          'passcode_not_set': 'Passcode is not set on the device',
          'biometric_not_available': 'Biometric authentication is not available',
          'biometric_not_enrolled': 'No biometric data is enrolled',
          'biometric_error': 'Biometric authentication failed'
        };
        
        const message = errorMessages[result.error] || 'Authentication failed';
        Alert.alert('Authentication Failed', message);
        return null;
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      
      // For development/testing, provide simulated authentication
      Alert.alert(
        'Biometric Error',
        'Biometric authentication failed. Use simulated authentication for testing?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Use Simulated',
            onPress: () => {
              const simulatedToken = `bio-${user?.id}-${Date.now()}`;
              return simulatedToken;
            }
          }
        ]
      );
      return null;
    } finally {
      setIsScanning(false);
    }
  }, [user?.id, checkBiometricSupport]);

  const simulateBiometricAuth = useCallback(() => {
    // For testing purposes when biometric hardware is not available
    return `bio-${user?.id}-${Date.now()}`;
  }, [user?.id]);

  return {
    isScanning,
    checkBiometricSupport,
    authenticateWithBiometric,
    simulateBiometricAuth
  };
};