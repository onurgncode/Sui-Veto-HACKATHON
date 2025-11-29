import { Request, Response, NextFunction } from 'express';
import { verifyPersonalMessage } from '@mysten/sui.js/verify';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: {
    address: string;
  };
}

/**
 * Middleware to verify Sui wallet signature
 */
export async function verifyWalletSignature(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { signature, message, address } = req.body;

    if (!signature || !message || !address) {
      res.status(400).json({
        success: false,
        error: 'Signature, message, and address are required',
      } as ApiResponse);
      return;
    }

    // Convert message to Uint8Array
    const messageBytes = new TextEncoder().encode(message);

    // Verify the signature and get public key
    let publicKey;
    try {
      publicKey = await verifyPersonalMessage(messageBytes, signature as any);
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Invalid signature',
      } as ApiResponse);
      return;
    }

    // Verify the address matches
    const recoveredAddress = publicKey.toSuiAddress();
    if (recoveredAddress !== address) {
      res.status(401).json({
        success: false,
        error: 'Address mismatch',
      } as ApiResponse);
      return;
    }

    // Attach user to request
    req.user = {
      address,
    };

    next();
  } catch (error) {
    logger.error('Error verifying wallet signature:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    } as ApiResponse);
  }
}

/**
 * Middleware to require authentication
 */
export function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required',
    } as ApiResponse);
    return;
  }

  next();
}

