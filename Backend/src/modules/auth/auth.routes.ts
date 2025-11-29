import { Router } from 'express';
import { AuthController } from './auth.controller';

const router = Router();
const authController = new AuthController();

// POST /api/auth/nonce
router.post('/nonce', authController.generateNonce);

// POST /api/auth/authenticate
router.post('/authenticate', authController.authenticate);

export default router;

