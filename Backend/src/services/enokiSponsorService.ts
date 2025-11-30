/**
 * Enoki Sponsor Service
 * Enoki API kullanarak sponsored transactions
 * 
 * Reference: https://docs.enoki.mystenlabs.com/ts-sdk/sponsored-transactions
 * API Reference: https://docs.enoki.mystenlabs.com/http-api
 */

import { ENOKI_CONFIG } from '../config/enoki';
import { logger } from '../utils/logger';
import { toB64 } from '@mysten/sui.js/utils';

interface EnokiSponsorResponse {
  bytes: string;
  digest: string;
}

interface EnokiSponsorSignatureResponse {
  transaction: string; // base64-encoded sponsor-signed transaction
}

export class EnokiSponsorService {
  private apiKey: string;
  private baseUrl: string;
  private network: string;

  constructor() {
    this.apiKey = ENOKI_CONFIG.apiKey;
    this.baseUrl = ENOKI_CONFIG.baseUrl;
    this.network = ENOKI_CONFIG.network;
  }

  /**
   * Check if Enoki sponsor service is available
   */
  isAvailable(): boolean {
    return !!this.apiKey && this.apiKey.length > 0;
  }

  /**
   * Sponsor a transaction using Enoki API
   * Step 1: Get sponsored transaction bytes
   * 
   * @param transactionBlockKindBytes - Transaction kind bytes (from onlyTransactionKind: true build)
   * @param sender - Sender address (required if zkLoginJwt is not provided)
   * @param zkLoginJwt - ZkLogin JWT token (required for zkLogin accounts, alternative to sender)
   * @returns Sponsored transaction bytes and digest
   */
  async sponsorTransaction(
    transactionBlockKindBytes: Uint8Array,
    sender?: string,
    zkLoginJwt?: string
  ): Promise<EnokiSponsorResponse> {
    if (!this.isAvailable()) {
      throw new Error('Enoki API key is not configured');
    }

    if (!zkLoginJwt && !sender) {
      throw new Error('Either zkLoginJwt or sender address is required');
    }

    try {
      const kindBytesBase64 = toB64(transactionBlockKindBytes);

      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      };

      // Add zkLogin JWT if provided
      if (zkLoginJwt) {
        headers['zklogin-jwt'] = zkLoginJwt;
      }

      const requestBody: any = {
        network: this.network,
        transactionBlockKindBytes: kindBytesBase64,
      };

      // Add sender if provided (required if JWT is not provided)
      if (sender) {
        requestBody.sender = sender;
      }

      const response = await fetch(`${this.baseUrl}/transaction-blocks/sponsor`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`[EnokiSponsorService] Sponsor API error: ${response.status} - ${errorText}`);
        throw new Error(`Enoki sponsor API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as { bytes: string; digest: string };
      logger.info(`[EnokiSponsorService] ✅ Transaction sponsored, digest: ${data.digest}`);

      return {
        bytes: data.bytes,
        digest: data.digest,
      };
    } catch (error) {
      logger.error('[EnokiSponsorService] ❌ Error sponsoring transaction:', error);
      throw error;
    }
  }

  /**
   * Submit signature for sponsored transaction
   * Step 2: Submit user signature to get sponsor-signed transaction
   * 
   * @param digest - Transaction digest from sponsorTransaction
   * @param signature - User's signature (base64 SerializedSignature)
   * @param zkLoginJwt - ZkLogin JWT token (required for zkLogin accounts)
   * @returns Sponsor-signed transaction (base64)
   */
  async submitSignature(
    digest: string,
    signature: string,
    zkLoginJwt?: string
  ): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('Enoki API key is not configured');
    }

    try {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      };

      // Add zkLogin JWT if provided
      if (zkLoginJwt) {
        headers['zklogin-jwt'] = zkLoginJwt;
      }

      const response = await fetch(`${this.baseUrl}/transaction-blocks/sponsor/${digest}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          signature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`[EnokiSponsorService] Submit signature API error: ${response.status} - ${errorText}`);
        throw new Error(`Enoki submit signature API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as EnokiSponsorSignatureResponse;
      logger.info(`[EnokiSponsorService] ✅ Signature submitted, sponsor-signed transaction received`);

      return data.transaction;
    } catch (error) {
      logger.error('[EnokiSponsorService] ❌ Error submitting signature:', error);
      throw error;
    }
  }

  // Note: executeTransaction method removed
  // For ZkLogin wallets, we use useSignAndExecuteTransaction which automatically
  // handles Enoki sponsorship when the wallet is registered with Enoki API key
}

export const enokiSponsorService = new EnokiSponsorService();

