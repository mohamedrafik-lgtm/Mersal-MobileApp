/**
 * API Configuration
 */

export const API_BASE_URL = 'https://api.mersall.me';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
  },
  POINTS: {
    MY_POINTS: '/points/my-points',
  },
  CHANNELS: {
    LIST: '/channels',
  },
  CAMPAIGNS: {
    LIST: '/campaigns',
    DASHBOARD_STATS: '/campaigns/dashboard-stats',
  },
  CONTACTS: {
    LIST: '/contacts',
  },
};

export const REQUEST_TIMEOUT = 30000; // 30 seconds
