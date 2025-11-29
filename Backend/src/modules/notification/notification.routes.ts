import { Router } from 'express';
import { NotificationController } from './notification.controller';

const router = Router();
const notificationController = new NotificationController();

// GET /api/notification/:address
router.get('/:address', notificationController.getNotifications);

// GET /api/notification/:address/unread-count
router.get('/:address/unread-count', notificationController.getUnreadCount);

// POST /api/notification/:address/:notificationId/read
router.post('/:address/:notificationId/read', notificationController.markAsRead);

// POST /api/notification/:address/read-all
router.post('/:address/read-all', notificationController.markAllAsRead);

export default router;

