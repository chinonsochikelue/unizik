import { Slot, SplashScreen } from 'expo-router';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import { AuthProvider } from '@/context/AuthContext';
import { useEffect } from 'react';
import { StatusBar } from 'react-native';

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
      <AuthProvider>
        <StatusBar barStyle="light-content" />
        <Slot />
      </AuthProvider>
    </ThemeProvider>
  );
}