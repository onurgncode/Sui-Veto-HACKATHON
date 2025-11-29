import { TransactionBlock } from '@mysten/sui.js/transactions';
import { PACKAGE_ID } from '../config/sui';
import { logger } from '../utils/logger';
import * as Buffer from 'buffer';

export class TransactionBuilderService {
  private packageId: string;

  constructor(packageId: string = PACKAGE_ID) {
    this.packageId = packageId;
  }

  /**
   * Build a transaction block for profile creation
   */
  buildCreateProfileTransaction(nickname: string): TransactionBlock {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${this.packageId}::dao_app::create_profile`,
      arguments: [tx.pure.string(nickname)],
    });

    logger.info(`Built create_profile transaction for nickname: ${nickname}`);
    return tx;
  }

  /**
   * Build a transaction block for community creation
   */
  buildCreateCommunityTransaction(name: string): TransactionBlock {
    const tx = new TransactionBlock();
    
    tx.moveCall({
      target: `${this.packageId}::dao_app::create_commity`,
      arguments: [tx.pure.string(name)],
    });

    logger.info(`Built create_commity transaction for name: ${name}`);
    return tx;
  }

  /**
   * Build a transaction block for joining a community
   */
  buildJoinCommunityTransaction(
    profileId: string,
    commityId: string
  ): TransactionBlock {
    const tx = new TransactionBlock();
    
    const profile = tx.object(profileId);
    const commity = tx.object(commityId);

    tx.moveCall({
      target: `${this.packageId}::dao_app::join_commity`,
      arguments: [profile, commity],
    });

    logger.info(
      `Built join_commity transaction: profile ${profileId} -> community ${commityId}`
    );
    return tx;
  }

  /**
   * Build a transaction block for proposal creation
   */
  buildCreateProposalTransaction(data: {
    commityId: string;
    messageId: string;
    title: string;
    description: string;
    deadline: number;
    quorumThreshold: number;
  }): TransactionBlock {
    const tx = new TransactionBlock();
    
    const commity = tx.object(data.commityId);
    const messageId = tx.pure.id(data.messageId);

    tx.moveCall({
      target: `${this.packageId}::dao_app::create_proposal`,
      arguments: [
        commity,
        messageId,
        tx.pure.string(data.title),
        tx.pure.string(data.description),
        tx.pure.u64(data.deadline),
        tx.pure.u64(data.quorumThreshold),
      ],
    });

    logger.info(`Built create_proposal transaction: ${data.title}`);
    return tx;
  }

  /**
   * Build a transaction block for casting a vote
   */
  buildCastVoteTransaction(data: {
    profileId: string;
    proposalId: string;
    commityId: string;
    voteType: number;
  }): TransactionBlock {
    const tx = new TransactionBlock();
    
    const profile = tx.object(data.profileId);
    const proposal = tx.object(data.proposalId);
    const commity = tx.object(data.commityId);
    const clock = tx.object('0x6'); // Clock object ID (standard Sui object)

    tx.moveCall({
      target: `${this.packageId}::dao_app::cast_vote`,
      arguments: [
        profile,
        proposal,
        commity,
        tx.pure.u8(data.voteType),
        clock,
      ],
    });

    logger.info(
      `Built cast_vote transaction: proposal ${data.proposalId}, vote type: ${data.voteType}`
    );
    return tx;
  }

  /**
   * Build a transaction block for finalizing a proposal
   */
  buildFinalizeProposalTransaction(proposalId: string): TransactionBlock {
    const tx = new TransactionBlock();
    
    const proposal = tx.object(proposalId);
    const clock = tx.object('0x6'); // Clock object ID

    tx.moveCall({
      target: `${this.packageId}::dao_app::finalize_proposal`,
      arguments: [proposal, clock],
    });

    logger.info(`Built finalize_proposal transaction: ${proposalId}`);
    return tx;
  }

  /**
   * Build a transaction block for updating proposal status
   */
  buildUpdateProposalStatusTransaction(proposalId: string): TransactionBlock {
    const tx = new TransactionBlock();
    
    const proposal = tx.object(proposalId);
    const clock = tx.object('0x6'); // Clock object ID

    tx.moveCall({
      target: `${this.packageId}::dao_app::update_proposal_status`,
      arguments: [proposal, clock],
    });

    logger.info(`Built update_proposal_status transaction: ${proposalId}`);
    return tx;
  }

  /**
   * Serialize transaction block to bytes
   * Returns the transaction block itself for client-side signing
   */
  async serializeTransaction(tx: TransactionBlock): Promise<Uint8Array> {
    // Transaction will be serialized by the client when signing
    // For now, we return the transaction block as JSON and convert to bytes
    const serialized = JSON.stringify(tx);
    return new TextEncoder().encode(serialized);
  }

  /**
   * Get transaction block for client-side signing
   * Returns the transaction block object that can be signed by the client
   */
  getTransactionBlock(tx: TransactionBlock): TransactionBlock {
    return tx;
  }

  /**
   * Get transaction bytes as base64 string (for reference)
   * Note: Actual serialization happens on client side during signing
   */
  async getTransactionBytes(tx: TransactionBlock): Promise<string> {
    // Return transaction block as JSON string for now
    // Actual bytes will be generated during signing
    const serialized = JSON.stringify(tx);
    return Buffer.Buffer.from(serialized).toString('base64');
  }
}

