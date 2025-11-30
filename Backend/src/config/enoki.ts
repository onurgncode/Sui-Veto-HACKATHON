/**
 * Enoki Configuration
 * Sponsored transactions için Enoki API entegrasyonu
 */

import dotenv from 'dotenv';
dotenv.config();

export const ENOKI_CONFIG = {
  apiKey: process.env.ENOKI_API_KEY || 'enoki_private_f7ac6756e48fac872eea507e8570b199',
  baseUrl: 'https://api.enoki.mystenlabs.com/v1',
  network: process.env.SUI_NETWORK || 'testnet', // 'testnet' or 'mainnet'
} as const;

