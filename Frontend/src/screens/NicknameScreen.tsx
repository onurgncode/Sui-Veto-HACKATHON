import { useState, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button, TextField } from "@radix-ui/themes";
import { profileService } from "../services/profileService";
import { apiClient } from "../config/api";
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
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

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
      if (currentAccount) {
        // PACKAGE_ID'yi environment variable'dan al veya default değer kullan
        const packageId = import.meta.env.VITE_PACKAGE_ID || '0x115bbd92212fbab8f1408a5d12e697a410fae1dafc171a61bfe5ded4554a1f45';
        
        // Frontend'de transaction'ı direkt oluştur
        const tx = new Transaction();
        tx.moveCall({
          target: `${packageId}::dao_app::create_profile`,
          arguments: [tx.pure.string(inputNickname.trim())],
        });
        
        signAndExecute(
          {
            transaction: tx,
          },
          {
            onSuccess: async (result) => {
              console.log('Profile created successfully:', result);
              setIsLoading(false);
              
              // Transaction başarılı olduktan sonra, on-chain'den profile'ı yükle
              // Retry mekanizması ile profile'ın on-chain'de görünmesini bekliyoruz
              let retryCount = 0;
              const maxRetries = 15; // 15 saniye kadar bekle
              const retryDelay = 1000; // 1 saniye
              
              const checkProfile = async (): Promise<void> => {
                try {
                  const profileResponse = await profileService.getProfile(currentAccount.address);
                  if (profileResponse.success && profileResponse.data) {
                    const profile = (profileResponse.data as any).profile || profileResponse.data;
                    // Profile objesi varsa (id varsa), profile bulundu demektir
                    if (profile && profile.id) {
                      // Profile objesi bulundu, nickname'i set et ve explorer'a geç
                      const savedNickname = profile?.nickname || inputNickname.trim();
                      console.log('Profile found on-chain:', profile);
                      onNicknameSet(savedNickname);
                      return;
                    }
                  }
                  
                  // Profile henüz görünmüyor, tekrar dene
                  retryCount++;
                  console.log(`Profile not found yet, retry ${retryCount}/${maxRetries}`);
                  if (retryCount < maxRetries) {
                    setTimeout(checkProfile, retryDelay);
                  } else {
                    // Max retry'ye ulaşıldı, yine de devam et (transaction başarılı oldu)
                    console.warn('Profile not found after max retries, continuing anyway');
                    onNicknameSet(inputNickname.trim());
                  }
                } catch (error) {
                  console.error('Error loading created profile:', error);
                  retryCount++;
                  if (retryCount < maxRetries) {
                    setTimeout(checkProfile, retryDelay);
                  } else {
                    // Max retry'ye ulaşıldı, yine de devam et
                    console.warn('Max retries reached, continuing anyway');
                    onNicknameSet(inputNickname.trim());
                  }
                }
              };
              
              // İlk kontrolü 1 saniye sonra başlat (transaction'ın onaylanması için)
              setTimeout(checkProfile, 1000);
            },
            onError: (error) => {
              console.error('Transaction execution failed:', error);
              setError('Transaction başarısız oldu. Lütfen tekrar deneyin.');
              setIsLoading(false);
            },
          }
        );
      } else {
        onNicknameSet(inputNickname.trim());
        setIsLoading(false);
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
