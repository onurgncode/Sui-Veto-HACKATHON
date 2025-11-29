import { SURFLUX_CONFIG } from '../config/surflux';
import { logger } from '../utils/logger';

export interface SurfluxEvent {
  id: string;
  packageId: string;
  transactionDigest: string;
  eventType: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface SurfluxObject {
  objectId: string;
  type: string;
  packageId: string;
  module: string;
  struct: string;
  fields: Record<string, unknown>;
  owner: string;
  createdAt: number;
  updatedAt: number;
}

export interface SurfluxQueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PackageEventFilter {
  packageId: string;
  eventTypes?: string[];
}

export interface AddressEventFilter {
  address: string;
  eventTypes?: string[];
}

export class SurfluxClient {
  private enabled: boolean;

  constructor() {
    this.enabled = SURFLUX_CONFIG.enabled;
  }

  /**
   * Subscribe to package events using Surflux Flux Streams
   */
  async subscribeToPackageEvents(
    filter: PackageEventFilter,
    _callback: (event: SurfluxEvent) => void
  ): Promise<void> {
    if (!this.enabled) {
      logger.warn('Surflux is not enabled. Cannot subscribe to events.');
      return;
    }

    try {
      // TODO: Implement Surflux Flux Streams WebSocket connection
      // This will use Surflux's real-time event streaming API
      logger.info(
        `Subscribing to package events: ${filter.packageId}, types: ${filter.eventTypes?.join(', ') || 'all'}`
      );

      // Placeholder for actual implementation
      // In real implementation, this would:
      // 1. Connect to Surflux WebSocket endpoint
      // 2. Subscribe to package events
      // 3. Parse incoming events
      // 4. Call callback for each event
    } catch (error) {
      logger.error('Error subscribing to package events:', error);
      throw error;
    }
  }

  /**
   * Subscribe to address events
   */
  async subscribeToAddressEvents(
    filter: AddressEventFilter,
    _callback: (event: SurfluxEvent) => void
  ): Promise<void> {
    if (!this.enabled) {
      logger.warn('Surflux is not enabled. Cannot subscribe to events.');
      return;
    }

    try {
      logger.info(
        `Subscribing to address events: ${filter.address}, types: ${filter.eventTypes?.join(', ') || 'all'}`
      );

      // Placeholder for actual implementation
    } catch (error) {
      logger.error('Error subscribing to address events:', error);
      throw error;
    }
  }

  /**
   * Get package events (historical)
   */
  async getPackageEvents(
    packageId: string,
    eventTypes?: string[],
    limit: number = 100
  ): Promise<SurfluxEvent[]> {
    if (!this.enabled) {
      logger.warn('Surflux is not enabled. Cannot fetch events.');
      return [];
    }

    try {
      // TODO: Implement Surflux API call to fetch historical events
      logger.info(
        `Fetching package events: ${packageId}, types: ${eventTypes?.join(', ') || 'all'}, limit: ${limit}`
      );

      return [];
    } catch (error) {
      logger.error('Error fetching package events:', error);
      throw error;
    }
  }

  /**
   * Get address events (historical)
   */
  async getAddressEvents(
    address: string,
    eventTypes?: string[],
    limit: number = 100
  ): Promise<SurfluxEvent[]> {
    if (!this.enabled) {
      logger.warn('Surflux is not enabled. Cannot fetch events.');
      return [];
    }

    try {
      logger.info(
        `Fetching address events: ${address}, types: ${eventTypes?.join(', ') || 'all'}, limit: ${limit}`
      );

      return [];
    } catch (error) {
      logger.error('Error fetching address events:', error);
      throw error;
    }
  }

  /**
   * Query objects by type using Surflux indexing API
   * This is more efficient than querying transactions directly
   */
  async queryObjectsByType(
    objectType: string,
    options: SurfluxQueryOptions = {}
  ): Promise<SurfluxObject[]> {
    if (!this.enabled) {
      logger.warn('Surflux is not enabled. Cannot query objects.');
      throw new Error('Surflux is not enabled');
    }

    try {
      logger.info(
        `Querying objects by type via Surflux: ${objectType}, limit: ${options.limit || 100}, offset: ${options.offset || 0}`
      );

      // Try REST API first (more common for indexing services)
      // If that fails, fall back to GraphQL
      try {
        return await this.queryObjectsByTypeREST(objectType, options);
      } catch (restError) {
        logger.warn('REST API failed, trying GraphQL:', restError);
        return await this.queryObjectsByTypeGraphQL(objectType, options);
      }
    } catch (error) {
      logger.error('Error querying objects via Surflux:', error);
      throw error;
    }
  }

  /**
   * Query objects using REST API (primary method)
   */
  private async queryObjectsByTypeREST(
    objectType: string,
    options: SurfluxQueryOptions
  ): Promise<SurfluxObject[]> {
    const { limit = 100, offset = 0, orderBy = 'createdAt', orderDirection = 'desc' } = options;
    
    const params = new URLSearchParams({
      type: objectType,
      limit: limit.toString(),
      offset: offset.toString(),
      orderBy,
      orderDirection,
    });

    const response = await fetch(`${SURFLUX_CONFIG.apiUrl}/api/v1/objects?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SURFLUX_CONFIG.apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Surflux REST API error: ${response.status} - ${errorText}`);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new Error(`Surflux rate limit exceeded. Retry after: ${retryAfter || 'unknown'} seconds`);
      }
      
