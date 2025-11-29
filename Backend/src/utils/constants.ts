// Sui Constants
export const PACKAGE_MODULE = 'dao_app';

// Vote Weight Multipliers
export const VOTE_WEIGHT_MULTIPLIERS = {
  LEVEL_1: 1,
  LEVEL_2_5: 1.5,
  LEVEL_6_10: 2,
  LEVEL_11_PLUS: 3,
} as const;

// Proposal Status
export const PROPOSAL_STATUS = {
  ACTIVE: 0,
  PASSED: 1,
  FAILED: 2,
  EXPIRED: 3,
} as const;

// Vote Types
export const VOTE_TYPES = {
  NO: 0,
  YES: 1,
  ABSTAIN: 2,
} as const;

