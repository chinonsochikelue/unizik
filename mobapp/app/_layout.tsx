import { Slot, SplashScreen } from 'expo-router';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import ToastContainer from '@/components/Toast';
import { useEffect } from 'react';
import { StatusBar, View, Platform } from 'react-native';

// Import Sonner Toaster for web
let Toaster = null
if (Platform.OS === 'web') {
  try {
    // Use require for better React Native Web compatibility
    const sonner = require('sonner')
    Toaster = sonner.Toaster
    console.log('Sonner Toaster loaded successfully')
  } catch (error) {
    console.warn('Sonner Toaster not available:', error)
  }
}

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const myTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: 'white',
    card: '#101010',
    background: '#101010',
    text: '#ffffff',
    border: '#202020',
  },
};

export default function RootLayout() {
  useEffect(() => {
    // Hide splash screen after a short delay
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 1000);
  }, []);

  return (
    <ThemeProvider value={myTheme}>
      <ToastProvider>
        <AuthProvider>
          <View style={{ flex: 1 }}>
            <StatusBar barStyle="light-content" />
            <Slot />
            {Platform.OS === 'web' ? (
              Toaster && <Toaster 
                position="top-right" 
                closeButton 
                richColors 
                theme="light"
                expand
              />
            ) : (
              <ToastContainer />
            )}
          </View>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
