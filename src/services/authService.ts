/**
 * Authentication Service
 */

import { ENDPOINTS } from '../config';
import apiClient from './apiClient';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  message?: string;
}

export interface RegisterResponse {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  message?: string;
}

const authService = {
  /**
   * Login with email and password
   */
  login: async (data: LoginRequest): Promise<{ token: string; user: LoginResponse['user'] }> => {
    const response = await apiClient.post<LoginResponse>(
      ENDPOINTS.AUTH.LOGIN,
      data,
    );
    return {
      token: response.data.access_token,
      user: response.data.user,
    };
  },

  /**
   * Register a new account
   */
  register: async (data: RegisterRequest): Promise<{ token: string; user: RegisterResponse['user'] }> => {
    const response = await apiClient.post<RegisterResponse>(
      ENDPOINTS.AUTH.REGISTER,
      data,
    );
    return {
      token: response.data.access_token,
      user: response.data.user,
    };
  },
};

export default authService;
