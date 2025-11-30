import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button, Badge, Separator } from "@radix-ui/themes";
import { proposalService, type Proposal, ProposalStatus, type Vote } from "../services/proposalService";
import { profileService } from "../services/profileService";
import { formatAddress } from "../utils/formatters";
import { useVoting, VoteType } from "../hooks/useVoting";
import { isProposalVotable, formatDeadline, getVoteTypeLabel } from "../utils/voting";

interface ProposalDetailScreenProps {
  proposalId: string;
  onBack: () => void;
}

export function ProposalDetailScreen({ proposalId, onBack }: ProposalDetailScreenProps) {
  const currentAccount = useCurrentAccount();
  const { state: votingState, castVote, reset: resetVoting } = useVoting();
  
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVote, setSelectedVote] = useState<VoteType | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState<Vote | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Load proposal data
  const loadProposal = async () => {
    setIsLoading(true);
    try {
      const [proposalResponse, votesResponse] = await Promise.all([
        proposalService.getProposal(proposalId),
        proposalService.getVotes(proposalId),
      ]);

      if (proposalResponse.success && proposalResponse.data) {
        setProposal(proposalResponse.data.proposal);
      }

      if (votesResponse.success && votesResponse.data) {
        const votesList = votesResponse.data.votes || [];
        setVotes(votesList);
        
        // Check if user has voted
        if (currentAccount) {
          const userVoteFound = votesList.find(
            (vote) => vote.voter === currentAccount.address
          );
          if (userVoteFound) {
            setHasVoted(true);
            setUserVote(userVoteFound);
          } else {
            setHasVoted(false);
            setUserVote(null);
          }
        }
      }

      // Load profile ID
      if (currentAccount) {
        const profileResponse = await profileService.getProfile(currentAccount.address);
        if (profileResponse.success && profileResponse.data) {
          setProfileId(profileResponse.data.profile.id);
        }
      }
    } catch (error) {
      console.error('Failed to load proposal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (proposalId) {
      loadProposal();
    }
    
    // Cleanup on unmount
    return () => {
      resetVoting();
    };
  }, [proposalId, currentAccount, refreshKey, resetVoting]);

  // Handle vote submission
  const handleVote = async () => {
    if (!proposal || !profileId || selectedVote === null || !currentAccount) {
      return;
    }

    try {
      await castVote(proposalId, proposal.commityId, profileId, selectedVote);
      
      // Reset selection and refresh data
      setSelectedVote(null);
      setTimeout(() => {
        setRefreshKey(prev => prev + 1);
      }, 2000);
    } catch (error) {
      // Error is handled in useVoting hook
      console.error('Vote failed:', error);
    }
  };

  // Status badge component
  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case ProposalStatus.ACTIVE:
        return <Badge color="blue">Aktif</Badge>;
      case ProposalStatus.PASSED:
        return <Badge color="green">Kabul Edildi</Badge>;
      case ProposalStatus.FAILED:
        return <Badge color="red">Reddedildi</Badge>;
      case ProposalStatus.EXPIRED:
        return <Badge color="gray">Süresi Doldu</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <Box style={{ padding: '2rem' }}>
        <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Yükleniyor...
        </Text>
      </Box>
    );
  }

  // No proposal found
  if (!proposal) {
    return (
      <Box style={{ padding: '2rem' }}>
        <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Öneri bulunamadı
        </Text>
        <Button 
          variant="soft" 
          onClick={onBack}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 300,
            marginTop: '1rem',
          }}
        >
          ×
        </Button>
      </Box>
    );
  }

  // Check if proposal is votable
  const canVote = isProposalVotable(proposal) && !hasVoted && !!profileId && !!currentAccount;
  const isDisabled = votingState.isVoting || selectedVote === null;

  return (
    <Box style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      {/* Header */}
      <Flex justify="between" align="center" mb="6">
        <Heading 
          size="8" 
          style={{ 
            color: 'rgba(255, 255, 255, 0.95)', 
            fontWeight: 700,
          }}
        >
          {proposal.title}
        </Heading>
        <Button 
          variant="soft" 
          onClick={onBack}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 300,
          }}
        >
          ×
        </Button>
      </Flex>

      {/* Proposal Card */}
      <Box
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(40px) saturate(180%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '2rem',
          marginBottom: '2rem',
        }}
      >
        {/* Proposal Info */}
        <Flex justify="between" align="start" mb="4">
          <Flex align="center" gap="3">
            {getStatusBadge(proposal.status)}
            <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Oluşturan: {formatAddress(proposal.creator)}
            </Text>
          </Flex>
          <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Son Tarih: {formatDeadline(proposal.deadline)}
          </Text>
        </Flex>

        {/* Description */}
        <Text 
          size="4" 
          style={{ 
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: 1.8,
            marginBottom: '2rem',
          }}
        >
          {proposal.description}
        </Text>

        <Separator size="4" style={{ background: 'rgba(255, 255, 255, 0.08)', marginBottom: '2rem' }} />

        {/* Vote Results */}
        <Flex justify="between" align="center" mb="4">
          <Heading size="5" style={{ color: 'rgba(255, 255, 255, 0.95)', fontWeight: 600 }}>
            Oylama Sonuçları
          </Heading>
          <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {proposal.totalVoters} oy
          </Text>
        </Flex>

        <Flex gap="4" mb="4">
          <Box style={{ flex: 1, padding: '1rem', background: 'rgba(76, 175, 80, 0.1)', borderRadius: '12px', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
            <Text size="2" style={{ color: 'rgba(76, 175, 80, 0.9)', fontWeight: 600, marginBottom: '0.5rem' }}>
              Evet
            </Text>
            <Text size="6" style={{ color: 'rgba(76, 175, 80, 0.9)', fontWeight: 700 }}>
              {proposal.yesVotes}
            </Text>
          </Box>
          <Box style={{ flex: 1, padding: '1rem', background: 'rgba(244, 67, 54, 0.1)', borderRadius: '12px', border: '1px solid rgba(244, 67, 54, 0.3)' }}>
            <Text size="2" style={{ color: 'rgba(244, 67, 54, 0.9)', fontWeight: 600, marginBottom: '0.5rem' }}>
              Hayır
            </Text>
            <Text size="6" style={{ color: 'rgba(244, 67, 54, 0.9)', fontWeight: 700 }}>
              {proposal.noVotes}
            </Text>
          </Box>
          <Box style={{ flex: 1, padding: '1rem', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600, marginBottom: '0.5rem' }}>
              Çekimser
            </Text>
            <Text size="6" style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 700 }}>
              {proposal.abstainVotes}
            </Text>
          </Box>
        </Flex>

        {/* User's Vote Display */}
        {hasVoted && userVote && (
          <Box
            style={{
              padding: '1rem',
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              marginBottom: '2rem',
            }}
          >
            <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              Oyunuz: <strong>{getVoteTypeLabel(userVote.voteType)}</strong> (Ağırlık: {userVote.voteWeight})
            </Text>
          </Box>
        )}

        {/* Error Display */}
        {votingState.error && (
          <Box
            style={{
              padding: '1rem',
              background: 'rgba(244, 67, 54, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(244, 67, 54, 0.3)',
              marginBottom: '2rem',
            }}
          >
            <Text size="3" style={{ color: 'rgba(244, 67, 54, 0.9)' }}>
              {votingState.error}
            </Text>
          </Box>
        )}

        {/* Voting Interface */}
        {canVote && (
          <Box
            style={{
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Heading size="5" mb="4" style={{ color: 'rgba(255, 255, 255, 0.95)', fontWeight: 600 }}>
              Oyunuzu Verin
            </Heading>
            <Flex gap="3" mb="4">
              <Button
                variant={selectedVote === VoteType.YES ? "solid" : "soft"}
                onClick={() => setSelectedVote(VoteType.YES)}
                style={{
                  flex: 1,
                  background: selectedVote === VoteType.YES 
                    ? 'rgba(76, 175, 80, 0.9)' 
                    : 'rgba(255, 255, 255, 0.08)',
                  color: selectedVote === VoteType.YES ? 'white' : 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  fontWeight: 600,
                }}
              >
                ✓ Evet
              </Button>
              <Button
                variant={selectedVote === VoteType.NO ? "solid" : "soft"}
                onClick={() => setSelectedVote(VoteType.NO)}
                style={{
                  flex: 1,
                  background: selectedVote === VoteType.NO 
                    ? 'rgba(244, 67, 54, 0.9)' 
                    : 'rgba(255, 255, 255, 0.08)',
                  color: selectedVote === VoteType.NO ? 'white' : 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  fontWeight: 600,
                }}
              >
                ✗ Hayır
              </Button>
              <Button
                variant={selectedVote === VoteType.ABSTAIN ? "solid" : "soft"}
                onClick={() => setSelectedVote(VoteType.ABSTAIN)}
                style={{
                  flex: 1,
                  background: selectedVote === VoteType.ABSTAIN 
                    ? 'rgba(255, 255, 255, 0.2)' 
                    : 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  fontWeight: 600,
                }}
              >
                ⊘ Çekimser
              </Button>
            </Flex>
            <Button
              onClick={handleVote}
              disabled={isDisabled}
              style={{
                width: '100%',
                background: !isDisabled
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(236, 72, 153, 0.9) 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '0.875rem 2rem',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: !isDisabled ? 'pointer' : 'not-allowed',
                opacity: !isDisabled ? 1 : 0.5,
              }}
            >
              {votingState.isVoting ? 'Oylanıyor...' : 'Oyla'}
            </Button>
          </Box>
        )}

        {/* Votes List */}
        {votes.length > 0 && (
          <>
            <Separator size="4" style={{ background: 'rgba(255, 255, 255, 0.08)', marginTop: '2rem', marginBottom: '2rem' }} />
            <Heading size="5" mb="4" style={{ color: 'rgba(255, 255, 255, 0.95)', fontWeight: 600 }}>
              Tüm Oylar ({votes.length})
            </Heading>
            <Flex direction="column" gap="2">
              {votes.map((vote, index) => (
                <Box
                  key={index}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <Flex justify="between" align="center">
                    <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.9)', fontFamily: 'monospace' }}>
                      {formatAddress(vote.voter)}
                    </Text>
                    <Flex gap="3" align="center">
                      <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {getVoteTypeLabel(vote.voteType)}
                      </Text>
                      <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        Ağırlık: {vote.voteWeight}
                      </Text>
                    </Flex>
                  </Flex>
                </Box>
              ))}
            </Flex>
          </>
        )}
      </Box>
    </Box>
  );
}
