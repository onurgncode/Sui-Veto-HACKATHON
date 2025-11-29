export interface Notification {
  id: string;
  address: string;
  type: NotificationType;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  timestamp: number;
}

export enum NotificationType {
  PROPOSAL_CREATED = 'proposal_created',
  VOTE_CASTED = 'vote_casted',
  PROPOSAL_FINALIZED = 'proposal_finalized',
  PROPOSAL_EXPIRING = 'proposal_expiring',
}

export interface CreateNotificationRequest {
  address: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

