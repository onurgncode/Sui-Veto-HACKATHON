/**
 * Enoki Service
 * ZkLogin ve sponsorlu işlemler için Enoki entegrasyonu
 */

import { ENOKI_CONFIG } from '../config/enoki';
import { Transaction } from '@mysten/sui/transactions';
import { SuiClient } from '@mysten/sui/client';

export class EnokiService {
  private apiKey: string;
  private privateKey: string;
  private client: SuiClient;

  constructor() {
    this.apiKey = ENOKI_CONFIG.apiKey;
    this.privateKey = ENOKI_CONFIG.privateKey;
    this.client = new SuiClient({
      url: 'https://fullnode.testnet.sui.io:443',
    });
  }

  /**
   * Sponsorlu transaction gönder
   * Enoki private key ile transaction'ı sponsor et
   */
  async sponsorTransaction(transaction: Transaction): Promise<string> {
    try {
      // Transaction'ı build et
      const builtTx = await transaction.build({ client: this.client });
      
      // Enoki API'ye sponsorlu transaction gönder
      // Not: Enoki SDK'nın sponsor transaction özelliği varsa kullanılabilir
      // Şimdilik manuel olarak transaction'ı sponsor etmek için Enoki API'yi kullanabiliriz
      
      // TODO: Enoki sponsor transaction API entegrasyonu
      // Enoki'nin sponsor transaction endpoint'ini kullanarak transaction'ı sponsor et
      
      throw new Error('Sponsor transaction not yet implemented - Enoki API integration needed');
    } catch (error) {
      console.error('[EnokiService] Error sponsoring transaction:', error);
      throw error;
    }
  }

  /**
   * ZkLogin signature doğrulama
   * Enoki API üzerinden ZkLogin signature'ı doğrula
   */
  async verifyZkLoginSignature(
    message: Uint8Array,
    signature: string,
    address: string
  ): Promise<boolean> {
    try {
      // Enoki API'ye ZkLogin signature verification isteği gönder
      // TODO: Enoki ZkLogin verification API entegrasyonu
      
      // Şimdilik verifyPersonalMessage'ı deneyelim
      // ZkLogin için özel verification gerekebilir
      
      return true; // Placeholder
    } catch (error) {
      console.error('[EnokiService] Error verifying ZkLogin signature:', error);
      return false;
    }
  }
}

export const enokiService = new EnokiService();

