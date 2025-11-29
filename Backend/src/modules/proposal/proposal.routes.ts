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

export default router;

