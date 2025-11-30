import { Router } from 'express';
import { ProfileController } from './profile.controller';

const router = Router();
const profileController = new ProfileController();

// POST /api/profile
router.post('/', profileController.createProfile);

// POST /api/profile/sponsor-create - Create profile with sponsored gas
router.post('/sponsor-create', profileController.sponsorCreateProfile);

// POST /api/profile/build-sponsored-transaction - Build sponsored transaction block on backend
router.post('/build-sponsored-transaction', profileController.buildSponsoredTransaction);

// POST /api/profile/enoki-sponsor - Enoki sponsored transaction step 1: Sponsor transaction
router.post('/enoki-sponsor', profileController.enokiSponsorTransaction);

// POST /api/profile/enoki-submit-signature - Enoki sponsored transaction step 2: Submit signature
router.post('/enoki-submit-signature', profileController.enokiSubmitSignature);

// GET /api/profile/sponsor-address - Get sponsor address (must be before /:address route)
router.get('/sponsor-address', profileController.getSponsorAddress);

// GET /api/profile/:address/stats?commityId=xxx
router.get('/:address/stats', profileController.getMemberStats);

// GET /api/profile/:address/debug - Debug endpoint for testing
router.get('/:address/debug', profileController.debugProfile);

// GET /api/profile/:address (must be last to avoid conflicts)
router.get('/:address', profileController.getProfile);

export default router;

