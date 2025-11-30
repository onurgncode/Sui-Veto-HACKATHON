/**
 * Messaging Service
 * Handles Sui Stack Messaging SDK integration for community messaging
 * Uses client extension system for Seal and Walrus
 */

import { SuiStackMessagingClient, TESTNET_MESSAGING_PACKAGE_CONFIG } from '@mysten/messaging';
import type { MessagingCompatibleClient } from '@mysten/messaging';
import type { Signer } from '@mysten/sui/cryptography';
import { useSuiClient } from '@mysten/dapp-kit';
import type { SuiClient } from '@mysten/sui/client';
import { SealClient } from '@mysten/seal';
import { walrus } from '@mysten/walrus';

export interface Message {
  id: string;
  channelId: string;
  sender: string;
  content: string;
  timestamp: number;
  attachments?: string[];
}

export interface Channel {
  id: string;
  name: string;
  type: 'direct' | 'group';
  members: string[];
  createdAt: number;
  memberCapId?: string;
}

class MessagingServiceClass {
  private messagingClient: SuiStackMessagingClient | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize messaging client using client extension system
   * Adds Seal and Walrus extensions, then messaging extension
   */
  async initialize(baseClient: SuiClient): Promise<void> {
    if (this.isInitialized && this.messagingClient) {
      return;
    }

    try {
      // Step 1: Add Walrus extension first (required for storage)
      const walrusExtension = walrus({
        network: 'testnet',
      });
      const clientWithWalrus = walrusExtension.register(baseClient);

      // Step 2: Add Seal extension (required for encryption)
      const sealExtension = SealClient.asClientExtension({
        network: 'testnet',
        serverConfigs: [], // Messaging SDK will configure this
      });
      const clientWithSealAndWalrus = sealExtension.register(clientWithWalrus);

      // Step 3: Create messaging client extension
      // Now that Seal and Walrus are registered, messaging SDK can use them
      const messagingExtension = SuiStackMessagingClient.experimental_asClientExtension({
        packageConfig: TESTNET_MESSAGING_PACKAGE_CONFIG,
        walrusStorageConfig: {
          rpcUrl: 'https://walrus-testnet.sui.io',
        },
        sessionKeyConfig: {
          // Session key will be managed automatically by messaging SDK
          // Seal encryption is handled internally by messaging SDK
        },
      });

      // Step 4: Register the messaging extension
      // The client now has Walrus, Seal, and Messaging extensions
      this.messagingClient = messagingExtension.register(clientWithSealAndWalrus as any);

      this.isInitialized = true;
      console.log('[MessagingService] ✅ Initialized with Walrus, Seal, and Messaging extensions');
    } catch (error) {
      console.error('[MessagingService] ❌ Initialization error:', error);
      throw error;
    }
  }

  /**
   * Get messaging client instance
   */
  getClient(): SuiStackMessagingClient {
    if (!this.messagingClient) {
      throw new Error('Messaging client not initialized. Call initialize() first.');
    }
    return this.messagingClient;
  }

  /**
   * Get or find a community channel
   * Each community should have its own channel
   * Tries to find existing channel by checking all members' channels
   */
  async findCommunityChannel(
    communityId: string,
    memberAddresses: string[]
  ): Promise<Channel | null> {
    const client = this.getClient();

    try {
      // Try to find channel by checking one of the members' channels
      // If any member has a channel, check if all members are in it
      for (const memberAddress of memberAddresses.slice(0, 3)) { // Check first 3 members to avoid too many calls
        try {
          const memberships = await client.getChannelMemberships({
            owner: memberAddress,
            limit: 100,
          });

          if (memberships.memberships.length > 0) {
            const channelIds = memberships.memberships.map((m) => m.channel_id);
            const channelObjects = await client.getChannelObjectsByChannelIds({
              channelIds,
              userAddress: memberAddress,
              memberCapIds: memberships.memberships.map((m) => m.member_cap_id),
            });

            // Check if any channel has all community members
            for (const channelObj of channelObjects) {
              const channelMemberAddresses = channelObj.members.map((m: any) => m.memberAddress);
              const hasAllMembers = memberAddresses.every(addr => channelMemberAddresses.includes(addr));
              
              if (hasAllMembers && channelMemberAddresses.length === memberAddresses.length) {
                // Found matching channel
                return {
                  id: channelObj.channelId,
                  name: `Community ${communityId.slice(0, 8)}`,
                  type: 'group',
                  members: channelMemberAddresses,
                  createdAt: Date.now(),
                  memberCapId: channelObj.memberCapId,
                };
              }
            }
          }
        } catch (error) {
          // Continue to next member
          console.warn('[MessagingService] Error checking member channels:', error);
        }
      }

      return null;
    } catch (error) {
      console.error('[MessagingService] Error finding channel:', error);
      return null;
    }
  }

