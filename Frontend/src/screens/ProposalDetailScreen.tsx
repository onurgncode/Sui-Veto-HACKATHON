import { useState, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button, Badge, Separator, TextField } from "@radix-ui/themes";
import { proposalService, type Proposal, ProposalStatus, type Vote } from "../services/proposalService";
import { profileService } from "../services/profileService";
import { formatAddress } from "../utils/formatters";
// PACKAGE_ID will be used from environment variable

interface ProposalDetailScreenProps {
  proposalId: string;
  onBack: () => void;
}

export function ProposalDetailScreen({ proposalId, onBack }: ProposalDetailScreenProps) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [selectedVote, setSelectedVote] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [userVote, setUserVote] = useState<Vote | null>(null);

  useEffect(() => {
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
          setVotes(votesResponse.data.votes || []);
          
          // Check if user has voted
          if (currentAccount) {
            const userVote = votesResponse.data.votes?.find(
              (vote) => vote.voter === currentAccount.address
            );
            if (userVote) {
              setHasVoted(true);
              setUserVote(userVote);
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

    if (proposalId) {
      loadProposal();
    }
  }, [proposalId, currentAccount]);

  const handleVote = async () => {
    if (!proposal || !profileId || selectedVote === null || !currentAccount) {
      return;
    }

    setIsVoting(true);
    try {
      // Get transaction from backend
      const response = await proposalService.castVote(proposalId, {
        profileId,
        commityId: proposal.commityId,
        voteType: selectedVote,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create vote transaction');
      }

      // Backend returns transaction block as base64
      // We need to deserialize it
      const { Transaction } = await import("@mysten/sui/transactions");
      const base64String = response.data.transaction.transactionBlock;
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      // Deserialize transaction
      const tx = Transaction.from(bytes);

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            // Reload proposal and votes
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          },
          onError: (error) => {
            console.error('Vote failed:', error);
            alert('Oylama başarısız: ' + (error.message || 'Bilinmeyen hata'));
          },
        }
      );
    } catch (error) {
      console.error('Vote error:', error);
      alert('Oylama hatası: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
    } finally {
      setIsVoting(false);
    }
  };

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

  const formatDeadline = (deadline: number) => {
    const date = new Date(deadline);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getVoteTypeLabel = (voteType: number) => {
    switch (voteType) {
      case 0:
        return 'Hayır';
      case 1:
        return 'Evet';
      case 2:
        return 'Çekimser';
      default:
        return 'Bilinmeyen';
    }
  };

  if (isLoading) {
    return (
      <Box style={{ padding: '2rem' }}>
        <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Yükleniyor...
        </Text>
      </Box>
    );
  }

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
          }}
        >
          ×
        </Button>
      </Box>
    );
  }

  const isExpired = proposal.deadline < Date.now();
  const canVote = proposal.status === ProposalStatus.ACTIVE && !isExpired && !hasVoted && profileId;

  return (
    <Box style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <Flex justify="between" align="center" mb="6">
        <Heading 
          size="8" 
          style={{ 
            color: 'rgba(255, 255, 255, 0.95)', 
            fontWeight: 700,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
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

      <Box
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '2rem',
          marginBottom: '2rem',
        }}
      >
        <Flex justify="between" align="start" mb="4">
          <Flex align="center" gap="3">
            {getStatusBadge(proposal.status)}
            <Text 
              size="2" 
              style={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              }}
            >
              Oluşturan: {formatAddress(proposal.creator)}
            </Text>
          </Flex>
          <Text 
            size="2" 
            style={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            }}
          >
            Son Tarih: {formatDeadline(proposal.deadline)}
          </Text>
        </Flex>

        <Text 
          size="4" 
          style={{ 
            color: 'rgba(255, 255, 255, 0.9)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            lineHeight: 1.8,
            marginBottom: '2rem',
          }}
        >
          {proposal.description}
        </Text>

        <Separator size="4" style={{ background: 'rgba(255, 255, 255, 0.08)', marginBottom: '2rem' }} />

        <Flex justify="between" align="center" mb="4">
          <Heading 
            size="5" 
            style={{ 
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 600,
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            }}
          >
            Oylama Sonuçları
          </Heading>
          <Text 
            size="3" 
            style={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            }}
          >
            {proposal.totalVoters} oy
          </Text>
        </Flex>

        <Flex gap="4" mb="4">
          <Box
            style={{
              flex: 1,
              padding: '1rem',
              background: 'rgba(76, 175, 80, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(76, 175, 80, 0.3)',
            }}
          >
            <Text 
              size="2" 
              style={{ 
                color: 'rgba(76, 175, 80, 0.9)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 600,
                marginBottom: '0.5rem',
              }}
            >
              Evet
            </Text>
            <Text 
              size="6" 
              style={{ 
                color: 'rgba(76, 175, 80, 0.9)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 700,
              }}
            >
              {proposal.yesVotes}
            </Text>
          </Box>
          <Box
            style={{
              flex: 1,
              padding: '1rem',
              background: 'rgba(244, 67, 54, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(244, 67, 54, 0.3)',
            }}
          >
            <Text 
              size="2" 
              style={{ 
                color: 'rgba(244, 67, 54, 0.9)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 600,
                marginBottom: '0.5rem',
              }}
            >
              Hayır
            </Text>
            <Text 
              size="6" 
              style={{ 
                color: 'rgba(244, 67, 54, 0.9)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 700,
              }}
            >
              {proposal.noVotes}
            </Text>
          </Box>
          <Box
            style={{
              flex: 1,
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Text 
              size="2" 
              style={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 600,
                marginBottom: '0.5rem',
              }}
            >
              Çekimser
            </Text>
            <Text 
              size="6" 
              style={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                fontWeight: 700,
              }}
            >
              {proposal.abstainVotes}
            </Text>
          </Box>
        </Flex>

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
            <Text 
              size="3" 
              style={{ 
                color: 'rgba(255, 255, 255, 0.9)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              }}
            >
              Oyunuz: <strong>{getVoteTypeLabel(userVote.voteType)}</strong> (Ağırlık: {userVote.voteWeight})
            </Text>
          </Box>
        )}

        {canVote && (
          <Box
            style={{
              padding: '1.5rem',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Heading 
              size="5" 
              mb="4"
              style={{ 
                color: 'rgba(255, 255, 255, 0.95)',
                fontWeight: 600,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              }}
            >
              Oyunuzu Verin
            </Heading>
            <Flex gap="3" mb="4">
              <Button
                variant={selectedVote === 1 ? "solid" : "soft"}
                onClick={() => setSelectedVote(1)}
                style={{
                  flex: 1,
                  background: selectedVote === 1 
                    ? 'rgba(76, 175, 80, 0.9)' 
                    : 'rgba(255, 255, 255, 0.08)',
                  color: selectedVote === 1 ? 'white' : 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ✓ Evet
              </Button>
              <Button
                variant={selectedVote === 0 ? "solid" : "soft"}
                onClick={() => setSelectedVote(0)}
                style={{
                  flex: 1,
                  background: selectedVote === 0 
                    ? 'rgba(244, 67, 54, 0.9)' 
                    : 'rgba(255, 255, 255, 0.08)',
                  color: selectedVote === 0 ? 'white' : 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ✗ Hayır
              </Button>
              <Button
                variant={selectedVote === 2 ? "solid" : "soft"}
                onClick={() => setSelectedVote(2)}
                style={{
                  flex: 1,
                  background: selectedVote === 2 
                    ? 'rgba(255, 255, 255, 0.2)' 
                    : 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                ⊘ Çekimser
              </Button>
            </Flex>
            <Button
              onClick={handleVote}
              disabled={selectedVote === null || isVoting}
              style={{
                width: '100%',
                background: selectedVote !== null
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(236, 72, 153, 0.9) 100%)'
                  : 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '0.875rem 2rem',
                fontWeight: 600,
                fontSize: '1rem',
                cursor: selectedVote !== null ? 'pointer' : 'not-allowed',
                opacity: selectedVote !== null ? 1 : 0.5,
              }}
            >
              {isVoting ? 'Oylanıyor...' : 'Oyla'}
            </Button>
          </Box>
        )}

        {votes.length > 0 && (
          <>
            <Separator size="4" style={{ background: 'rgba(255, 255, 255, 0.08)', marginTop: '2rem', marginBottom: '2rem' }} />
            <Heading 
              size="5" 
              mb="4"
              style={{ 
                color: 'rgba(255, 255, 255, 0.95)',
                fontWeight: 600,
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              }}
            >
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
                    <Text 
                      size="2" 
                      style={{ 
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                      }}
                    >
                      {formatAddress(vote.voter)}
                    </Text>
                    <Flex gap="3" align="center">
                      <Text 
                        size="2" 
                        style={{ 
                          color: 'rgba(255, 255, 255, 0.7)',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        }}
                      >
                        {getVoteTypeLabel(vote.voteType)}
                      </Text>
                      <Text 
                        size="2" 
                        style={{ 
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        }}
                      >
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

