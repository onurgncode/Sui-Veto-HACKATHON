import React, { useRef, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button } from "@radix-ui/themes";
import { ConnectButton } from "@mysten/dapp-kit";

interface LoginScreenProps {
  onLogin: () => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const currentAccount = useCurrentAccount();
  const connectButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hideModals = () => {
      const modals = document.querySelectorAll(
        '[data-radix-portal], [data-testid="wallet-kit-dialog"], [role="dialog"][aria-modal="true"]'
      );
      modals.forEach((modal) => {
        (modal as HTMLElement).style.display = 'none';
        (modal as HTMLElement).style.visibility = 'hidden';
        (modal as HTMLElement).style.opacity = '0';
      });
    };

    const interval = setInterval(hideModals, 100);
    return () => clearInterval(interval);
  }, []);

  const handleConnectWallet = () => {
    if (connectButtonRef.current) {
      const button = connectButtonRef.current.querySelector('button') as HTMLElement;
      if (button) {
        button.click();
      }
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

      <Box
        style={{
          position: 'absolute',
          top: '2rem',
          right: '2rem',
          zIndex: 100,
        }}
      >
        <Box
          onClick={handleConnectWallet}
          style={{
            cursor: 'pointer',
            transition: 'transform 0.2s ease, opacity 0.2s ease',
          }}
          onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.opacity = '0.9';
          }}
          onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.opacity = '1';
          }}
        >
          <img 
            src="/connetc.png" 
            alt="Connect Wallet"
            style={{
              width: '200px',
              height: 'auto',
              pointerEvents: 'none',
            }}
          />
        </Box>
        <Box
          ref={connectButtonRef}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            width: '1px',
            height: '1px',
            overflow: 'hidden',
            zIndex: -1,
          }}
        >
          <ConnectButton />
        </Box>
      </Box>

      <Flex
        direction="column"
        align="center"
        gap="4"
        style={{
          width: '100%',
          maxWidth: '1200px',
          padding: '2rem',
          position: 'relative',
          zIndex: 100,
        }}
      >
        <Flex direction="row" gap="4" style={{ width: '100%', maxWidth: '1000px' }}>
          <Box
            className="liquid-glass-card"
            style={{
              flex: 1,
              padding: '2.5rem',
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            <Heading 
              size="5" 
              mb="4"
              style={{ 
                color: 'white',
                fontWeight: 700,
                fontSize: '1.5rem',
                letterSpacing: '-0.01em',
              }}
            >
              Merkeziyetsiz Topluluk Platformu
            </Heading>
            <Text 
              size="3" 
              style={{ 
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: 1.8,
                fontSize: '1rem',
              }}
            >
              Blockchain teknolojisi ile çalışan, kullanıcıların özgürce topluluklar oluşturabildiği, yönetebildiği ve birbirleriyle etkileşime geçebildiği tamamen merkeziyetsiz bir platform. Tüm veriler blockchain üzerinde güvenli ve şeffaf bir şekilde saklanır.
            </Text>
          </Box>

          <Box
            className="liquid-glass-card"
            style={{
              flex: 1,
              padding: '2.5rem',
              background: 'rgba(255, 255, 255, 0.06)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
          >
            <Heading 
              size="5" 
              mb="4"
              style={{ 
                color: 'white',
                fontWeight: 700,
                fontSize: '1.5rem',
                letterSpacing: '-0.01em',
              }}
            >
              Güvenli ve Şeffaf
            </Heading>
            <Text 
              size="3" 
              style={{ 
                color: 'rgba(255, 255, 255, 0.85)',
                lineHeight: 1.8,
                fontSize: '1rem',
              }}
            >
              Merkezi bir otoriteye bağlı değildir. Kullanıcılar kendi verilerinin tam kontrolüne sahiptir. Smart contract'lar ile güvenli işlemler, değiştirilemez kayıtlar ve tam şeffaflık sağlanır. Topluluklarınızı oluşturun, yönetin ve büyütün.
            </Text>
          </Box>
        </Flex>

        {currentAccount && (
          <Button
            className="liquid-glass-button"
            size="3"
            onClick={onLogin}
            style={{
              width: '100%',
              maxWidth: '480px',
              marginTop: '1rem',
              padding: '0.875rem',
              fontSize: '0.9rem',
              fontWeight: 600,
            }}
          >
            Devam Et →
          </Button>
        )}

        <Text 
          size="1" 
          style={{ 
            color: 'rgba(255, 255, 255, 0.4)',
            textAlign: 'center',
            marginTop: '1.5rem',
            fontWeight: 400,
            fontSize: '0.7rem',
          }}
        >
          Güvenli ve merkeziyetsiz blockchain teknolojisi
        </Text>
      </Flex>
    </Box>
  );
}
