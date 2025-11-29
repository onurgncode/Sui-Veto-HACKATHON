import { SurfluxClient, SurfluxEvent } from './surfluxClient';
import { PACKAGE_ID } from '../config/sui';
import { SURFLUX_CONFIG } from '../config/surflux';
import { logger } from '../utils/logger';
import {
  ProposalCreatedEvent,
  VoteCastedEvent,
  ProposalFinalizedEvent,
} from '../types';

export interface EventHandler {
  onProposalCreated: (event: ProposalCreatedEvent) => void;
  onVoteCasted: (event: VoteCastedEvent) => void;
  onProposalFinalized: (event: ProposalFinalizedEvent) => void;
}

export class EventProcessor {
  private surfluxClient: SurfluxClient;
  private handlers: EventHandler;
  private processedEvents: Set<string> = new Set();

  constructor(handlers: EventHandler) {
    this.surfluxClient = new SurfluxClient();
    this.handlers = handlers;
  }

  /**
   * Start processing events from Surflux
   */
  async start(): Promise<void> {
    if (!SURFLUX_CONFIG.enabled) {
      logger.warn('Surflux is not enabled. Event processing will not start.');
      return;
    }

    logger.info('Starting Surflux event processing...');

    // Subscribe to package events
    await this.surfluxClient.subscribeToPackageEvents(
      {
        packageId: PACKAGE_ID,
        eventTypes: [
          'ProposalCreated',
          'VoteCasted',
          'ProposalFinalized',
        ],
      },
      (event) => this.processEvent(event)
    );

    logger.info('Surflux event processing started');
  }

  /**
   * Process incoming event
   */
  private async processEvent(event: SurfluxEvent): Promise<void> {
    try {
      // Deduplication check
      if (this.processedEvents.has(event.id)) {
        logger.debug(`Event ${event.id} already processed, skipping`);
        return;
      }

      this.processedEvents.add(event.id);

      // Parse event based on type
      switch (event.eventType) {
        case 'ProposalCreated':
          await this.handleProposalCreated(event);
          break;
        case 'VoteCasted':
          await this.handleVoteCasted(event);
          break;
        case 'ProposalFinalized':
          await this.handleProposalFinalized(event);
          break;
        default:
          logger.warn(`Unknown event type: ${event.eventType}`);
      }
    } catch (error) {
      logger.error('Error processing event:', error);
    }
  }

  /**
   * Handle ProposalCreated event
   */
  private async handleProposalCreated(event: SurfluxEvent): Promise<void> {
    try {
      const proposalEvent: ProposalCreatedEvent = {
        proposalId: event.data.proposalId as string,
        commityId: event.data.commityId as string,
        creator: event.data.creator as string,
        timestamp: event.timestamp,
      };

      this.handlers.onProposalCreated(proposalEvent);
      logger.info(`Processed ProposalCreated event: ${proposalEvent.proposalId}`);
    } catch (error) {
      logger.error('Error handling ProposalCreated event:', error);
    }
  }

  /**
   * Handle VoteCasted event
   */
  private async handleVoteCasted(event: SurfluxEvent): Promise<void> {
    try {
      const voteEvent: VoteCastedEvent = {
        proposalId: event.data.proposalId as string,
        voter: event.data.voter as string,
        voteType: event.data.voteType as number,
        voteWeight: event.data.voteWeight as number,
        timestamp: event.timestamp,
      };

      this.handlers.onVoteCasted(voteEvent);
      logger.info(
        `Processed VoteCasted event: proposal ${voteEvent.proposalId}, voter ${voteEvent.voter}`
      );
    } catch (error) {
      logger.error('Error handling VoteCasted event:', error);
    }
  }

  /**
   * Handle ProposalFinalized event
   */
  private async handleProposalFinalized(event: SurfluxEvent): Promise<void> {
    try {
      const finalizedEvent: ProposalFinalizedEvent = {
        proposalId: event.data.proposalId as string,
        status: event.data.status as number,
        timestamp: event.timestamp,
      };

      this.handlers.onProposalFinalized(finalizedEvent);
      logger.info(
        `Processed ProposalFinalized event: ${finalizedEvent.proposalId}, status: ${finalizedEvent.status}`
      );
    } catch (error) {
      logger.error('Error handling ProposalFinalized event:', error);
    }
  }

  /**
   * Clear processed events cache (for testing or memory management)
   */
  clearCache(): void {
    this.processedEvents.clear();
    logger.info('Event cache cleared');
  }
}

