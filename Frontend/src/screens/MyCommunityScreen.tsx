import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button } from "@radix-ui/themes";
import { communityService, type Community } from "../services/communityService";
import { formatAddress } from "../utils/formatters";

interface MyCommunityScreenProps {
  nickname: string;
  onBack?: () => void;
  onCommunityClick: (communityId: string) => void;
}

export function MyCommunityScreen({ nickname, onBack, onCommunityClick }: MyCommunityScreenProps) {
  const currentAccount = useCurrentAccount();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCommunities = async () => {
      if (!currentAccount) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await communityService.getCommunitiesByMember(currentAccount.address);
        if (response.success && response.data) {
          setCommunities(response.data.communities || []);
        } else {
          setCommunities([]);
        }
      } catch (error) {
        console.error('Failed to load communities:', error);
        setCommunities([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCommunities();
  }, [currentAccount]);

  return (
    <Box style={{ width: '100%', padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <Flex justify="between" align="center" mb="6">
        <Heading 
          size="8" 
          style={{ 
            color: 'rgba(255, 255, 255, 0.95)', 
            fontWeight: 700,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          }}
        >
          Topluluklarım
        </Heading>
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
      </Flex>

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
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            }}
          >
            Yükleniyor...
          </Text>
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
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            }}
          >
            Henüz hiçbir topluluğa üye değilsiniz. Explorer'dan bir topluluğa katılın!
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
          {communities.map((community) => (
            <Box
              key={community.id}
              onClick={() => onCommunityClick(community.id)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                padding: '2rem',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
                      color: 'rgba(255, 255, 255, 0.95)',
                      fontWeight: 600,
                      fontSize: '1.25rem',
                      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
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
              </Flex>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
