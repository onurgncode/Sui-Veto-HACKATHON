// Ensure dotenv is loaded before accessing environment variables
import dotenv from 'dotenv';
dotenv.config();

import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient } from '@mysten/sui.js/client';
import { suiClient } from '../config/sui';
import { logger } from '../utils/logger';
import { fromB64 } from '@mysten/sui.js/utils';

/**
 * Sponsor Gas Service
 * Handles sponsored transactions where backend pays gas fees
 */
export class SponsorGasService {
  private sponsorKeypair: Ed25519Keypair | null = null;
  private suiClient: SuiClient;

  constructor() {
    this.suiClient = suiClient;
    this.initializeKeypair();
  }

  /**
   * Initialize sponsor keypair from environment variable
   */
  private initializeKeypair(): void {
    try {
      const privateKeyBase64 = process.env.SPONSOR_PRIVATE_KEY;
      
      if (!privateKeyBase64) {
        logger.warn('[SponsorGasService] SPONSOR_PRIVATE_KEY not found in environment variables');
        logger.warn('[SponsorGasService] Sponsor gas will not be available');
        return;
      }

      // Decode base64 private key
      const privateKeyBytes = fromB64(privateKeyBase64);
      
      // Create keypair from private key
      // fromSecretKey() expects the private key bytes (32 bytes for Ed25519)
      // If the bytes are from export().privateKey, they should be 32 bytes
      // If they're from getSecretKey(), they're 64 bytes (private + public)
      // We'll try fromSecretKey first, and if it fails, we'll use the first 32 bytes
      try {
        if (privateKeyBytes.length === 32) {
          // Correct format: 32 bytes private key
          this.sponsorKeypair = Ed25519Keypair.fromSecretKey(privateKeyBytes);
        } else if (privateKeyBytes.length === 64) {
          // Full secret key format: first 32 bytes are private key
          this.sponsorKeypair = Ed25519Keypair.fromSecretKey(privateKeyBytes.slice(0, 32));
        } else {
          // Try to use as-is, or use first 32 bytes
          logger.warn(`[SponsorGasService] Unexpected private key length: ${privateKeyBytes.length} bytes. Using first 32 bytes.`);
          this.sponsorKeypair = Ed25519Keypair.fromSecretKey(privateKeyBytes.slice(0, 32));
        }
      } catch (keyError: any) {
        logger.error(`[SponsorGasService] Error creating keypair from private key: ${keyError.message}`);
        logger.error(`[SponsorGasService] Private key length: ${privateKeyBytes.length} bytes`);
        throw keyError;
      }
      
      const sponsorAddress = this.sponsorKeypair.toSuiAddress();
      logger.info(`[SponsorGasService] ✅ Sponsor keypair initialized`);
      logger.info(`[SponsorGasService] Sponsor address: ${sponsorAddress}`);
    } catch (error) {
      logger.error('[SponsorGasService] ❌ Error initializing sponsor keypair:', error);
      this.sponsorKeypair = null;
    }
  }

  /**
   * Check if sponsor gas is available
   */
  isAvailable(): boolean {
    return this.sponsorKeypair !== null;
  }

  /**
   * Get sponsor address
   */
  getSponsorAddress(): string | null {
    if (!this.sponsorKeypair) {
      return null;
    }
    return this.sponsorKeypair.toSuiAddress();
  }

