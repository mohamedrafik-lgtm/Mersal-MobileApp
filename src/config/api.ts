/**
 * API Configuration
 */

export const API_BASE_URL = 'https://api.mersall.me';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  POINTS: {
    MY_POINTS: '/points/my-points',
    MY_STATS: '/points/my-stats',
    MY_TRANSACTIONS: '/points/my-transactions-paginated',
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
