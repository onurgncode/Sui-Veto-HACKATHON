import { Request, Response, NextFunction } from 'express';
import { ProposalService } from './proposal.service';
import { ApiResponse } from '../../types';

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
      const { commityId, messageId, title, description, deadline, quorumThreshold } =
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

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Proposal ID is required',
        } as ApiResponse);
        return;
      }

      const transaction = await this.proposalService.finalizeProposalTransaction(
        id
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
}

