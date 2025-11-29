import { Router } from 'express';
import { CommunityController } from './community.controller';

const router = Router();
const communityController = new CommunityController();

// GET /api/community/:id
router.get('/:id', communityController.getCommunity);

// GET /api/community/:id/members
router.get('/:id/members', communityController.getMembers);

// POST /api/community
router.post('/', communityController.createCommunity);

// POST /api/community/:id/join
router.post('/:id/join', communityController.joinCommunity);

export default router;

