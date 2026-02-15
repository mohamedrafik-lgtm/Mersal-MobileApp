/**
 * Axios API Client
 */

import axios from 'axios';
import { API_BASE_URL, REQUEST_TIMEOUT } from '../config';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  config => {
    // Token is attached via AuthContext (apiClient.defaults.headers.common.Authorization)
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response interceptor
apiClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Server responded with error status
      const message =
        error.response.data?.message ||
        error.response.data?.error ||
        'حدث خطأ في الاتصال بالخادم';
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // No response received
      return Promise.reject(new Error('لا يمكن الاتصال بالخادم. تحقق من اتصالك بالإنترنت'));
    }
    return Promise.reject(error);
  },
);

export default apiClient;
