/**
 * Auth Context
 * Manages global authentication state (token, user, loading)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import storageService, { type StoredUser } from '../services/storageService';
import apiClient from '../services/apiClient';

interface AuthState {
  token: string | null;
  user: StoredUser | null;
  isLoading: boolean; // true while checking stored session on app start
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  signIn: (token: string, user: StoredUser) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // On mount: restore session from AsyncStorage
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const [token, user] = await Promise.all([
          storageService.getToken(),
          storageService.getUser(),
        ]);

        if (token && user) {
          // Attach token to API client
          apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;
          setState({
            token,
            user,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch {
        // If storage fails, just show login
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    restoreSession();
  }, []);

  const signIn = useCallback(async (token: string, user: StoredUser) => {
    // Save to storage
    await storageService.saveSession(token, user);

    // Attach token to API client for future requests
    apiClient.defaults.headers.common.Authorization = `Bearer ${token}`;

    setState({
      token,
      user,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const signOut = useCallback(async () => {
    // Clear storage
    await storageService.clearSession();

    // Remove token from API client
    delete apiClient.defaults.headers.common.Authorization;

    setState({
      token: null,
      user: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Hook to access auth context
 */
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
