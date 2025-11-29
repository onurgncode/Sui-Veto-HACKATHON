import { Router } from 'express';
import { ProfileController } from './profile.controller';

const router = Router();
const profileController = new ProfileController();

// GET /api/profile/:address
router.get('/:address', profileController.getProfile);

// GET /api/profile/:address/stats?commityId=xxx
router.get('/:address/stats', profileController.getMemberStats);

// POST /api/profile
router.post('/', profileController.createProfile);

// GET /api/profile/:address/debug - Debug endpoint for testing
router.get('/:address/debug', profileController.debugProfile);

export default router;

