import { logger } from '../../utils/logger';
import { TransactionBuilderService } from '../../services/transactionBuilder';
import { SuiObjectFetcher } from '../../services/suiObjectFetcher';
import { EventNFT, MintEventNFTRequest } from './event-nft.types';
import { PACKAGE_ID } from '../../config/sui';

export class EventNFTService {
  private transactionBuilder: TransactionBuilderService;
  private objectFetcher: SuiObjectFetcher;

  constructor() {
    this.transactionBuilder = new TransactionBuilderService();
    this.objectFetcher = new SuiObjectFetcher();
  }

  async getEventNFT(id: string): Promise<EventNFT | null> {
    try {
      logger.info(`Fetching event NFT: ${id}`);

      const nftObject = await this.objectFetcher.getObject(id);

      if (!nftObject) {
        return null;
      }

      // Check if it's an EventNFT type
      const eventNFTType = `${PACKAGE_ID}::event_nft::EventNFT`;
      if (nftObject.type !== eventNFTType) {
        logger.warn(`Object ${id} is not an EventNFT (type: ${nftObject.type})`);
        return null;
      }

      const data = nftObject.data;

      const nft: EventNFT = {
        id: nftObject.objectId,
        commityId: (data.commity_id as string) || '',
        xp: Number(data.xp) || 0,
        owner: (data.owner as string) || '',
      };

      return nft;
    } catch (error) {
      logger.error('Error getting event NFT:', error);
      throw error;
    }
  }

  async getEventNFTsByOwner(owner: string): Promise<EventNFT[]> {
    try {
      logger.info(`Fetching event NFTs for owner: ${owner}`);

      const eventNFTType = `${PACKAGE_ID}::event_nft::EventNFT`;
      const objects = await this.objectFetcher.getOwnedObjects(owner, eventNFTType);

      const nfts: EventNFT[] = objects.map((obj) => {
        const data = obj.data;
        return {
          id: obj.objectId,
          commityId: (data.commity_id as string) || '',
          xp: Number(data.xp) || 0,
          owner: (data.owner as string) || owner,
        };
      });

      return nfts;
    } catch (error) {
      logger.error('Error getting event NFTs by owner:', error);
      throw error;
    }
  }

  async getEventNFTsByCommunity(commityId: string): Promise<EventNFT[]> {
    try {
      logger.info(`Fetching event NFTs for community: ${commityId}`);

      // Note: This requires indexing or querying all NFTs
      // For now, return empty array - will be implemented with Surflux indexing
      logger.warn(
        'getEventNFTsByCommunity: Requires Surflux indexing for efficient querying'
      );

      return [];
    } catch (error) {
      logger.error('Error getting event NFTs by community:', error);
      throw error;
    }
  }

  async mintEventNFTTransaction(
    data: MintEventNFTRequest
  ): Promise<{
    transactionBlock: string;
  }> {
    try {
      const tx = this.transactionBuilder.buildMintEventNFTTransaction(data);
      const serialized = tx.serialize();

      return {
        transactionBlock: Buffer.from(serialized).toString('base64'),
      };
    } catch (error) {
      logger.error('Error creating mint event NFT transaction:', error);
      throw error;
    }
  }
}

