/**
 * Storage Service
 * Handles persisting auth session (JWT + user info) via AsyncStorage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AUTH_TOKEN: '@morasel_auth_token',
  USER_DATA: '@morasel_user_data',
};

export interface StoredUser {
  id: number;
  name: string;
  email: string;
}

const storageService = {
  /**
   * Save JWT token
   */
  saveToken: async (token: string): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  /**
   * Get stored JWT token
   */
  getToken: async (): Promise<string | null> => {
    return AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  /**
   * Save user data
   */
  saveUser: async (user: StoredUser): Promise<void> => {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  },

  /**
   * Get stored user data
   */
  getUser: async (): Promise<StoredUser | null> => {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  },

  /**
   * Save entire auth session (token + user) at once
   */
  saveSession: async (token: string, user: StoredUser): Promise<void> => {
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.AUTH_TOKEN, token],
      [STORAGE_KEYS.USER_DATA, JSON.stringify(user)],
    ]);
  },

  /**
   * Clear auth session (logout)
   */
  clearSession: async (): Promise<void> => {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_DATA,
    ]);
  },
};

export default storageService;
