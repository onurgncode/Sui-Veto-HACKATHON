import { apiClient } from '../config/api';
import type { ApiResponse } from '../config/api';

export interface Community {
  id: string;
  name: string;
}

export interface CommunityMember {
  address: string;
  joinedAt: number;
}

export interface CreateCommunityRequest {
  name: string;
  description?: string;
}

export const communityService = {
  async getCommunity(id: string): Promise<ApiResponse<{ community: Community; memberCount: number }>> {
    return apiClient.get<{ community: Community; memberCount: number }>(`/community/${id}`);
  },

  async createCommunity(
    data: CreateCommunityRequest
  ): Promise<ApiResponse<{ community: Community }>> {
    return apiClient.post<{ community: Community }>('/community', data);
  },

  async joinCommunity(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post<{ success: boolean }>(`/community/${id}/join`);
  },

  async getMembers(id: string): Promise<ApiResponse<{ members: CommunityMember[]; total: number }>> {
    return apiClient.get<{ members: CommunityMember[]; total: number }>(`/community/${id}/members`);
  },
};

