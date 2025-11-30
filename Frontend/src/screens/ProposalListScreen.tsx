import { useState, useEffect, useMemo } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button, Badge, TextField, Select } from "@radix-ui/themes";
import { proposalService, type Proposal, ProposalStatus } from "../services/proposalService";
import { profileService } from "../services/profileService";
import { communityService } from "../services/communityService";
import { formatAddress } from "../utils/formatters";
import { Transaction } from "@mysten/sui/transactions";

interface ProposalListScreenProps {
  communityId: string;
  onCreateProposal: () => void;
  onProposalClick: (proposalId: string) => void;
  onBack?: () => void;
  refreshKey?: number;
}

type FilterStatus = 'all' | ProposalStatus;
type SortOption = 'newest' | 'oldest' | 'most-votes' | 'least-votes';

export function ProposalListScreen({ 
  communityId, 
  onCreateProposal, 
  onProposalClick,
  onBack,
  refreshKey = 0
}: ProposalListScreenProps) {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [finalizingProposals, setFinalizingProposals] = useState<Set<string>>(new Set());

  // Auto-finalize proposals that need to be finalized
  useEffect(() => {
    const checkAndFinalizeProposals = async () => {
      if (!communityId || proposals.length === 0 || !currentAccount) return;

      // Get community members to check if all have voted
      const membersResponse = await communityService.getMembers(communityId);
      if (!membersResponse.success || !membersResponse.data) return;
      
      const totalMembers = membersResponse.data.total || 0;
      const now = Date.now();

      for (const proposal of proposals) {
        // Skip if already finalizing or not active
        if (finalizingProposals.has(proposal.id) || proposal.status !== ProposalStatus.ACTIVE) {
          continue;
        }

        // Skip join requests - they should not be auto-finalized
        if (proposal.isJoinRequest) {
          continue;
        }

        // Check if deadline has passed
        const deadlinePassed = proposal.deadline < now;
        
        // Check if all members have voted (for regular proposals only)
        const allMembersVoted = totalMembers > 0 && proposal.totalVoters >= totalMembers;

        if (deadlinePassed || allMembersVoted) {
          try {
            setFinalizingProposals(prev => new Set(prev).add(proposal.id));
            
            // Get creator profile ID
            const creatorProfileResponse = await profileService.getProfile(proposal.creator);
            if (!creatorProfileResponse.success || !creatorProfileResponse.data?.profile) {
              console.error(`[ProposalListScreen] Could not find creator profile for ${proposal.creator}`);
              setFinalizingProposals(prev => {
                const next = new Set(prev);
                next.delete(proposal.id);
                return next;
              });
              continue;
            }

            const creatorProfileId = creatorProfileResponse.data.profile.id;
            const packageId = import.meta.env.VITE_PACKAGE_ID || '0x6b30552018493c6daaef95c7a1956aca5adc1528513a7bc0d831cd9b136a8f90';

            // Create finalize transaction
            const tx = new Transaction();
            tx.moveCall({
              target: `${packageId}::dao_app::finalize_proposal`,
              arguments: [
                tx.object(creatorProfileId),
                tx.object(proposal.id),
                tx.object(proposal.commityId),
                tx.object('0x6'), // Clock
              ],
            });

            await signAndExecute({ transaction: tx });
            
            console.log(`[ProposalListScreen] Successfully finalized proposal ${proposal.id}`);
            
            // Wait a bit for transaction to be indexed, then refresh
            setTimeout(() => {
              setFinalizingProposals(prev => {
                const next = new Set(prev);
                next.delete(proposal.id);
                return next;
              });
              // Trigger refresh
              const loadProposals = async () => {
                const response = await proposalService.getProposalsByCommunity(communityId);
                if (response.success && response.data) {
                  setProposals(response.data.proposals || []);
                }
              };
              loadProposals();
            }, 3000);
          } catch (error) {
            console.error(`[ProposalListScreen] Error finalizing proposal ${proposal.id}:`, error);
            setFinalizingProposals(prev => {
              const next = new Set(prev);
              next.delete(proposal.id);
              return next;
            });
          }
        }
      }
    };

    checkAndFinalizeProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proposals, communityId, currentAccount, signAndExecute]);

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
      
      // Auto-refresh every 10 seconds to catch new proposals
      const interval = setInterval(loadProposals, 10000);
      return () => clearInterval(interval);
    }
  }, [communityId, refreshKey]);

  // Check if proposal is expired or completed (not votable)
  const isProposalVotable = (proposal: Proposal): boolean => {
    // Check if status is not active
    if (proposal.status !== ProposalStatus.ACTIVE) {
      return false;
    }
    
    // Check if deadline has passed (deadline is in milliseconds)
    const now = Date.now();
    if (proposal.deadline < now) {
      return false;
    }
    
    return true;
  };

  const filteredAndSortedProposals = useMemo(() => {
    let filtered = [...proposals];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (proposal) =>
          proposal.title.toLowerCase().includes(query) ||
          proposal.description.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter((proposal) => proposal.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'newest':
          return b.deadline - a.deadline;
        case 'oldest':
          return a.deadline - b.deadline;
        case 'most-votes':
          return (b.yesVotes + b.noVotes + b.abstainVotes) - (a.yesVotes + a.noVotes + a.abstainVotes);
        case 'least-votes':
          return (a.yesVotes + a.noVotes + a.abstainVotes) - (b.yesVotes + b.noVotes + b.abstainVotes);
        default:
          return 0;
      }
    });

    return filtered;
  }, [proposals, searchQuery, filterStatus, sortOption]);

  // Separate proposals into active (votable) and inactive (non-votable)
  const { activeProposals, inactiveProposals } = useMemo(() => {
    const active: Proposal[] = [];
    const inactive: Proposal[] = [];

    filteredAndSortedProposals.forEach((proposal) => {
      if (isProposalVotable(proposal)) {
        active.push(proposal);
      } else {
        inactive.push(proposal);
      }
    });

    return { activeProposals: active, inactiveProposals: inactive };
  }, [filteredAndSortedProposals]);

  const getStatusBadge = (status: ProposalStatus) => {
    switch (status) {
      case ProposalStatus.ACTIVE:
        return <Badge color="blue" style={{ background: 'rgba(33, 150, 243, 0.3)', color: 'white' }}>Aktif</Badge>;
      case ProposalStatus.PASSED:
        return <Badge color="green" style={{ background: 'rgba(76, 175, 80, 0.3)', color: 'white' }}>Kabul Edildi</Badge>;
      case ProposalStatus.FAILED:
        return <Badge color="red" style={{ background: 'rgba(244, 67, 54, 0.3)', color: 'white' }}>Reddedildi</Badge>;
      case ProposalStatus.EXPIRED:
        return <Badge color="gray" style={{ background: 'rgba(158, 158, 158, 0.3)', color: 'white' }}>Süresi Doldu</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDeadline = (deadline: number) => {
    // Deadline is in milliseconds (as contract uses clock::timestamp_ms)
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diff < 0) {
      return 'Süresi doldu';
    }
    if (days > 0) {
      return `${days} gün ${hours} saat kaldı`;
    }
    if (hours > 0) {
      return `${hours} saat kaldı`;
    }
    return 'Çok yakında';
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
    <Box style={{ width: '100%', padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <Flex justify="between" align="center" mb="6" wrap="wrap" gap="3">
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
            }}
          >
            Öneriler ({filteredAndSortedProposals.length})
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
          }}
        >
          + Yeni Öneri
        </Button>
      </Flex>

      {/* Search and Filters */}
      <Box
        className="liquid-glass-card"
        style={{
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <Flex direction="column" gap="3">
          <TextField.Root
            size="3"
            placeholder="Önerilerde ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
            }}
          >
            <TextField.Slot>🔍</TextField.Slot>
          </TextField.Root>

          <Flex gap="3" wrap="wrap">
            <Box style={{ flex: 1, minWidth: '200px' }}>
              <Text size="2" mb="2" style={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block' }}>
                Durum
              </Text>
              <Select.Root value={filterStatus === 'all' ? 'all' : String(filterStatus)} onValueChange={(value) => setFilterStatus(value === 'all' ? 'all' : Number(value) as ProposalStatus)}>
                <Select.Trigger
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    width: '100%',
                  }}
                />
                <Select.Content>
                  <Select.Item value="all">Tümü</Select.Item>
                  <Select.Item value={String(ProposalStatus.ACTIVE)}>Aktif</Select.Item>
                  <Select.Item value={String(ProposalStatus.PASSED)}>Kabul Edildi</Select.Item>
                  <Select.Item value={String(ProposalStatus.FAILED)}>Reddedildi</Select.Item>
                  <Select.Item value={String(ProposalStatus.EXPIRED)}>Süresi Doldu</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>

            <Box style={{ flex: 1, minWidth: '200px' }}>
              <Text size="2" mb="2" style={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block' }}>
                Sırala
              </Text>
              <Select.Root value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
                <Select.Trigger
                  style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    width: '100%',
                  }}
                />
                <Select.Content>
                  <Select.Item value="newest">En Yeni</Select.Item>
                  <Select.Item value="oldest">En Eski</Select.Item>
                  <Select.Item value="most-votes">En Çok Oy</Select.Item>
                  <Select.Item value="least-votes">En Az Oy</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>
          </Flex>
        </Flex>
      </Box>

      {activeProposals.length === 0 && inactiveProposals.length === 0 ? (
        <Box
          className="liquid-glass-card"
          style={{
            padding: '3rem',
            textAlign: 'center',
          }}
        >
          <Text 
            size="4" 
            style={{ 
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            {searchQuery || filterStatus !== 'all'
              ? 'Arama kriterlerinize uygun öneri bulunamadı.'
              : 'Henüz öneri yok. İlk öneriyi oluşturun!'}
          </Text>
        </Box>
      ) : (
        <Flex direction="column" gap="6">
          {/* Active (Votable) Proposals - Shown at the top */}
          {activeProposals.length > 0 && (
            <Box>
              <Heading 
                size="5" 
                mb="4"
                style={{ 
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontWeight: 600,
                }}
              >
                Aktif Öneriler ({activeProposals.length})
              </Heading>
              <Flex direction="column" gap="4">
                {activeProposals.map((proposal) => (
                  <Box
                    key={proposal.id}
                    onClick={() => onProposalClick(proposal.id)}
                    className="liquid-glass-card"
                    style={{
                      padding: '1.5rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
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
                        <Flex align="center" gap="3" mb="2" wrap="wrap">
                          <Heading 
                            size="5" 
                            style={{ 
                              color: 'rgba(255, 255, 255, 0.95)',
                              fontWeight: 600,
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
                            lineHeight: 1.6,
                          }}
                        >
                          {proposal.description}
                        </Text>
                      </Box>
                    </Flex>

                    <Flex justify="between" align="center" mt="4" wrap="wrap" gap="3">
                      <Flex gap="4" align="center" wrap="wrap">
                        <Text 
                          size="2" 
                          style={{ 
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {formatAddress(proposal.creator)}
                        </Text>
                        <Text 
                          size="2" 
                          style={{ 
                            color: 'rgba(255, 255, 255, 0.6)',
                          }}
                        >
                          {formatDeadline(proposal.deadline)}
                        </Text>
                      </Flex>
                      <Flex gap="3" align="center">
                        <Badge size="2" style={{ background: 'rgba(76, 175, 80, 0.3)', color: 'white' }}>
                          ✓ {proposal.yesVotes}
                        </Badge>
                        <Badge size="2" style={{ background: 'rgba(244, 67, 54, 0.3)', color: 'white' }}>
                          ✗ {proposal.noVotes}
                        </Badge>
                        <Badge size="2" style={{ background: 'rgba(158, 158, 158, 0.3)', color: 'white' }}>
                          ⊘ {proposal.abstainVotes}
                        </Badge>
                      </Flex>
                    </Flex>
                  </Box>
                ))}
              </Flex>
            </Box>
          )}

          {/* Inactive (Non-votable) Proposals - Shown at the bottom */}
          {inactiveProposals.length > 0 && (
            <Box>
              <Heading 
                size="5" 
                mb="4"
                style={{ 
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontWeight: 600,
                }}
              >
                Tamamlanmış Öneriler ({inactiveProposals.length})
              </Heading>
              <Flex direction="column" gap="4">
                {inactiveProposals.map((proposal) => (
                  <Box
                    key={proposal.id}
                    className="liquid-glass-card"
                    style={{
                      padding: '1.5rem',
                      cursor: 'not-allowed',
                      opacity: 0.6,
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    <Flex justify="between" align="start" mb="3">
                      <Box style={{ flex: 1 }}>
                        <Flex align="center" gap="3" mb="2" wrap="wrap">
                          <Heading 
                            size="5" 
                            style={{ 
                              color: 'rgba(255, 255, 255, 0.7)',
                              fontWeight: 600,
                            }}
                          >
                            {proposal.title}
                          </Heading>
                          {getStatusBadge(proposal.status)}
                        </Flex>
                        <Text 
                          size="3" 
                          style={{ 
                            color: 'rgba(255, 255, 255, 0.5)',
                            lineHeight: 1.6,
                          }}
                        >
                          {proposal.description}
                        </Text>
                      </Box>
                    </Flex>

                    <Flex justify="between" align="center" mt="4" wrap="wrap" gap="3">
                      <Flex gap="4" align="center" wrap="wrap">
                        <Text 
                          size="2" 
                          style={{ 
                            color: 'rgba(255, 255, 255, 0.5)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {formatAddress(proposal.creator)}
                        </Text>
                        <Text 
                          size="2" 
                          style={{ 
                            color: 'rgba(255, 255, 255, 0.5)',
                          }}
                        >
                          {formatDeadline(proposal.deadline)}
                        </Text>
                      </Flex>
                      <Flex gap="3" align="center">
                        <Badge size="2" style={{ background: 'rgba(76, 175, 80, 0.2)', color: 'rgba(255, 255, 255, 0.7)' }}>
                          ✓ {proposal.yesVotes}
                        </Badge>
                        <Badge size="2" style={{ background: 'rgba(244, 67, 54, 0.2)', color: 'rgba(255, 255, 255, 0.7)' }}>
                          ✗ {proposal.noVotes}
                        </Badge>
                        <Badge size="2" style={{ background: 'rgba(158, 158, 158, 0.2)', color: 'rgba(255, 255, 255, 0.7)' }}>
                          ⊘ {proposal.abstainVotes}
                        </Badge>
                      </Flex>
                    </Flex>
                  </Box>
                ))}
              </Flex>
            </Box>
          )}
        </Flex>
      )}
    </Box>
  );
}
