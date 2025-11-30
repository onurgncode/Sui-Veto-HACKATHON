import { logger } from '../../utils/logger';
import { TransactionBuilderService } from '../../services/transactionBuilder';
import { SuiObjectFetcher } from '../../services/suiObjectFetcher';
import { Proposal, Vote, ProposalStatus } from './proposal.types';

export class ProposalService {
  private transactionBuilder: TransactionBuilderService;
  private objectFetcher: SuiObjectFetcher;

  constructor() {
    this.transactionBuilder = new TransactionBuilderService();
    this.objectFetcher = new SuiObjectFetcher();
  }

  async getProposal(id: string): Promise<Proposal | null> {
    try {
      logger.info(`Fetching proposal: ${id}`);

      const proposalObject = await this.objectFetcher.getProposalById(id);

      if (!proposalObject) {
        return null;
      }

      const data = proposalObject.data;

      const proposal: Proposal = {
        id: proposalObject.objectId,
        commityId: (data.commity_id as string) || '',
        messageId: (data.message_id as string) || '',
        creator: (data.creator as string) || '',
        title: (data.title as string) || '',
        description: (data.description as string) || '',
        deadline: Number(data.deadline) || 0,
        yesVotes: Number(data.yes_votes) || 0,
        noVotes: Number(data.no_votes) || 0,
        abstainVotes: Number(data.abstain_votes) || 0,
        totalVoters: Number(data.total_voters) || 0,
        status: (Number(data.status) as ProposalStatus) || ProposalStatus.ACTIVE,
        quorumThreshold: Number(data.quorum_threshold) || 0,
        isJoinRequest: Boolean(data.is_join_request) || false,
      };

      return proposal;
    } catch (error) {
      logger.error('Error getting proposal:', error);
      throw error;
    }
  }

  async getProposalsByCommunity(commityId: string): Promise<Proposal[]> {
    try {
      logger.info(`Fetching proposals for community: ${commityId}`);

      const proposalObjects = await this.objectFetcher.getProposalsByCommunity(commityId);

      const proposals: Proposal[] = [];

      for (const proposalObject of proposalObjects) {
        const data = proposalObject.data;

        const proposal: Proposal = {
          id: proposalObject.objectId,
          commityId: (data.commity_id as string) || '',
          messageId: (data.message_id as string) || '',
          creator: (data.creator as string) || '',
          title: (data.title as string) || '',
          description: (data.description as string) || '',
          deadline: Number(data.deadline) || 0,
          yesVotes: Number(data.yes_votes) || 0,
          noVotes: Number(data.no_votes) || 0,
          abstainVotes: Number(data.abstain_votes) || 0,
          totalVoters: Number(data.total_voters) || 0,
          status: (Number(data.status) as ProposalStatus) || ProposalStatus.ACTIVE,
          quorumThreshold: Number(data.quorum_threshold) || 0,
          isJoinRequest: Boolean(data.is_join_request) || false,
        };

        proposals.push(proposal);
      }

      logger.info(`Found ${proposals.length} proposals for community ${commityId}`);
      return proposals;
    } catch (error) {
      logger.error('Error getting proposals:', error);
      throw error;
    }
  }

  async getVotes(proposalId: string): Promise<Vote[]> {
    try {
      logger.info(`Fetching votes for proposal: ${proposalId}`);

      const proposalObject = await this.objectFetcher.getProposalById(
        proposalId
      );

      if (!proposalObject) {
        return [];
      }

      // Get all dynamic fields (votes are stored as dynamic fields)
      const dynamicFields = await this.objectFetcher.getDynamicFields(
        proposalObject.objectId
      );

      const votes: Vote[] = [];

      for (const field of dynamicFields) {
        if (field.value) {
          const voteData = field.value.data;
          votes.push({
            voter: field.name,
            voteType: Number(voteData.vote_type) || 0,
            voteWeight: Number(voteData.vote_weight) || 0,
            timestamp: Number(voteData.timestamp) || 0,
          });
        }
      }

      return votes;
    } catch (error) {
      logger.error('Error getting votes:', error);
      throw error;
    }
  }

  async createProposalTransaction(data: {
    commityId: string;
    messageId: string;
    title: string;
    description: string;
    deadline: number;
    quorumThreshold: number;
    isJoinRequest: boolean;
  }): Promise<{
    transactionBlock: string;
  }> {
    try {
      const tx = this.transactionBuilder.buildCreateProposalTransaction(data);
      const serialized = tx.serialize();

      return {
        transactionBlock: Buffer.from(serialized).toString('base64'),
      };
    } catch (error) {
      logger.error('Error creating proposal transaction:', error);
      throw error;
    }
  }

  async castVoteTransaction(
    proposalId: string,
    profileId: string,
    commityId: string,
    voteType: number
  ): Promise<{
    transactionBlock: string;
  }> {
    try {
      const tx = this.transactionBuilder.buildCastVoteTransaction({
        profileId,
        proposalId,
        commityId,
        voteType,
      });
      const serialized = tx.serialize();

      return {
        transactionBlock: Buffer.from(serialized).toString('base64'),
      };
    } catch (error) {
      logger.error('Error creating vote transaction:', error);
      throw error;
    }
  }

  async finalizeProposalTransaction(
    proposalId: string,
    creatorProfileId: string,
    commityId: string
  ): Promise<{
    transactionBlock: string;
  }> {
    try {
      const tx = this.transactionBuilder.buildFinalizeProposalTransaction(
        proposalId,
        creatorProfileId,
        commityId
      );
      const serialized = tx.serialize();

      return {
        transactionBlock: Buffer.from(serialized).toString('base64'),
      };
    } catch (error) {
      logger.error('Error creating finalize transaction:', error);
      throw error;
    }
  }

  async updateProposalStatusTransaction(proposalId: string): Promise<{
    transactionBlock: string;
  }> {
    try {
      const tx =
        this.transactionBuilder.buildUpdateProposalStatusTransaction(
          proposalId
        );
      const serialized = tx.serialize();

      return {
        transactionBlock: Buffer.from(serialized).toString('base64'),
      };
    } catch (error) {
      logger.error('Error creating update status transaction:', error);
      throw error;
    }
  }
}

