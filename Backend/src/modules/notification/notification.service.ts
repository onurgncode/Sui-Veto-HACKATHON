import { logger } from '../../utils/logger';
import {
  Notification,
  CreateNotificationRequest,
} from './notification.types';

export class NotificationService {
  private notifications: Map<string, Notification[]> = new Map();

  /**
   * Create a new notification
   */
  async createNotification(
    request: CreateNotificationRequest
  ): Promise<Notification> {
    try {
      const notification: Notification = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        address: request.address,
        type: request.type,
        title: request.title,
        message: request.message,
        data: request.data || {},
        read: false,
        timestamp: Date.now(),
      };

      // Store notification in memory (in production, use database)
      if (!this.notifications.has(request.address)) {
        this.notifications.set(request.address, []);
      }
      this.notifications.get(request.address)!.push(notification);

      logger.info(
        `Created notification for ${request.address}: ${notification.type}`
      );

      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for an address
   */
  async getNotifications(
    address: string,
    unreadOnly: boolean = false
  ): Promise<Notification[]> {
    try {
      const userNotifications = this.notifications.get(address) || [];

      if (unreadOnly) {
        return userNotifications.filter((n) => !n.read);
      }

      return userNotifications.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      logger.error('Error getting notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, address: string): Promise<boolean> {
    try {
      const userNotifications = this.notifications.get(address) || [];
      const notification = userNotifications.find((n) => n.id === notificationId);

      if (!notification) {
        return false;
      }

      notification.read = true;
      logger.info(`Marked notification ${notificationId} as read`);
      return true;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for an address
   */
  async markAllAsRead(address: string): Promise<number> {
    try {
      const userNotifications = this.notifications.get(address) || [];
      let count = 0;

      for (const notification of userNotifications) {
        if (!notification.read) {
          notification.read = true;
          count++;
        }
      }

      logger.info(`Marked ${count} notifications as read for ${address}`);
      return count;
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread count for an address
   */
  async getUnreadCount(address: string): Promise<number> {
    try {
      const userNotifications = this.notifications.get(address) || [];
      return userNotifications.filter((n) => !n.read).length;
    } catch (error) {
      logger.error('Error getting unread count:', error);
      throw error;
    }
  }
}

