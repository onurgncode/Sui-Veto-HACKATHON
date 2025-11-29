import { useState } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button, TextField } from "@radix-ui/themes";
import { profileService } from "../services/profileService";

interface NicknameScreenProps {
  nickname: string;
  onNicknameSet: (nickname: string) => void;
}

export function NicknameScreen({ nickname, onNicknameSet }: NicknameScreenProps) {
  const [inputNickname, setInputNickname] = useState(nickname);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentAccount = useCurrentAccount();

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
        const response = await profileService.createProfile(inputNickname.trim());
        if (response.success) {
          onNicknameSet(inputNickname.trim());
        } else {
          setError(response.error || 'Profil oluşturulamadı');
          console.error('Profile creation failed:', response.error);
        }
      } else {
        onNicknameSet(inputNickname.trim());
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
      setError('Bağlantı hatası. Devam ediliyor...');
      setTimeout(() => {
        onNicknameSet(inputNickname.trim());
      }, 1000);
    } finally {
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
                  {isLoading ? 'Yükleniyor...' : 'Devam Et →'}
                </Button>
              </Flex>
            </form>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
}
