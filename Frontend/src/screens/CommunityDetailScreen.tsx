import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button, Separator } from "@radix-ui/themes";
import { communityService, type Community, type CommunityMember } from "../services/communityService";
import { formatAddress } from "../utils/formatters";

interface CommunityDetailScreenProps {
  communityId: string;
  onBack: () => void;
  onViewProposals?: () => void;
  onCreateProposal?: () => void;
  onProposalClick?: (proposalId: string) => void;
}

export function CommunityDetailScreen({ 
  communityId, 
  onBack, 
  onViewProposals, 
  onCreateProposal,
  onProposalClick 
}: CommunityDetailScreenProps) {
  const currentAccount = useCurrentAccount();
  const [community, setCommunity] = useState<Community | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);

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
          setMembers(membersResponse.data.members || []);
          
          // Check if current user is a member
          if (currentAccount) {
            const userIsMember = membersResponse.data.members?.some(
              (member) => member.address === currentAccount.address
            );
            setIsMember(userIsMember || false);
          }
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

      <Flex gap="6" direction={{ initial: 'column', md: 'row' }}>
        {/* Main Content */}
        <Box
          style={{
            flex: 2,
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
          }}
        >
          <Heading 
            size="6" 
            mb="4"
            style={{ 
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 600,
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            }}
          >
            Kanal
          </Heading>
          <Box
            style={{
              minHeight: '400px',
              padding: '1.5rem',
              background: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              marginBottom: '1.5rem',
            }}
          >
            <Text 
              size="3" 
              style={{ 
                color: 'rgba(255, 255, 255, 0.6)',
                fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
              }}
            >
              Henüz mesaj yok. İlk mesajınızı gönderin!
            </Text>
          </Box>

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
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                }}
              >
                Önerileri Görüntüle
              </Button>
            )}
            {onCreateProposal && (
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
                Yeni Öneri Oluştur
              </Button>
            )}
          </Flex>
        </Box>

        {/* Sidebar */}
        <Box
          style={{
            flex: 1,
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '2rem',
            height: 'fit-content',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
          }}
        >
          <Heading 
            size="6" 
            mb="4"
            style={{ 
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: 600,
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            }}
          >
            Üyeler ({members.length})
          </Heading>
          
          <Box
            style={{
              maxHeight: '500px',
              overflowY: 'auto',
            }}
          >
            {members.length === 0 ? (
              <Text 
                size="3" 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                }}
              >
                Henüz üye yok
              </Text>
            ) : (
              <Flex direction="column" gap="2">
                {members.map((member) => (
                  <Box
                    key={member.address}
                    style={{
                      padding: '0.75rem 1rem',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <Text 
                      size="2" 
                      style={{ 
                        color: 'rgba(255, 255, 255, 0.9)',
                        fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                        fontSize: '0.8125rem',
                      }}
                    >
                      {formatAddress(member.address)}
                    </Text>
                  </Box>
                ))}
              </Flex>
            )}
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}

