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

export interface CreateProposalRequest {
  commityId: string;
  messageId: string;
  title: string;
  description: string;
  deadline: number;
  quorumThreshold: number;
}

export interface VoteRequest {
  voteType: number; // 0: No, 1: Yes, 2: Abstain
}

export interface Vote {
  voter: string;
  voteType: number;
  voteWeight: number;
  timestamp: number;
}

export interface GetProposalResponse {
  proposal: Proposal;
}

export interface GetVotesResponse {
  votes: Vote[];
  total: number;
}

