import { useState, useEffect } from "react";
import { useCurrentAccount, useWallets, useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button, TextField } from "@radix-ui/themes";
import { profileService } from "../services/profileService";
import { apiClient } from "../config/api";
import { toB64 } from "@mysten/bcs";
import { fromB64 } from "@mysten/sui/utils";
import { Transaction } from "@mysten/sui/transactions";

interface NicknameScreenProps {
  nickname: string;
  onNicknameSet: (nickname: string) => void;
}

export function NicknameScreen({ nickname, onNicknameSet }: NicknameScreenProps) {
  const [inputNickname, setInputNickname] = useState(nickname);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);
  const currentAccount = useCurrentAccount();
  const wallets = useWallets();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  // Profile kontrolü - Eğer profile varsa bu ekran gösterilmemeli
  useEffect(() => {
    const checkProfile = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token || !currentAccount) {
        setIsLoadingProfile(false);
        return;
      }
      
      // Token varsa, API client'a set et
      apiClient.setToken(token);
      
      // Profile kontrolü yap
      try {
        console.log('[NicknameScreen] Checking for existing profile...');
        const response = await profileService.getProfile(currentAccount.address);
        console.log('[NicknameScreen] Response:', JSON.stringify(response, null, 2));
        
        // Backend response format: { success: true, data: { profile: { id, nickname, owner } } }
        if (response.success && response.data) {
          const profile = response.data.profile;
          console.log('[NicknameScreen] Profile object:', profile);
          
          // Profile objesi varsa (id varsa), profile var demektir
          if (profile && profile.id) {
            const profileNickname = profile.nickname || '';
            console.log('[NicknameScreen] ✅ Profile found! ID:', profile.id, 'Nickname:', profileNickname);
            
            // Profile varsa, onNicknameSet callback'ini çağır (App.tsx explorer'a yönlendirecek)
            if (profileNickname && profileNickname.trim()) {
              console.log('[NicknameScreen] Redirecting to explorer with nickname:', profileNickname);
              onNicknameSet(profileNickname);
              setHasProfile(true);
              setIsLoadingProfile(false);
              return;
            } else {
              console.warn('[NicknameScreen] Profile found but nickname is empty');
            }
          } else {
            console.warn('[NicknameScreen] Profile data exists but no id:', response.data);
          }
        } else {
          if (response.success === false) {
            console.log('[NicknameScreen] Backend returned success: false. Error:', response.error);
          } else {
            console.log('[NicknameScreen] No profile found. Response:', response);
          }
        }
        
        // Profile yok, bu ekranı göster
        console.log('[NicknameScreen] ❌ No profile found, showing nickname screen');
        setIsLoadingProfile(false);
      } catch (error) {
        console.error('[NicknameScreen] Error checking profile:', error);
        // Hata durumunda da ekranı göster
        setIsLoadingProfile(false);
      }
    };

    checkProfile();
  }, [currentAccount, onNicknameSet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputNickname.trim()) {
      setError('Lütfen bir nickname girin');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (!currentAccount?.address) {
        throw new Error('Wallet address not available');
      }

      const packageId = import.meta.env.VITE_PACKAGE_ID || '0x6b30552018493c6daaef95c7a1956aca5adc1528513a7bc0d831cd9b136a8f90';
      
      // Get the connected wallet
      const connectedWallet = wallets.find(w => w.accounts.length > 0);
      if (!connectedWallet || !currentAccount) {
        throw new Error('No connected wallet found');
      }
      
      // Check if this is a ZkLogin wallet (Enoki)
      const isZkLogin = connectedWallet?.name?.toLowerCase().includes('enoki') || 
                        connectedWallet?.name?.toLowerCase().includes('zklogin') ||
                        currentAccount?.label?.toLowerCase().includes('enoki') ||
                        currentAccount?.label?.toLowerCase().includes('zklogin') ||
                        !connectedWallet.features['sui:signTransactionBlock']; // Fallback: if feature not available, assume ZkLogin
      
      console.log('[NicknameScreen] Wallet type:', isZkLogin ? 'ZkLogin' : 'Standard');
      console.log('[NicknameScreen] Wallet name:', connectedWallet?.name);
      console.log('[NicknameScreen] Account label:', currentAccount?.label);
      console.log('[NicknameScreen] Has signTransactionBlock feature:', !!connectedWallet.features['sui:signTransactionBlock']);

      if (isZkLogin) {
        // ZkLogin wallet için: Enoki'nin sponsored transactions API'sini kullan
        // ZkLogin wallet'ları signTransactionBlock desteklemez, bu yüzden Enoki API kullanıyoruz
        console.log('[NicknameScreen] Using ZkLogin flow with Enoki sponsored transactions API');
        
        // Build transaction kind (onlyTransactionKind: true) for Enoki API
        const tx = new Transaction();
        tx.setSender(currentAccount.address);
        tx.moveCall({
          target: `${packageId}::dao_app::create_profile`,
          arguments: [tx.pure.string(inputNickname.trim())],
        });
        
        // Build transaction kind bytes (onlyTransactionKind: true)
        const kindBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });
        const kindBytesBase64 = toB64(kindBytes);
        
        // Try to get JWT token from localStorage (Enoki stores it there)
        let zkLoginJwt: string | undefined;
        try {
          const possibleKeys = [
            'enoki:session:testnet',
            'enoki:session',
            `enoki:session:${currentAccount.address}`,
          ];
          for (const key of possibleKeys) {
            const stored = localStorage.getItem(key);
            if (stored) {
              try {
                const parsed = JSON.parse(stored);
                if (parsed.jwt || parsed.token) {
                  zkLoginJwt = parsed.jwt || parsed.token;
                  console.log('[NicknameScreen] Found JWT token in localStorage:', key);
                  break;
                }
              } catch {
                if (stored.startsWith('eyJ')) {
                  zkLoginJwt = stored;
                  console.log('[NicknameScreen] Found JWT token as direct string:', key);
                  break;
                }
              }
            }
          }
        } catch (jwtError) {
          console.warn('[NicknameScreen] Could not get JWT token:', jwtError);
        }

        // Step 1: Sponsor transaction via Enoki API
        console.log('[NicknameScreen] Step 1: Sponsoring transaction via Enoki API...');
        const sponsorResponse = await profileService.enokiSponsorTransaction(
          kindBytesBase64,
          currentAccount.address,
          zkLoginJwt
        );
        
        if (!sponsorResponse.success || !sponsorResponse.data) {
          throw new Error(sponsorResponse.error || 'Failed to sponsor transaction via Enoki');
        }
        
        const { digest } = sponsorResponse.data;
        console.log('[NicknameScreen] ✅ Transaction sponsored, digest:', digest);

        // Step 2: ZkLogin wallet'ları signTransactionBlock desteklemediği için
        // Enoki'nin otomatik sponsor gas'ını kullanmak için useSignAndExecuteTransaction kullanıyoruz
        // Enoki wallet'ları registerEnokiWallets ile API key ile kayıtlı olduğu için
        // useSignAndExecuteTransaction otomatik olarak Enoki'nin sponsor gas'ını kullanmalı
        console.log('[NicknameScreen] Step 2: Using Enoki automatic sponsor gas via useSignAndExecuteTransaction...');
        
        const newTx = new Transaction();
        newTx.setSender(currentAccount.address);
        newTx.moveCall({
          target: `${packageId}::dao_app::create_profile`,
          arguments: [newTx.pure.string(inputNickname.trim())],
        });
        
        try {
          // useSignAndExecuteTransaction should automatically use Enoki's sponsor gas
          // if the wallet is an Enoki wallet and the contract is in the allow-list
          // Explicitly pass currentAccount to ensure correct account is used
          console.log('[NicknameScreen] Current account address:', currentAccount.address);
          await signAndExecute({
            transaction: newTx,
            account: currentAccount, // Explicitly use currentAccount
          });
          console.log('[NicknameScreen] ✅ Profile created with ZkLogin wallet (Enoki automatic sponsor gas)');
        } catch (error: any) {
          // If "No valid gas coins found" error, it means Enoki's automatic sponsor gas didn't work
          if (error?.message?.includes('No valid gas coins') || error?.message?.includes('gas coins')) {
            throw new Error('ZkLogin wallet does not have gas coins. Enoki automatic sponsor gas is not working. Please check Enoki dashboard settings and ensure the contract is in the allow-list.');
          }
          throw error;
        }
        
              setIsLoading(false);
              
        // Retry logic to check profile on-chain
              let retryCount = 0;
        const maxRetries = 15;
        const retryDelay = 1000;
              
              const checkProfile = async (): Promise<void> => {
                try {
                  const profileResponse = await profileService.getProfile(currentAccount.address);
                  if (profileResponse.success && profileResponse.data) {
                    const profile = (profileResponse.data as any).profile || profileResponse.data;
                    if (profile && profile.id) {
                      const savedNickname = profile?.nickname || inputNickname.trim();
                console.log('[NicknameScreen] Profile found on-chain:', profile);
                      onNicknameSet(savedNickname);
                      return;
                    }
                  }
                  
                  retryCount++;
                  if (retryCount < maxRetries) {
                    setTimeout(checkProfile, retryDelay);
                  } else {
              console.warn('[NicknameScreen] Profile not found after max retries, continuing anyway');
                    onNicknameSet(inputNickname.trim());
                  }
                } catch (error) {
            console.error('[NicknameScreen] Error loading created profile:', error);
                  retryCount++;
                  if (retryCount < maxRetries) {
                    setTimeout(checkProfile, retryDelay);
                  } else {
              console.warn('[NicknameScreen] Max retries reached, continuing anyway');
                    onNicknameSet(inputNickname.trim());
                  }
                }
              };
              
              setTimeout(checkProfile, 1000);
      } else {
        // Standard wallet için: Backend'de build et, frontend'de imzala
        console.log('[NicknameScreen] Using Standard wallet flow with backend build');
        
        const moveCallTarget = `${packageId}::dao_app::create_profile`;
        const moveCallArgs = [
          { type: 'string', value: inputNickname.trim() },
        ];
        
        // Build transaction on backend (avoids CORS issues)
        let builtTx: Uint8Array;
        try {
          const buildResponse = await profileService.buildSponsoredTransaction(
            currentAccount.address,
            moveCallTarget,
            moveCallArgs
          );
          
          if (!buildResponse.success || !buildResponse.data) {
            throw new Error(buildResponse.error || 'Failed to build sponsored transaction');
          }
          
          // Decode base64 transaction block
          builtTx = fromB64(buildResponse.data.transactionBlock);
          console.log('[NicknameScreen] ✅ Transaction built successfully on backend with sponsor gas');
        } catch (buildError: any) {
          console.error('[NicknameScreen] Transaction build error:', buildError);
          setError('Transaction oluşturulamadı. Lütfen tekrar deneyin.');
              setIsLoading(false);
          return;
        }
        
        // Sign the full transaction
        try {
          // Check if signTransactionBlock feature is available
          const signFeature = connectedWallet.features['sui:signTransactionBlock'];
          if (!signFeature) {
            throw new Error('Sign transaction feature not available');
          }
          
          // Sign the transaction
          const account = currentAccount; // TypeScript narrowing
          const signResult = await signFeature.signTransactionBlock({
            transactionBlock: builtTx as any,
            account: account,
            chain: (account.chains && account.chains[0]) || 'sui:testnet',
          });
          const signature = signResult.signature;
          
          // Send to backend for sponsor gas execution
          const sponsorResult = await profileService.sponsorCreateProfile(
            inputNickname.trim(),
            toB64(builtTx),
            signature
          );
          
          if (!sponsorResult.success) {
            throw new Error(sponsorResult.error || 'Sponsor gas failed');
          }
          
          console.log('[NicknameScreen] Profile created with sponsored gas:', sponsorResult.data);
          setIsLoading(false);
          
          // Retry logic to check profile on-chain
          let retryCount = 0;
          const maxRetries = 15;
          const retryDelay = 1000;
          
          const checkProfile = async (): Promise<void> => {
            try {
              const profileResponse = await profileService.getProfile(currentAccount.address);
              if (profileResponse.success && profileResponse.data) {
                const profile = (profileResponse.data as any).profile || profileResponse.data;
                if (profile && profile.id) {
                  const savedNickname = profile?.nickname || inputNickname.trim();
                  console.log('[NicknameScreen] Profile found on-chain:', profile);
                  onNicknameSet(savedNickname);
                  return;
                }
              }
              
              retryCount++;
              if (retryCount < maxRetries) {
                setTimeout(checkProfile, retryDelay);
              } else {
                console.warn('[NicknameScreen] Profile not found after max retries, continuing anyway');
                onNicknameSet(inputNickname.trim());
              }
            } catch (error) {
              console.error('[NicknameScreen] Error loading created profile:', error);
              retryCount++;
              if (retryCount < maxRetries) {
                setTimeout(checkProfile, retryDelay);
      } else {
                console.warn('[NicknameScreen] Max retries reached, continuing anyway');
        onNicknameSet(inputNickname.trim());
              }
            }
          };
          
          setTimeout(checkProfile, 1000);
        } catch (error: any) {
          console.error('[NicknameScreen] Error signing or executing transaction:', error);
          setError(error?.message || 'Transaction başarısız oldu. Lütfen tekrar deneyin.');
        setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
      setIsLoading(false);
    }
  };

  return (
    <Box
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        zIndex: 1,
        transform: 'translate3d(0, 0, 0)',
        WebkitTransform: 'translate3d(0, 0, 0)',
        backfaceVisibility: 'hidden',
        WebkitBackfaceVisibility: 'hidden',
        willChange: 'transform',
      } as React.CSSProperties}
    >
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
          opacity: 0.6,
          transform: 'translate3d(0, 0, 0)',
          WebkitTransform: 'translate3d(0, 0, 0)',
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          perspective: 1000,
          WebkitPerspective: 1000,
          willChange: 'transform',
        } as React.CSSProperties}
      >
        <source src="/background-video.mp4" type="video/mp4" />
      </video>

      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1,
        }}
      />

      <Flex
        direction="column"
        align="center"
        justify="center"
        style={{ 
          minHeight: '100vh',
          width: '100%',
          position: 'relative',
          zIndex: 100,
          padding: '2rem',
        }}
        gap="6"
      >
        <Box
          className="liquid-glass-card"
          style={{
            padding: '4rem 3.5rem',
            maxWidth: '520px',
            width: '90%',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
          }}
        >
          <Flex direction="column" gap="6" align="center">
            <Box style={{ textAlign: 'center' }}>
              <Heading 
                size="8" 
                align="center" 
                mb="3"
                style={{ 
                  color: 'white',
                  fontWeight: 700,
                  letterSpacing: '-0.02em',
                  fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                }}
              >
                Nickname Belirle
              </Heading>
              <Text 
                size="3" 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 400,
                  letterSpacing: '0.01em',
                }}
              >
                Toplulukta görünecek isminizi girin
              </Text>
            </Box>

            {isLoadingProfile ? (
              <Text 
                size="3" 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  textAlign: 'center',
                }}
              >
                Profil kontrol ediliyor...
              </Text>
            ) : hasProfile ? (
              <Text 
                size="3" 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  textAlign: 'center',
                }}
              >
                Profil bulundu, yönlendiriliyor...
              </Text>
            ) : (
              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <Flex direction="column" gap="5">
                  <Box>
                    <Text 
                      size="2" 
                      weight="bold" 
                      mb="3" 
                      style={{ 
                        display: 'block',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      }}
                    >
                      Nickname
                    </Text>
                    <TextField.Root
                      className="liquid-glass-input"
                      size="3"
                      placeholder="örn: nadolink"
                      value={inputNickname}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputNickname(e.target.value)}
                      style={{ 
                        width: '100%',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontSize: '1rem',
                        padding: '0.875rem 1rem',
                        minHeight: '48px',
                      }}
                      required
                    />
                    <Text 
                      size="1" 
                      style={{ 
                        color: 'rgba(255, 255, 255, 0.6)',
                        marginTop: '0.5rem',
                        display: 'block',
                        fontSize: '0.8rem',
                      }}
                    >
                      Bu isim toplulukta görünecek
                    </Text>
                    {error && (
                      <Text 
                        size="2" 
                        style={{ 
                          color: 'rgba(255, 100, 100, 0.9)',
                          marginTop: '0.5rem',
                          display: 'block',
                          fontSize: '0.85rem',
                        }}
                      >
                        {error}
                      </Text>
                    )}
                  </Box>

                  <Button
                    className="liquid-glass-button"
                    size="4"
                    type="submit"
                    disabled={!inputNickname.trim() || isLoading}
                    style={{
                      width: '100%',
                      padding: '1rem',
                      fontSize: '1rem',
                      fontWeight: 600,
                      background: isLoading 
                        ? 'rgba(255, 255, 255, 0.3)' 
                        : 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)',
                      color: '#000000',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                      cursor: isLoading ? 'wait' : 'pointer',
                    }}
                    >
                      {isLoading ? 'Yükleniyor...' : 'Oluştur →'}
                    </Button>
                </Flex>
              </form>
            )}
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
}
