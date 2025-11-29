import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import profileRoutes from '../modules/profile/profile.routes';
import communityRoutes from '../modules/community/community.routes';
import proposalRoutes from '../modules/proposal/proposal.routes';
import notificationRoutes from '../modules/notification/notification.routes';
import storageRoutes from '../modules/storage/storage.routes';
import eventNFTRoutes from '../modules/event-nft/event-nft.routes';

const router = Router();

// API Routes
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/community', communityRoutes);
router.use('/proposal', proposalRoutes);
router.use('/notification', notificationRoutes);
router.use('/storage', storageRoutes);
router.use('/event-nft', eventNFTRoutes);

export default router;

