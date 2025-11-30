import { useState, useEffect } from "react";
import { useCurrentAccount, useWallets } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button, TextField } from "@radix-ui/themes";
import { proposalService } from "../services/proposalService";
import { profileService } from "../services/profileService";
import { communityService } from "../services/communityService";
import { formatAddress } from "../utils/formatters";
import { toB64 } from "@mysten/bcs";
import { fromB64 } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";

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
  const wallets = useWallets();
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
      const packageId = import.meta.env.VITE_PACKAGE_ID || '0x6b30552018493c6daaef95c7a1956aca5adc1528513a7bc0d831cd9b136a8f90';
      
      // Create a join request proposal
      // Title: "Join Request from {address}"
      // Description: User's message or default
      const title = `Katılma İsteği: ${formatAddress(currentAccount.address)}`;
      const description = message.trim() || `${formatAddress(currentAccount.address)} bu topluluğa katılmak istiyor.`;
      
      // Deadline: 7 days from now (in milliseconds, as contract expects)
      const deadline = Date.now() + (7 * 24 * 60 * 60 * 1000);
      // Quorum: 50% of members (we'll use a default for now)
      const quorumThreshold = 50;

      // We need message_id - for now, we'll use a placeholder or generate one
      // In a real implementation, this would come from a messaging system
      // For now, we'll use the community ID as a placeholder
      const messageId = communityId; // Placeholder - should be from messaging system

      // Get connected wallet for signing
      const connectedWallet = wallets.find(w => w.accounts.length > 0);
      if (!connectedWallet || !currentAccount) {
        throw new Error('No connected wallet found');
      }

      // Check if signTransactionBlock feature is available
      const signFeature = connectedWallet.features['sui:signTransactionBlock'];
      if (!signFeature) {
        throw new Error('Sign transaction feature not available');
      }

      // Build transaction on backend with sponsor gas
      const moveCallTarget = `${packageId}::dao_app::create_proposal`;
      const moveCallArgs = [
        { type: 'object', value: communityId },
        { type: 'id', value: messageId },
        { type: 'string', value: title },
        { type: 'string', value: description },
        { type: 'u64', value: deadline },
        { type: 'u64', value: quorumThreshold },
        { type: 'bool', value: true }, // is_join_request = true for join requests
      ];

      // Build transaction on backend (avoids CORS issues)
      let builtTx: Uint8Array;
      try {
        const buildResponse = await proposalService.buildSponsoredCreateProposal(
          currentAccount.address,
          moveCallTarget,
          moveCallArgs
        );
        
        if (!buildResponse.success || !buildResponse.data) {
          throw new Error(buildResponse.error || 'Failed to build sponsored transaction');
        }
        
        // Decode base64 transaction block
        builtTx = fromB64(buildResponse.data.transactionBlock);
        console.log('[JoinRequestScreen] ✅ Transaction built successfully on backend with sponsor gas');
      } catch (buildError: any) {
        console.error('[JoinRequestScreen] Transaction build error:', buildError);
        setError('Transaction oluşturulamadı. Lütfen tekrar deneyin.');
        setIsSubmitting(false);
        return;
      }

      // Sign the full transaction
      try {
        // Sign the transaction
        const account = currentAccount;
        const signResult = await signFeature.signTransactionBlock({
          transactionBlock: builtTx as any,
          account: account,
          chain: (account.chains && account.chains[0]) || 'sui:testnet',
        });
        const signature = signResult.signature;
        
        // Send to backend for sponsor gas execution
        const sponsorResult = await proposalService.sponsorCreateProposal(
          toB64(builtTx),
          signature
        );
        
        if (!sponsorResult.success) {
          throw new Error(sponsorResult.error || 'Sponsor gas failed');
        }
        
        console.log('[JoinRequestScreen] Join request created with sponsored gas:', sponsorResult.data);
        setIsSubmitting(false);
        onRequestSent();
      } catch (error: any) {
        console.error('[JoinRequestScreen] Error signing or executing transaction:', error);
        setError(error?.message || 'Transaction başarısız oldu. Lütfen tekrar deneyin.');
        setIsSubmitting(false);
      }
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

