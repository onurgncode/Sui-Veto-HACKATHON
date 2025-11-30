import { suiClient, PACKAGE_ID } from '../config/sui';
import { logger } from '../utils/logger';
import { SurfluxClient } from './surfluxClient';
import { SURFLUX_CONFIG } from '../config/surflux';

const COMMITY_TYPE = `${PACKAGE_ID}::commity::Commity`;
const PROPOSAL_TYPE = `${PACKAGE_ID}::proposal::Proposal`;

export interface SuiObjectInfo {
  objectId: string;
  type: string;
  data: Record<string, unknown>;
}

export class SuiObjectFetcher {
  private surfluxClient: SurfluxClient;

  constructor() {
    this.surfluxClient = new SurfluxClient();
  }

  /**
   * Get object by ID
   */
  async getObject(objectId: string): Promise<SuiObjectInfo | null> {
    try {
      const response = await suiClient.getObject({
        id: objectId,
        options: {
          showContent: true,
          showType: true,
          showOwner: true,
        },
      });

      if (response.error) {
        logger.warn(`Object not found: ${objectId}`);
        return null;
      }

      const data = response.data;
      if (!data || !data.content || data.content.dataType !== 'moveObject') {
        return null;
      }

      return {
        objectId: data.objectId,
        type: data.type || '',
        data: data.content.fields as Record<string, unknown>,
      };
    } catch (error) {
      logger.error(`Error fetching object ${objectId}:`, error);
      throw error;
    }
  }

