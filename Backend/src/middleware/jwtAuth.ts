import { Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { ApiResponse } from '../types';
import { AuthenticatedRequest } from './auth';

const authService = new AuthService();

/**
 * Middleware to verify JWT token
 */
export function verifyJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      } as ApiResponse);
      return;
    }

    const token = authHeader.substring(7);
    const decoded = authService.verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      } as ApiResponse);
      return;
    }

    req.user = {
      address: decoded.address,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
    } as ApiResponse);
  }
}

