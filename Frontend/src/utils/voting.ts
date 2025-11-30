import { ProposalStatus } from "../services/proposalService";

/**
 * Check if a proposal is votable (active and not expired)
 */
export function isProposalVotable(proposal: {
  status: ProposalStatus;
  deadline: number;
}): boolean {
  // Must be active
  if (proposal.status !== ProposalStatus.ACTIVE) {
    return false;
  }

  // Deadline must not have passed (deadline is in milliseconds, as contract uses clock::timestamp_ms)
  const now = Date.now();
  if (proposal.deadline < now) {
    return false;
  }

  return true;
}

/**
 * Format deadline for display
 * Deadline is in milliseconds (as contract uses clock::timestamp_ms)
 */
export function formatDeadline(deadline: number): string {
  const date = new Date(deadline);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (diff < 0) {
    return 'Süresi doldu';
  }
  if (days > 0) {
    return `${days} gün ${hours} saat kaldı`;
  }
  if (hours > 0) {
    return `${hours} saat kaldı`;
  }
  return 'Çok yakında';
}

/**
 * Get vote type label
 */
export function getVoteTypeLabel(voteType: number): string {
  switch (voteType) {
    case 0:
      return 'Hayır';
    case 1:
      return 'Evet';
    case 2:
      return 'Çekimser';
    default:
      return 'Bilinmeyen';
  }
}

