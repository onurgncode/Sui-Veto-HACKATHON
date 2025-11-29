import { Request, Response, NextFunction } from 'express';
import { ProfileService } from './profile.service';
import { ApiResponse } from '../../types';

export class ProfileController {
  private profileService: ProfileService;

  constructor() {
    this.profileService = new ProfileService();
  }

  getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { address } = req.params;

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'Address parameter is required',
        } as ApiResponse);
        return;
      }

      const profile = await this.profileService.getProfile(address);

      if (!profile) {
        res.status(404).json({
          success: false,
          error: 'Profile not found',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: profile,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  getMemberStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { address } = req.params;
      const { commityId } = req.query;

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'Address parameter is required',
        } as ApiResponse);
        return;
      }

      if (!commityId || typeof commityId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'commityId query parameter is required',
        } as ApiResponse);
        return;
      }

      const stats = await this.profileService.getMemberStats(
        address,
        commityId
      );

      res.json({
        success: true,
        data: {
          stats,
          commityId,
        },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  createProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { nickname } = req.body;

      if (!nickname || typeof nickname !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Nickname is required',
        } as ApiResponse);
        return;
      }

      const transaction = await this.profileService.createProfileTransaction(
        nickname
      );

      res.json({
        success: true,
        data: {
          transaction,
        },
        message: 'Profile creation transaction created',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };
}

