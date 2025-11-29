// Sui Types
export interface SuiObject {
  objectId: string;
  version: string;
  digest: string;
  type: string;
  owner?: string;
  data?: unknown;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Event Types (for Surflux integration)
export interface ProposalCreatedEvent {
  proposalId: string;
  commityId: string;
  creator: string;
  timestamp: number;
}

export interface VoteCastedEvent {
  proposalId: string;
  voter: string;
  voteType: number;
  voteWeight: number;
  timestamp: number;
}

export interface ProposalFinalizedEvent {
  proposalId: string;
  status: number;
  timestamp: number;
}

