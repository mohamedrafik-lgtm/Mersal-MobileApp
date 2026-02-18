/**
 * Points Service
 * Handles points, stats & transactions
 */

import { ENDPOINTS } from '../config';
import apiClient from './apiClient';

// ─── Types ───────────────────────────────────────────────

export interface MyPointsResponse {
  points: number;
}

export interface PointsStats {
  currentPoints: number;
  totalSpent: number;
  totalReceived: number;
  transactionCount: number;
}

export type TransactionType = 'admin_add' | 'admin_deduct' | 'campaign_deduct';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

export interface TransactionsListParams {
  page?: number;
  limit?: number;
  type?: TransactionType;
}

export interface PaginatedTransactions {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ─── Service ─────────────────────────────────────────────

const pointsService = {
  /**
   * Get my current points balance
   */
  getMyPoints: async (): Promise<MyPointsResponse> => {
    const response = await apiClient.get(ENDPOINTS.POINTS.MY_POINTS);
    const result = response.data?.data || response.data;
    return result;
  },

  /**
   * Get points statistics
   */
  getMyStats: async (): Promise<PointsStats> => {
    const response = await apiClient.get(ENDPOINTS.POINTS.MY_STATS);
    const result = response.data?.data || response.data;
    return result;
  },

  /**
   * Get paginated transactions
   */
  getTransactions: async (
    params?: TransactionsListParams,
  ): Promise<PaginatedTransactions> => {
    const queryParams: Record<string, string> = {};
    if (params?.page) {
      queryParams.page = String(params.page);
    }
    if (params?.limit) {
      queryParams.limit = String(params.limit);
    }
    if (params?.type) {
      queryParams.type = params.type;
    }

    const response = await apiClient.get(ENDPOINTS.POINTS.MY_TRANSACTIONS, {
      params: queryParams,
    });

    const raw = response.data?.data || response.data;

    // Handle both paginated and array responses
    if (Array.isArray(raw)) {
      return {
        data: raw,
        total: raw.length,
        page: params?.page || 1,
        limit: params?.limit || 20,
        totalPages: 1,
      };
    }

    return {
      data: Array.isArray(raw.data) ? raw.data : [],
      total: raw.total ?? 0,
      page: raw.page ?? params?.page ?? 1,
      limit: raw.limit ?? params?.limit ?? 20,
      totalPages: raw.totalPages ?? raw.lastPage ?? 1,
    };
  },
};

export default pointsService;