  /**
   * Get sponsor's gas coins for setting gas payment
   * Includes retry mechanism for rate limiting (429 errors)
   */
  async getSponsorGasCoins(): Promise<string[]> {
    if (!this.sponsorKeypair) {
      throw new Error('Sponsor gas is not available. SPONSOR_PRIVATE_KEY not configured.');
    }

    const sponsorAddress = this.sponsorKeypair.toSuiAddress();
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const coins = await this.suiClient.getCoins({
          owner: sponsorAddress,
          coinType: '0x2::sui::SUI',
        });
        
        // Return coin object IDs
        const coinIds = coins.data.map(coin => coin.coinObjectId);
        logger.info(`[SponsorGasService] ✅ Found ${coinIds.length} gas coins for sponsor`);
        return coinIds;
      } catch (error: any) {
        // Check if it's a rate limit error (429)
        if (error.status === 429 && attempt < maxRetries) {
          const delay = retryDelay * attempt; // Exponential backoff
          logger.warn(`[SponsorGasService] Rate limit error (429), retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // For other errors or final attempt, log and throw
        logger.error('[SponsorGasService] ❌ Error getting sponsor gas coins:', error);
        if (attempt === maxRetries) {
          // On final attempt, return empty array instead of throwing
          // This allows the transaction to proceed with just setGasOwner
          logger.warn('[SponsorGasService] ⚠️ Could not get gas coins after retries, returning empty array');
          return [];
        }
        throw error;
      }
    }

    // Should never reach here, but TypeScript requires it
    return [];
  }

  /**
   * Build sponsored transaction block on backend (avoids CORS issues)
   * Frontend sends transaction kind bytes, backend builds full transaction with sponsor gas
   * 
   * @param transactionKindBytes - Transaction kind bytes (base64, from onlyTransactionKind: true build)
   * @param sender - Sender address
   * @param moveCallTarget - Move call target (e.g., "0x123::dao_app::create_profile")
   * @param moveCallArgs - Move call arguments (serialized)
   * @returns Built transaction block bytes (base64) for frontend signing
   */
  async buildSponsoredTransactionBlock(
    sender: string,
    moveCallTarget: string,
    moveCallArgs: any[]
  ): Promise<{ bytes: string }> {
    if (!this.sponsorKeypair) {
      throw new Error('Sponsor gas is not available. SPONSOR_PRIVATE_KEY not configured.');
    }

    try {
      const sponsorAddress = this.sponsorKeypair.toSuiAddress();
      
      // Create transaction block with sponsor as gas owner
      const tx = new TransactionBlock();
      tx.setSender(sender);
      tx.setGasOwner(sponsorAddress);
      
      // Note: setGasPayment is not needed when using setGasOwner
      // The sponsor's gas coins will be automatically selected by the Sui network
      // when the transaction is executed with setGasOwner set to the sponsor address
      
      // Add the move call
      // moveCallTarget must be in format: "package::module::function"
      // moveCallArgs comes from frontend as array of { type, value } objects
      // We need to convert them to TransactionBlock arguments
      const convertedArgs: any[] = [];
      for (const arg of moveCallArgs) {
        if (arg.type === 'string') {
          convertedArgs.push(tx.pure.string(arg.value));
        } else if (arg.type === 'u64') {
          convertedArgs.push(tx.pure.u64(arg.value));
        } else if (arg.type === 'u8') {
          convertedArgs.push(tx.pure.u8(arg.value));
        } else if (arg.type === 'bool') {
          convertedArgs.push(tx.pure.bool(arg.value));
        } else if (arg.type === 'address') {
          convertedArgs.push(tx.pure.address(arg.value));
        } else if (arg.type === 'id') {
          convertedArgs.push(tx.pure.id(arg.value));
        } else if (arg.type === 'object') {
          convertedArgs.push(tx.object(arg.value));
        } else {
          // Default: try to use as-is
          convertedArgs.push(arg.value);
        }
      }
      
      tx.moveCall({
        target: moveCallTarget as `${string}::${string}::${string}`,
        arguments: convertedArgs,
      });
      
      // Build the transaction on backend (no CORS issues)
      const builtTx = await tx.build({ client: this.suiClient });
      
      // Return as base64
      // Use Buffer for base64 encoding (Node.js built-in)
      return {
        bytes: Buffer.from(builtTx).toString('base64'),
      };
    } catch (error) {
      logger.error('[SponsorGasService] ❌ Error building sponsored transaction block:', error);
      throw error;
    }
  }

  /**
   * Sponsor and execute a transaction
   * User signs the transaction, backend sponsors the gas
   * 
   * @param transactionBlock - Serialized transaction block (base64)
   * @param userSignature - User's signature (base64, SerializedSignature format)
   * @returns Transaction result
   */
  async sponsorAndExecuteTransaction(
    transactionBlock: string,
    userSignature: string
  ): Promise<any> {
    if (!this.sponsorKeypair) {
      throw new Error('Sponsor gas is not available. SPONSOR_PRIVATE_KEY not configured.');
    }

    try {
      // Decode transaction block
      const txBytes = fromB64(transactionBlock);
      
      // Sign transaction as sponsor (for gas payment)
      const sponsorSignature = await this.sponsorKeypair.signTransactionBlock(txBytes);
      
      // Combine signatures in the correct order
      // When setGasOwner is used, the transaction expects signatures in this order:
      // 1. Sender signature (user)
      // 2. Gas owner signature (sponsor)
      // Both are already in SerializedSignature format (base64 strings)
      // executeTransactionBlock expects string | string[]
      const combinedSignatures = [
        userSignature, // User's SerializedSignature (sender, first)
        sponsorSignature.signature, // Sponsor's SerializedSignature (gas owner, second)
      ];
      
      logger.info(`[SponsorGasService] Combining signatures: user + sponsor`);
      logger.info(`[SponsorGasService] User signature length: ${userSignature.length}`);
      logger.info(`[SponsorGasService] Sponsor signature length: ${sponsorSignature.signature.length}`);

      // Execute transaction with combined signatures
      const result = await this.suiClient.executeTransactionBlock({
        transactionBlock: txBytes,
        signature: combinedSignatures,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
        requestType: 'WaitForLocalExecution',
      });

      logger.info(`[SponsorGasService] ✅ Transaction sponsored and executed successfully`);
      logger.info(`[SponsorGasService] Transaction digest: ${result.digest}`);
      
      return result;
    } catch (error) {
      logger.error('[SponsorGasService] ❌ Error sponsoring transaction:', error);
      throw error;
    }
  }



  /**
   * Execute a transaction fully on behalf of user (backend signs everything)
   * Use this only when user cannot sign (e.g., automated finalize)
   * 
   * @param transactionBlock - TransactionBlock object
   * @returns Transaction result
   */
  async executeTransactionAsSponsor(transactionBlock: TransactionBlock): Promise<any> {
    if (!this.sponsorKeypair) {
      throw new Error('Sponsor gas is not available. SPONSOR_PRIVATE_KEY not configured.');
    }

    try {
      // Build and sign transaction
      const builtTx = await transactionBlock.build({ client: this.suiClient });
      const signature = await this.sponsorKeypair.signTransactionBlock(builtTx);

      // Execute transaction
      const result = await this.suiClient.executeTransactionBlock({
        transactionBlock: builtTx,
        signature: signature.signature,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
        requestType: 'WaitForLocalExecution',
      });

      logger.info(`[SponsorGasService] ✅ Transaction executed as sponsor`);
      logger.info(`[SponsorGasService] Transaction digest: ${result.digest}`);
      
      return result;
    } catch (error) {
      logger.error('[SponsorGasService] ❌ Error executing transaction as sponsor:', error);
      throw error;
    }
  }
}

export const sponsorGasService = new SponsorGasService();

