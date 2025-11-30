import { useState, useCallback } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { profileService } from "../services/profileService";

export enum VoteType {
  NO = 0,
  YES = 1,
  ABSTAIN = 2,
}

export interface VotingState {
  isVoting: boolean;
  error: string | null;
}

export interface UseVotingResult {
  state: VotingState;
  castVote: (
    proposalId: string,
    commityId: string,
    profileId: string,
    voteType: VoteType
  ) => Promise<void>;
  reset: () => void;
}

const PACKAGE_ID = import.meta.env.VITE_PACKAGE_ID || '0x6b30552018493c6daaef95c7a1956aca5adc1528513a7bc0d831cd9b136a8f90';
const TRANSACTION_TIMEOUT = 30000; // 30 seconds

/**
 * Custom hook for handling voting logic
 * Simplifies voting by handling membership checks, transaction creation, and error handling
 */
export function useVoting(): UseVotingResult {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  
  const [state, setState] = useState<VotingState>({
    isVoting: false,
    error: null,
  });

  /**
   * Check if user is a member of the community
   * Uses direct chain check for reliability (more accurate than API)
   */
  const checkMembership = useCallback(async (
    address: string,
    commityId: string
  ): Promise<boolean> => {
    try {
      // Always use direct chain check for accuracy
      // API check can be unreliable if stats aren't initialized yet
      const dynamicFields = await suiClient.getDynamicFields({
        parentId: commityId,
      });
      
      const normalizedAddress = address.toLowerCase();
      const isMember = dynamicFields.data.some((field) => {
        if (field.name.type === 'address') {
          const fieldAddress = (field.name.value as string).toLowerCase();
          return fieldAddress === normalizedAddress;
        }
        return false;
      });
      
      console.log(`[useVoting] Membership check for ${address} in ${commityId}: ${isMember} (checked ${dynamicFields.data.length} fields)`);
      return isMember;
    } catch (chainError) {
      console.error('[useVoting] Chain membership check failed:', chainError);
      // If chain check fails, try API as fallback
      try {
        const apiResponse = await profileService.getMemberStats(address, commityId);
        if (apiResponse.success && apiResponse.data?.stats) {
          return true;
        }
      } catch (apiError) {
        console.error('[useVoting] API membership check also failed:', apiError);
      }
      // If both checks fail, assume not a member
      return false;
    }
  }, [suiClient]);

  /**
   * Create and execute vote transaction
   * Note: User must be a member of the community to vote
   */
  const castVote = useCallback(async (
    proposalId: string,
    commityId: string,
    profileId: string,
    voteType: VoteType
  ): Promise<void> => {
    if (!currentAccount) {
      throw new Error('Cüzdan bağlantısı gerekli');
    }

    // Reset state
    setState({ isVoting: false, error: null });

    // Check membership BEFORE attempting to vote
    const isMember = await checkMembership(currentAccount.address, commityId);
    
    if (!isMember) {
      const errorMsg = 'Bu topluluğun üyesi değilsiniz. Oy verebilmek için önce topluluğa katılmanız gerekiyor.';
      setState({ isVoting: false, error: errorMsg });
      throw new Error(errorMsg);
    }

    // User is a member, proceed with voting
    setState(prev => ({ ...prev, isVoting: true }));

    // Transaction timeout
    const timeoutId = setTimeout(() => {
      setState({ isVoting: false, error: 'Transaction çok uzun sürdü' });
      throw new Error('Transaction timeout');
    }, TRANSACTION_TIMEOUT);

    try {
      // Create transaction - ONLY cast_vote, NO join_commity
      const tx = new Transaction();

      // Add cast_vote
      tx.moveCall({
        target: `${PACKAGE_ID}::dao_app::cast_vote`,
        arguments: [
          tx.object(profileId),
          tx.object(proposalId),
          tx.object(commityId),
          tx.pure.u8(voteType),
          tx.object('0x6'), // Clock
        ],
      });

      // Execute transaction
      await signAndExecute({ transaction: tx });

      // Clear timeout
      clearTimeout(timeoutId);

      // Reset state on success
      setState({ isVoting: false, error: null });
    } catch (error) {
      clearTimeout(timeoutId);
      
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      let userMessage = 'Oylama hatası: ' + errorMessage;

      // Parse error messages
      if (errorMessage.includes('MoveAbort')) {
        if (errorMessage.includes('1')) {
          userMessage = 'Topluluğun üyesi değilsiniz. Oy verebilmek için önce topluluğa katılmanız gerekiyor.';
        } else if (errorMessage.includes('0')) {
          userMessage = 'Profil sahibi değilsiniz veya profil bulunamadı.';
        } else if (errorMessage.includes('2')) {
          userMessage = 'Öneri bu topluluğa ait değil.';
        } else if (errorMessage.includes('3')) {
          userMessage = 'Üyelik istatistikleriniz başlatılmamış. Lütfen topluluğa katılın.';
        }
      } else if (errorMessage.includes('User rejected')) {
        // User rejected - don't show error
        setState({ isVoting: false, error: null });
        return;
      }

      setState({ isVoting: false, error: userMessage });
      throw new Error(userMessage);
    }
  }, [currentAccount, signAndExecute, checkMembership]);

  /**
   * Reset voting state
   */
  const reset = useCallback(() => {
    setState({ isVoting: false, error: null });
  }, []);

  return {
    state,
    castVote,
    reset,
  };
}

