import { apiClient } from '../config/api';
import type { ApiResponse } from '../config/api';

export enum ProposalStatus {
  ACTIVE = 0,
  PASSED = 1,
  FAILED = 2,
  EXPIRED = 3,
}

export interface Proposal {
  id: string;
  commityId: string;
  messageId: string;
  creator: string;
  title: string;
  description: string;
  deadline: number;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  totalVoters: number;
  status: ProposalStatus;
  quorumThreshold: number;
}

export interface Vote {
  voter: string;
  voteType: number;
  voteWeight: number;
  timestamp: number;
}

export interface CreateProposalRequest {
  commityId: string;
  messageId: string;
  title: string;
  description: string;
  deadline: number;
  quorumThreshold: number;
}

export interface VoteRequest {
  voteType: number;
}

export const proposalService = {
  async getProposal(id: string): Promise<ApiResponse<{ proposal: Proposal }>> {
    return apiClient.get<{ proposal: Proposal }>(`/proposal/${id}`);
  },

  async getProposalsByCommunity(
    communityId: string
  ): Promise<ApiResponse<{ proposals: Proposal[] }>> {
    return apiClient.get<{ proposals: Proposal[] }>(`/proposal/community/${communityId}`);
  },

  async createProposal(
    data: CreateProposalRequest
  ): Promise<ApiResponse<{ transaction: { transactionBlock: string } }>> {
    return apiClient.post<{ transaction: { transactionBlock: string } }>('/proposal', data);
  },

  async castVote(
    proposalId: string, 
    vote: VoteRequest & { profileId: string; commityId: string }
  ): Promise<ApiResponse<{ transaction: { transactionBlock: string } }>> {
    return apiClient.post<{ transaction: { transactionBlock: string } }>(`/proposal/${proposalId}/vote`, vote);
  },

  async getVotes(proposalId: string): Promise<ApiResponse<{ votes: Vote[]; total: number }>> {
    return apiClient.get<{ votes: Vote[]; total: number }>(`/proposal/${proposalId}/votes`);
  },

  async finalizeProposal(proposalId: string): Promise<ApiResponse<{ proposal: Proposal }>> {
    return apiClient.post<{ proposal: Proposal }>(`/proposal/${proposalId}/finalize`);
  },
};

