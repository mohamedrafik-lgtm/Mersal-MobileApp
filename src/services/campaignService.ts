/**
 * Campaign Service
 * Handles campaign CRUD operations
 */

import { ENDPOINTS } from '../config';
import apiClient from './apiClient';
import type { Asset } from 'react-native-image-picker';

// ─── Types ───────────────────────────────────────────────

export interface Campaign {
  id: string;
  name: string;
  message: string;
  channelId: string;
  status: string;
  protectionEnabled: boolean;
  protectionType: string;
  delayBetweenMessages: number;
  batchSize: number;
  batchDelay: number;
  sendImageFirst: boolean;
  sentCount: number;
  totalCount: number;
  failedCount: number;
  createdAt: string;
  updatedAt: string;
  channel?: {
    id: string;
    name: string;
    phoneNumber: string;
  };
}

export interface CreateCampaignRequest {
  name: string;
  message: string;
  channelId: string;
  protectionEnabled: boolean;
  protectionType: string;
  delayBetweenMessages: number;
  batchSize: number;
  batchDelay: number;
  sendImageFirst: boolean;
  contactIds: string[];
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}

// ─── Service ─────────────────────────────────────────────

const campaignService = {
  /**
   * Get all campaigns
   */
  getCampaigns: async (): Promise<Campaign[]> => {
    const response = await apiClient.get(ENDPOINTS.CAMPAIGNS.LIST);
    const result = response.data?.data || response.data;
    if (__DEV__) {
      console.log('[getCampaigns] result count:', Array.isArray(result) ? result.length : 'not array');
    }
    return Array.isArray(result) ? result : [];
  },

  /**
   * Create a new campaign (with optional image)
   */
  createCampaign: async (data: CreateCampaignRequest, image?: Asset): Promise<Campaign> => {
    if (__DEV__) {
      console.log('[createCampaign] sending:', JSON.stringify(data), 'hasImage:', !!image);
    }

    let response;

    if (image && image.uri) {
      // Send as multipart/form-data when image is attached
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('message', data.message);
      formData.append('channelId', data.channelId);
      formData.append('protectionEnabled', String(data.protectionEnabled));
      formData.append('protectionType', data.protectionType);
      formData.append('delayBetweenMessages', String(data.delayBetweenMessages));
      formData.append('batchSize', String(data.batchSize));
      formData.append('batchDelay', String(data.batchDelay));
      formData.append('sendImageFirst', String(data.sendImageFirst));
      data.contactIds.forEach(id => formData.append('contactIds[]', id));
      formData.append('image', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.fileName || 'campaign_image.jpg',
      } as any);

      response = await apiClient.post(ENDPOINTS.CAMPAIGNS.LIST, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    } else {
      // Send as JSON when no image
      response = await apiClient.post(ENDPOINTS.CAMPAIGNS.LIST, data);
    }

    const result = response.data?.data || response.data;
    if (__DEV__) {
      console.log('[createCampaign] result:', JSON.stringify(result));
    }
    return result;
  },

  /**
   * Get a single campaign by ID
   */
  getCampaign: async (id: string): Promise<Campaign> => {
    const response = await apiClient.get(`${ENDPOINTS.CAMPAIGNS.LIST}/${id}`);
    const result = response.data?.data || response.data;
    return result;
  },

  /**
   * Delete a campaign by ID
   */
  deleteCampaign: async (id: string): Promise<void> => {
    await apiClient.delete(`${ENDPOINTS.CAMPAIGNS.LIST}/${id}`);
  },

  /**
   * Get all contacts (for the contact picker)
   */
  getContacts: async (): Promise<Contact[]> => {
    const response = await apiClient.get(ENDPOINTS.CONTACTS.LIST);
    const result = response.data?.data || response.data;
    return Array.isArray(result) ? result : [];
  },
};

export default campaignService;
