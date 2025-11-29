import { logger } from '../../utils/logger';
import { TransactionBuilderService } from '../../services/transactionBuilder';
import { SuiObjectFetcher } from '../../services/suiObjectFetcher';
import { Community, CommunityMember } from './community.types';

export class CommunityService {
  private transactionBuilder: TransactionBuilderService;
  private objectFetcher: SuiObjectFetcher;

  constructor() {
    this.transactionBuilder = new TransactionBuilderService();
    this.objectFetcher = new SuiObjectFetcher();
  }

  async getCommunity(id: string): Promise<Community | null> {
    try {
      logger.info(`Fetching community: ${id}`);

      const communityObject = await this.objectFetcher.getCommunityById(id);

      if (!communityObject) {
        return null;
      }

      const community: Community = {
        id: communityObject.objectId,
        name: (communityObject.data.name as string) || '',
      };

      return community;
    } catch (error) {
      logger.error('Error getting community:', error);
      throw error;
    }
  }

  async getMembers(commityId: string): Promise<CommunityMember[]> {
    try {
      logger.info(`Fetching members for community: ${commityId}`);

      const communityObject = await this.objectFetcher.getCommunityById(
        commityId
      );

      if (!communityObject) {
        return [];
      }

      // Get all dynamic fields (members are stored as dynamic fields)
      const dynamicFields = await this.objectFetcher.getDynamicFields(
        communityObject.objectId
      );

      const members: CommunityMember[] = [];

      for (const field of dynamicFields) {
        // Members are stored as <address, bool> in dynamic fields
        // The field name is the address
        if (field.name) {
          // This is a member entry (bool value stored as dynamic field)
          // Note: Timestamp would require indexing transaction history
          // For now, using current time as placeholder
          members.push({
            address: field.name,
            joinedAt: Date.now(),
          });
        }
      }

      return members;
    } catch (error) {
      logger.error('Error getting members:', error);
      throw error;
    }
  }

  async isMember(commityId: string, address: string): Promise<boolean> {
    try {
      logger.info(
        `Checking membership: ${address} in community: ${commityId}`
      );

      const communityObject = await this.objectFetcher.getCommunityById(
        commityId
      );

      if (!communityObject) {
        return false;
      }

      // Check if address exists as dynamic field
      const memberField = await this.objectFetcher.getDynamicField(
        communityObject.objectId,
        address,
        'address'
      );

      return memberField !== null;
    } catch (error) {
      logger.error('Error checking membership:', error);
      throw error;
    }
  }

  async createCommunityTransaction(name: string): Promise<{
    transactionBlock: string;
  }> {
    try {
      const tx = this.transactionBuilder.buildCreateCommunityTransaction(name);
      const serialized = tx.serialize();

      return {
        transactionBlock: Buffer.from(serialized).toString('base64'),
      };
    } catch (error) {
      logger.error('Error creating community transaction:', error);
      throw error;
    }
  }

  async joinCommunityTransaction(
    commityId: string,
    profileId: string
  ): Promise<{
    transactionBlock: string;
  }> {
    try {
      const tx = this.transactionBuilder.buildJoinCommunityTransaction(
        profileId,
        commityId
      );
      const serialized = tx.serialize();

      return {
        transactionBlock: Buffer.from(serialized).toString('base64'),
      };
    } catch (error) {
      logger.error('Error creating join transaction:', error);
      throw error;
    }
  }

  async getAllCommunities(): Promise<Community[]> {
    try {
      logger.info('Fetching all communities');

      const communityObjects = await this.objectFetcher.getAllCommunities();

      const communities: Community[] = communityObjects.map((obj) => ({
        id: obj.objectId,
        name: (obj.data.name as string) || '',
      }));

      logger.info(`Found ${communities.length} communities`);
      return communities;
    } catch (error) {
      logger.error('Error getting all communities:', error);
      throw error;
    }
  }

  async getCommunitiesByMember(address: string): Promise<Community[]> {
    try {
      logger.info(`Fetching communities for member: ${address}`);

      const communityObjects = await this.objectFetcher.getCommunitiesByMember(address);

      const communities: Community[] = communityObjects.map((obj) => ({
        id: obj.objectId,
        name: (obj.data.name as string) || '',
      }));

      logger.info(`Found ${communities.length} communities for member ${address}`);
      return communities;
    } catch (error) {
      logger.error('Error getting communities by member:', error);
      throw error;
    }
  }
}

