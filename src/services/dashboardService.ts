/**
 * Dashboard Service
 * Fetches dashboard stats, points balance, and channels data
 */

import { ENDPOINTS } from '../config';
import apiClient from './apiClient';

// ─── Types ───────────────────────────────────────────────

export interface PointsResponse {
  points: number;
}

export interface Channel {
  id: string;
  name: string;
  status: string;
  phoneNumber: string;
  connectionStatus: string;
  isConnected: boolean;
  createdAt: string;
  lastConnected?: string | null;
}

export interface CreateChannelRequest {
  name: string;
  phoneNumber: string;
}

export interface CreateChannelResponse {
  id: string;
  name: string;
  phoneNumber: string;
  status: string;
  sessionData: string | null;
  qrCode: string | null;
  lastConnected: string | null;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChartDataItem {
  name: string;
  value: number;
}

export interface RecentCampaign {
  id: string;
  name: string;
  status: string;
  sentCount: number;
  totalCount: number;
  createdAt: string;
}

export interface DashboardStats {
  totalSent: number;
  totalFailed: number;
  totalMessages: number;
  totalReplied: number;
  deliveryRate: number;
  campaignCount: number;
  totalChannels: number;
  connectedChannels: number;
  points: number;
  chartData: ChartDataItem[];
  recentCampaigns: RecentCampaign[];
}

// ─── Service ─────────────────────────────────────────────

const dashboardService = {
  /**
   * Get full dashboard stats (single endpoint)
   */
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get<DashboardStats>(
      ENDPOINTS.CAMPAIGNS.DASHBOARD_STATS,
    );
    return response.data;
  },

  /**
   * Get current user's points balance
   */
  getMyPoints: async (): Promise<PointsResponse> => {
    const response = await apiClient.get<PointsResponse>(
      ENDPOINTS.POINTS.MY_POINTS,
    );
    return response.data;
  },

  /**
   * Get all channels
   */
  getChannels: async (): Promise<Channel[]> => {
    const response = await apiClient.get<Channel[]>(ENDPOINTS.CHANNELS.LIST);
    return response.data;
  },

  /**
   * Create a new channel
   */
  createChannel: async (data: CreateChannelRequest): Promise<CreateChannelResponse> => {
    const response = await apiClient.post(
      ENDPOINTS.CHANNELS.LIST,
      data,
    );
    // Handle both direct and wrapped API responses
    const result = response.data?.data || response.data;
    if (__DEV__) {
      console.log('[createChannel] raw response.data:', JSON.stringify(response.data));
      console.log('[createChannel] resolved result:', JSON.stringify(result));
    }
    return result;
  },

  /**
   * Get a single channel by ID (used for polling QR code)
   */
  getChannel: async (id: string): Promise<CreateChannelResponse> => {
    const response = await apiClient.get(
      `${ENDPOINTS.CHANNELS.LIST}/${id}`,
    );
    // Handle both direct and wrapped API responses
    const result = response.data?.data || response.data;
    return result;
  },

  /**
   * Delete a channel by ID
   */
  deleteChannel: async (id: string): Promise<void> => {
    await apiClient.delete(`${ENDPOINTS.CHANNELS.LIST}/${id}`);
  },
};

export default dashboardService;
