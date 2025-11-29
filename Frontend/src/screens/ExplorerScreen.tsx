import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Button, Text } from "@radix-ui/themes";
import { formatAddress } from "../utils/formatters";
import { communityService, type Community } from "../services/communityService";

interface ExplorerScreenProps {
  onCreateCommunity: () => void;
  onCommunityClick?: (communityId: string) => void;
  onJoinRequest?: (communityId: string) => void;
}

export function ExplorerScreen({ onCreateCommunity, onCommunityClick, onJoinRequest }: ExplorerScreenProps) {
  const currentAccount = useCurrentAccount();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [userCommunities, setUserCommunities] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCommunities = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [allCommunitiesResponse, userCommunitiesResponse] = await Promise.all([
          communityService.getAllCommunities(),
          currentAccount ? communityService.getCommunitiesByMember(currentAccount.address) : Promise.resolve({ success: false, data: null }),
        ]);
        
        if (allCommunitiesResponse.success && allCommunitiesResponse.data) {
          const communitiesList = allCommunitiesResponse.data.communities || [];
          setCommunities(communitiesList);
        } else {
          setError(allCommunitiesResponse.error || 'Topluluklar yüklenemedi');
          setCommunities([]);
        }

        if (currentAccount && userCommunitiesResponse.success && userCommunitiesResponse.data) {
          const userCommList = userCommunitiesResponse.data.communities || [];
          const userCommSet = new Set(userCommList.map(c => c.id));
          setUserCommunities(userCommSet);
        } else {
          setUserCommunities(new Set());
        }
      } catch (error) {
        console.error('[ExplorerScreen] Error loading communities:', error);
        setError(error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu');
        setCommunities([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadCommunities();
  }, [currentAccount]);

  return (
    <Box style={{ width: '100%', padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Main Content */}
      <Box>
        <Flex 
          justify="between" 
          align="start" 
          mb="6"
          style={{
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <Box>
            <Heading 
              size="9" 
              style={{ 
                color: 'white', 
                fontWeight: 800,
                fontSize: 'clamp(2rem, 5vw, 3rem)',
                letterSpacing: '-0.03em',
                marginBottom: '0.5rem',
              }}
            >
              Toplulukları Keşfet
            </Heading>
            {!isLoading && communities.length === 0 && (
              <Text 
                size="4" 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '1.1rem',
                  fontWeight: 400,
                }}
              >
                Henüz topluluk yok. İlk topluluğu oluşturun!
              </Text>
            )}
          </Box>
          <Button
            onClick={onCreateCommunity}
            size="3"
            style={{
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
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.4)';
            }}
          >
            + Topluluk Oluştur
          </Button>
        </Flex>

        {/* Communities Grid */}
        {isLoading ? (
          <Box
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
            }}
          >
            <Text 
              size="4" 
              style={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                fontSize: '1.1rem',
              }}
            >
              Yükleniyor...
            </Text>
          </Box>
        ) : error ? (
          <Box
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              background: 'rgba(244, 67, 54, 0.1)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '24px',
              border: '1px solid rgba(244, 67, 54, 0.3)',
            }}
          >
            <Text 
              size="4" 
              style={{ 
                color: 'rgba(244, 67, 54, 0.9)',
                fontSize: '1.1rem',
                marginBottom: '1rem',
              }}
            >
              {error}
            </Text>
            <Button
              onClick={() => {
                setIsLoading(true);
                setError(null);
                const loadCommunities = async () => {
                  try {
                    const response = await communityService.getAllCommunities();
                    if (response.success && response.data) {
                      setCommunities(response.data.communities || []);
                    } else {
                      setError(response.error || 'Topluluklar yüklenemedi');
                    }
                  } catch (error) {
                    setError(error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu');
                  } finally {
                    setIsLoading(false);
                  }
                };
                loadCommunities();
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                padding: '0.75rem 1.5rem',
              }}
            >
              Tekrar Dene
            </Button>
          </Box>
        ) : communities.length === 0 ? (
          <Box
            style={{
              padding: '4rem 2rem',
              textAlign: 'center',
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '24px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <Text 
              size="4" 
              style={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '1.1rem',
              }}
            >
              Henüz topluluk yok. İlk topluluğu oluşturun!
            </Text>
          </Box>
        ) : (
          <Box
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {communities.map((community) => {
              const isMember = currentAccount ? userCommunities.has(community.id) : false;
              
              return (
              <Box
                key={community.id}
                onClick={() => {
                  if (isMember) {
                    // User is already a member, go directly to community detail
                    if (onCommunityClick) {
                      onCommunityClick(community.id);
                    }
                  } else {
                    // User is not a member, show join request screen
                    if (onJoinRequest) {
                      onJoinRequest(community.id);
                    }
                  }
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  backdropFilter: 'blur(40px)',
                  WebkitBackdropFilter: 'blur(40px)',
                  borderRadius: '20px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  padding: '2rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)';
                }}
              >
                <Flex direction="column" gap="4">
                  <Flex align="center" gap="3">
                    <Box
                      style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.8) 0%, rgba(236, 72, 153, 0.8) 100%)',
                        boxShadow: '0 0 12px rgba(139, 92, 246, 0.5)',
                        flexShrink: 0,
                      }}
                    />
                    <Heading 
                      size="6" 
                      style={{ 
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '1.25rem',
                      }}
                    >
                      {community.name}
                    </Heading>
                  </Flex>
                  <Text 
                    size="2" 
                    style={{ 
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                      fontSize: '0.75rem',
                    }}
                  >
                    {formatAddress(community.id)}
                  </Text>
                  {isMember && (
                    <Text 
                      size="2" 
                      style={{ 
                        color: 'rgba(76, 175, 80, 0.9)',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        marginTop: '0.5rem',
                      }}
                    >
                      ✓ Üyesiniz
                    </Text>
                  )}
                </Flex>
              </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
