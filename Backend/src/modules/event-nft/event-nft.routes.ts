import { Router } from 'express';
import { EventNFTController } from './event-nft.controller';

const router = Router();
const eventNFTController = new EventNFTController();

// GET /api/event-nft/:id
router.get('/:id', eventNFTController.getEventNFT);

// GET /api/event-nft/owner/:owner
router.get('/owner/:owner', eventNFTController.getEventNFTsByOwner);

// GET /api/event-nft/community/:commityId
router.get('/community/:commityId', eventNFTController.getEventNFTsByCommunity);

// POST /api/event-nft/mint
router.post('/mint', eventNFTController.mintEventNFT);

export default router;

