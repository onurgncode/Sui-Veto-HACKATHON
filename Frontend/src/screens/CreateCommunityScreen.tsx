import { useState } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button, TextField } from "@radix-ui/themes";
import { profileService } from "../services/profileService";
import { communityService } from "../services/communityService";
import { messagingService } from "../services/messagingService";

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
      const packageId = import.meta.env.VITE_PACKAGE_ID || '0x6b30552018493c6daaef95c7a1956aca5adc1528513a7bc0d831cd9b136a8f90';
      
      // Get profile ID first
      const profileResponse = await profileService.getProfile(currentAccount.address);
      if (!profileResponse.success || !profileResponse.data?.profile) {
        throw new Error('Profil bulunamadı. Lütfen önce profil oluşturun.');
      }
      const profileId = profileResponse.data.profile.id;

      // Frontend'de transaction'ı direkt oluştur
      const { Transaction } = await import("@mysten/sui/transactions");
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::dao_app::create_commity`,
        arguments: [tx.pure.string(name.trim())],
      });
      
      try {
        // First transaction: Create community
        const createResult = await signAndExecute({
          transaction: tx,
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get community ID from transaction result
        let communityId: string | null = null;
        
        try {
          const txDigest = createResult.digest;
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
          console.error('Error fetching transaction details:', txError);
        }
        
        // Fallback: Get community ID from API
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
                // Get the most recently created one (last in list)
                communityId = allCommunities[allCommunities.length - 1].id;
              }
            }
          } catch (altError) {
            console.error('Fallback method failed:', altError);
          }
        }

        // Second transaction: Join community (creator must be a member to vote)
        if (communityId) {
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
            console.log('[CreateCommunity] Creator successfully joined the community');
            
            // Wait for transaction to be indexed and verify membership
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Step 3: Create messaging channel for the community
            try {
              console.log('[CreateCommunity] Creating messaging channel for community:', communityId);
              
              // Initialize messaging service
              await messagingService.initialize(suiClient);
              
              // Get all current members (just the creator for now)
              const currentMembers = [currentAccount.address];
              
              // Create channel with creator as initial member
              // The channel will be automatically found/created when other members join
              const createChannelFlow = messagingService.getClient().createChannelFlow({
                creatorAddress: currentAccount.address,
                initialMemberAddresses: currentMembers,
              });

              // Build and execute channel creation transaction
              const channelTx = createChannelFlow.build();
              channelTx.setSender(currentAccount.address);

              const channelResult = await signAndExecute({
                transaction: channelTx,
              });

              // Wait for transaction to be indexed
              await new Promise(resolve => setTimeout(resolve, 2000));

              // Get generated caps
              const { creatorMemberCap } = await createChannelFlow.getGeneratedCaps({
                digest: channelResult.digest,
              });

              // Generate and attach encryption key
              const { transaction: encryptionTx } = await createChannelFlow.generateAndAttachEncryptionKey({
                creatorMemberCap,
              });
              encryptionTx.setSender(currentAccount.address);

              // Execute encryption key transaction
              await signAndExecute({
                transaction: encryptionTx,
              });

              // Wait for encryption transaction to be indexed
              await new Promise(resolve => setTimeout(resolve, 2000));

              // Get the channel ID
              const { channelId } = createChannelFlow.getGeneratedEncryptionKey();
              
              console.log('[CreateCommunity] Messaging channel created:', channelId);
            } catch (channelError) {
              // Don't fail community creation if channel creation fails
              console.error('[CreateCommunity] Failed to create messaging channel:', channelError);
              console.warn('[CreateCommunity] Community created but channel creation failed. Channel will be created when first accessed.');
            }
            
            // Verify membership directly from chain
            let membershipVerified = false;
            let retryCount = 0;
            const maxRetries = 5;
            
            while (!membershipVerified && retryCount < maxRetries) {
              try {
                const dynamicFields = await suiClient.getDynamicFields({
                  parentId: communityId,
                });
                
                const normalizedAddress = currentAccount.address.toLowerCase();
                membershipVerified = dynamicFields.data.some((field) => {
                  if (field.name.type === 'address') {
                    return (field.name.value as string).toLowerCase() === normalizedAddress;
                  }
                  return false;
                });
                
                if (membershipVerified) {
                  console.log('[CreateCommunity] Membership verified from chain');
                  break;
                }
              } catch (verifyError) {
                console.warn(`[CreateCommunity] Membership verification attempt ${retryCount + 1} failed:`, verifyError);
              }
              
              retryCount++;
              if (!membershipVerified && retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
            
            if (!membershipVerified) {
              console.warn('[CreateCommunity] Membership could not be verified, but join transaction succeeded');
            }

            // Step 3: Create messaging channel for the community
            try {
              console.log('[CreateCommunity] Creating messaging channel for community:', communityId);
              
              // Initialize messaging service
              await messagingService.initialize(suiClient);
              
              // Get all current members (just the creator for now)
              const currentMembers = [currentAccount.address];
              
              // Create channel with creator as initial member
              // The channel will be automatically found/created when other members join
              const createChannelFlow = messagingService.getClient().createChannelFlow({
                creatorAddress: currentAccount.address,
                initialMemberAddresses: currentMembers,
              });

              // Build and execute channel creation transaction
              const channelTx = createChannelFlow.build();
              channelTx.setSender(currentAccount.address);

              const channelResult = await signAndExecute({
                transaction: channelTx,
              });

              // Wait for transaction to be indexed
              await new Promise(resolve => setTimeout(resolve, 2000));

              // Get generated caps
              const { creatorMemberCap } = await createChannelFlow.getGeneratedCaps({
                digest: channelResult.digest,
              });

              // Generate and attach encryption key
              const { transaction: encryptionTx } = await createChannelFlow.generateAndAttachEncryptionKey({
                creatorMemberCap,
              });
              encryptionTx.setSender(currentAccount.address);

              // Execute encryption key transaction
              await signAndExecute({
                transaction: encryptionTx,
              });

              // Wait for encryption transaction to be indexed
              await new Promise(resolve => setTimeout(resolve, 2000));

              // Get the channel ID
              const { channelId } = createChannelFlow.getGeneratedEncryptionKey();
              
              console.log('[CreateCommunity] Messaging channel created:', channelId);
            } catch (channelError) {
              // Don't fail community creation if channel creation fails
              console.error('[CreateCommunity] Failed to create messaging channel:', channelError);
              console.warn('[CreateCommunity] Community created but channel creation failed. Channel will be created when first accessed.');
            }
          } catch (joinError) {
            console.error('[CreateCommunity] Auto-join failed:', joinError);
            const errorMsg = joinError instanceof Error ? joinError.message : 'Bilinmeyen hata';
            // This is critical - if join fails, creator won't be able to vote
            throw new Error(`Topluluk oluşturuldu ancak otomatik üyelik başarısız oldu: ${errorMsg}. Lütfen manuel olarak topluluğa katılın.`);
          }
        } else {
          console.warn('[CreateCommunity] Community ID not found, cannot auto-join');
          throw new Error('Topluluk oluşturuldu ancak topluluk ID bulunamadı. Lütfen sayfayı yenileyin ve manuel olarak topluluğa katılın.');
        }
        } catch (error) {
          console.error('Error processing community creation:', error);
          throw error;
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
