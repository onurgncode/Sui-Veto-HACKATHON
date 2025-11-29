import { ProfileService } from '../profile.service';
import { SuiObjectFetcher } from '../../../services/suiObjectFetcher';
import { TransactionBuilderService } from '../../../services/transactionBuilder';

// Mock dependencies
jest.mock('../../../services/suiObjectFetcher');
jest.mock('../../../services/transactionBuilder');

describe('ProfileService', () => {
  let service: ProfileService;
  let mockObjectFetcher: jest.Mocked<SuiObjectFetcher>;
  let mockTransactionBuilder: jest.Mocked<TransactionBuilderService>;

  beforeEach(() => {
    mockObjectFetcher = {
      getProfileByOwner: jest.fn(),
      getDynamicField: jest.fn(),
    } as any;

    mockTransactionBuilder = {
      buildCreateProfileTransaction: jest.fn(),
    } as any;

    service = new ProfileService();
    // Inject mocks
    (service as any).objectFetcher = mockObjectFetcher;
    (service as any).transactionBuilder = mockTransactionBuilder;
  });

  describe('getProfile', () => {
    it('should return null when profile not found', async () => {
      mockObjectFetcher.getProfileByOwner.mockResolvedValue(null);

      const result = await service.getProfile('0x123');

      expect(result).toBeNull();
      expect(mockObjectFetcher.getProfileByOwner).toHaveBeenCalledWith('0x123');
    });

    it('should return profile when found', async () => {
      const mockProfile = {
        objectId: '0x123',
        type: 'Profile',
        data: {
          nickname: 'testuser',
          owner: '0x123',
        },
      };

      mockObjectFetcher.getProfileByOwner.mockResolvedValue(mockProfile as any);

      const result = await service.getProfile('0x123');

      expect(result).toEqual({
        id: '0x123',
        nickname: 'testuser',
        owner: '0x123',
      });
    });
  });

  describe('getMemberStats', () => {
    it('should return null when profile not found', async () => {
      mockObjectFetcher.getProfileByOwner.mockResolvedValue(null);

      const result = await service.getMemberStats('0x123', '0x456');

      expect(result).toBeNull();
    });

    it('should return null when stats not found', async () => {
      const mockProfile = {
        objectId: '0x123',
        data: {},
      };

      mockObjectFetcher.getProfileByOwner.mockResolvedValue(mockProfile as any);
      mockObjectFetcher.getDynamicField.mockResolvedValue(null);

      const result = await service.getMemberStats('0x123', '0x456');

      expect(result).toBeNull();
    });

    it('should return stats when found', async () => {
      const mockProfile = {
        objectId: '0x123',
        data: {},
      };

      const mockStats = {
        objectId: '0xstats',
        data: {
          xp: '100',
          level: '2',
        },
      };

      mockObjectFetcher.getProfileByOwner.mockResolvedValue(mockProfile as any);
      mockObjectFetcher.getDynamicField.mockResolvedValue(mockStats as any);

      const result = await service.getMemberStats('0x123', '0x456');

      expect(result).toEqual({
        xp: 100,
        level: 2,
      });
    });
  });

  describe('createProfileTransaction', () => {
    it('should create and serialize transaction', async () => {
      const mockTx = {
        serialize: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
      };

      mockTransactionBuilder.buildCreateProfileTransaction.mockReturnValue(
        mockTx as any
      );

      const result = await service.createProfileTransaction('testuser');

      expect(result).toHaveProperty('transactionBlock');
      expect(typeof result.transactionBlock).toBe('string');
      expect(mockTransactionBuilder.buildCreateProfileTransaction).toHaveBeenCalledWith(
        'testuser'
      );
    });
  });
});

