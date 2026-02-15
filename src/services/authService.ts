/**
 * Authentication Service
 */

import { ENDPOINTS } from '../config';
import apiClient from './apiClient';

export interface LoginRequest {
  email: string;
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
};

export default authService;
