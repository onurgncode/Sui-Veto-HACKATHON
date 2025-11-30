import { logger } from '../utils/logger';
import { ProposalService } from '../modules/proposal/proposal.service';
import { ProfileService } from '../modules/profile/profile.service';
import { CommunityService } from '../modules/community/community.service';
import { sponsorGasService } from './sponsorGasService';
import { TransactionBuilderService } from './transactionBuilder';
import { SuiClient } from '@mysten/sui.js/client';
import { suiClient } from '../config/sui';

/**
 * Auto Finalize Service
 * Automatically finalizes proposals when deadline passes or all members vote
 * Uses sponsor gas to execute transactions
 */
export class AutoFinalizeService {
  private proposalService: ProposalService;
  private profileService: ProfileService;
  private communityService: CommunityService;
  private transactionBuilder: TransactionBuilderService;
  private suiClient: SuiClient;
  private isRunning: boolean = false;

  constructor() {
    this.proposalService = new ProposalService();
    this.profileService = new ProfileService();
    this.communityService = new CommunityService();
    this.transactionBuilder = new TransactionBuilderService();
    this.suiClient = suiClient;
  }

  /**
   * Check and finalize proposals that need to be finalized
   * This should be called periodically (e.g., every minute)
   */
  async checkAndFinalizeProposals(): Promise<void> {
    if (this.isRunning) {
      logger.debug('[AutoFinalizeService] Already running, skipping');
      return;
    }

    if (!sponsorGasService.isAvailable()) {
      logger.debug('[AutoFinalizeService] Sponsor gas not available, skipping');
      return;
    }

    this.isRunning = true;

    try {
      // Get all active proposals
      // Note: This is a simplified approach - in production, you'd want to
      // query proposals by status and deadline
      logger.info('[AutoFinalizeService] Checking for proposals to finalize...');

      // TODO: Implement query for active proposals that need finalization
      // For now, this is a placeholder - you'd need to implement a method
      // to get all active proposals across all communities

      logger.info('[AutoFinalizeService] Auto-finalize check completed');
    } catch (error) {
      logger.error('[AutoFinalizeService] Error checking proposals:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Finalize a specific proposal
   * This is called when a proposal needs to be finalized
   */
  async finalizeProposal(
    proposalId: string,
    creatorProfileId: string,
    commityId: string
  ): Promise<void> {
    if (!sponsorGasService.isAvailable()) {
      throw new Error('Sponsor gas is not available');
    }

    try {
      logger.info(`[AutoFinalizeService] Finalizing proposal ${proposalId}`);

      // Build finalize transaction
      const tx = this.transactionBuilder.buildFinalizeProposalTransaction(
        proposalId,
        creatorProfileId,
        commityId
      );

      // Execute as sponsor (backend signs and pays gas)
      // Note: This requires the creator's profile to be accessible
      // In practice, the creator should sign this transaction
      // For now, we'll use sponsor gas but the creator's profile must be passed
      const result = await sponsorGasService.executeTransactionAsSponsor(tx);

      logger.info(`[AutoFinalizeService] ✅ Proposal ${proposalId} finalized successfully`);
      logger.info(`[AutoFinalizeService] Transaction digest: ${result.digest}`);
    } catch (error) {
      logger.error(`[AutoFinalizeService] ❌ Error finalizing proposal ${proposalId}:`, error);
      throw error;
    }
  }

  /**
   * Start auto-finalize service (periodic checking)
   */
  start(intervalMs: number = 60000): void {
    logger.info(`[AutoFinalizeService] Starting auto-finalize service (interval: ${intervalMs}ms)`);
    
    // Check immediately
    this.checkAndFinalizeProposals();
    
    // Then check periodically
    setInterval(() => {
      this.checkAndFinalizeProposals();
    }, intervalMs);
  }
}

export const autoFinalizeService = new AutoFinalizeService();

