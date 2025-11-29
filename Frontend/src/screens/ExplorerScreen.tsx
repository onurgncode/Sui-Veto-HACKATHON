import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Button, Tabs, Text } from "@radix-ui/themes";
import { formatAddress } from "../utils/formatters";
import { communityService, type Community } from "../services/communityService";

interface ExplorerScreenProps {
  nickname: string;
  selectedTab: 'explorer' | 'my-community' | 'profile';
  onTabChange: (tab: 'explorer' | 'my-community' | 'profile') => void;
  onCreateCommunity: () => void;
}

export function ExplorerScreen({ nickname, selectedTab, onTabChange, onCreateCommunity }: ExplorerScreenProps) {
  const currentAccount = useCurrentAccount();
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCommunities = async () => {
      setIsLoading(true);
      try {
        setCommunities([]);
      } catch (error) {
        console.error('Failed to load communities:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadCommunities();
  }, []);

  return (
    <Box>
      <Box
        className="liquid-glass-card"
        mb="5"
        style={{
          padding: '0.5rem',
        }}
      >
        <Tabs.Root value={selectedTab} onValueChange={(value) => onTabChange(value as any)}>
          <Tabs.List
            style={{
              background: 'transparent',
              border: 'none',
            }}
          >
            <Tabs.Trigger 
              value="explorer"
              className="liquid-glass-tab"
              style={{
                color: selectedTab === 'explorer' ? 'white' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: selectedTab === 'explorer' ? 600 : 400,
              }}
            >
              Explorer
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="my-community"
              className="liquid-glass-tab"
              style={{
                color: selectedTab === 'my-community' ? 'white' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: selectedTab === 'my-community' ? 600 : 400,
              }}
            >
              My Community
            </Tabs.Trigger>
            <Tabs.Trigger 
              value="profile"
              className="liquid-glass-tab"
              style={{
                color: selectedTab === 'profile' ? 'white' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: selectedTab === 'profile' ? 600 : 400,
              }}
            >
              Profile
            </Tabs.Trigger>
            {currentAccount && (
              <Tabs.Trigger 
                value="wallet" 
                disabled
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                }}
              >
                {formatAddress(currentAccount.address)}
              </Tabs.Trigger>
            )}
          </Tabs.List>
        </Tabs.Root>
      </Box>

      <Box>
        <Flex justify="between" align="center" mb="5">
          <Heading size="8" style={{ color: 'white', fontWeight: 700 }}>
            Toplulukları Keşfet
          </Heading>
          <Button
            className="liquid-glass-button"
            size="3"
            onClick={onCreateCommunity}
          >
            + Topluluk Oluştur
          </Button>
        </Flex>

        <Box
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {isLoading ? (
            <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Yükleniyor...
            </Text>
          ) : communities.length === 0 ? (
            <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Henüz topluluk yok. İlk topluluğu oluşturun!
            </Text>
          ) : (
            communities.map((community) => (
              <Box
                key={community.id}
                className="liquid-glass-card"
                style={{
                  padding: '2rem',
                  cursor: 'pointer',
                }}
                onClick={() => onTabChange('my-community')}
              >
                <Flex direction="column" gap="4">
                  <Flex align="center" gap="3">
                    <Box
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #ffffff 0%, #b0b0b0 100%)',
                        boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
                      }}
                    />
                    <Heading 
                      size="6" 
                      style={{ 
                        color: 'white',
                        fontWeight: 600,
                      }}
                    >
                      {community.name}
                    </Heading>
                  </Flex>
                </Flex>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
}
