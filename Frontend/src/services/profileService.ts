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

  /**
   * Create profile with sponsored gas
   * User signs the transaction, backend sponsors the gas
   */
  async sponsorCreateProfile(
    nickname: string,
    transactionBlock: string,
    signature: string
  ): Promise<ApiResponse<{ digest: string; effects: any; events: any; objectChanges: any }>> {
    return apiClient.post<{ digest: string; effects: any; events: any; objectChanges: any }>(
      '/profile/sponsor-create',
      {
        nickname,
        transactionBlock,
        signature,
      }
    );
  },

  /**
   * Get sponsor address for gas sponsorship
   */
  async getSponsorAddress(): Promise<ApiResponse<{ sponsorAddress: string; gasCoins?: string[] }>> {
    return apiClient.get<{ sponsorAddress: string; gasCoins?: string[] }>('/profile/sponsor-address');
  },

  /**
   * Build sponsored transaction block on backend (avoids CORS issues)
   */
  async buildSponsoredTransaction(
    sender: string,
    moveCallTarget: string,
    moveCallArgs: any[]
  ): Promise<ApiResponse<{ transactionBlock: string }>> {
    return apiClient.post<{ transactionBlock: string }>('/profile/build-sponsored-transaction', {
      sender,
      moveCallTarget,
      moveCallArgs,
    });
  },

  /**
   * Enoki sponsored transaction - Step 1: Sponsor transaction
   */
  async enokiSponsorTransaction(
    transactionBlockKindBytes: string,
    sender: string,
    zkLoginJwt?: string
  ): Promise<ApiResponse<{ bytes: string; digest: string }>> {
    return apiClient.post<{ bytes: string; digest: string }>('/profile/enoki-sponsor', {
      transactionBlockKindBytes,
      sender,
      zkLoginJwt,
    });
  },

  /**
   * Enoki sponsored transaction - Step 2: Submit signature
   */
  async enokiSubmitSignature(
    digest: string,
    signature: string,
    zkLoginJwt?: string
  ): Promise<ApiResponse<{ transaction: string }>> {
    return apiClient.post<{ transaction: string }>('/profile/enoki-submit-signature', {
      digest,
      signature,
      zkLoginJwt,
    });
  },
};

