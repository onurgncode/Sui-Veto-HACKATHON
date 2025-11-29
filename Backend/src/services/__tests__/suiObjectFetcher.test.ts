import { SuiObjectFetcher } from '../suiObjectFetcher';

// Real test address
const TEST_ADDRESS = '0x6db331729a299df9a9ebe73d36abb11584380748bbc6283d51eddbdea7a8943c';

describe('SuiObjectFetcher', () => {
  let fetcher: SuiObjectFetcher;

  beforeEach(() => {
    fetcher = new SuiObjectFetcher();
  });

  describe('getProfileByOwner', () => {
    it('should fetch profile for real address', async () => {
      const profile = await fetcher.getProfileByOwner(TEST_ADDRESS);

      // Profile might not exist, so we just check it doesn't throw
      expect(profile === null || typeof profile === 'object').toBe(true);
    }, 10000); // 10 second timeout for network calls
  });

  describe('getOwnedObjects', () => {
    it('should fetch owned objects for real address', async () => {
      const objects = await fetcher.getOwnedObjects(TEST_ADDRESS);

      expect(Array.isArray(objects)).toBe(true);
      // Objects array might be empty if address has no objects
    }, 10000);
  });

  describe('getObject', () => {
    it('should handle invalid object ID gracefully', async () => {
      const invalidId = '0x0000000000000000000000000000000000000000000000000000000000000000';
      const object = await fetcher.getObject(invalidId);

      expect(object).toBeNull();
    }, 10000);
  });
});
