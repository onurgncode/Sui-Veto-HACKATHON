import { logger } from '../../utils/logger';
import { TransactionBuilderService } from '../../services/transactionBuilder';
import { SuiObjectFetcher } from '../../services/suiObjectFetcher';
import { Profile, MemberStats } from './profile.types';

export class ProfileService {
  private transactionBuilder: TransactionBuilderService;
  private objectFetcher: SuiObjectFetcher;

  constructor() {
    this.transactionBuilder = new TransactionBuilderService();
    this.objectFetcher = new SuiObjectFetcher();
  }

  async getProfile(address: string): Promise<Profile | null> {
    try {
      logger.info(`Fetching profile for address: ${address}`);

      const profileObject = await this.objectFetcher.getProfileByOwner(address);

      if (!profileObject) {
        return null;
      }

      const profile: Profile = {
        id: profileObject.objectId,
        nickname: (profileObject.data.nickname as string) || '',
        owner: (profileObject.data.owner as string) || address,
      };

      return profile;
    } catch (error) {
      logger.error('Error getting profile:', error);
      throw error;
    }
  }

  async getMemberStats(
    address: string,
    commityId: string
  ): Promise<MemberStats | null> {
    try {
      logger.info(
        `Fetching member stats for address: ${address}, commity: ${commityId}`
      );

      const profileObject = await this.objectFetcher.getProfileByOwner(address);

      if (!profileObject) {
        return null;
      }

      // Get member stats from dynamic field
      const statsField = await this.objectFetcher.getDynamicField(
        profileObject.objectId,
        commityId
      );

      if (!statsField) {
        return null;
      }

      const stats: MemberStats = {
        xp: Number(statsField.data.xp) || 0,
        level: Number(statsField.data.level) || 1,
      };

      return stats;
    } catch (error) {
      logger.error('Error getting member stats:', error);
      throw error;
    }
  }

  async createProfileTransaction(nickname: string): Promise<{
    transactionBlock: string;
  }> {
    try {
      const tx = this.transactionBuilder.buildCreateProfileTransaction(nickname);
      const serialized = tx.serialize();

      return {
        transactionBlock: Buffer.from(serialized).toString('base64'),
      };
    } catch (error) {
      logger.error('Error creating profile transaction:', error);
      throw error;
    }
  }
}

