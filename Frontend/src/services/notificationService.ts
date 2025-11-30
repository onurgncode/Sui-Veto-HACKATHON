import { apiClient } from '../config/api';
import type { ApiResponse } from '../config/api';

export interface Notification {
  id: string;
  address: string;
  type: 'proposal_created' | 'vote_casted' | 'proposal_finalized' | 'proposal_expiring';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  read: boolean;
  timestamp: number;
}

export const notificationService = {
  async getNotifications(address: string): Promise<ApiResponse<{ notifications: Notification[] }>> {
    return apiClient.get<{ notifications: Notification[] }>(`/notification/${address}`);
  },

  async getUnreadCount(address: string): Promise<ApiResponse<{ unreadCount: number }>> {
    return apiClient.get<{ unreadCount: number }>(`/notification/${address}/unread-count`);
  },

  async markAsRead(address: string, notificationId: string): Promise<ApiResponse<{ read: boolean }>> {
    return apiClient.post<{ read: boolean }>(`/notification/${address}/${notificationId}/read`);
  },

  async markAllAsRead(address: string): Promise<ApiResponse<{ read: number }>> {
    return apiClient.post<{ read: number }>(`/notification/${address}/read-all`);
  },
};

