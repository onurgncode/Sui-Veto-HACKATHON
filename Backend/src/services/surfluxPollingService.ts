/**
 * Surflux Polling Service
 * Polls Surflux REST API for new events and broadcasts via WebSocket
 */

import { logger } from '../utils/logger';
import { SURFLUX_CONFIG } from '../config/surflux';
import { PACKAGE_ID } from '../config/sui';
import { webSocketServer } from './websocketServer';
import { EventHandlerService } from './eventHandler';

export interface SurfluxEvent {
  id: string;
  packageId: string;
  transactionDigest: string;
  eventType: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export class SurfluxPollingService {
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastPolledTimestamp: number = Date.now();
  private isRunning: boolean = false;
  private eventHandler: EventHandlerService;
  private pollIntervalMs: number = 5000; // Poll every 5 seconds

  constructor() {
    this.eventHandler = new EventHandlerService();
  }

  /**
   * Start polling Surflux API for new events
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Surflux polling service already running');
      return;
    }

    if (!SURFLUX_CONFIG.enabled) {
      logger.warn('Surflux is not enabled. Polling service will not start.');
      return;
    }

    this.isRunning = true;
    logger.info('Starting Surflux polling service...');

    // Initial poll
    this.pollForEvents();

    // Set up interval
    this.pollingInterval = setInterval(() => {
      this.pollForEvents();
    }, this.pollIntervalMs);

    logger.info(`Surflux polling service started (interval: ${this.pollIntervalMs}ms)`);
  }

  /**
   * Stop polling service
   */
  stop(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.isRunning = false;
    logger.info('Surflux polling service stopped');
  }

  /**
   * Poll Surflux API for new events
   */
  private async pollForEvents(): Promise<void> {
    try {
      // Poll for package events (proposals, votes)
      const events = await this.fetchPackageEvents();

      for (const event of events) {
        await this.processEvent(event);
      }

      // Update last polled timestamp
      this.lastPolledTimestamp = Date.now();
    } catch (error) {
      logger.error('Error polling Surflux events:', error);
    }
  }

  /**
   * Fetch package events from Surflux REST API
   */
  private async fetchPackageEvents(): Promise<SurfluxEvent[]> {
    try {
      // Use Surflux REST API to fetch recent events
      // We'll query for events from our package
      const params = new URLSearchParams({
        packageId: PACKAGE_ID,
        limit: '50',
        orderBy: 'timestamp',
        orderDirection: 'desc',
      });

      // Add timestamp filter if we have last polled time
      if (this.lastPolledTimestamp > 0) {
        params.append('fromTimestamp', this.lastPolledTimestamp.toString());
      }

      const apiEndpoint = `${SURFLUX_CONFIG.baseApiUrl}/api/v1/events?${params.toString()}`;

      const response = await fetch(apiEndpoint, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SURFLUX_CONFIG.apiKey}`,
          'Accept': 'application/json',
          'X-Flux-Stream': SURFLUX_CONFIG.fluxStreamName || '',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logger.warn('Surflux API key invalid, skipping polling');
          return [];
        }
        if (response.status === 429) {
          logger.warn('Surflux rate limit exceeded, backing off');
          return [];
        }
        throw new Error(`Surflux API error: ${response.status}`);
      }

      const result = await response.json() as { data?: any[]; events?: any[]; error?: any };

      if (result.error) {
        logger.error('Surflux API returned error:', result.error);
        return [];
      }

      const events = result.data || result.events || [];
      logger.debug(`Fetched ${events.length} events from Surflux`);

      return this.normalizeEvents(events);
    } catch (error) {
      logger.error('Error fetching package events from Surflux:', error);
      return [];
    }
  }

  /**
   * Normalize Surflux events to our format
   */
  private normalizeEvents(events: any[]): SurfluxEvent[] {
    return events.map((event: any) => ({
      id: event.id || event.eventId || `${event.transactionDigest}-${event.eventIndex}`,
      packageId: event.packageId || PACKAGE_ID,
      transactionDigest: event.transactionDigest || event.txDigest || '',
      eventType: event.eventType || event.type || 'unknown',
      timestamp: event.timestamp || event.createdAt || Date.now(),
      data: typeof event.data === 'string' ? JSON.parse(event.data) : (event.data || {}),
    }));
  }

  /**
   * Process a single event
   */
  private async processEvent(event: SurfluxEvent): Promise<void> {
    try {
      // Check if we've already processed this event
      // (In production, use a database or cache to track processed events)

      // Parse event type and data
      const eventType = event.eventType.toLowerCase();

      if (eventType.includes('proposalcreated') || eventType.includes('proposal_created')) {
        await this.handleProposalCreated(event);
      } else if (eventType.includes('votecasted') || eventType.includes('vote_casted')) {
        await this.handleVoteCasted(event);
      } else if (eventType.includes('proposalfinalized') || eventType.includes('proposal_finalized')) {
        await this.handleProposalFinalized(event);
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
      const data = event.data;
      const proposalId = data.proposalId || data.proposal_id;
      const commityId = data.commityId || data.commity_id || data.communityId;
      const creator = data.creator || data.creator_address;
      const title = data.title || 'New Proposal';

      if (!proposalId || !commityId || !creator) {
        logger.warn('Invalid ProposalCreated event data:', data);
        return;
      }

      // Handle via event handler (creates notifications)
      await this.eventHandler.onProposalCreated({
        proposalId: proposalId as string,
        commityId: commityId as string,
        creator: creator as string,
      });

      // Broadcast via WebSocket
      webSocketServer.broadcastProposalCreated({
        proposalId: proposalId as string,
        commityId: commityId as string,
        creator: creator as string,
        title: title as string,
      });

      logger.info(`Processed ProposalCreated event: ${proposalId}`);
    } catch (error) {
      logger.error('Error handling ProposalCreated event:', error);
    }
  }

  /**
   * Handle VoteCasted event
   */
  private async handleVoteCasted(event: SurfluxEvent): Promise<void> {
    try {
      const data = event.data;
      const proposalId = data.proposalId || data.proposal_id;
      const voter = data.voter || data.voter_address;
      const voteType = data.voteType || data.vote_type;
      const voteWeight = data.voteWeight || data.vote_weight || 1;

      if (!proposalId || !voter || voteType === undefined) {
        logger.warn('Invalid VoteCasted event data:', data);
        return;
      }

      // Handle via event handler (creates notifications)
      await this.eventHandler.onVoteCasted({
        proposalId: proposalId as string,
        voter: voter as string,
        voteType: voteType as number,
        voteWeight: voteWeight as number,
      });

      // Broadcast via WebSocket
      webSocketServer.broadcastVoteCasted({
        proposalId: proposalId as string,
        voter: voter as string,
        voteType: voteType as number,
        voteWeight: voteWeight as number,
      });

      logger.info(`Processed VoteCasted event: ${proposalId} by ${voter}`);
    } catch (error) {
      logger.error('Error handling VoteCasted event:', error);
    }
  }

  /**
   * Handle ProposalFinalized event
   */
  private async handleProposalFinalized(event: SurfluxEvent): Promise<void> {
    try {
      const data = event.data;
      const proposalId = data.proposalId || data.proposal_id;
      const status = data.status;
      const commityId = data.commityId || data.commity_id || data.communityId;

      if (!proposalId || status === undefined) {
        logger.warn('Invalid ProposalFinalized event data:', data);
        return;
      }

      // Handle via event handler (creates notifications)
      await this.eventHandler.onProposalFinalized({
        proposalId: proposalId as string,
        status: status as number,
      });

      // Broadcast via WebSocket
      webSocketServer.broadcastProposalFinalized({
        proposalId: proposalId as string,
        status: status as number,
        commityId: commityId as string || '',
      });

      logger.info(`Processed ProposalFinalized event: ${proposalId} with status ${status}`);
    } catch (error) {
      logger.error('Error handling ProposalFinalized event:', error);
    }
  }
}

export const surfluxPollingService = new SurfluxPollingService();

