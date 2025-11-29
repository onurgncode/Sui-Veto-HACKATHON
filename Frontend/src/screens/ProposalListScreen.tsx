import { useState, useEffect } from "react";
import { Box, Flex, Heading, Text, Button, Badge } from "@radix-ui/themes";
import { proposalService, type Proposal, ProposalStatus } from "../services/proposalService";
import { formatAddress } from "../utils/formatters";

interface ProposalListScreenProps {
  communityId: string;
  onCreateProposal: () => void;
  onProposalClick: (proposalId: string) => void;
  onBack?: () => void;
}

export function ProposalListScreen({ 
  communityId, 
  onCreateProposal, 
  onProposalClick,
  onBack 
}: ProposalListScreenProps) {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProposals = async () => {
      setIsLoading(true);
      try {
        const response = await proposalService.getProposalsByCommunity(communityId);
        if (response.success && response.data) {
          setProposals(response.data.proposals || []);
        }
      } catch (error) {
        console.error('Failed to load proposals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (communityId) {
      loadProposals();
    }
  }, [communityId]);

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

  if (isLoading) {
    return (
      <Box style={{ padding: '2rem' }}>
        <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Yükleniyor...
        </Text>
      </Box>
    );
  }

  return (
    <Box style={{ width: '100%', padding: '2rem' }}>
      <Flex justify="between" align="center" mb="6">
        <Flex align="center" gap="4">
          {onBack && (
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
          )}
          <Heading 
            size="7" 
            style={{ 
              color: 'rgba(255, 255, 255, 0.95)', 
              fontWeight: 700,
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            }}
          >
            Öneriler
          </Heading>
        </Flex>
        <Button
          onClick={onCreateProposal}
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(236, 72, 153, 0.9) 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            padding: '0.75rem 1.5rem',
            fontWeight: 600,
            fontSize: '0.9375rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.4)';
          }}
        >
          + Yeni Öneri
        </Button>
      </Flex>

      {proposals.length === 0 ? (
        <Box
          style={{
            padding: '3rem',
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <Text 
            size="4" 
            style={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            }}
          >
            Henüz öneri yok. İlk öneriyi oluşturun!
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap="4">
          {proposals.map((proposal) => (
            <Box
              key={proposal.id}
              onClick={() => onProposalClick(proposal.id)}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '1.5rem',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Flex justify="between" align="start" mb="3">
                <Box style={{ flex: 1 }}>
                  <Flex align="center" gap="3" mb="2">
                    <Heading 
                      size="5" 
                      style={{ 
                        color: 'rgba(255, 255, 255, 0.95)',
                        fontWeight: 600,
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      }}
                    >
                      {proposal.title}
                    </Heading>
                    {getStatusBadge(proposal.status)}
                  </Flex>
                  <Text 
                    size="3" 
                    style={{ 
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      lineHeight: 1.6,
                    }}
                  >
                    {proposal.description}
                  </Text>
                </Box>
              </Flex>

              <Flex justify="between" align="center" mt="4">
                <Flex gap="4" align="center">
                  <Text 
                    size="2" 
                    style={{ 
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                    }}
                  >
                    Oluşturan: {formatAddress(proposal.creator)}
                  </Text>
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
                <Flex gap="3" align="center">
                  <Text 
                    size="2" 
                    style={{ 
                      color: 'rgba(76, 175, 80, 0.9)',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 600,
                    }}
                  >
                    ✓ {proposal.yesVotes}
                  </Text>
                  <Text 
                    size="2" 
                    style={{ 
                      color: 'rgba(244, 67, 54, 0.9)',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 600,
                    }}
                  >
                    ✗ {proposal.noVotes}
                  </Text>
                  <Text 
                    size="2" 
                    style={{ 
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      fontWeight: 600,
                    }}
                  >
                    ⊘ {proposal.abstainVotes}
                  </Text>
                </Flex>
              </Flex>
            </Box>
          ))}
        </Flex>
      )}
    </Box>
  );
}

