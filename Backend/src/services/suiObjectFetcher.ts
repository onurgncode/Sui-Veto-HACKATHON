import { suiClient, PACKAGE_ID } from '../config/sui';
import { logger } from '../utils/logger';

export interface SuiObjectInfo {
  objectId: string;
  type: string;
  data: Record<string, unknown>;
}

export class SuiObjectFetcher {
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
      const filter = objectType
        ? { StructType: objectType }
        : { Package: PACKAGE_ID };

      const response = await suiClient.getOwnedObjects({
        owner: address,
        filter,
        options: {
          showContent: true,
          showType: true,
        },
      });

      const objects: SuiObjectInfo[] = [];

      for (const item of response.data) {
        if (item.data) {
          const data = item.data;
          if (data.content && data.content.dataType === 'moveObject') {
            objects.push({
              objectId: data.objectId,
              type: data.type || '',
              data: data.content.fields as Record<string, unknown>,
            });
          }
        }
      }

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
      const objects = await this.getOwnedObjects(address, profileType);

      if (objects.length === 0) {
        return null;
      }

      return objects[0];
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
    fieldName: string
  ): Promise<SuiObjectInfo | null> {
    try {
      const response = await suiClient.getDynamicFieldObject({
        parentId: parentObjectId,
        name: {
          type: '0x1::string::String',
          value: fieldName,
        },
      });

      if (response.error || !response.data) {
        return null;
      }

      const data = response.data;
      if (!data.content || data.content.dataType !== 'moveObject') {
        return null;
      }

      return {
        objectId: data.objectId,
        type: data.type || '',
        data: data.content.fields as Record<string, unknown>,
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
      const response = await suiClient.getDynamicFields({
        parentId: parentObjectId,
      });

      const fields: Array<{ name: string; value: SuiObjectInfo | null }> = [];

      for (const field of response.data) {
        const fieldValue = await this.getObject(field.objectId);
        fields.push({
          name: field.name.value as string,
          value: fieldValue,
        });
      }

      return fields;
    } catch (error) {
      logger.error(
        `Error fetching dynamic fields for ${parentObjectId}:`,
        error
      );
      return [];
    }
  }
}

