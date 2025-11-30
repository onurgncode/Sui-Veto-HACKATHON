import { useState, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button, Separator, Tabs, Badge } from "@radix-ui/themes";
import { communityService, type Community, type CommunityMember } from "../services/communityService";
import { profileService, type MemberStats } from "../services/profileService";
import { formatAddress } from "../utils/formatters";
import { Transaction } from "@mysten/sui/transactions";
import { CommunityMessaging } from "../components/CommunityMessaging";

interface CommunityDetailScreenProps {
  communityId: string;
  onBack: () => void;
  onViewProposals?: () => void;
  onCreateProposal?: () => void;
  onProposalClick?: (proposalId: string) => void;
}

interface MemberWithStats extends CommunityMember {
  nickname?: string;
  stats?: MemberStats;
}

export function CommunityDetailScreen({ 
  communityId, 
  onBack, 
  onViewProposals, 
  onCreateProposal,
  onProposalClick 
}: CommunityDetailScreenProps) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<MemberWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'members' | 'settings'>('overview');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    const loadCommunity = async () => {
      setIsLoading(true);
      try {
        const [communityResponse, membersResponse] = await Promise.all([
          communityService.getCommunity(communityId),
          communityService.getMembers(communityId),
        ]);

        if (communityResponse.success && communityResponse.data) {
          setCommunity(communityResponse.data.community);
        }

        if (membersResponse.success && membersResponse.data) {
          const membersList = membersResponse.data.members || [];
          
          // Check if current user is a member
          if (currentAccount) {
            const userIsMember = membersList.some(
              (member) => member.address === currentAccount.address
            );
            setIsMember(userIsMember || false);

            // Load profile ID if member
            if (userIsMember) {
              const profileResponse = await profileService.getProfile(currentAccount.address);
              if (profileResponse.success && profileResponse.data?.profile) {
                setProfileId(profileResponse.data.profile.id);
              }
            }
          }

          // Load member profiles and stats
          const membersWithStats = await Promise.all(
            membersList.map(async (member) => {
              const [profileResponse, statsResponse] = await Promise.all([
                profileService.getProfile(member.address),
                profileService.getMemberStats(member.address, communityId),
              ]);

              const memberWithStats: MemberWithStats = { ...member };
              
              if (profileResponse.success && profileResponse.data?.profile) {
                memberWithStats.nickname = profileResponse.data.profile.nickname;
              }

              if (statsResponse.success && statsResponse.data?.stats) {
                memberWithStats.stats = statsResponse.data.stats;
              }

              return memberWithStats;
            })
          );

          setMembers(membersWithStats);
        }
      } catch (error) {
        console.error('Failed to load community:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (communityId) {
      loadCommunity();
    }
  }, [communityId, currentAccount]);

  const handleLeaveCommunity = async () => {
    if (!currentAccount || !profileId || !isMember) {
      return;
    }

    if (!confirm('Bu topluluktan ayrılmak istediğinize emin misiniz?')) {
      return;
    }

    setIsLeaving(true);
    try {
      const packageId = import.meta.env.VITE_PACKAGE_ID || '0x6b30552018493c6daaef95c7a1956aca5adc1528513a7bc0d831cd9b136a8f90';
      const tx = new Transaction();
      
      // Note: Backend'de leave_commity fonksiyonu yoksa bu çalışmayacak
      // Şimdilik placeholder olarak bırakıyorum
      tx.moveCall({
        target: `${packageId}::dao_app::leave_commity`,
        arguments: [
          tx.object(profileId),
          tx.object(communityId),
        ],
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            onBack();
          },
          onError: (error) => {
            console.error('Leave community failed:', error);
            alert('Topluluktan ayrılma işlemi başarısız oldu. Backend\'de leave_commity fonksiyonu olmayabilir.');
            setIsLeaving(false);
          },
        }
      );
    } catch (error) {
      console.error('Leave community error:', error);
      setIsLeaving(false);
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

  if (!community) {
    return (
      <Box style={{ padding: '2rem' }}>
        <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Topluluk bulunamadı
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

  return (
    <Box style={{ width: '100%', maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
      <Flex justify="between" align="center" mb="6">
        <Heading 
          size="8" 
          style={{ 
            color: 'rgba(255, 255, 255, 0.95)', 
            fontWeight: 700,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          }}
        >
          {community.name}
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

      <Tabs.Root value={selectedTab} onValueChange={(value) => setSelectedTab(value as any)}>
        <Tabs.List
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(40px) saturate(180%)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '0.5rem',
            marginBottom: '2rem',
          }}
        >
          <Tabs.Trigger 
            value="overview"
            style={{
              color: selectedTab === 'overview' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.5)',
              fontWeight: selectedTab === 'overview' ? 600 : 500,
              background: selectedTab === 'overview' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              borderRadius: '8px',
              padding: '0.625rem 1.25rem',
            }}
          >
            Genel Bakış
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="members"
            style={{
              color: selectedTab === 'members' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.5)',
              fontWeight: selectedTab === 'members' ? 600 : 500,
              background: selectedTab === 'members' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              borderRadius: '8px',
              padding: '0.625rem 1.25rem',
            }}
          >
            Üyeler ({members.length})
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="settings"
            style={{
              color: selectedTab === 'settings' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.5)',
              fontWeight: selectedTab === 'settings' ? 600 : 500,
              background: selectedTab === 'settings' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              borderRadius: '8px',
              padding: '0.625rem 1.25rem',
            }}
          >
            Ayarlar
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview">
          <Box
            className="liquid-glass-card"
            style={{
              padding: '2rem',
          }}
        >
          <Heading 
            size="6" 
            mb="4"
            style={{ 
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 600,
            }}
          >
            Kanal
          </Heading>
          {isMember ? (
            <CommunityMessaging
              communityId={communityId}
              memberAddresses={members.map(m => m.address)}
            />
          ) : (
            <Box
              style={{
                minHeight: '400px',
                padding: '1.5rem',
                background: 'rgba(0, 0, 0, 0.2)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text 
                size="3" 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.6)',
                  textAlign: 'center',
                }}
              >
                Mesajlaşma özelliğini kullanmak için topluluğa üye olmanız gerekiyor.
              </Text>
            </Box>
          )}

          <Separator size="4" style={{ background: 'rgba(255, 255, 255, 0.08)', marginBottom: '1.5rem' }} />

            <Flex gap="3" direction="column">
              {onViewProposals && (
                <Button
                  onClick={onViewProposals}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    borderRadius: '12px',
                    padding: '0.875rem 2rem',
                    fontWeight: 600,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Önerileri Görüntüle
                </Button>
              )}
              {onCreateProposal && isMember && (
          <Button
                  onClick={onCreateProposal}
            style={{
              width: '100%',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(236, 72, 153, 0.9) 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '0.875rem 2rem',
              fontWeight: 600,
              fontSize: '1rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)',
                  }}
                >
                  Yeni Öneri Oluştur
          </Button>
              )}
            </Flex>
        </Box>
        </Tabs.Content>

        <Tabs.Content value="members">
        <Box
            className="liquid-glass-card"
          style={{
            padding: '2rem',
          }}
        >
          <Heading 
            size="6" 
            mb="4"
            style={{ 
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 600,
            }}
          >
            Üyeler ({members.length})
          </Heading>
          
            {members.length === 0 ? (
              <Text 
                size="3" 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.6)',
                }}
              >
                Henüz üye yok
              </Text>
            ) : (
              <Flex direction="column" gap="3">
                {members.map((member) => (
                  <Box
                    key={member.address}
                    className="liquid-glass-card"
                    style={{
                      padding: '1.5rem',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <Flex justify="between" align="center" wrap="wrap" gap="3">
                      <Box style={{ flex: 1 }}>
                        {member.nickname ? (
                          <Heading size="4" mb="1" style={{ color: 'white', fontWeight: 600 }}>
                            {member.nickname}
                          </Heading>
                        ) : null}
                    <Text 
                      size="2" 
                      style={{ 
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontFamily: 'monospace',
                      }}
                    >
                      {formatAddress(member.address)}
                    </Text>
                        {member.stats && (
                          <Flex gap="3" mt="2">
                            <Badge size="2" style={{ background: 'rgba(102, 126, 234, 0.3)', color: 'white' }}>
                              {member.stats.xp} XP
                            </Badge>
                            <Badge size="2" style={{ background: 'rgba(236, 72, 153, 0.3)', color: 'white' }}>
                              Level {member.stats.level}
                            </Badge>
                          </Flex>
                        )}
                      </Box>
                    </Flex>
                  </Box>
                ))}
              </Flex>
            )}
          </Box>
        </Tabs.Content>

        <Tabs.Content value="settings">
          <Box
            className="liquid-glass-card"
            style={{
              padding: '2rem',
            }}
          >
            <Heading 
              size="6" 
              mb="4"
              style={{ 
                color: 'rgba(255, 255, 255, 0.95)',
                fontWeight: 600,
              }}
            >
              Topluluk Ayarları
            </Heading>

            <Flex direction="column" gap="4">
              <Box>
                <Text size="3" mb="2" style={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block' }}>
                  Topluluk Adı
                </Text>
                <Text size="4" style={{ color: 'white', fontWeight: 600 }}>
                  {community.name}
                </Text>
              </Box>

              <Box>
                <Text size="3" mb="2" style={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block' }}>
                  Topluluk ID
                </Text>
                <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'monospace' }}>
                  {formatAddress(community.id)}
                </Text>
              </Box>

              <Box>
                <Text size="3" mb="2" style={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block' }}>
                  Üye Sayısı
                </Text>
                <Text size="4" style={{ color: 'white', fontWeight: 600 }}>
                  {members.length}
                </Text>
              </Box>

              <Separator size="4" style={{ background: 'rgba(255, 255, 255, 0.08)' }} />

              {isMember && (
                <Box>
                  <Button
                    size="3"
                    variant="soft"
                    onClick={handleLeaveCommunity}
                    disabled={isLeaving}
                    style={{
                      background: 'rgba(236, 72, 153, 0.2)',
                      color: 'rgba(236, 72, 153, 0.9)',
                      border: '1px solid rgba(236, 72, 153, 0.3)',
                    }}
                  >
                    {isLeaving ? 'Ayrılıyor...' : 'Topluluktan Ayrıl'}
                  </Button>
                  <Text size="1" mt="2" style={{ color: 'rgba(255, 255, 255, 0.5)', display: 'block' }}>
                    Not: Backend'de leave_commity fonksiyonu olmayabilir.
                  </Text>
        </Box>
              )}
      </Flex>
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
