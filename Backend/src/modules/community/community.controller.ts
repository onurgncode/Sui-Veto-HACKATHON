import { Request, Response, NextFunction } from 'express';
import { CommunityService } from './community.service';
import { ApiResponse } from '../../types';

export class CommunityController {
  private communityService: CommunityService;

  constructor() {
    this.communityService = new CommunityService();
  }

  getCommunity = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Community ID is required',
        } as ApiResponse);
        return;
      }

      const community = await this.communityService.getCommunity(id);

      if (!community) {
        res.status(404).json({
          success: false,
          error: 'Community not found',
        } as ApiResponse);
        return;
      }

      const members = await this.communityService.getMembers(id);

      res.json({
        success: true,
        data: {
          community,
          memberCount: members.length,
        },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  getMembers = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Community ID is required',
        } as ApiResponse);
        return;
      }

      const members = await this.communityService.getMembers(id);

      res.json({
        success: true,
        data: {
          members,
          total: members.length,
        },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  createCommunity = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { name } = req.body;

      if (!name || typeof name !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Community name is required',
        } as ApiResponse);
        return;
      }

      const transaction =
        await this.communityService.createCommunityTransaction(name);

      res.json({
        success: true,
        data: {
          transaction,
        },
        message: 'Community creation transaction created',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  joinCommunity = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { id } = req.params;
      const { profileId } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Community ID is required',
        } as ApiResponse);
        return;
      }

      if (!profileId || typeof profileId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Profile ID is required',
        } as ApiResponse);
        return;
      }

      const transaction = await this.communityService.joinCommunityTransaction(
        id,
        profileId
      );

      res.json({
        success: true,
        data: {
          transaction,
        },
        message: 'Join community transaction created',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  getAllCommunities = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const communities = await this.communityService.getAllCommunities();

      res.json({
        success: true,
        data: {
          communities,
          total: communities.length,
        },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  getCommunitiesByMember = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { address } = req.params;

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'Address is required',
        } as ApiResponse);
        return;
      }

      const communities = await this.communityService.getCommunitiesByMember(address);

      res.json({
        success: true,
        data: {
          communities,
          total: communities.length,
        },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };
}

