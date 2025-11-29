import { NotificationService } from '../modules/notification/notification.service';
import { NotificationType } from '../modules/notification/notification.types';
import { CommunityService } from '../modules/community/community.service';
import { ProposalService } from '../modules/proposal/proposal.service';
import {
  ProposalCreatedEvent,
  VoteCastedEvent,
  ProposalFinalizedEvent,
} from '../types';
import { logger } from '../utils/logger';

export class EventHandlerService {
  private notificationService: NotificationService;
  private communityService: CommunityService;
  private proposalService: ProposalService;

  constructor() {
    this.notificationService = new NotificationService();
    this.communityService = new CommunityService();
    this.proposalService = new ProposalService();
  }

  /**
   * Handle ProposalCreated event
   */
  async onProposalCreated(event: ProposalCreatedEvent): Promise<void> {
    try {
      logger.info(`Handling ProposalCreated: ${event.proposalId}`);

      // Get community members
      const members = await this.communityService.getMembers(event.commityId);

      // Notify the creator
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

      // Notify all community members
      for (const member of members) {
        if (member.address !== event.creator) {
          await this.notificationService.createNotification({
            address: member.address,
            type: NotificationType.PROPOSAL_CREATED,
            title: 'New Proposal',
            message: `A new proposal has been created in your community`,
            data: {
              proposalId: event.proposalId,
              commityId: event.commityId,
              creator: event.creator,
            },
          });
        }
      }

      logger.info(
        `Sent ProposalCreated notifications to ${members.length} members`
      );
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

      // Get proposal to find creator
      const proposal = await this.proposalService.getProposal(
        event.proposalId
      );

      // Notify the voter
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

      // Notify proposal creator if different from voter
      if (proposal && proposal.creator !== event.voter) {
        await this.notificationService.createNotification({
          address: proposal.creator,
          type: NotificationType.VOTE_CASTED,
          title: 'New Vote',
          message: `Someone voted on your proposal`,
          data: {
            proposalId: event.proposalId,
            voter: event.voter,
            voteType: event.voteType,
            voteWeight: event.voteWeight,
          },
        });
      }
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

      // Get proposal to find creator and votes
      const proposal = await this.proposalService.getProposal(
        event.proposalId
      );

      if (!proposal) {
        logger.warn(`Proposal ${event.proposalId} not found for finalization`);
        return;
      }

      const statusText =
        event.status === 1
          ? 'passed'
          : event.status === 2
          ? 'failed'
          : 'expired';

      // Notify proposal creator
      await this.notificationService.createNotification({
        address: proposal.creator,
        type: NotificationType.PROPOSAL_FINALIZED,
        title: 'Proposal Finalized',
        message: `Your proposal has been ${statusText}`,
        data: {
          proposalId: event.proposalId,
          status: event.status,
          statusText,
        },
      });

      // Get all voters and notify them
      const votes = await this.proposalService.getVotes(event.proposalId);
      const notifiedAddresses = new Set<string>([proposal.creator]);

      for (const vote of votes) {
        if (!notifiedAddresses.has(vote.voter)) {
          await this.notificationService.createNotification({
            address: vote.voter,
            type: NotificationType.PROPOSAL_FINALIZED,
            title: 'Proposal Finalized',
            message: `A proposal you voted on has been ${statusText}`,
            data: {
              proposalId: event.proposalId,
              status: event.status,
              statusText,
            },
          });
          notifiedAddresses.add(vote.voter);
        }
      }

      logger.info(
        `Sent ProposalFinalized notifications to ${notifiedAddresses.size} addresses`
      );
    } catch (error) {
      logger.error('Error handling ProposalFinalized:', error);
    }
  }
}

