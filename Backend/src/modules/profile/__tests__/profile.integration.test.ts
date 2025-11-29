import { ProfileService } from '../profile.service';

// Real test address
const TEST_ADDRESS = '0x6db331729a299df9a9ebe73d36abb11584380748bbc6283d51eddbdea7a8943c';

describe('ProfileService Integration Tests', () => {
  let service: ProfileService;

  beforeEach(() => {
    service = new ProfileService();
  });

  describe('getProfile with real address', () => {
    it('should fetch profile from Sui blockchain', async () => {
      const profile = await service.getProfile(TEST_ADDRESS);

      // Profile might not exist, so we check it doesn't throw
      expect(profile === null || typeof profile === 'object').toBe(true);
      if (profile) {
        expect(profile).toHaveProperty('id');
        expect(profile).toHaveProperty('nickname');
        expect(profile).toHaveProperty('owner');
      }
    }, 15000);
  });

  describe('createProfileTransaction', () => {
    it('should create valid transaction block', async () => {
      const result = await service.createProfileTransaction('testuser');

      expect(result).toHaveProperty('transactionBlock');
      expect(typeof result.transactionBlock).toBe('string');
      expect(result.transactionBlock.length).toBeGreaterThan(0);
    });
  });
});
