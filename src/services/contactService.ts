/**
 * Contact Service
 * Handles contact CRUD operations with pagination
 */

import { ENDPOINTS } from '../config';
import apiClient from './apiClient';

// ─── Types ───────────────────────────────────────────────

export interface Contact {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
  channels?: {
    id: string;
    name: string;
    phoneNumber: string;
  }[];
}

export interface ContactsListParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedContacts {
  data: Contact[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateContactRequest {
  name: string;
  phoneNumber: string;
  notes?: string;
  channelIds?: string[];
}

export interface UpdateContactRequest {
  name?: string;
  phoneNumber?: string;
  notes?: string;
  channelIds?: string[];
}

// ─── Service ─────────────────────────────────────────────

const contactService = {
  /**
   * Get contacts with pagination & search
   */
  getContacts: async (params?: ContactsListParams): Promise<PaginatedContacts> => {
    const queryParams: Record<string, string> = {};
    if (params?.page) {
      queryParams.page = String(params.page);
    }
    if (params?.limit) {
      queryParams.limit = String(params.limit);
    }
    if (params?.search) {
      queryParams.search = params.search;
    }

    const response = await apiClient.get(ENDPOINTS.CONTACTS.LIST, {
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
      data: Array.isArray(raw.data) ? raw.data : (Array.isArray(raw) ? raw : []),
      total: raw.total ?? raw.data?.length ?? 0,
      page: raw.page ?? params?.page ?? 1,
      limit: raw.limit ?? params?.limit ?? 20,
      totalPages: raw.totalPages ?? raw.lastPage ?? 1,
    };
  },

  /**
   * Create a new contact
   */
  createContact: async (data: CreateContactRequest): Promise<Contact> => {
    if (__DEV__) {
      console.log('[createContact] sending:', JSON.stringify(data));
    }
    const response = await apiClient.post(ENDPOINTS.CONTACTS.LIST, data);
    const result = response.data?.data || response.data;
    if (__DEV__) {
      console.log('[createContact] result:', JSON.stringify(result));
    }
    return result;
  },

  /**
   * Delete a contact by ID
   */
  deleteContact: async (id: string): Promise<void> => {
    await apiClient.delete(`${ENDPOINTS.CONTACTS.LIST}/${id}`);
  },

  /**
   * Update a contact by ID
   */
  updateContact: async (id: string, data: UpdateContactRequest): Promise<Contact> => {
    if (__DEV__) {
      console.log('[updateContact] id:', id, 'data:', JSON.stringify(data));
    }
    const response = await apiClient.put(`${ENDPOINTS.CONTACTS.LIST}/${id}`, data);
    const result = response.data?.data || response.data;
    if (__DEV__) {
      console.log('[updateContact] result:', JSON.stringify(result));
    }
    return result;
  },

  /**
   * Delete all contacts
   */
  deleteAllContacts: async (): Promise<void> => {
    await apiClient.delete(ENDPOINTS.CONTACTS.LIST);
  },
};

export default contactService;
