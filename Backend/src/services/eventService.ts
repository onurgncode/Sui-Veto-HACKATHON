import { EventProcessor } from './eventProcessor';
import { EventHandlerService } from './eventHandler';
import { logger } from '../utils/logger';

export class EventService {
  private eventProcessor: EventProcessor | null = null;
  private eventHandler: EventHandlerService;

  constructor() {
    this.eventHandler = new EventHandlerService();
  }

  /**
   * Initialize and start event processing
   */
  async start(): Promise<void> {
    try {
      this.eventProcessor = new EventProcessor({
        onProposalCreated: (event) =>
          this.eventHandler.onProposalCreated(event),
        onVoteCasted: (event) => this.eventHandler.onVoteCasted(event),
        onProposalFinalized: (event) =>
          this.eventHandler.onProposalFinalized(event),
      });

      await this.eventProcessor.start();
      logger.info('Event service started successfully');
    } catch (error) {
      logger.error('Error starting event service:', error);
      throw error;
    }
  }

  /**
   * Stop event processing
   */
  async stop(): Promise<void> {
    try {
      if (this.eventProcessor) {
        this.eventProcessor.clearCache();
        this.eventProcessor = null;
        logger.info('Event service stopped');
      }
    } catch (error) {
      logger.error('Error stopping event service:', error);
    }
  }
}

