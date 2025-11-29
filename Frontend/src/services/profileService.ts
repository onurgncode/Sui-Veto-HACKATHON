import { apiClient } from '../config/api';
import type { ApiResponse } from '../config/api';

export interface Profile {
  id: string;
  nickname: string;
  owner: string;
}

export interface MemberStats {
  xp: number;
  level: number;
}

export interface CreateProfileRequest {
  nickname: string;
}

export const profileService = {
  async getProfile(address: string): Promise<ApiResponse<{ profile: Profile }>> {
    return apiClient.get<{ profile: Profile }>(`/profile/${address}`);
  },

  async createProfile(nickname: string): Promise<ApiResponse<{ profile: Profile }>> {
    return apiClient.post<{ profile: Profile }>('/profile', { nickname });
  },

  async getMemberStats(
    address: string,
    communityId?: string
  ): Promise<ApiResponse<{ stats: MemberStats | null; commityId: string }>> {
    const query = communityId ? `?commityId=${communityId}` : '';
    return apiClient.get<{ stats: MemberStats | null; commityId: string }>(
      `/profile/${address}/stats${query}`
    );
  },
};

