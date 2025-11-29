import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button } from "@radix-ui/themes";
import { profileService, type MemberStats } from "../services/profileService";
import { communityService } from "../services/communityService";

interface ProfileScreenProps {
  nickname: string;
  onBack: () => void;
}

export function ProfileScreen({ nickname, onBack }: ProfileScreenProps) {
  const currentAccount = useCurrentAccount();
  const [stats, setStats] = useState<MemberStats | null>(null);
  const [communitiesCount, setCommunitiesCount] = useState(0);

  useEffect(() => {
    const loadData = async () => {
      if (currentAccount) {
        const communitiesResponse = await communityService.getCommunitiesByMember(currentAccount.address);
        if (communitiesResponse.success && communitiesResponse.data) {
          const communities = communitiesResponse.data.communities || [];
          setCommunitiesCount(communities.length);
          
          if (communities.length > 0) {
            const firstCommunityId = communities[0].id;
            const statsResponse = await profileService.getMemberStats(currentAccount.address, firstCommunityId);
            if (statsResponse.success && statsResponse.data?.stats) {
              setStats(statsResponse.data.stats);
            }
          }
        }
      }
    };
    loadData();
    
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [currentAccount]);

  return (
    <Box>
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
          padding: '4rem',
          maxWidth: '700px',
          margin: '0 auto',
        }}
      >
        <Flex direction="column" gap="6" align="center">
          <Box
            style={{
              width: '140px',
              height: '140px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '3.5rem',
              fontWeight: 'bold',
              boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
            }}
          >
            {nickname.charAt(0).toUpperCase()}
          </Box>

          <Box style={{ textAlign: 'center' }}>
            <Heading 
              size="8" 
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
                size="3" 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontFamily: 'monospace',
                  display: 'block',
                  marginTop: '0.5rem',
                }}
              >
                {currentAccount.address}
              </Text>
            )}
          </Box>

          <Flex gap="4" wrap="wrap" justify="center" style={{ width: '100%' }}>
            <Box
              className="liquid-glass-card"
              style={{ 
                padding: '2rem', 
                minWidth: '180px',
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
                  size="7" 
                  style={{ 
                    color: 'white',
                    fontWeight: 700,
                  }}
                >
                  {communitiesCount}
                </Heading>
              </Flex>
            </Box>
            <Box
              className="liquid-glass-card"
              style={{ 
                padding: '2rem', 
                minWidth: '180px',
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
                  XP
                </Text>
                <Heading 
                  size="7" 
                  style={{ 
                    color: 'white',
                    fontWeight: 700,
                  }}
                >
                  {stats?.xp || 0}
                </Heading>
              </Flex>
            </Box>
            <Box
              className="liquid-glass-card"
              style={{ 
                padding: '2rem', 
                minWidth: '180px',
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
                  Level
                </Text>
                <Heading 
                  size="7" 
                  style={{ 
                    color: 'white',
                    fontWeight: 700,
                  }}
                >
                  {stats?.level || 1}
                </Heading>
              </Flex>
            </Box>
          </Flex>
        </Flex>
      </Box>
    </Box>
  );
}
