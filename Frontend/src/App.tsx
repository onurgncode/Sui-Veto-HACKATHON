import { useState, useEffect } from "react";
import React from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading, Text, DropdownMenu } from "@radix-ui/themes";
import { LoginScreen } from "./screens/LoginScreen";
import { NicknameScreen } from "./screens/NicknameScreen";
import { ExplorerScreen } from "./screens/ExplorerScreen";
import { MyCommunityScreen } from "./screens/MyCommunityScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { CreateCommunityScreen } from "./screens/CreateCommunityScreen";

type Screen = 'login' | 'nickname' | 'explorer' | 'my-community' | 'profile' | 'create-community';

function App() {
  const currentAccount = useCurrentAccount();
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [nickname, setNickname] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'explorer' | 'my-community' | 'profile'>('explorer');
  const [showDisconnectMenu, setShowDisconnectMenu] = useState(false);

  const handleDisconnect = () => {
    setShowDisconnectMenu(false);
    setNickname('');
    
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('sui-dapp-kit:wallet-connection-info');
      localStorage.removeItem('sui-dapp-kit:last-wallet-name');
      localStorage.removeItem('sui-dapp-kit:last-wallet-account');
      localStorage.removeItem('auth_token');
    }
    
    setCurrentScreen('login');
  };

  React.useEffect(() => {
    if (!currentAccount && currentScreen !== 'login') {
      setCurrentScreen('login');
      setNickname('');
    } else if (currentAccount && currentScreen === 'login') {
      const timer = setTimeout(() => {
        setCurrentScreen('nickname');
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [currentAccount, currentScreen]);

  const handleScreenChange = (screen: Screen) => {
    if (screen === currentScreen) return;
    
    if (screen === 'explorer' && currentScreen === 'nickname') {
      setCurrentScreen(screen);
      setSelectedTab('explorer');
    } else {
      setTimeout(() => {
        setCurrentScreen(screen);
        if (screen === 'explorer') {
          setSelectedTab('explorer');
        }
      }, 300);
    }
  };

  const handleTabChange = (tab: 'explorer' | 'my-community' | 'profile') => {
    setSelectedTab(tab);
    if (tab === 'my-community') {
      setCurrentScreen('my-community');
    } else if (tab === 'profile') {
      setCurrentScreen('profile');
    } else {
      setCurrentScreen('explorer');
    }
  };

  useEffect(() => {
    const hideModals = () => {
      const modals = document.querySelectorAll(
        '[data-radix-portal]:has([data-testid*="wallet"]), [data-testid="wallet-kit-dialog"], [role="dialog"][aria-modal="true"]:has([data-testid*="wallet"])'
      );
      modals.forEach((modal) => {
        (modal as HTMLElement).style.display = 'none';
        (modal as HTMLElement).style.visibility = 'hidden';
        (modal as HTMLElement).style.opacity = '0';
        (modal as HTMLElement).style.pointerEvents = 'none';
      });
    };

    const interval = setInterval(hideModals, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box className="liquid-glass-bg" style={{ minHeight: '100vh' }}>
      {currentScreen !== 'login' && (
        <Flex
          className="liquid-glass-header"
          position="sticky"
          top="0"
          px="5"
          py="4"
          justify="between"
          align="center"
          style={{
            zIndex: 1000,
          }}
        >
        <Flex align="center" gap="3">
          <Heading 
            size="7" 
            style={{ 
              color: 'white', 
              fontWeight: 800, 
              letterSpacing: '-0.02em',
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Merkeziyetsiz Community
          </Heading>
        </Flex>

        <Flex gap="3" align="center">
          {currentAccount && (
            <DropdownMenu.Root open={showDisconnectMenu} onOpenChange={setShowDisconnectMenu}>
              <DropdownMenu.Trigger>
                <Box
                  style={{
                    padding: '0.75rem 1.25rem',
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(15px)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    minWidth: '160px',
                    textAlign: 'right',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
                  }}
                  onMouseLeave={(e) => {
                    if (!showDisconnectMenu) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
                    }
                  }}
                >
                  <Text 
                    size="2" 
                    style={{ 
                      color: 'rgba(255, 255, 255, 0.95)', 
                      fontFamily: currentAccount.label ? 'inherit' : 'monospace',
                      fontSize: currentAccount.label ? '0.95rem' : '0.85rem',
                      fontWeight: 600,
                      letterSpacing: currentAccount.label ? '0.01em' : '0',
                    }}
                  >
                    {currentAccount.label || `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`}
                  </Text>
                </Box>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                style={{
                  background: 'rgba(0, 0, 0, 0.9)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '12px',
                  padding: '0.5rem',
                  minWidth: '180px',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                }}
              >
                <DropdownMenu.Item
                  style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                  onSelect={handleDisconnect}
                >
                  <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Çıkış Yap
                  </Text>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          )}
        </Flex>
      </Flex>
      )}

          <Container size="4" py="6" style={{ position: 'relative', zIndex: 1, minHeight: 'calc(100vh - 100px)' }}>
            {currentScreen === 'login' && (
              <Box
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  opacity: 1,
                  transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  pointerEvents: 'auto',
                  zIndex: 10,
                }}
              >
                <LoginScreen onLogin={() => handleScreenChange('nickname')} />
              </Box>
            )}

            {currentScreen === 'nickname' && (
              <Box
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  width: '100vw',
                  height: '100vh',
                  opacity: 1,
                  transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  pointerEvents: 'auto',
                  zIndex: 10,
                }}
              >
                <NicknameScreen
                  nickname={nickname}
                  onNicknameSet={(nick) => {
                    setNickname(nick);
                    setCurrentScreen('explorer');
                    setSelectedTab('explorer');
                  }}
                />
              </Box>
            )}

            {currentScreen === 'explorer' && (
              <Box
                style={{
                  position: 'relative',
                  opacity: 1,
                  transform: 'translateY(0)',
                  transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  pointerEvents: 'auto',
                  zIndex: 10,
                }}
              >
                <ExplorerScreen
                  nickname={nickname}
                  selectedTab={selectedTab}
                  onTabChange={handleTabChange}
                  onCreateCommunity={() => handleScreenChange('create-community')}
                />
              </Box>
            )}

            <Box
              style={{
                position: 'relative',
                opacity: currentScreen === 'my-community' ? 1 : 0,
                transform: currentScreen === 'my-community' ? 'translateX(0)' : 'translateX(20px)',
                transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: currentScreen === 'my-community' ? 'auto' : 'none',
                zIndex: currentScreen === 'my-community' ? 10 : 1,
              }}
            >
              {currentScreen === 'my-community' && (
                <MyCommunityScreen
                  nickname={nickname}
                  onBack={() => handleScreenChange('explorer')}
                />
              )}
            </Box>

            <Box
              style={{
                position: 'relative',
                opacity: currentScreen === 'profile' ? 1 : 0,
                transform: currentScreen === 'profile' ? 'translateX(0)' : 'translateX(20px)',
                transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: currentScreen === 'profile' ? 'auto' : 'none',
                zIndex: currentScreen === 'profile' ? 10 : 1,
              }}
            >
              {currentScreen === 'profile' && (
                <ProfileScreen
                  nickname={nickname}
                  onBack={() => handleScreenChange('explorer')}
                />
              )}
            </Box>

            <Box
              style={{
                position: 'relative',
                opacity: currentScreen === 'create-community' ? 1 : 0,
                transform: currentScreen === 'create-community' ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                pointerEvents: currentScreen === 'create-community' ? 'auto' : 'none',
                zIndex: currentScreen === 'create-community' ? 10 : 1,
              }}
            >
              {currentScreen === 'create-community' && (
                <CreateCommunityScreen
                  onBack={() => handleScreenChange('explorer')}
                  onCreated={() => handleScreenChange('explorer')}
                />
              )}
            </Box>
      </Container>
    </Box>
  );
}

export default App;
