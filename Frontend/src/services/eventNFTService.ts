import { apiClient } from '../config/api';
import type { ApiResponse } from '../config/api';

export interface EventNFT {
  id: string;
  commityId: string;
  xp: number;
  owner: string;
}

export interface MintEventNFTRequest {
  commityId: string;
  xp: number;
  recipient: string;
}

export const eventNFTService = {
  async getEventNFT(id: string): Promise<ApiResponse<{ nft: EventNFT }>> {
    return apiClient.get<{ nft: EventNFT }>(`/event-nft/${id}`);
  },

  async getEventNFTsByOwner(owner: string): Promise<ApiResponse<{ nfts: EventNFT[]; total: number }>> {
    return apiClient.get<{ nfts: EventNFT[]; total: number }>(`/event-nft/owner/${owner}`);
  },

  async getEventNFTsByCommunity(commityId: string): Promise<ApiResponse<{ nfts: EventNFT[]; total: number }>> {
    return apiClient.get<{ nfts: EventNFT[]; total: number }>(`/event-nft/community/${commityId}`);
  },
};

