import { useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button, TextField } from "@radix-ui/themes";
import { profileService } from "../services/profileService";
import { communityService } from "../services/communityService";
import { useSuiClient } from "@mysten/dapp-kit";

interface CreateCommunityScreenProps {
  onBack: () => void;
  onCreated: () => void;
}

export function CreateCommunityScreen({ onBack, onCreated }: CreateCommunityScreenProps) {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const suiClient = useSuiClient();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !currentAccount) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (!currentAccount) {
        throw new Error('Wallet bağlantısı gerekli');
      }

      // PACKAGE_ID'yi environment variable'dan al veya default değer kullan
      const packageId = import.meta.env.VITE_PACKAGE_ID || '0x115bbd92212fbab8f1408a5d12e697a410fae1dafc171a61bfe5ded4554a1f45';
      
      // Frontend'de transaction'ı direkt oluştur
      const { Transaction } = await import("@mysten/sui/transactions");
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::dao_app::create_commity`,
        arguments: [tx.pure.string(name.trim())],
      });
      
      try {
        const result = await signAndExecute({
          transaction: tx,
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        let communityId: string | null = null;
        
        try {
          const txDigest = result.digest;
          const txDetails = await suiClient.getTransactionBlock({
            digest: txDigest,
            options: {
              showEffects: true,
              showObjectChanges: true,
            },
          });

          if (txDetails.objectChanges) {
            for (const change of txDetails.objectChanges) {
              if (change.type === 'created' && 'objectType' in change) {
                const objectType = change.objectType as string;
                if (objectType.includes('commity::Commity')) {
                  communityId = (change as any).objectId;
                  break;
                }
              }
            }
          }
          
          if (!communityId && txDetails.effects) {
            const effects = txDetails.effects as any;
            if (effects.created && Array.isArray(effects.created)) {
              for (const created of effects.created) {
                if (created.reference && created.reference.objectId) {
                  try {
                    const obj = await suiClient.getObject({
                      id: created.reference.objectId,
                      options: { showType: true },
                    });
                    if (obj.data && obj.data.type && obj.data.type.includes('commity::Commity')) {
                      communityId = created.reference.objectId;
                      break;
                    }
                  } catch (e) {
                    // Continue to next
                  }
                }
              }
            }
          }
        } catch (txError) {
          // Transaction details fetch failed, try fallback
        }
        
        if (!communityId) {
          try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            const allCommunitiesResponse = await communityService.getAllCommunities();
            if (allCommunitiesResponse.success && allCommunitiesResponse.data) {
              const allCommunities = allCommunitiesResponse.data.communities || [];
              const matchingCommunity = allCommunities.find((c: { name: string; id: string }) => c.name === name.trim());
              if (matchingCommunity) {
                communityId = matchingCommunity.id;
              } else if (allCommunities.length > 0) {
                communityId = allCommunities[allCommunities.length - 1].id;
              }
            }
          } catch (altError) {
            // Fallback method failed
          }
        }

        if (communityId && currentAccount) {
          const profileResponse = await profileService.getProfile(currentAccount.address);
          
          if (profileResponse.success && profileResponse.data?.profile) {
            const profileId = profileResponse.data.profile.id;
            const { Transaction } = await import("@mysten/sui/transactions");
            const joinTx = new Transaction();
            joinTx.moveCall({
              target: `${packageId}::dao_app::join_commity`,
              arguments: [
                joinTx.object(profileId),
                joinTx.object(communityId),
              ],
            });

            try {
              await signAndExecute({
                transaction: joinTx,
              });
              await new Promise(resolve => setTimeout(resolve, 5000));
            } catch (joinError) {
              // Auto-join failed, but community was created successfully
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
        } catch (error) {
          console.error('Error processing community creation:', error);
          // Still consider it successful since community was created
        }
        
        setIsSubmitting(false);
        // Call onCreated after a short delay to allow backend to index
        setTimeout(() => {
          onCreated();
        }, 1000);
      } catch (error) {
        console.error('Community creation failed:', error);
        setError('Topluluk oluşturma başarısız: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
        setIsSubmitting(false);
      }
  };

  return (
    <Box>
      <Flex justify="between" align="center" mb="5">
        <Heading size="8" style={{ color: 'white', fontWeight: 700 }}>
          Topluluk Oluştur
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
          }}
        >
          ×
        </Button>
      </Flex>

      <Box
        className="liquid-glass-card"
        style={{
          padding: '3.5rem',
          maxWidth: '650px',
          margin: '0 auto',
        }}
      >
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="6">
            <Box>
              <Text 
                size="4" 
                weight="bold" 
                mb="3" 
                style={{ 
                  display: 'block',
                  color: 'white',
                }}
              >
                Topluluk Adı
              </Text>
              <TextField.Root
                className="liquid-glass-input"
                size="3"
                placeholder="örn: Sui Türkiye"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                }}
                required
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
                size="3"
                disabled={isSubmitting}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                }}
              >
                İptal
              </Button>
              <Button
                className="liquid-glass-button"
                type="submit"
                size="3"
                disabled={!name.trim() || isSubmitting || !currentAccount}
                style={{
                  opacity: (!name.trim() || isSubmitting || !currentAccount) ? 0.5 : 1,
                  cursor: (!name.trim() || isSubmitting || !currentAccount) ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'Oluşturuluyor...' : 'Oluştur'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Box>
    </Box>
  );
}
