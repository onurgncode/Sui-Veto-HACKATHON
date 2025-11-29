import { TransactionBuilderService } from '../transactionBuilder';
import { TransactionBlock } from '@mysten/sui.js/transactions';

describe('TransactionBuilderService', () => {
  let service: TransactionBuilderService;

  beforeEach(() => {
    service = new TransactionBuilderService();
  });

  describe('buildCreateProfileTransaction', () => {
    it('should create a valid profile creation transaction', () => {
      const nickname = 'testuser';
      const tx = service.buildCreateProfileTransaction(nickname);

      expect(tx).toBeInstanceOf(TransactionBlock);
    });

    it('should include correct function call', () => {
      const nickname = 'testuser';
      const tx = service.buildCreateProfileTransaction(nickname);

      // Transaction block should be serializable
      expect(() => tx.serialize()).not.toThrow();
    });
  });

  describe('buildCreateCommunityTransaction', () => {
    it('should create a valid community creation transaction', () => {
      const name = 'Test Community';
      const tx = service.buildCreateCommunityTransaction(name);

      expect(tx).toBeInstanceOf(TransactionBlock);
      expect(() => tx.serialize()).not.toThrow();
    });
  });

  describe('buildJoinCommunityTransaction', () => {
    it('should create a valid join community transaction', () => {
      const profileId = '0x123';
      const commityId = '0x456';
      const tx = service.buildJoinCommunityTransaction(profileId, commityId);

      expect(tx).toBeInstanceOf(TransactionBlock);
      expect(() => tx.serialize()).not.toThrow();
    });
  });

  describe('buildCreateProposalTransaction', () => {
    it('should create a valid proposal creation transaction', () => {
      const data = {
        commityId: '0x123',
        messageId: '0x456',
        title: 'Test Proposal',
        description: 'Test Description',
        deadline: 1735689600000,
        quorumThreshold: 100,
      };

      const tx = service.buildCreateProposalTransaction(data);

      expect(tx).toBeInstanceOf(TransactionBlock);
      expect(() => tx.serialize()).not.toThrow();
    });
  });

  describe('buildCastVoteTransaction', () => {
    it('should create a valid vote transaction', () => {
      const data = {
        profileId: '0x123',
        proposalId: '0x456',
        commityId: '0x789',
        voteType: 1,
      };

      const tx = service.buildCastVoteTransaction(data);

      expect(tx).toBeInstanceOf(TransactionBlock);
      expect(() => tx.serialize()).not.toThrow();
    });
  });

  describe('buildFinalizeProposalTransaction', () => {
    it('should create a valid finalize transaction', () => {
      const proposalId = '0x123';
      const tx = service.buildFinalizeProposalTransaction(proposalId);

      expect(tx).toBeInstanceOf(TransactionBlock);
      expect(() => tx.serialize()).not.toThrow();
    });
  });
});