      throw new Error(`Surflux REST API error: ${response.status}`);
    }

    const result = await response.json() as { data?: any[]; objects?: any[] };
    const objects = result.data || result.objects || [];
    
    logger.info(`Surflux REST returned ${objects.length} objects of type ${objectType}`);
    
    return this.normalizeSurfluxObjects(objects);
  }

  /**
   * Query objects using GraphQL API (fallback method)
   */
  private async queryObjectsByTypeGraphQL(
    objectType: string,
    options: SurfluxQueryOptions
  ): Promise<SurfluxObject[]> {
    const { limit = 100, offset = 0, orderBy = 'createdAt', orderDirection = 'desc' } = options;
    
    const query = `
      query QueryObjects($type: String!, $limit: Int!, $offset: Int!, $orderBy: String!, $orderDirection: String!) {
        objects(
          filter: { type: $type }
          limit: $limit
          offset: $offset
          orderBy: $orderBy
          orderDirection: $orderDirection
        ) {
          objectId
          type
          packageId
          module
          struct
          fields
          owner
          createdAt
          updatedAt
        }
      }
    `;

    const variables = {
      type: objectType,
      limit,
      offset,
      orderBy,
      orderDirection: orderDirection.toUpperCase(),
    };

    const response = await fetch(`${SURFLUX_CONFIG.apiUrl}/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SURFLUX_CONFIG.apiKey}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Surflux GraphQL API error: ${response.status} - ${errorText}`);
      
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        throw new Error(`Surflux rate limit exceeded. Retry after: ${retryAfter || 'unknown'} seconds`);
      }
      
      throw new Error(`Surflux GraphQL API error: ${response.status}`);
    }

    const result = await response.json() as { 
      errors?: any[]; 
      data?: { objects?: any[] } 
    };

    if (result.errors) {
      logger.error('Surflux GraphQL errors:', result.errors);
      throw new Error(`Surflux GraphQL error: ${JSON.stringify(result.errors)}`);
    }

    const objects = result.data?.objects || [];
    logger.info(`Surflux GraphQL returned ${objects.length} objects of type ${objectType}`);
    
    return this.normalizeSurfluxObjects(objects);
  }

  /**
   * Normalize Surflux objects to SurfluxObject format
   */
  private normalizeSurfluxObjects(objects: any[]): SurfluxObject[] {
    return objects.map((obj: any) => ({
      objectId: obj.objectId || obj.id,
      type: obj.type,
      packageId: obj.packageId || obj.package_id,
      module: obj.module,
      struct: obj.struct,
      fields: typeof obj.fields === 'string' ? JSON.parse(obj.fields) : (obj.fields || {}),
      owner: obj.owner || obj.owner_address,
      createdAt: obj.createdAt || obj.created_at || Date.now(),
      updatedAt: obj.updatedAt || obj.updated_at || Date.now(),
    }));
  }

  /**
   * Query all objects by type with pagination and retry logic
   */
  async queryAllObjectsByType(
    objectType: string,
    batchSize: number = 100
  ): Promise<SurfluxObject[]> {
    if (!this.enabled) {
      logger.warn('Surflux is not enabled. Cannot query objects.');
      throw new Error('Surflux is not enabled');
    }

    try {
      const allObjects: SurfluxObject[] = [];
      let offset = 0;
      let hasMore = true;
      let consecutiveErrors = 0;
      const maxConsecutiveErrors = 3;

      while (hasMore) {
        try {
          const objects = await this.queryObjectsByTypeWithRetry(
            objectType,
            {
              limit: batchSize,
              offset,
              orderBy: 'createdAt',
              orderDirection: 'desc',
            },
            3 // max retries
          );

          allObjects.push(...objects);
          hasMore = objects.length === batchSize;
          offset += batchSize;
          consecutiveErrors = 0; // Reset error counter on success

          // Add a small delay to avoid rate limiting
          if (hasMore) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        } catch (error) {
          consecutiveErrors++;
          logger.error(`Error fetching batch at offset ${offset}:`, error);
          
          if (consecutiveErrors >= maxConsecutiveErrors) {
            logger.error(`Too many consecutive errors. Stopping pagination.`);
            break;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, 1000 * consecutiveErrors));
        }
      }

      logger.info(`Fetched ${allObjects.length} total objects of type ${objectType} via Surflux`);
      return allObjects;
    } catch (error) {
      logger.error('Error querying all objects via Surflux:', error);
      throw error;
    }
  }

  /**
   * Query objects with retry logic and rate limiting
   */
  async queryObjectsByTypeWithRetry(
    objectType: string,
    options: SurfluxQueryOptions = {},
    maxRetries: number = 3
  ): Promise<SurfluxObject[]> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.queryObjectsByType(objectType, options);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // If rate limited, wait before retrying
        if (lastError.message.includes('rate limit') || lastError.message.includes('429')) {
          const retryAfterMatch = lastError.message.match(/Retry after: (\d+)/);
          const waitTime = retryAfterMatch 
            ? parseInt(retryAfterMatch[1], 10) * 1000 
            : Math.pow(2, attempt) * 1000; // Exponential backoff
          
          logger.warn(`Rate limited. Waiting ${waitTime}ms before retry ${attempt}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
        
        // For other errors, throw immediately
        throw lastError;
      }
    }
    
    throw lastError || new Error('Failed to query objects after retries');
  }
}

