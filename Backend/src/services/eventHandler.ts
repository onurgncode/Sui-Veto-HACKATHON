import { NotificationService } from '../modules/notification/notification.service';
import { NotificationType } from '../modules/notification/notification.types';
import {
  ProposalCreatedEvent,
  VoteCastedEvent,
  ProposalFinalizedEvent,
} from '../types';
import { logger } from '../utils/logger';

export class EventHandlerService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Handle ProposalCreated event
   */
  async onProposalCreated(event: ProposalCreatedEvent): Promise<void> {
    try {
      logger.info(`Handling ProposalCreated: ${event.proposalId}`);

      // Create notification for community members
      // TODO: Get community members and notify them
      // For now, we'll create a notification for the creator
      await this.notificationService.createNotification({
        address: event.creator,
        type: NotificationType.PROPOSAL_CREATED,
        title: 'Proposal Created',
        message: `Your proposal has been created successfully`,
        data: {
          proposalId: event.proposalId,
          commityId: event.commityId,
        },
      });

      // Note: Real-time notifications will be handled via Surflux Flux Streams
      // Frontend can subscribe to Surflux events or poll the notification API
    } catch (error) {
      logger.error('Error handling ProposalCreated:', error);
    }
  }

  /**
   * Handle VoteCasted event
   */
  async onVoteCasted(event: VoteCastedEvent): Promise<void> {
    try {
      logger.info(
        `Handling VoteCasted: proposal ${event.proposalId}, voter ${event.voter}`
      );

      // Create notification for proposal creator
      // TODO: Get proposal creator and notify them
      // For now, we'll create a notification for the voter
      await this.notificationService.createNotification({
        address: event.voter,
        type: NotificationType.VOTE_CASTED,
        title: 'Vote Casted',
        message: `Your vote has been recorded`,
        data: {
          proposalId: event.proposalId,
          voteType: event.voteType,
          voteWeight: event.voteWeight,
        },
      });

      // Note: Real-time notifications will be handled via Surflux Flux Streams
      // Frontend can subscribe to Surflux events or poll the notification API
    } catch (error) {
      logger.error('Error handling VoteCasted:', error);
    }
  }

  /**
   * Handle ProposalFinalized event
   */
  async onProposalFinalized(event: ProposalFinalizedEvent): Promise<void> {
    try {
      logger.info(
        `Handling ProposalFinalized: ${event.proposalId}, status: ${event.status}`
      );

      // Create notification for proposal creator and voters
      // TODO: Get proposal creator and voters, notify them
      const statusText =
        event.status === 1
          ? 'passed'
          : event.status === 2
          ? 'failed'
          : 'expired';

      await this.notificationService.createNotification({
        address: '', // TODO: Get from proposal
        type: NotificationType.PROPOSAL_FINALIZED,
        title: 'Proposal Finalized',
        message: `Proposal has been ${statusText}`,
        data: {
          proposalId: event.proposalId,
          status: event.status,
        },
      });
    } catch (error) {
      logger.error('Error handling ProposalFinalized:', error);
    }
  }
}

