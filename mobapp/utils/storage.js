import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cross-platform storage utility
class Storage {
  static async getItem(key) {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      } else {
        return await AsyncStorage.getItem(key);
      }
    } catch (error) {
      console.error('Storage getItem error:', error);
      return null;
    }
  }

  static async setItem(key, value) {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
        return Promise.resolve();
      } else {
        return await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.error('Storage setItem error:', error);
      throw error;
    }
  }

  static async removeItem(key) {
    try {
      if (Platform.OS === 'web') {
        localStorage.removeItem(key);
        return Promise.resolve();
      } else {
        return await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Storage removeItem error:', error);
      throw error;
    }
  }

  static async multiRemove(keys) {
    try {
      if (Platform.OS === 'web') {
        keys.forEach(key => localStorage.removeItem(key));
        return Promise.resolve();
      } else {
        return await AsyncStorage.multiRemove(keys);
      }
    } catch (error) {
      console.error('Storage multiRemove error:', error);
      throw error;
    }
  }

  static async clear() {
    try {
      if (Platform.OS === 'web') {
        localStorage.clear();
        return Promise.resolve();
      } else {
        return await AsyncStorage.clear();
      }
    } catch (error) {
      console.error('Storage clear error:', error);
      throw error;
    }
  }

  static async getAllKeys() {
    try {
      if (Platform.OS === 'web') {
        return Object.keys(localStorage);
      } else {
        return await AsyncStorage.getAllKeys();
      }
    } catch (error) {
      console.error('Storage getAllKeys error:', error);
      return [];
    }
  }
}

export default Storage;