  /**
   * Create a new channel for a community with all members
   * Note: This method requires a signer that can sign transactions
   */
  async createCommunityChannel(
    communityId: string,
    creatorAddress: string,
    memberAddresses: string[],
    signer: Signer
  ): Promise<Channel | null> {
    const client = this.getClient();

    try {
      // Create new channel with all members using executeCreateChannelTransaction
      // This method handles the full channel creation flow including encryption keys
      const result = await client.executeCreateChannelTransaction({
        signer,
        initialMembers: memberAddresses.length > 0 ? memberAddresses : undefined,
      });

      // Wait for transaction to be indexed
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get the channel members to get member cap ID
      const members = await client.getChannelMembers(result.channelId);
      const creatorMemberCap = members.members.find((m) => m.memberAddress === creatorAddress);

      if (!creatorMemberCap) {
        console.warn('[MessagingService] Creator member cap not found after channel creation');
      }

      return {
        id: result.channelId,
        name: `Community ${communityId.slice(0, 8)}`,
        type: 'group',
        members: memberAddresses,
        createdAt: Date.now(),
        memberCapId: creatorMemberCap?.memberCapId,
      };
    } catch (error) {
      console.error('[MessagingService] Error creating channel:', error);
      return null;
    }
  }

  /**
   * Add members to an existing channel
   * Note: This requires creatorCap which is not currently stored.
   * TODO: Store creatorCap when creating channels to enable this feature.
   */
  async addMembersToChannel(
    channelId: string,
    creatorCapId: string,
    newMemberAddresses: string[],
    signer: Signer
  ): Promise<boolean> {
    // TODO: Implement when creatorCap storage is added
    // The @mysten/messaging package doesn't export subpaths, so we can't import addMembers directly
    // This would need to be done through the SDK's client methods or by storing creatorCap
    console.warn('[MessagingService] addMembersToChannel not implemented - requires creatorCap storage');
    return false;
  }

  /**
   * Get user's channel memberships
   */
  async getUserChannels(userAddress: string): Promise<Channel[]> {
    const client = this.getClient();

    try {
      const memberships = await client.getChannelMemberships({
        owner: userAddress,
        limit: 100,
      });

      if (memberships.memberships.length === 0) {
        return [];
      }

      const channelIds = memberships.memberships.map((m) => m.channel_id);
      const channelObjects = await client.getChannelObjectsByChannelIds({
        channelIds,
        userAddress,
        memberCapIds: memberships.memberships.map((m) => m.member_cap_id),
      });

      return channelObjects.map((ch, index) => ({
        id: ch.id,
        name: `Channel ${ch.id.slice(0, 8)}`,
        type: 'group' as const,
        members: [], // Will be populated from getChannelMembers if needed
        createdAt: Date.now(),
        memberCapId: memberships.memberships[index]?.member_cap_id,
      }));
    } catch (error) {
      console.error('[MessagingService] Error getting user channels:', error);
      return [];
    }
  }

  /**
   * Get messages from a channel
   */
  async getMessages(
    channelId: string,
    userAddress: string,
    memberCapId: string,
    limit: number = 50
  ): Promise<Message[]> {
    const client = this.getClient();

    try {
      const response = await client.getChannelMessages({
        channelId,
        userAddress,
        limit,
        direction: 'backward', // Get latest messages first
      });

      return response.messages.map((msg: any) => ({
        id: msg.id,
        channelId: msg.channelId || channelId,
        sender: msg.sender || userAddress,
        content: msg.content || msg.text || '',
        timestamp: msg.timestamp || Date.now(),
        attachments: msg.attachments || [],
      }));
    } catch (error) {
      console.error('[MessagingService] Error getting messages:', error);
      return [];
    }
  }

  /**
   * Send a message to a channel
   */
  async sendMessage(
    channelId: string,
    memberCapId: string,
    sender: string,
    message: string,
    encryptedKey: Uint8Array,
    signer: Signer,
    attachments?: File[]
  ): Promise<{ digest: string; messageId: string } | null> {
    const client = this.getClient();

    try {
      const result = await client.executeSendMessageTransaction({
        signer,
        channelId,
        memberCapId,
        message,
        encryptedKey: {
          encryptedKeyBytes: encryptedKey,
        },
        attachments,
      });

      return result;
    } catch (error) {
      console.error('[MessagingService] Error sending message:', error);
      return null;
    }
  }

  /**
   * Get latest messages since last poll (for polling-based real-time updates)
   */
  async getLatestMessages(
    channelId: string,
    userAddress: string,
    pollingState: string | null,
    limit: number = 20
  ): Promise<Message[]> {
    const client = this.getClient();

    try {
      const response = await client.getLatestMessages({
        channelId,
        userAddress,
        pollingState: pollingState || undefined,
        limit,
      });

      return response.messages.map((msg: any) => ({
        id: msg.id,
        channelId: msg.channelId || channelId,
        sender: msg.sender || userAddress,
        content: msg.content || msg.text || '',
        timestamp: msg.timestamp || Date.now(),
        attachments: msg.attachments || [],
      }));
    } catch (error) {
      console.error('[MessagingService] Error getting latest messages:', error);
      return [];
    }
  }
}

// Export singleton instance
export const messagingService = new MessagingServiceClass();
