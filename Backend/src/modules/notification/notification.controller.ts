import { Request, Response, NextFunction } from 'express';
import { NotificationService } from './notification.service';
import { ApiResponse } from '../../types';

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  getNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { address } = req.params;
      const { unreadOnly } = req.query;

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'Address parameter is required',
        } as ApiResponse);
        return;
      }

      const notifications = await this.notificationService.getNotifications(
        address,
        unreadOnly === 'true'
      );

      res.json({
        success: true,
        data: {
          notifications,
          total: notifications.length,
        },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  getUnreadCount = async (
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

      const count = await this.notificationService.getUnreadCount(address);

      res.json({
        success: true,
        data: {
          unreadCount: count,
        },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { address, notificationId } = req.params;

      if (!address || !notificationId) {
        res.status(400).json({
          success: false,
          error: 'Address and notificationId parameters are required',
        } as ApiResponse);
        return;
      }

      const success = await this.notificationService.markAsRead(
        notificationId,
        address
      );

      if (!success) {
        res.status(404).json({
          success: false,
          error: 'Notification not found',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: 'Notification marked as read',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (
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

      const count = await this.notificationService.markAllAsRead(address);

      res.json({
        success: true,
        data: {
          markedCount: count,
        },
        message: `${count} notifications marked as read`,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };
}

