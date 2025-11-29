import { Request, Response, NextFunction } from 'express';
import { AuthModuleService } from './auth.service';
import { ApiResponse } from '../../types';

export class AuthController {
  private authService: AuthModuleService;

  constructor() {
    this.authService = new AuthModuleService();
  }

  generateNonce = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { address } = req.body;

      if (!address || typeof address !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Address is required',
        } as ApiResponse);
        return;
      }

      const result = await this.authService.generateNonce({ address });

      res.json({
        success: true,
        data: result,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { address, message, signature } = req.body;

      if (!address || !message || !signature) {
        res.status(400).json({
          success: false,
          error: 'Address, message, and signature are required',
        } as ApiResponse);
        return;
      }

      const result = await this.authService.authenticate({
        address,
        message,
        signature,
      });

      res.json({
        success: true,
        data: result,
        message: 'Authentication successful',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };
}

