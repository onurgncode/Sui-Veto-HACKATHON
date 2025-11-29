import { useState, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button, TextField } from "@radix-ui/themes";
import { proposalService } from "../services/proposalService";
import { profileService } from "../services/profileService";
import { communityService } from "../services/communityService";
import { formatAddress } from "../utils/formatters";

interface JoinRequestScreenProps {
  communityId: string;
  onBack: () => void;
  onRequestSent: () => void;
}

export function JoinRequestScreen({ 
  communityId, 
  onBack, 
  onRequestSent 
}: JoinRequestScreenProps) {
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [community, setCommunity] = useState<{ id: string; name: string } | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load community info
        const communityResponse = await communityService.getCommunity(communityId);
        if (communityResponse.success && communityResponse.data) {
          setCommunity(communityResponse.data.community);
        }

        // Load profile ID
        if (currentAccount) {
          const profileResponse = await profileService.getProfile(currentAccount.address);
          if (profileResponse.success && profileResponse.data) {
            setProfileId(profileResponse.data.profile.id);
          }
        }
      } catch (error) {
        console.error('Failed to load data:', error);
        setError('Veri yüklenemedi');
      } finally {
        setIsLoading(false);
      }
    };

    if (communityId && currentAccount) {
      loadData();
    }
  }, [communityId, currentAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAccount || !profileId || !community) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const packageId = import.meta.env.VITE_PACKAGE_ID || '0x115bbd92212fbab8f1408a5d12e697a410fae1dafc171a61bfe5ded4554a1f45';
      
      // Create a join request proposal
      // Title: "Join Request from {address}"
      // Description: User's message or default
      const title = `Katılma İsteği: ${formatAddress(currentAccount.address)}`;
      const description = message.trim() || `${formatAddress(currentAccount.address)} bu topluluğa katılmak istiyor.`;
      
      // Deadline: 7 days from now
      const deadline = Date.now() + (7 * 24 * 60 * 60 * 1000);
      // Quorum: 50% of members (we'll use a default for now)
      const quorumThreshold = 50;

      // Create proposal transaction
      const { Transaction } = await import("@mysten/sui/transactions");
      const tx = new Transaction();
      
      // We need message_id - for now, we'll use a placeholder or generate one
      // In a real implementation, this would come from a messaging system
      // For now, we'll use the community ID as a placeholder
      const messageId = communityId; // Placeholder - should be from messaging system
      
      tx.moveCall({
        target: `${packageId}::dao_app::create_proposal`,
        arguments: [
          tx.object(communityId),
          tx.pure.id(messageId),
          tx.pure.string(title),
          tx.pure.string(description),
          tx.pure.u64(deadline),
          tx.pure.u64(quorumThreshold),
        ],
      });

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            console.log('Join request sent successfully');
            setIsSubmitting(false);
            onRequestSent();
          },
          onError: (error) => {
            console.error('Join request failed:', error);
            setError('Katılma isteği gönderilemedi: ' + (error.message || 'Bilinmeyen hata'));
            setIsSubmitting(false);
          },
        }
      );
    } catch (error) {
      console.error('Join request error:', error);
      setError('Katılma isteği hatası: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
      setIsSubmitting(false);
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
          }}
        >
          ×
        </Button>
      </Box>
    );
  }

  return (
    <Box style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <Flex justify="between" align="center" mb="6">
        <Heading 
          size="8" 
          style={{ 
            color: 'rgba(255, 255, 255, 0.95)', 
            fontWeight: 700,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          }}
        >
          Katılma İsteği
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
        <Text 
          size="4" 
          mb="4"
          style={{ 
            color: 'rgba(255, 255, 255, 0.9)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            fontWeight: 600,
          }}
        >
          {community.name}
        </Text>
        <Text 
          size="3" 
          mb="6"
          style={{ 
            color: 'rgba(255, 255, 255, 0.7)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          }}
        >
          Bu topluluğa katılmak için bir istek gönderin. Topluluk üyeleri oylama yaparak isteğinizi değerlendirecek.
        </Text>
      </Box>

      <Box
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '2rem',
        }}
      >
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="5">
            <Box>
              <Text 
                size="3" 
                weight="bold" 
                mb="2" 
                style={{ 
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                }}
              >
                Mesaj (Opsiyonel)
              </Text>
              <textarea
                placeholder="Topluluk üyelerine iletmek istediğiniz mesaj..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontSize: '1rem',
                  resize: 'vertical',
                }}
              />
            </Box>

            {error && (
              <Box
                style={{
                  padding: '1rem',
                  background: 'rgba(244, 67, 54, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                }}
              >
                <Text 
                  size="3" 
                  style={{ 
                    color: 'rgba(244, 67, 54, 0.9)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  }}
                >
                  {error}
                </Text>
              </Box>
            )}

            <Flex gap="3" justify="end" mt="2">
              <Button
                type="button"
                variant="soft"
                onClick={onBack}
                disabled={isSubmitting}
                size="3"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '12px',
                  padding: '0.75rem 1.5rem',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                }}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !currentAccount || !profileId}
                size="3"
                style={{
                  background: isSubmitting
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(236, 72, 153, 0.9) 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.75rem 2rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: (isSubmitting || !currentAccount || !profileId) ? 0.5 : 1,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                }}
              >
                {isSubmitting ? 'Gönderiliyor...' : 'İstek Gönder'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Box>
    </Box>
  );
}

