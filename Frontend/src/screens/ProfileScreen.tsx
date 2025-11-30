import { useState, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button, Badge, Separator, Tabs } from "@radix-ui/themes";
import { profileService, type MemberStats } from "../services/profileService";
import { communityService, type Community } from "../services/communityService";
import { eventNFTService, type EventNFT } from "../services/eventNFTService";
import { formatAddress } from "../utils/formatters";
import { Transaction } from "@mysten/sui/transactions";

interface ProfileScreenProps {
  nickname: string;
  onBack: () => void;
}

interface CommunityStats extends MemberStats {
  communityId: string;
  communityName: string;
}

export function ProfileScreen({ nickname, onBack }: ProfileScreenProps) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [communityStats, setCommunityStats] = useState<CommunityStats[]>([]);
  const [eventNFTs, setEventNFTs] = useState<EventNFT[]>([]);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'communities' | 'nfts'>('overview');
  const [isRedeeming, setIsRedeeming] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
    if (currentAccount) {
        setIsLoading(true);
        try {
          // Load profile ID
          const profileResponse = await profileService.getProfile(currentAccount.address);
          if (profileResponse.success && profileResponse.data?.profile) {
            setProfileId(profileResponse.data.profile.id);
          }

          // Load communities
          const communitiesResponse = await communityService.getCommunitiesByMember(currentAccount.address);
          if (communitiesResponse.success && communitiesResponse.data) {
            const communitiesList = communitiesResponse.data.communities || [];
            setCommunities(communitiesList);
            
            // Load stats for each community
            const statsPromises = communitiesList.map(async (community) => {
              const statsResponse = await profileService.getMemberStats(currentAccount.address, community.id);
              if (statsResponse.success && statsResponse.data?.stats) {
                return {
                  ...statsResponse.data.stats,
                  communityId: community.id,
                  communityName: community.name,
                } as CommunityStats;
              }
              return null;
            });
            
            const statsResults = await Promise.all(statsPromises);
            setCommunityStats(statsResults.filter((s): s is CommunityStats => s !== null));
          }

          // Load event NFTs
          const nftsResponse = await eventNFTService.getEventNFTsByOwner(currentAccount.address);
          if (nftsResponse.success && nftsResponse.data) {
            setEventNFTs(nftsResponse.data.nfts || []);
        }
        } catch (error) {
          console.error('Error loading profile data:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadData();
    
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [currentAccount]);

  const handleRedeemNFT = async (nft: EventNFT) => {
    if (!currentAccount || !profileId) {
      return;
    }

    setIsRedeeming(nft.id);
    try {
      const packageId = import.meta.env.VITE_PACKAGE_ID || '0x6b30552018493c6daaef95c7a1956aca5adc1528513a7bc0d831cd9b136a8f90';
      const tx = new Transaction();
      
      tx.moveCall({
        target: `${packageId}::dao_app::redeem_nft_for_xp`,
        arguments: [
          tx.object(profileId),
          tx.object(nft.id),
          tx.object(nft.commityId),
        ],
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            // Refresh data after successful redemption
            setTimeout(() => {
              const loadData = async () => {
                const nftsResponse = await eventNFTService.getEventNFTsByOwner(currentAccount.address);
                if (nftsResponse.success && nftsResponse.data) {
                  setEventNFTs(nftsResponse.data.nfts || []);
                }
                const communitiesResponse = await communityService.getCommunitiesByMember(currentAccount.address);
                if (communitiesResponse.success && communitiesResponse.data) {
                  const communitiesList = communitiesResponse.data.communities || [];
                  const statsPromises = communitiesList.map(async (community) => {
                    const statsResponse = await profileService.getMemberStats(currentAccount.address, community.id);
                    if (statsResponse.success && statsResponse.data?.stats) {
                      return {
                        ...statsResponse.data.stats,
                        communityId: community.id,
                        communityName: community.name,
                      } as CommunityStats;
                    }
                    return null;
                  });
                  const statsResults = await Promise.all(statsPromises);
                  setCommunityStats(statsResults.filter((s): s is CommunityStats => s !== null));
                }
              };
              loadData();
            }, 2000);
            setIsRedeeming(null);
          },
          onError: (error) => {
            console.error('NFT redemption failed:', error);
            setIsRedeeming(null);
          },
        }
      );
    } catch (error) {
      console.error('NFT redemption error:', error);
      setIsRedeeming(null);
    }
  };

  const totalXP = communityStats.reduce((sum, stat) => sum + stat.xp, 0);
  const maxLevel = communityStats.length > 0 ? Math.max(...communityStats.map(s => s.level)) : 1;

  return (
    <Box style={{ width: '100%', maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <Flex justify="between" align="center" mb="5">
        <Heading size="8" style={{ color: 'white', fontWeight: 700 }}>
          Profile
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
        className="liquid-glass-card"
        style={{
          padding: '3rem',
          marginBottom: '2rem',
        }}
      >
        <Flex direction="column" gap="6" align="center">
          <Box
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '3rem',
              fontWeight: 'bold',
              boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
            }}
          >
            {nickname.charAt(0).toUpperCase()}
          </Box>

          <Box style={{ textAlign: 'center' }}>
            <Heading 
              size="7" 
              mb="2"
              style={{ 
                color: 'white',
                fontWeight: 700,
              }}
            >
              {nickname}
            </Heading>
            {currentAccount && (
              <Text 
                size="2" 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontFamily: 'monospace',
                  display: 'block',
                  marginTop: '0.5rem',
                }}
              >
                {formatAddress(currentAccount.address)}
              </Text>
            )}
          </Box>

          <Flex gap="4" wrap="wrap" justify="center" style={{ width: '100%' }}>
            <Box
              className="liquid-glass-card"
              style={{ 
                padding: '1.5rem', 
                minWidth: '150px',
                flex: 1,
              }}
            >
              <Flex direction="column" align="center" gap="2">
                <Text 
                  size="2" 
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  Topluluklar
                </Text>
                <Heading 
                  size="6" 
                  style={{ 
                    color: 'white',
                    fontWeight: 700,
                  }}
                >
                  {communities.length}
                </Heading>
              </Flex>
            </Box>
            <Box
              className="liquid-glass-card"
              style={{ 
                padding: '1.5rem', 
                minWidth: '150px',
                flex: 1,
              }}
            >
              <Flex direction="column" align="center" gap="2">
                <Text 
                  size="2" 
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  Toplam XP
                </Text>
                <Heading 
                  size="6" 
                  style={{ 
                    color: 'white',
                    fontWeight: 700,
                  }}
                >
                  {totalXP}
                </Heading>
              </Flex>
            </Box>
            <Box
              className="liquid-glass-card"
              style={{ 
                padding: '1.5rem', 
                minWidth: '150px',
                flex: 1,
              }}
            >
              <Flex direction="column" align="center" gap="2">
                <Text 
                  size="2" 
                  style={{ 
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  En Yüksek Level
                </Text>
                <Heading 
                  size="6" 
                  style={{ 
                    color: 'white',
                    fontWeight: 700,
                  }}
                >
                  {maxLevel}
                </Heading>
              </Flex>
            </Box>
          </Flex>
        </Flex>
      </Box>

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
            value="communities"
            style={{
              color: selectedTab === 'communities' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.5)',
              fontWeight: selectedTab === 'communities' ? 600 : 500,
              background: selectedTab === 'communities' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              borderRadius: '8px',
              padding: '0.625rem 1.25rem',
            }}
          >
            Topluluklar ({communities.length})
          </Tabs.Trigger>
          <Tabs.Trigger 
            value="nfts"
            style={{
              color: selectedTab === 'nfts' ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.5)',
              fontWeight: selectedTab === 'nfts' ? 600 : 500,
              background: selectedTab === 'nfts' ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              borderRadius: '8px',
              padding: '0.625rem 1.25rem',
            }}
          >
            NFT'ler ({eventNFTs.length})
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="overview">
          <Box
            className="liquid-glass-card"
            style={{
              padding: '2rem',
            }}
          >
            <Heading size="5" mb="4" style={{ color: 'white', fontWeight: 600 }}>
              Özet
            </Heading>
            <Flex direction="column" gap="4">
              <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                {communities.length} topluluğa üyesiniz ve toplam {totalXP} XP kazandınız.
              </Text>
              {eventNFTs.length > 0 && (
                <Box
                  style={{
                    padding: '1rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                    {eventNFTs.length} adet Event NFT'niz var. Bunları XP'ye çevirebilirsiniz.
                  </Text>
                </Box>
              )}
            </Flex>
          </Box>
        </Tabs.Content>

        <Tabs.Content value="communities">
          <Box
            className="liquid-glass-card"
            style={{
              padding: '2rem',
            }}
          >
            <Heading size="5" mb="4" style={{ color: 'white', fontWeight: 600 }}>
              Topluluk İstatistikleri
            </Heading>
            {isLoading ? (
              <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Yükleniyor...
              </Text>
            ) : communityStats.length === 0 ? (
              <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Henüz hiçbir topluluğa üye değilsiniz.
              </Text>
            ) : (
              <Flex direction="column" gap="3">
                {communityStats.map((stat) => (
                  <Box
                    key={stat.communityId}
                    className="liquid-glass-card"
                    style={{
                      padding: '1.5rem',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <Flex justify="between" align="center" wrap="wrap" gap="3">
                      <Box>
                        <Heading size="4" mb="1" style={{ color: 'white', fontWeight: 600 }}>
                          {stat.communityName}
                        </Heading>
                        <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'monospace' }}>
                          {formatAddress(stat.communityId)}
                        </Text>
                      </Box>
                      <Flex gap="4">
                        <Box style={{ textAlign: 'center' }}>
                          <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mb: '0.25rem' }}>
                            XP
                          </Text>
                          <Badge size="2" style={{ background: 'rgba(102, 126, 234, 0.3)', color: 'white' }}>
                            {stat.xp}
                          </Badge>
                        </Box>
                        <Box style={{ textAlign: 'center' }}>
                          <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.7)', display: 'block', mb: '0.25rem' }}>
                            Level
                          </Text>
                          <Badge size="2" style={{ background: 'rgba(236, 72, 153, 0.3)', color: 'white' }}>
                            {stat.level}
                          </Badge>
                        </Box>
                      </Flex>
                    </Flex>
                  </Box>
                ))}
              </Flex>
            )}
          </Box>
        </Tabs.Content>

        <Tabs.Content value="nfts">
          <Box
            className="liquid-glass-card"
            style={{
              padding: '2rem',
            }}
          >
            <Heading size="5" mb="4" style={{ color: 'white', fontWeight: 600 }}>
              Event NFT'lerim
            </Heading>
            {isLoading ? (
              <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Yükleniyor...
              </Text>
            ) : eventNFTs.length === 0 ? (
              <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Henüz Event NFT'niz yok.
              </Text>
            ) : (
              <Flex direction="column" gap="3">
                {eventNFTs.map((nft) => (
                  <Box
                    key={nft.id}
                    className="liquid-glass-card"
                    style={{
                      padding: '1.5rem',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                    }}
                  >
                    <Flex justify="between" align="center" wrap="wrap" gap="3">
                      <Box>
                        <Flex align="center" gap="2" mb="1">
                          <Badge size="2" style={{ background: 'rgba(102, 126, 234, 0.3)', color: 'white' }}>
                            {nft.xp} XP
                          </Badge>
                        </Flex>
                        <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.6)', fontFamily: 'monospace' }}>
                          {formatAddress(nft.commityId)}
                        </Text>
                      </Box>
                      <Button
                        size="2"
                        onClick={() => handleRedeemNFT(nft)}
                        disabled={isRedeeming === nft.id || !profileId}
                        style={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          border: 'none',
                        }}
                      >
                        {isRedeeming === nft.id ? 'İşleniyor...' : 'XP\'ye Çevir'}
                      </Button>
                    </Flex>
                  </Box>
                ))}
              </Flex>
            )}
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
