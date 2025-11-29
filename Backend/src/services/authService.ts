import jwt from 'jsonwebtoken';
import { verifyPersonalMessage } from '@mysten/sui.js/verify';
import { logger } from '../utils/logger';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthResult {
  token: string;
  address: string;
}

export interface NonceResult {
  nonce: string;
  message: string;
}

export class AuthService {
  /**
   * Generate a nonce for authentication
   */
  generateNonce(address: string): NonceResult {
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    const message = `Sign this message to authenticate with Sui Veto DAO.\n\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

    return {
      nonce,
      message,
    };
  }

  /**
   * Verify signature and generate JWT token
   */
  async authenticate(
    address: string,
    message: string,
    signature: string
  ): Promise<AuthResult> {
    try {
      // Convert message to Uint8Array
      const messageBytes = new TextEncoder().encode(message);

      // Verify the signature and get public key
      const publicKey = await verifyPersonalMessage(
        messageBytes,
        signature as any
      );

      // Verify the address matches
      const recoveredAddress = publicKey.toSuiAddress();
      if (recoveredAddress !== address) {
        throw new Error('Address mismatch');
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          address,
          type: 'wallet',
        },
        JWT_SECRET,
        {
          expiresIn: JWT_EXPIRES_IN,
        } as jwt.SignOptions
      );

      logger.info(`User authenticated: ${address}`);

      return {
        token,
        address,
      };
    } catch (error) {
      logger.error('Error authenticating user:', error);
      throw error;
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { address: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { address: string };
      return decoded;
    } catch (error) {
      logger.error('Error verifying token:', error);
      return null;
    }
  }
}

