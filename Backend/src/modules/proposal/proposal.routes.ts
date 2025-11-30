import { Router } from 'express';
import { ProposalController } from './proposal.controller';

const router = Router();
const proposalController = new ProposalController();

// GET /api/proposal/:id
router.get('/:id', proposalController.getProposal);

// GET /api/proposal/community/:commityId
router.get('/community/:commityId', proposalController.getProposalsByCommunity);

// GET /api/proposal/:id/votes
router.get('/:id/votes', proposalController.getVotes);

// POST /api/proposal
router.post('/', proposalController.createProposal);

// POST /api/proposal/:id/vote
router.post('/:id/vote', proposalController.castVote);

// POST /api/proposal/:id/finalize
router.post('/:id/finalize', proposalController.finalizeProposal);

// POST /api/proposal/build-sponsored - Build sponsored transaction for creating proposal
router.post('/build-sponsored', proposalController.buildSponsoredCreateProposal);

// POST /api/proposal/sponsor-create - Create proposal with sponsored gas
router.post('/sponsor-create', proposalController.sponsorCreateProposal);

// POST /api/proposal/:id/sponsor-finalize - Finalize proposal with sponsored gas
router.post('/:id/sponsor-finalize', proposalController.sponsorFinalizeProposal);

export default router;

