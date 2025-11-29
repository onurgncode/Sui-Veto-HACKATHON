import { Request, Response, NextFunction } from 'express';
import { EventNFTService } from './event-nft.service';
import { ApiResponse } from '../../types';

export class EventNFTController {
  private eventNFTService: EventNFTService;

  constructor() {
    this.eventNFTService = new EventNFTService();
  }

  getEventNFT = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'NFT ID parameter is required',
        } as ApiResponse);
        return;
      }

      const nft = await this.eventNFTService.getEventNFT(id);

      if (!nft) {
        res.status(404).json({
          success: false,
          error: 'Event NFT not found',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: {
          nft,
        },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  getEventNFTsByOwner = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { owner } = req.params;

      if (!owner) {
        res.status(400).json({
          success: false,
          error: 'Owner address parameter is required',
        } as ApiResponse);
        return;
      }

      const nfts = await this.eventNFTService.getEventNFTsByOwner(owner);

      res.json({
        success: true,
        data: {
          nfts,
          total: nfts.length,
        },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  getEventNFTsByCommunity = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { commityId } = req.params;

      if (!commityId) {
        res.status(400).json({
          success: false,
          error: 'Community ID parameter is required',
        } as ApiResponse);
        return;
      }

      const nfts = await this.eventNFTService.getEventNFTsByCommunity(commityId);

      res.json({
        success: true,
        data: {
          nfts,
          total: nfts.length,
        },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  mintEventNFT = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { commityId, xp, recipient } = req.body;

      if (!commityId || typeof commityId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'commityId is required',
        } as ApiResponse);
        return;
      }

      if (!xp || typeof xp !== 'number' || xp <= 0) {
        res.status(400).json({
          success: false,
          error: 'xp must be a positive number',
        } as ApiResponse);
        return;
      }

      if (!recipient || typeof recipient !== 'string') {
        res.status(400).json({
          success: false,
          error: 'recipient address is required',
        } as ApiResponse);
        return;
      }

      const transaction = await this.eventNFTService.mintEventNFTTransaction({
        commityId,
        xp,
        recipient,
      });

      res.json({
        success: true,
        data: {
          transaction,
        },
        message: 'Event NFT mint transaction created',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };
}

