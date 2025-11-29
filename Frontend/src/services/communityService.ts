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
}

export const communityService = {
  async getAllCommunities(): Promise<ApiResponse<{ communities: Community[]; total: number }>> {
    return apiClient.get<{ communities: Community[]; total: number }>('/community');
  },

  async getCommunity(id: string): Promise<ApiResponse<{ community: Community; memberCount: number }>> {
    return apiClient.get<{ community: Community; memberCount: number }>(`/community/${id}`);
  },

  async createCommunity(
    data: CreateCommunityRequest
  ): Promise<ApiResponse<{ transaction: { transactionBlock: string } }>> {
    return apiClient.post<{ transaction: { transactionBlock: string } }>('/community', data);
  },

  async joinCommunity(id: string): Promise<ApiResponse<{ success: boolean }>> {
    return apiClient.post<{ success: boolean }>(`/community/${id}/join`);
  },

  async getMembers(id: string): Promise<ApiResponse<{ members: CommunityMember[]; total: number }>> {
    return apiClient.get<{ members: CommunityMember[]; total: number }>(`/community/${id}/members`);
  },

  async getCommunitiesByMember(address: string): Promise<ApiResponse<{ communities: Community[]; total: number }>> {
    return apiClient.get<{ communities: Community[]; total: number }>(`/community/member/${address}`);
  },
};

