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
      logger.info(`[ProfileService] Fetching profile for address: ${address}`);

      const profileObject = await this.objectFetcher.getProfileByOwner(address);

      if (!profileObject) {
        logger.info(`[ProfileService] No profile object found for address: ${address}`);
        return null;
      }

      logger.info(
        `[ProfileService] Profile object found: ${profileObject.objectId}, type: ${profileObject.type}`
      );

      // Sui String type is stored as bytes, need to decode it
      let nickname = '';
      if (profileObject.data.nickname) {
        // Check if nickname is a string directly or bytes
        if (typeof profileObject.data.nickname === 'string') {
          nickname = profileObject.data.nickname;
          logger.info(`[ProfileService] Nickname is string: ${nickname}`);
        } else if (profileObject.data.nickname && typeof profileObject.data.nickname === 'object') {
          // Sui String type structure: { bytes: Uint8Array } veya { value: string }
          const nicknameObj = profileObject.data.nickname as any;
          logger.info(`[ProfileService] Nickname is object: ${JSON.stringify(nicknameObj)}`);
          
          if (nicknameObj.bytes) {
            // Convert bytes to string
            try {
              const bytesArray = Array.isArray(nicknameObj.bytes) 
                ? nicknameObj.bytes 
                : Object.values(nicknameObj.bytes);
              nickname = new TextDecoder().decode(new Uint8Array(bytesArray));
              logger.info(`[ProfileService] Decoded nickname from bytes: ${nickname}`);
            } catch (error) {
              logger.error(`[ProfileService] Error decoding nickname bytes:`, error);
            }
          } else if (nicknameObj.value) {
            nickname = nicknameObj.value;
            logger.info(`[ProfileService] Nickname from value: ${nickname}`);
          } else {
            // Belki direkt string olarak geliyor
            logger.warn(`[ProfileService] Unknown nickname format:`, nicknameObj);
          }
        } else {
          logger.warn(`[ProfileService] Nickname is neither string nor object: ${typeof profileObject.data.nickname}`);
        }
      } else {
        logger.warn(`[ProfileService] No nickname field in profile data`);
      }

      const profile: Profile = {
        id: profileObject.objectId,
        nickname: nickname || '',
        owner: (profileObject.data.owner as string) || address,
      };

      logger.info(
        `[ProfileService] Profile parsed successfully: id=${profile.id}, nickname=${profile.nickname}, owner=${profile.owner}`
      );

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