  /**
   * Get owned objects by address and type
   */
  async getOwnedObjects(
    address: string,
    objectType?: string
  ): Promise<SuiObjectInfo[]> {
    try {
      // Filter oluştur - Sui'de type filter için doğru format
      const filter = objectType
        ? { StructType: objectType }
        : { Package: PACKAGE_ID };
      
      logger.info(
        `[getOwnedObjects] Filter: ${JSON.stringify(filter)}, address: ${address}`
      );

      const objects: SuiObjectInfo[] = [];
      let cursor: string | null | undefined = undefined;
      let hasNextPage = true;
      let pageCount = 0;
      const maxPages = 100; // Güvenlik için maksimum sayfa sayısı

      // Pagination ile tüm sayfaları al
      while (hasNextPage && pageCount < maxPages) {
        pageCount++;
        logger.info(
          `Fetching page ${pageCount} for address ${address}, type: ${objectType || 'all'}`
        );

        const response = await suiClient.getOwnedObjects({
          owner: address,
          filter,
          options: {
            showContent: true,
            showType: true,
            showOwner: true,
          },
          cursor, // Sonraki sayfa için cursor kullan
        });
        
        logger.info(
          `[getOwnedObjects] Page ${pageCount} response: ${response.data.length} objects, hasNextPage: ${response.hasNextPage}`
        );

        // Mevcut sayfadaki objeleri ekle
        for (const item of response.data) {
          if (item.data) {
            const data = item.data;
            if (data.content && data.content.dataType === 'moveObject') {
              const objectInfo = {
                objectId: data.objectId,
                type: data.type || '',
                data: data.content.fields as Record<string, unknown>,
              };
              objects.push(objectInfo);
              logger.info(
                `[getOwnedObjects] Found object: ${data.objectId}, type: ${data.type}`
              );
            } else {
              logger.info(
                `[getOwnedObjects] Skipping object ${data.objectId}: content type is ${data.content?.dataType || 'unknown'}`
              );
            }
          }
        }

        // Pagination kontrolü
        hasNextPage = response.hasNextPage || false;
        cursor = response.nextCursor;

        logger.info(
          `Page ${pageCount}: Found ${response.data.length} objects, hasNextPage: ${hasNextPage}`
        );
      }

      if (pageCount >= maxPages) {
        logger.warn(
          `Reached max pages limit (${maxPages}) for address ${address}. Stopping pagination.`
        );
      }

      logger.info(
        `Fetched ${objects.length} objects for address ${address}, type: ${objectType || 'all'}`
      );
      return objects;
    } catch (error) {
      logger.error(`Error fetching owned objects for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get Profile object by owner address
   */
  async getProfileByOwner(address: string): Promise<SuiObjectInfo | null> {
    try {
      const profileType = `${PACKAGE_ID}::profile::Profile`;
      logger.info(
        `Fetching profile for address: ${address}, type: ${profileType}`
      );

      const objects = await this.getOwnedObjects(address, profileType);

      if (objects.length === 0) {
        logger.warn(`No profile found for address: ${address}, type: ${profileType}`);
        return null;
      }

      // Debug: Bulunan objelerin type'larını logla
      logger.info(
        `Found ${objects.length} objects for address ${address}. Types: ${objects.map((o) => o.type).join(', ')}`
      );

      // Type kontrolü yap - gerçekten Profile objesi mi?
      const profileObjects = objects.filter(
        (obj) => obj.type && obj.type.includes('profile::Profile')
      );

      if (profileObjects.length === 0) {
        logger.warn(
          `Profile object not found in results for address: ${address}. Found ${objects.length} objects with types: ${objects.map((o) => o.type).join(', ')}`
        );
        return null;
      }

      // Eğer birden fazla profile varsa, en son oluşturulanı al (object ID'ye göre sırala)
      // Object ID'ler Sui'de monotonik artan, bu yüzden en yüksek ID = en yeni
      const sortedProfiles = profileObjects.sort((a, b) => {
        // Object ID'leri karşılaştır (string olarak, ama numeric değerlerine göre)
        return b.objectId.localeCompare(a.objectId);
      });

      const latestProfile = sortedProfiles[0];

      if (profileObjects.length > 1) {
        logger.warn(
          `Multiple profiles found for address: ${address}. Using latest one: ${latestProfile.objectId}. Total: ${profileObjects.length}`
        );
      }

      logger.info(
        `Profile found for address: ${address}, objectId: ${latestProfile.objectId}, total profiles: ${profileObjects.length}`
      );
      
      // ÖNEMLİ: Profile owner kontrolü - profile gerçekten bu address'e ait mi?
      const profileOwner = latestProfile.data.owner as string;
      if (profileOwner && profileOwner !== address) {
        logger.error(
          `Profile owner mismatch! Profile owner: ${profileOwner}, Requested address: ${address}. Profile objectId: ${latestProfile.objectId}`
        );
        return null; // Owner eşleşmiyorsa null döndür
      }
      
      logger.info(
        `Profile owner verified: ${profileOwner || address} matches requested address: ${address}`
      );
      
      return latestProfile;
    } catch (error) {
      logger.error(`Error fetching profile for ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get Community object by ID
   */
  async getCommunityById(communityId: string): Promise<SuiObjectInfo | null> {
    try {
      const object = await this.getObject(communityId);

      if (!object || !object.type.includes('commity::Commity')) {
        return null;
      }

      return object;
    } catch (error) {
      logger.error(`Error fetching community ${communityId}:`, error);
      throw error;
    }
  }

  /**
   * Get Proposal object by ID
   */
  async getProposalById(proposalId: string): Promise<SuiObjectInfo | null> {
    try {
      const object = await this.getObject(proposalId);

      if (!object || !object.type.includes('proposal::Proposal')) {
        return null;
      }

      return object;
    } catch (error) {
      logger.error(`Error fetching proposal ${proposalId}:`, error);
      throw error;
    }
  }

  /**
   * Get dynamic field value
   */
  async getDynamicField(
    parentObjectId: string,
    fieldName: string,
    fieldNameType: 'address' | 'string' = 'string'
  ): Promise<SuiObjectInfo | null> {
    try {
      const response = await suiClient.getDynamicFieldObject({
        parentId: parentObjectId,
        name: fieldNameType === 'address'
          ? {
              type: 'address',
              value: fieldName,
            }
          : {
              type: '0x1::string::String',
              value: fieldName,
            },
      });

      if (response.error || !response.data) {
        return null;
      }

      const data = response.data;
      // For address dynamic fields, the value might be a primitive (bool) not an object
      if (data.content) {
        if (data.content.dataType === 'moveObject') {
          return {
            objectId: data.objectId,
            type: data.type || '',
            data: data.content.fields as Record<string, unknown>,
          };
        }
      }
      
      // Return a minimal object info for primitive values (like bool for membership)
      return {
        objectId: data.objectId,
        type: data.type || '',
        data: { value: data.content || true },
      };
    } catch (error) {
      logger.error(
        `Error fetching dynamic field ${fieldName} from ${parentObjectId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Get all dynamic fields for an object
   */
  async getDynamicFields(
    parentObjectId: string
  ): Promise<Array<{ name: string; value: SuiObjectInfo | null }>> {
    try {
      const fields: Array<{ name: string; value: SuiObjectInfo | null }> = [];
      let cursor: string | null | undefined = undefined;
      let hasNextPage = true;

      while (hasNextPage) {
        const response = await suiClient.getDynamicFields({
          parentId: parentObjectId,
          cursor,
        });

      for (const field of response.data) {
          // Field name'i parse et - address veya string olabilir
          let fieldName: string;
          if (field.name.type === 'address') {
            fieldName = field.name.value as string;
          } else if (field.name.type === '0x1::string::String') {
            fieldName = field.name.value as string;
          } else {
            // Diğer tipler için string'e çevir
            fieldName = String(field.name.value);
          }

          // Field value'yu al (optional - sadece name'e ihtiyacımız var membership kontrolü için)
          let fieldValue: SuiObjectInfo | null = null;
          try {
            fieldValue = await this.getObject(field.objectId);
          } catch (objError) {
            // Object fetch başarısız olabilir (primitive value olabilir), bu normal
            logger.debug(`Could not fetch field object ${field.objectId}, may be primitive value`);
          }

        fields.push({
            name: fieldName,
          value: fieldValue,
        });
      }

        hasNextPage = response.hasNextPage;
        cursor = response.nextCursor || undefined;
      }

      logger.info(`Found ${fields.length} dynamic fields for ${parentObjectId}`);
      return fields;
    } catch (error) {
      logger.error(
        `Error fetching dynamic fields for ${parentObjectId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Get all Commity objects created from this package
   * First tries Surflux indexing API (more efficient), falls back to transaction query if Surflux is disabled
   */
  async getAllCommunities(): Promise<SuiObjectInfo[]> {
    try {
      // Try Surflux indexing first if enabled
      if (SURFLUX_CONFIG.enabled) {
        try {
          logger.info('Fetching all communities using Surflux indexing API');
          return await this.getAllCommunitiesFromSurflux();
        } catch (surfluxError) {
          logger.warn('Surflux indexing failed, falling back to transaction query:', surfluxError);
          // Fall back to transaction-based query
          return await this.getAllCommunitiesFromTransactions();
        }
      } else {
        logger.info('Surflux not enabled, using transaction-based query');
        return await this.getAllCommunitiesFromTransactions();
      }
    } catch (error) {
      logger.error('Error fetching all communities:', error);
      throw error;
    }
  }

  /**
   * Get all Commity objects using Surflux indexing API
   * This is more efficient and avoids rate limiting issues
   */
  private async getAllCommunitiesFromSurflux(): Promise<SuiObjectInfo[]> {
    try {
      logger.info('Fetching communities from Surflux indexing');
      
      // Use retry logic to handle rate limiting
      const surfluxObjects = await this.surfluxClient.queryObjectsByTypeWithRetry(
        COMMITY_TYPE,
        { limit: 100, orderBy: 'createdAt', orderDirection: 'desc' },
        3 // max retries
      );
      
      const communities: SuiObjectInfo[] = [];
      
      for (const surfluxObj of surfluxObjects) {
        try {
          // Convert Surflux object to SuiObjectInfo format
          communities.push({
            objectId: surfluxObj.objectId,
            type: surfluxObj.type,
            data: surfluxObj.fields as Record<string, unknown>,
          });
        } catch (objError) {
          logger.error(`Error processing Surflux object ${surfluxObj.objectId}:`, objError);
        }
      }

      logger.info(`Found ${communities.length} communities via Surflux indexing`);
      return communities;
    } catch (error) {
      logger.error('Error fetching communities from Surflux:', error);
      throw error;
    }
  }

  /**
   * Fallback method: Get all Commity objects by querying create_commity transactions
   */
  private async getAllCommunitiesFromTransactions(): Promise<SuiObjectInfo[]> {
    try {
      logger.info('Fetching all communities from transactions (fallback method)');
      
      const communities: SuiObjectInfo[] = [];
      
      // Query transactions that call create_commity
      let cursor: string | null | undefined = undefined;
      let hasNextPage = true;
      let pageCount = 0;
      const maxPages = 50;
      const seenObjectIds = new Set<string>();

      while (hasNextPage && pageCount < maxPages) {
        pageCount++;
        
        const response = await suiClient.queryTransactionBlocks({
          filter: {
            MoveFunction: {
              package: PACKAGE_ID,
              module: 'dao_app',
              function: 'create_commity',
            },
          },
          options: {
            showEffects: true,
            showObjectChanges: true,
          },
          cursor,
          limit: 50,
        });

        logger.info(`Transaction query page ${pageCount}: Found ${response.data.length} transactions`);

        // Extract created Commity objects from transaction effects
        for (const tx of response.data) {
          if (tx.objectChanges) {
            for (const change of tx.objectChanges) {
              // Check for created objects
              if (change.type === 'created' && 'objectType' in change && 'objectId' in change) {
                const objectType = change.objectType as string;
                const objectId = change.objectId as string;
                
                logger.info(`Transaction ${tx.digest}: Found object change - type: ${change.type}, objectType: ${objectType}, objectId: ${objectId}`);
                
                // Check if it's a Commity object
                if (objectType === COMMITY_TYPE || objectType.includes('commity::Commity')) {
                // Avoid duplicates
                if (!seenObjectIds.has(objectId)) {
                  seenObjectIds.add(objectId);
                  
                  // Fetch the full object
                    try {
                      const communityObject = await this.getObject(objectId);
                      if (communityObject) {
                        communities.push(communityObject);
                        logger.info(`Found community from transaction: ${objectId}, name: ${communityObject.data.name || 'unknown'}`);
                      } else {
                        logger.warn(`Failed to fetch community object: ${objectId}`);
                      }
                    } catch (objError) {
                      logger.error(`Error fetching community object ${objectId}:`, objError);
                    }
                  }
                }
              }
              // Also check for published/shared objects
              else if (change.type === 'published' && 'objectType' in change && 'objectId' in change) {
                const objectType = change.objectType as string;
                const objectId = change.objectId as string;
                
                if (objectType === COMMITY_TYPE || objectType.includes('commity::Commity')) {
                  if (!seenObjectIds.has(objectId)) {
                    seenObjectIds.add(objectId);
                    try {
                  const communityObject = await this.getObject(objectId);
                  if (communityObject) {
                    communities.push(communityObject);
                        logger.info(`Found community from published object: ${objectId}`);
                      }
                    } catch (objError) {
                      logger.error(`Error fetching published community object ${objectId}:`, objError);
                    }
                  }
                }
              }
            }
          }
        }

        hasNextPage = response.hasNextPage;
        cursor = response.nextCursor || undefined;
      }

      logger.info(`Found ${communities.length} communities from transactions`);
      return communities;
    } catch (error) {
      logger.error('Error fetching communities from transactions:', error);
      throw error;
    }
  }

  /**
   * Get all communities that a user is a member of
   * Checks all communities and filters by membership
   */
  async getCommunitiesByMember(address: string): Promise<SuiObjectInfo[]> {
    try {
      logger.info(`Fetching communities for member: ${address}`);
      
      const allCommunities = await this.getAllCommunities();
      logger.info(`Found ${allCommunities.length} total communities to check for membership`);
      
      const memberCommunities: SuiObjectInfo[] = [];

      for (const community of allCommunities) {
        const communityName = (community.data.name as string) || 'unknown';
        const isMember = await this.isMemberOfCommunity(community.objectId, address);
        logger.info(`Community ${community.objectId} (${communityName}): isMember=${isMember}`);
        
        if (isMember) {
          memberCommunities.push(community);
          logger.info(`✅ ${address} is a member of ${communityName} (${community.objectId})`);
        }
      }

      logger.info(`Found ${memberCommunities.length} communities for member ${address} out of ${allCommunities.length} total`);
      return memberCommunities;
    } catch (error) {
      logger.error(`Error fetching communities for member ${address}:`, error);
      throw error;
    }
  }

  /**
   * Check if an address is a member of a community
   * Uses getDynamicFields to get all fields and check if address exists
   */
  private async isMemberOfCommunity(communityId: string, address: string): Promise<boolean> {
    try {
      // Normalize address (lowercase for comparison)
      const normalizedAddress = address.toLowerCase();
      
      // Get all dynamic fields for the community
      const dynamicFields = await this.getDynamicFields(communityId);
      
      // Check if address exists in the field names
      const isMember = dynamicFields.some(field => {
        // Field name'i normalize et ve karşılaştır
        const fieldName = String(field.name).toLowerCase();
        return fieldName === normalizedAddress;
      });
      
      logger.info(`Membership check for ${address} in ${communityId}: ${isMember} (checked ${dynamicFields.length} fields)`);
      return isMember;
    } catch (error) {
      logger.error(`Error checking membership for ${address} in ${communityId}:`, error);
      // Hata durumunda false dön ama log'la
      return false;
    }
  }

  /**
   * Get all Proposal objects for a specific community
   * First tries Surflux indexing API (more efficient), falls back to transaction query if Surflux is disabled
   */
  async getProposalsByCommunity(commityId: string): Promise<SuiObjectInfo[]> {
    try {
      logger.info(`Fetching proposals for community: ${commityId}`);
      
      // Try Surflux indexing first if enabled
      if (SURFLUX_CONFIG.enabled) {
        try {
          logger.info('Fetching proposals using Surflux indexing API');
          return await this.getProposalsByCommunityFromSurflux(commityId);
        } catch (surfluxError) {
          logger.warn('Surflux indexing failed, falling back to transaction query:', surfluxError);
          // Fall back to transaction-based query
          return await this.getProposalsByCommunityFromTransactions(commityId);
        }
      } else {
        logger.info('Surflux not enabled, using transaction-based query');
        return await this.getProposalsByCommunityFromTransactions(commityId);
      }
    } catch (error) {
      logger.error(`Error fetching proposals for community ${commityId}:`, error);
      throw error;
    }
  }

  /**
   * Get proposals using Surflux indexing API
   */
  private async getProposalsByCommunityFromSurflux(commityId: string): Promise<SuiObjectInfo[]> {
    try {
      logger.info(`Fetching proposals from Surflux indexing for community: ${commityId}`);
      
      // Use retry logic to handle rate limiting
      const surfluxObjects = await this.surfluxClient.queryObjectsByTypeWithRetry(
        PROPOSAL_TYPE,
        { limit: 100, orderBy: 'createdAt', orderDirection: 'desc' },
        3 // max retries
      );
      
      const proposals: SuiObjectInfo[] = [];
      
      for (const surfluxObj of surfluxObjects) {
        try {
          // Filter by community ID
          const proposalCommityId = (surfluxObj.fields.commity_id as string) || '';
          if (proposalCommityId === commityId) {
            // Convert Surflux object to SuiObjectInfo format
            proposals.push({
              objectId: surfluxObj.objectId,
              type: surfluxObj.type,
              data: surfluxObj.fields as Record<string, unknown>,
            });
            logger.info(`Found proposal from Surflux for community ${commityId}: ${surfluxObj.objectId}`);
          }
        } catch (objError) {
          logger.error(`Error processing Surflux proposal object ${surfluxObj.objectId}:`, objError);
        }
      }

      logger.info(`Found ${proposals.length} proposals via Surflux indexing for community ${commityId}`);
      return proposals;
    } catch (error) {
      logger.error('Error fetching proposals from Surflux:', error);
      throw error;
    }
  }

  /**
   * Fallback method: Get proposals by querying create_proposal transactions
   */
  private async getProposalsByCommunityFromTransactions(commityId: string): Promise<SuiObjectInfo[]> {
    try {
      logger.info(`Fetching proposals from transactions (fallback method) for community: ${commityId}`);
      
      const proposals: SuiObjectInfo[] = [];
      const seenObjectIds = new Set<string>();
      
      // Query transactions that call create_proposal
      let cursor: string | null | undefined = undefined;
      let hasNextPage = true;
      let pageCount = 0;
      const maxPages = 50;

      while (hasNextPage && pageCount < maxPages) {
        pageCount++;
        
        const response = await suiClient.queryTransactionBlocks({
          filter: {
            MoveFunction: {
              package: PACKAGE_ID,
              module: 'dao_app',
              function: 'create_proposal',
            },
          },
          options: {
            showEffects: true,
            showObjectChanges: true,
          },
          cursor,
          limit: 50,
        });

        logger.info(`Proposal transaction query page ${pageCount}: Found ${response.data.length} transactions`);

        // Extract created Proposal objects from transaction effects
        for (const tx of response.data) {
          if (tx.objectChanges) {
            for (const change of tx.objectChanges) {
              // Check for created objects
              if (change.type === 'created' && 'objectType' in change && 'objectId' in change) {
                const objectType = change.objectType as string;
                const objectId = change.objectId as string;
                
                // Check if it's a Proposal object
                if (objectType === PROPOSAL_TYPE || objectType.includes('proposal::Proposal')) {
                  // Avoid duplicates
                  if (!seenObjectIds.has(objectId)) {
                    seenObjectIds.add(objectId);
                    
                    // Fetch the full object
                    try {
                      const proposalObject = await this.getObject(objectId);
                      if (proposalObject) {
                        // Check if this proposal belongs to the requested community
                        const proposalCommityId = (proposalObject.data.commity_id as string) || '';
                        if (proposalCommityId === commityId) {
                          proposals.push(proposalObject);
                          logger.info(`Found proposal for community ${commityId}: ${objectId}`);
                        }
                      }
                    } catch (objError) {
                      logger.error(`Error fetching proposal object ${objectId}:`, objError);
                    }
                  }
                }
              }
            }
          }
          
          // Also check effects for created objects
          if (tx.effects && (tx.effects as any).created) {
            const created = (tx.effects as any).created;
            if (Array.isArray(created)) {
              for (const createdObj of created) {
                if (createdObj.reference && createdObj.reference.objectId) {
                  const objectId = createdObj.reference.objectId;
                  
                  if (!seenObjectIds.has(objectId)) {
                    seenObjectIds.add(objectId);
                    
                    try {
                      const obj = await suiClient.getObject({
                        id: objectId,
                        options: { showType: true, showContent: true },
                      });
                      
                      if (obj.data && obj.data.type && (obj.data.type === PROPOSAL_TYPE || obj.data.type.includes('proposal::Proposal'))) {
                        if (obj.data.content && obj.data.content.dataType === 'moveObject') {
                          const proposalCommityId = (obj.data.content.fields as any).commity_id || '';
                          if (proposalCommityId === commityId) {
                            proposals.push({
                              objectId: obj.data.objectId,
                              type: obj.data.type,
                              data: obj.data.content.fields as Record<string, unknown>,
                            });
                            logger.info(`Found proposal from effects for community ${commityId}: ${objectId}`);
                          }
                        }
                      }
                    } catch (objError) {
                      // Continue to next
                    }
                  }
                }
              }
            }
          }
        }

        hasNextPage = response.hasNextPage || false;
        cursor = response.nextCursor;
      }

      logger.info(`Found ${proposals.length} proposals for community ${commityId} from transactions`);
      return proposals;
    } catch (error) {
      logger.error(`Error fetching proposals from transactions for community ${commityId}:`, error);
      throw error;
    }
  }
}

