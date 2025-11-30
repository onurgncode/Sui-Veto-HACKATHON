/**
 * WebSocket Server for Real-time Updates
 * Broadcasts events from Surflux polling to connected frontend clients
 */

import { WebSocketServer, WebSocket } from 'ws';
import { logger } from '../utils/logger';
// Imported for future use
// import { SURFLUX_CONFIG } from '../config/surflux';
// import { PACKAGE_ID } from '../config/sui';

export interface WebSocketMessage {
  type: 'proposal_created' | 'vote_casted' | 'proposal_finalized' | 'notification';
  data: any;
  timestamp: number;
}

export class WebSocketServerService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private isRunning: boolean = false;

  /**
   * Initialize WebSocket server
   */
  initialize(server: any): void {
    if (this.wss) {
      logger.warn('WebSocket server already initialized');
      return;
    }

    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
    });

    this.wss.on('connection', (ws: WebSocket) => {
      logger.info('New WebSocket client connected');
      this.clients.add(ws);

      // Send welcome message
      this.sendToClient(ws, {
        type: 'notification',
        data: { message: 'Connected to real-time updates' },
        timestamp: Date.now(),
      });

      ws.on('close', () => {
        logger.info('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          logger.debug('Received WebSocket message:', data);
          
          // Handle client messages (e.g., subscribe to specific events)
          if (data.type === 'subscribe') {
            // Store subscription info if needed
            logger.info('Client subscribed to:', data.events);
          }
        } catch (error) {
          logger.error('Error parsing WebSocket message:', error);
        }
      });
    });

    logger.info('WebSocket server initialized on /ws');
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(message: WebSocketMessage): void {
    if (this.clients.size === 0) {
      return;
    }

    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
          sentCount++;
        } catch (error) {
          logger.error('Error sending WebSocket message:', error);
          this.clients.delete(client);
        }
      } else {
        this.clients.delete(client);
      }
    });

    if (sentCount > 0) {
      logger.debug(`Broadcasted message to ${sentCount} clients:`, message.type);
    }
  }

  /**
   * Send message to specific client
   */
  private sendToClient(client: WebSocket, message: WebSocketMessage): void {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(message));
      } catch (error) {
        logger.error('Error sending message to client:', error);
      }
    }
  }

  /**
   * Broadcast proposal created event
   */
  broadcastProposalCreated(data: {
    proposalId: string;
    commityId: string;
    creator: string;
    title: string;
  }): void {
    this.broadcast({
      type: 'proposal_created',
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast vote casted event
   */
  broadcastVoteCasted(data: {
    proposalId: string;
    voter: string;
    voteType: number;
    voteWeight: number;
  }): void {
    this.broadcast({
      type: 'vote_casted',
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast proposal finalized event
   */
  broadcastProposalFinalized(data: {
    proposalId: string;
    status: number;
    commityId: string;
  }): void {
    this.broadcast({
      type: 'proposal_finalized',
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast notification
   */
  broadcastNotification(data: {
    address: string;
    notification: any;
  }): void {
    // Only send to specific client if we track addresses
    // For now, broadcast to all and let frontend filter
    this.broadcast({
      type: 'notification',
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Close WebSocket server
   */
  close(): void {
    if (this.wss) {
      this.clients.forEach((client) => {
        client.close();
      });
      this.clients.clear();
      this.wss.close();
      this.wss = null;
      logger.info('WebSocket server closed');
    }
  }
}

export const webSocketServer = new WebSocketServerService();

