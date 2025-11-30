import { Request, Response, NextFunction } from 'express';
import { ProposalService } from './proposal.service';
import { ApiResponse } from '../../types';
import { sponsorGasService } from '../../services/sponsorGasService';
import { logger } from '../../utils/logger';

export class ProposalController {
  private proposalService: ProposalService;

  constructor() {
    this.proposalService = new ProposalService();
  }

  getProposal = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Proposal ID is required',
        } as ApiResponse);
        return;
      }

      const proposal = await this.proposalService.getProposal(id);

      if (!proposal) {
        res.status(404).json({
          success: false,
          error: 'Proposal not found',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: { proposal },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  getProposalsByCommunity = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { commityId } = req.params;

      if (!commityId) {
        res.status(400).json({
          success: false,
          error: 'Community ID is required',
        } as ApiResponse);
        return;
      }

      const proposals = await this.proposalService.getProposalsByCommunity(
        commityId
      );

      res.json({
        success: true,
        data: {
          proposals,
          total: proposals.length,
        },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  getVotes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Proposal ID is required',
        } as ApiResponse);
        return;
      }

      const votes = await this.proposalService.getVotes(id);

      res.json({
        success: true,
        data: {
          votes,
          total: votes.length,
        },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  createProposal = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { commityId, messageId, title, description, deadline, quorumThreshold, isJoinRequest } =
        req.body;

      if (!commityId || !title || !description || !deadline || !quorumThreshold) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
        } as ApiResponse);
        return;
      }

      const transaction = await this.proposalService.createProposalTransaction({
        commityId,
        messageId: messageId || '',
        title,
        description,
        deadline,
        quorumThreshold,
        isJoinRequest: isJoinRequest || false,
      });

      res.json({
        success: true,
        data: {
          transaction,
        },
        message: 'Proposal creation transaction created',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  castVote = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { profileId, commityId, voteType } = req.body;

      if (!id || !profileId || !commityId || voteType === undefined) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields',
        } as ApiResponse);
        return;
      }

      if (![0, 1, 2].includes(voteType)) {
        res.status(400).json({
          success: false,
          error: 'Invalid vote type. Must be 0 (No), 1 (Yes), or 2 (Abstain)',
        } as ApiResponse);
        return;
      }

      const transaction = await this.proposalService.castVoteTransaction(
        id,
        profileId,
        commityId,
        voteType
      );

      res.json({
        success: true,
        data: {
          transaction,
        },
        message: 'Vote transaction created',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  finalizeProposal = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { creatorProfileId, commityId } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Proposal ID is required',
        } as ApiResponse);
        return;
      }

      // Get proposal to find creator and commityId if not provided
      const proposal = await this.proposalService.getProposal(id);
      if (!proposal) {
        res.status(404).json({
          success: false,
          error: 'Proposal not found',
        } as ApiResponse);
        return;
      }

      // Use provided values or fallback to proposal data
      const finalCreatorProfileId = creatorProfileId || '';
      const finalCommityId = commityId || proposal.commityId;

      if (!finalCreatorProfileId) {
        res.status(400).json({
          success: false,
          error: 'Creator profile ID is required for finalization with auto-join',
        } as ApiResponse);
        return;
      }

      const transaction = await this.proposalService.finalizeProposalTransaction(
        id,
        finalCreatorProfileId,
        finalCommityId
      );

      res.json({
        success: true,
        data: {
          transaction,
        },
        message: 'Finalize proposal transaction created',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Build sponsored transaction for creating proposal (join request)
   * User signs the transaction, backend sponsors the gas
   */
  buildSponsoredCreateProposal = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { sender, moveCallTarget, moveCallArgs } = req.body;

      if (!sender || typeof sender !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Sender address is required',
        } as ApiResponse);
        return;
      }

      if (!moveCallTarget || typeof moveCallTarget !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Move call target is required',
        } as ApiResponse);
        return;
      }

      if (!Array.isArray(moveCallArgs)) {
        res.status(400).json({
          success: false,
          error: 'Move call arguments must be an array',
        } as ApiResponse);
        return;
      }

      if (!sponsorGasService.isAvailable()) {
        res.status(503).json({
          success: false,
          error: 'Sponsor gas is not available. SPONSOR_PRIVATE_KEY not configured.',
        } as ApiResponse);
        return;
      }

      // Build sponsored transaction block
      const result = await sponsorGasService.buildSponsoredTransactionBlock(
        sender,
        moveCallTarget,
        moveCallArgs
      );

      res.json({
        success: true,
        data: {
          transactionBlock: result.bytes,
        },
        message: 'Sponsored transaction block built successfully',
      } as ApiResponse);
    } catch (error) {
      logger.error('ProposalController.buildSponsoredCreateProposal error:', error);
      next(error);
    }
  };

  /**
   * Create proposal with sponsored gas
   * User signs the transaction, backend sponsors the gas
   */
  sponsorCreateProposal = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { transactionBlock, signature } = req.body;

      if (!transactionBlock || typeof transactionBlock !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Transaction block is required',
        } as ApiResponse);
        return;
      }

      if (!signature || typeof signature !== 'string') {
        res.status(400).json({
          success: false,
          error: 'User signature is required',
        } as ApiResponse);
        return;
      }

      if (!sponsorGasService.isAvailable()) {
        res.status(503).json({
          success: false,
          error: 'Sponsor gas is not available. SPONSOR_PRIVATE_KEY not configured.',
        } as ApiResponse);
        return;
      }

      // Sponsor and execute transaction
      const result = await sponsorGasService.sponsorAndExecuteTransaction(
        transactionBlock,
        signature
      );

      res.json({
        success: true,
        data: {
          digest: result.digest,
          effects: result.effects,
          events: result.events,
          objectChanges: result.objectChanges,
        },
        message: 'Proposal created with sponsored gas',
      } as ApiResponse);
    } catch (error) {
      logger.error('ProposalController.sponsorCreateProposal error:', error);
      next(error);
    }
  };

  /**
   * Finalize proposal with sponsored gas
   * User signs the transaction, backend sponsors the gas
   */
  sponsorFinalizeProposal = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { creatorProfileId, commityId, transactionBlock, signature } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Proposal ID is required',
        } as ApiResponse);
        return;
      }

      if (!transactionBlock || typeof transactionBlock !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Transaction block is required',
        } as ApiResponse);
        return;
      }

      if (!signature || typeof signature !== 'string') {
        res.status(400).json({
          success: false,
          error: 'User signature is required',
        } as ApiResponse);
        return;
      }

      // Get proposal to find creator and commityId if not provided
      const proposal = await this.proposalService.getProposal(id);
      if (!proposal) {
        res.status(404).json({
          success: false,
          error: 'Proposal not found',
        } as ApiResponse);
        return;
      }

      // Use provided values or fallback to proposal data
      const finalCreatorProfileId = creatorProfileId || '';
      const finalCommityId = commityId || proposal.commityId;

      if (!finalCreatorProfileId) {
        res.status(400).json({
          success: false,
          error: 'Creator profile ID is required for finalization with auto-join',
        } as ApiResponse);
        return;
      }

      if (!sponsorGasService.isAvailable()) {
        res.status(503).json({
          success: false,
          error: 'Sponsor gas is not available. SPONSOR_PRIVATE_KEY not configured.',
        } as ApiResponse);
        return;
      }

      // Sponsor and execute transaction
      const result = await sponsorGasService.sponsorAndExecuteTransaction(
        transactionBlock,
        signature
      );

      res.json({
        success: true,
        data: {
          digest: result.digest,
          effects: result.effects,
          events: result.events,
          objectChanges: result.objectChanges,
        },
        message: 'Proposal finalized with sponsored gas',
      } as ApiResponse);
    } catch (error) {
      logger.error('ProposalController.sponsorFinalizeProposal error:', error);
      next(error);
    }
  };
}

