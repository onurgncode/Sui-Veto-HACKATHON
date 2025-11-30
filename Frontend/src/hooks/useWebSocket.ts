/**
 * WebSocket Hook for Real-time Updates
 * Connects to backend WebSocket server and handles real-time events
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';

export interface WebSocketMessage {
  type: 'proposal_created' | 'vote_casted' | 'proposal_finalized' | 'notification';
  data: any;
  timestamp: number;
}

export interface UseWebSocketOptions {
  enabled?: boolean;
  onProposalCreated?: (data: any) => void;
  onVoteCasted?: (data: any) => void;
  onProposalFinalized?: (data: any) => void;
  onNotification?: (data: any) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    enabled = true,
    onProposalCreated,
    onVoteCasted,
    onProposalFinalized,
    onNotification,
  } = options;

  const currentAccount = useCurrentAccount();
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const connect = useCallback(() => {
    if (!enabled || !currentAccount) {
      return;
    }

    // Get WebSocket URL from API URL
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const wsUrl = apiUrl.replace(/^http/, 'ws') + '/ws';

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[WebSocket] Connected to server');
        setIsConnected(true);
        setReconnectAttempts(0);

        // Send subscription message
        ws.send(JSON.stringify({
          type: 'subscribe',
          events: ['proposal_created', 'vote_casted', 'proposal_finalized', 'notification'],
          address: currentAccount.address,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('[WebSocket] Received message:', message.type);

          switch (message.type) {
            case 'proposal_created':
              onProposalCreated?.(message.data);
              break;
            case 'vote_casted':
              onVoteCasted?.(message.data);
              break;
            case 'proposal_finalized':
              onProposalFinalized?.(message.data);
              break;
            case 'notification':
              onNotification?.(message.data);
              break;
          }
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      ws.onclose = () => {
        console.log('[WebSocket] Disconnected from server');
        setIsConnected(false);
        wsRef.current = null;

        // Attempt to reconnect
        if (reconnectAttempts < maxReconnectAttempts && enabled) {
          const delay = reconnectDelay * Math.pow(2, reconnectAttempts);
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          console.warn('[WebSocket] Max reconnect attempts reached. Using polling fallback.');
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[WebSocket] Error creating connection:', error);
    }
  }, [enabled, currentAccount, reconnectAttempts, onProposalCreated, onVoteCasted, onProposalFinalized, onNotification]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (enabled && currentAccount) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, currentAccount, connect, disconnect]);

  return {
    isConnected,
    reconnectAttempts,
    connect,
    disconnect,
  };
}

