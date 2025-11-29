import { CommunityService } from '../community.service';

describe('CommunityService Integration Tests', () => {
  let service: CommunityService;

  beforeEach(() => {
    service = new CommunityService();
  });

  describe('createCommunityTransaction', () => {
    it('should create valid transaction block', async () => {
      const result = await service.createCommunityTransaction('Test Community');

      expect(result).toHaveProperty('transactionBlock');
      expect(typeof result.transactionBlock).toBe('string');
      expect(result.transactionBlock.length).toBeGreaterThan(0);
    });
  });

  describe('joinCommunityTransaction', () => {
    it('should create valid join transaction', async () => {
      const profileId = '0x123';
      const commityId = '0x456';

      const result = await service.joinCommunityTransaction(commityId, profileId);

      expect(result).toHaveProperty('transactionBlock');
      expect(typeof result.transactionBlock).toBe('string');
    });
  });
});
