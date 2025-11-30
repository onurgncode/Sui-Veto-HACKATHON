import { useState, useEffect } from "react";
import React from "react";
import { useCurrentAccount, useWallets } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading, Text, DropdownMenu, Button } from "@radix-ui/themes";
import { LoginScreen } from "./screens/LoginScreen";
import { NicknameScreen } from "./screens/NicknameScreen";
import { ExplorerScreen } from "./screens/ExplorerScreen";
import { MyCommunityScreen } from "./screens/MyCommunityScreen";
import { ProfileScreen } from "./screens/ProfileScreen";
import { CreateCommunityScreen } from "./screens/CreateCommunityScreen";
import { CommunityDetailScreen } from "./screens/CommunityDetailScreen";
import { ProposalListScreen } from "./screens/ProposalListScreen";
import { ProposalDetailScreen } from "./screens/ProposalDetailScreen";
import { CreateProposalScreen } from "./screens/CreateProposalScreen";
import { JoinRequestScreen } from "./screens/JoinRequestScreen";
import { NotificationScreen } from "./screens/NotificationScreen";
import { apiClient } from "./config/api";
import { authService } from "./services/authService";
import { profileService } from "./services/profileService";
import { notificationService } from "./services/notificationService";
import { formatAddress } from "./utils/formatters";
import { GridScan } from "./components/GridScan";
import { useWebSocket } from "./hooks/useWebSocket";

type Screen = 'login' | 'nickname' | 'explorer' | 'my-community' | 'profile' | 'create-community' | 'community-detail' | 'proposal-list' | 'proposal-detail' | 'create-proposal' | 'join-request' | 'notifications';

function App() {
  const currentAccount = useCurrentAccount();
  const wallets = useWallets();
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [nickname, setNickname] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<'explorer' | 'my-community' | 'profile'>('explorer');
  const [showDisconnectMenu, setShowDisconnectMenu] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  const [joinRequestCommunityId, setJoinRequestCommunityId] = useState<string | null>(null);
  const [explorerRefreshKey, setExplorerRefreshKey] = useState(0);
  const [proposalListRefreshKey, setProposalListRefreshKey] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // WebSocket for real-time updates
  const { isConnected: isWebSocketConnected } = useWebSocket({
    enabled: !!currentAccount && currentScreen !== 'login' && currentScreen !== 'nickname',
    onProposalCreated: (data) => {
      console.log('[App] Real-time: Proposal created', data);
      // Refresh proposal list if we're on that screen
      if (currentScreen === 'proposal-list' && data.commityId === selectedCommunityId) {
        setProposalListRefreshKey(prev => prev + 1);
      }
      // Refresh notification count
      if (currentAccount) {
        notificationService.getUnreadCount(currentAccount.address).then((response) => {
          if (response.success && response.data) {
            setUnreadNotificationCount(response.data.unreadCount || 0);
          }
        });
      }
    },
    onVoteCasted: (data) => {
      console.log('[App] Real-time: Vote casted', data);
      // Refresh proposal detail if we're viewing that proposal
      if (currentScreen === 'proposal-detail' && data.proposalId === selectedProposalId) {
        setProposalListRefreshKey(prev => prev + 1);
      }
      // Refresh proposal list
      if (currentScreen === 'proposal-list') {
        setProposalListRefreshKey(prev => prev + 1);
      }
      // Refresh notification count
      if (currentAccount) {
        notificationService.getUnreadCount(currentAccount.address).then((response) => {
          if (response.success && response.data) {
            setUnreadNotificationCount(response.data.unreadCount || 0);
          }
        });
      }
    },
    onProposalFinalized: (data) => {
      console.log('[App] Real-time: Proposal finalized', data);
      // Refresh proposal list
      if (currentScreen === 'proposal-list') {
        setProposalListRefreshKey(prev => prev + 1);
      }
      // Refresh proposal detail if we're viewing that proposal
      if (currentScreen === 'proposal-detail' && data.proposalId === selectedProposalId) {
        setProposalListRefreshKey(prev => prev + 1);
      }
      // Refresh notification count
      if (currentAccount) {
        notificationService.getUnreadCount(currentAccount.address).then((response) => {
          if (response.success && response.data) {
            setUnreadNotificationCount(response.data.unreadCount || 0);
          }
        });
      }
    },
    onNotification: (data) => {
      console.log('[App] Real-time: Notification', data);
      // Update notification count if it's for current user
      if (currentAccount && data.address === currentAccount.address) {
        setUnreadNotificationCount(prev => prev + 1);
      }
    },
  });

  const handleDisconnect = async () => {
    setShowDisconnectMenu(false);
    setNickname('');
    
    // Tüm bağlı wallet'ları disconnect et
    try {
      // useWallets hook'undan bağlı wallet'ları al
      const connectedWallets = wallets.filter(
        wallet => wallet.accounts && wallet.accounts.length > 0
      );
      
      for (const wallet of connectedWallets) {
        try {
          // Wallet'ın disconnect metodunu dene
          if (wallet && typeof (wallet as any).disconnect === 'function') {
            await (wallet as any).disconnect();
          } else if (wallet.features) {
            // Features üzerinden disconnect dene
            const features = wallet.features as any;
            if (features['standard:disconnect'] && typeof features['standard:disconnect'].disconnect === 'function') {
              await features['standard:disconnect'].disconnect();
            }
          }
        } catch (error) {
        }
      }
    } catch (error) {
    }
    
    // Auth token'ı temizle
    authService.logout();
    
    // Tüm localStorage key'lerini temizle (dapp-kit ve custom)
    if (typeof window !== 'undefined' && window.localStorage) {
      // Dapp-kit localStorage key'leri
      const dappKitKeys = [
        'sui-dapp-kit:wallet-connection-info',
        'sui-dapp-kit:last-wallet-name',
        'sui-dapp-kit:last-wallet-account',
        'sui-dapp-kit:wallet-connection-status',
        'sui-dapp-kit:wallet-accounts',
        'sui-dapp-kit:wallet-connection',
      ];
      
      // Tüm localStorage key'lerini kontrol et ve dapp-kit ile ilgili olanları temizle
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sui-dapp-kit:') || key === 'auth_token')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Ek olarak bilinen key'leri de temizle
      dappKitKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      localStorage.removeItem('auth_token');
      
      // Tüm sessionStorage'ı da temizle (bazı wallet'lar sessionStorage kullanabilir)
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.clear();
      }
      
      // Disconnect flag'i ekle (sayfa yeniden yüklendiğinde wallet bağlanmasın)
      localStorage.setItem('wallet-disconnected', 'true');
    }
    
    // State'leri sıfırla
    setCurrentScreen('login');
    setSelectedTab('explorer');
    
    // Kısa bir delay sonra sayfayı yeniden yükle (wallet bağlantısını tamamen temizlemek için)
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  // Load nickname from on-chain profile
  // Returns: { hasProfile: boolean, nickname: string }
  const loadNickname = async (address: string, retryCount: number = 0): Promise<{ hasProfile: boolean; nickname: string }> => {
    try {
      const response = await profileService.getProfile(address);
      
      if (response.success && response.data) {
        const profile = response.data.profile;
        
        if (profile && profile.id) {
          const nickname = profile.nickname || '';
          
          if (nickname && nickname.trim()) {
            setNickname(nickname);
            return { hasProfile: true, nickname };
          } else {
            return { hasProfile: true, nickname: '' };
          }
        }
      } else {
        if (response.success === false) {
          const isRateLimitError = response.error?.includes('Too many requests') || response.error?.includes('429');
          
          if (isRateLimitError && retryCount < 5) {
            const waitTime = (retryCount + 1) * 2000;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            return loadNickname(address, retryCount + 1);
          }
        }
      }
    } catch (error) {
      const isRateLimitError = 
        (error as any)?.response?.status === 429 ||
        (error as any)?.message?.includes('429') ||
        (error as any)?.message?.includes('Too many requests');
      
      if (retryCount < 5) {
        const waitTime = isRateLimitError ? (retryCount + 1) * 2000 : 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return loadNickname(address, retryCount + 1);
      }
    }
    return { hasProfile: false, nickname: '' };
  };

  // Auto-login: Sayfa yüklendiğinde token kontrolü yap
  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      
      // Eğer disconnect flag'i varsa, temizle ve login ekranına git
      const disconnected = localStorage.getItem('wallet-disconnected');
      if (disconnected === 'true') {
        localStorage.removeItem('wallet-disconnected');
        setCurrentScreen('login');
        setIsCheckingAuth(false);
        return;
      }
      
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Token varsa, geçerli olup olmadığını kontrol et
          apiClient.setToken(token);
          
          // Eğer wallet bağlıysa ve token varsa, profile'dan nickname'i al ve explorer'a geç
          if (currentAccount) {
            const profileData = await loadNickname(currentAccount.address);
            if (profileData.hasProfile) {
              // Profile objesi varsa, direkt explorer'a geç
              // (Contract'ta profile oluşturulurken nickname zorunlu, bu yüzden her zaman olmalı)
              setCurrentScreen('explorer');
              setSelectedTab('explorer');
            } else {
              // Profile yok, nickname ekranına git
              setCurrentScreen('nickname');
            }
          } else {
            // Wallet bağlı değilse, login ekranına git
            setCurrentScreen('login');
          }
        } else {
          // Token yoksa, login ekranına git
          setCurrentScreen('login');
        }
      } catch (error) {
        // Hata durumunda login ekranına git
        setCurrentScreen('login');
        authService.logout();
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, [currentAccount]);

  // Load notification count
  useEffect(() => {
    const loadNotificationCount = async () => {
    if (currentAccount) {
        try {
          const response = await notificationService.getUnreadCount(currentAccount.address);
          if (response.success && response.data) {
            setUnreadNotificationCount(response.data.unreadCount || 0);
          }
        } catch (error) {
          // Silent fail
      }
    } else {
        setUnreadNotificationCount(0);
      }
    };

    loadNotificationCount();
    const interval = setInterval(loadNotificationCount, 15000);
    return () => clearInterval(interval);
  }, [currentAccount]);

  React.useEffect(() => {
    // Auth kontrolü tamamlanmadan wallet kontrolü yapma
    if (isCheckingAuth) return;

    // Wallet bağlantısı kesildiyse
    if (!currentAccount && currentScreen !== 'login') {
      setCurrentScreen('login');
      setNickname('');
      authService.logout();
    } 
    // Wallet bağlandıysa ve login ekranındaysak
    else if (currentAccount && currentScreen === 'login') {
      // Token kontrolü yap
      const token = localStorage.getItem('auth_token');
      
      // Token olsun ya da olmasın, profile kontrolü yap
      // (Kullanıcı daha önce profile oluşturmuş olabilir, sadece token'ı kaybetmiş olabilir)
      if (token) {
        apiClient.setToken(token);
      }
      
      // Profile kontrolü yap
      loadNickname(currentAccount.address).then((profileData) => {
        if (profileData.hasProfile) {
          // Profile varsa
          if (token) {
            // Token da varsa, direkt explorer'a geç
            setCurrentScreen('explorer');
            setSelectedTab('explorer');
          } else {
            // Token yoksa ama profile var
            // LoginScreen'de kal, kullanıcı "Giriş Yap" butonuna tıklayacak
            // Auth yapıldıktan sonra onLogin callback'i explorer'a yönlendirecek
            // LoginScreen'de kal, kullanıcı auth yapacak
          }
        } else {
          // Profile yoksa, nickname ekranına geç
          const timer = setTimeout(() => {
            setCurrentScreen('nickname');
          }, 400);
          return () => clearTimeout(timer);
        }
      });
    }
    // Nickname ekranındaysak ve profile varsa, explorer'a yönlendir
    else if (currentAccount && currentScreen === 'nickname') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        apiClient.setToken(token);
        loadNickname(currentAccount.address).then((profileData) => {
          if (profileData.hasProfile) {
            setCurrentScreen('explorer');
            setSelectedTab('explorer');
          }
        });
      }
    }
  }, [currentAccount, currentScreen, isCheckingAuth]);

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
    <Box className="liquid-glass-bg" style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* GridScan Background */}
      <Box
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <GridScan
          sensitivity={0.1}
          lineThickness={0.3}
          linesColor="#1a1625"
          gridScale={0.15}
          scanColor="#FF9FFC"
          scanOpacity={0.05}
          enablePost={false}
          bloomIntensity={0.1}
          chromaticAberration={0.0005}
          noiseIntensity={0.002}
        />
      </Box>

      {currentScreen !== 'login' && (
        <Box
          style={{
            position: 'sticky',
            top: 0,
            width: '100%',
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(60px) saturate(180%)',
            WebkitBackdropFilter: 'blur(60px) saturate(180%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            zIndex: 1000,
            padding: '1.25rem 2rem',
          }}
        >
          <Flex justify="between" align="center" style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <Flex align="center" gap="3">
              <Heading 
                size="7" 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.95)', 
                  fontWeight: 600, 
                  letterSpacing: '-0.015em',
                  fontSize: 'clamp(1.25rem, 2.5vw, 1.75rem)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
                }}
              >
                Merkeziyetsiz Community
              </Heading>
            </Flex>

            {/* Navigation Menu */}
            <Flex gap="2" align="center" style={{ marginRight: '1rem' }}>
              <Button
                variant={selectedTab === 'explorer' ? 'solid' : 'soft'}
                onClick={() => {
                  setSelectedTab('explorer');
                  setCurrentScreen('explorer');
                }}
                style={{
                  background: selectedTab === 'explorer' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: selectedTab === 'explorer' ? 600 : 500,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                Explorer
              </Button>
              <Button
                variant={selectedTab === 'my-community' ? 'solid' : 'soft'}
                onClick={() => {
                  setSelectedTab('my-community');
                  setCurrentScreen('my-community');
                }}
                style={{
                  background: selectedTab === 'my-community' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: selectedTab === 'my-community' ? 600 : 500,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                Topluluklarım
              </Button>
              <Button
                variant={selectedTab === 'profile' ? 'solid' : 'soft'}
                onClick={() => {
                  setSelectedTab('profile');
                  setCurrentScreen('profile');
                }}
                style={{
                  background: selectedTab === 'profile' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: selectedTab === 'profile' ? 600 : 500,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                Profil
              </Button>
              <Button
                variant="soft"
                onClick={() => setCurrentScreen('notifications')}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '10px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                }}
              >
                🔔
                {unreadNotificationCount > 0 && (
                  <Box
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      background: 'rgba(236, 72, 153, 0.9)',
                      color: 'white',
                      borderRadius: '50%',
                      width: '18px',
                      height: '18px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.7rem',
                      fontWeight: 600,
                    }}
                  >
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </Box>
                )}
              </Button>
            </Flex>

            <Flex gap="3" align="center">
              {currentAccount && (
                <DropdownMenu.Root open={showDisconnectMenu} onOpenChange={setShowDisconnectMenu}>
                  <DropdownMenu.Trigger>
                    <Box
                      style={{
                        padding: '0.625rem 1rem',
                        background: 'rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(40px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                        borderRadius: '10px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15), 0 2px 4px rgba(0, 0, 0, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        if (!showDisconnectMenu) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)';
                        }
                      }}
                    >
                      <Flex align="center" gap="2">
                        <Box
                          style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'rgba(52, 199, 89, 0.9)',
                            boxShadow: '0 0 6px rgba(52, 199, 89, 0.5)',
                            flexShrink: 0,
                          }}
                        />
                        <Text 
                          size="2" 
                          style={{ 
                            color: 'rgba(255, 255, 255, 0.9)', 
                            fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                            fontSize: '0.8125rem',
                            fontWeight: 500,
                            letterSpacing: '0.01em',
                          }}
                        >
                          {formatAddress(currentAccount.address)}
                        </Text>
                      </Flex>
                    </Box>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(60px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(60px) saturate(180%)',
                      border: '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '14px',
                      padding: '0.5rem',
                      minWidth: '240px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 1px 0 rgba(255, 255, 255, 0.05) inset',
                      marginTop: '0.5rem',
                    }}
                  >
                    <Box
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                        marginBottom: '0.375rem',
                      }}
                    >
                      <Text 
                        size="1" 
                        style={{ 
                          color: 'rgba(255, 255, 255, 0.5)',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                        }}
                      >
                        Cüzdan Adresi
                      </Text>
                      <Text 
                        size="2" 
                        style={{ 
                          color: 'rgba(255, 255, 255, 0.9)',
                          fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
                          fontSize: '0.8125rem',
                          fontWeight: 400,
                          marginTop: '0.375rem',
                          wordBreak: 'break-all',
                          lineHeight: 1.5,
                        }}
                      >
                        {currentAccount.address}
                      </Text>
                    </Box>
                    <DropdownMenu.Item
                      style={{
                        color: 'rgba(255, 255, 255, 0.9)',
                        padding: '0.625rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        background: 'transparent',
                        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                      }}
                      onSelect={handleDisconnect}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <Flex align="center" gap="2">
                        <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500, fontSize: '0.875rem' }}>
                          Çıkış Yap
                        </Text>
                      </Flex>
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu.Root>
              )}
            </Flex>
          </Flex>
        </Box>
      )}

      <Container size="4" py="6" style={{ position: 'relative', zIndex: 1, minHeight: 'calc(100vh - 100px)' }}>
        {/* Login Screen - Full Screen Overlay */}
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
              zIndex: 1000,
            }}
          >
            <LoginScreen onLogin={async () => {
              if (currentAccount) {
                console.log('[App] onLogin callback triggered, checking profile...');
                const profileData = await loadNickname(currentAccount.address);
                if (profileData.hasProfile) {
                  console.log('[App] Profile found in onLogin, redirecting to explorer');
                  setCurrentScreen('explorer');
                  setSelectedTab('explorer');
                } else {
                  console.log('[App] No profile found in onLogin, redirecting to nickname');
                  setCurrentScreen('nickname');
                }
              } else {
                console.log('[App] No wallet in onLogin, redirecting to nickname');
                handleScreenChange('nickname');
              }
            }} />
          </Box>
        )}

        {/* Nickname Screen - Full Screen Overlay */}
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
              zIndex: 1000,
            }}
          >
            <NicknameScreen
              nickname={nickname}
              onNicknameSet={async (nick) => {
                setNickname(nick);
                if (currentAccount) {
                  setTimeout(async () => {
                    const profileData = await loadNickname(currentAccount.address);
                    if (profileData.hasProfile) {
                      setCurrentScreen('explorer');
                      setSelectedTab('explorer');
                    } else {
                      setCurrentScreen('explorer');
                      setSelectedTab('explorer');
                    }
                  }, 500);
                } else {
                  setCurrentScreen('explorer');
                  setSelectedTab('explorer');
                }
              }}
            />
          </Box>
        )}

        {/* Main Explorer Screen - Always visible when authenticated */}
        {currentScreen !== 'login' && currentScreen !== 'nickname' && (
          <Box style={{ position: 'relative', width: '100%' }}>
            <ExplorerScreen
              key={explorerRefreshKey}
              onCreateCommunity={() => setCurrentScreen('create-community')}
              onCommunityClick={(communityId) => {
                setSelectedCommunityId(communityId);
                setCurrentScreen('community-detail');
              }}
              onJoinRequest={(communityId) => {
                setJoinRequestCommunityId(communityId);
                setCurrentScreen('join-request');
              }}
            />

            {/* Overlay for My Community */}
            {currentScreen === 'my-community' && (
              <Box
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.7)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  zIndex: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  opacity: 1,
                  transition: 'opacity 0.3s ease',
                }}
                onClick={() => {
                  setCurrentScreen('explorer');
                  setSelectedTab('explorer');
                }}
              >
                <Box
                  style={{
                    background: 'rgba(0, 0, 0, 0.9)',
                    backdropFilter: 'blur(40px)',
                    WebkitBackdropFilter: 'blur(40px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '2rem',
                    maxWidth: '1200px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MyCommunityScreen
                    nickname={nickname}
                    onBack={() => {
                      setCurrentScreen('explorer');
                      setSelectedTab('explorer');
                    }}
                    onCommunityClick={(communityId) => {
                      setSelectedCommunityId(communityId);
                      setCurrentScreen('community-detail');
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* Overlay for Profile */}
            {currentScreen === 'profile' && (
              <Box
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.7)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  zIndex: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  opacity: 1,
                  transition: 'opacity 0.3s ease',
                }}
                onClick={() => {
                  setCurrentScreen('explorer');
                  setSelectedTab('explorer');
                }}
              >
                <Box
                  style={{
                    background: 'rgba(0, 0, 0, 0.9)',
                    backdropFilter: 'blur(40px)',
                    WebkitBackdropFilter: 'blur(40px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '2rem',
                    maxWidth: '800px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ProfileScreen
                    key={`profile-${explorerRefreshKey}`}
                    nickname={nickname}
                    onBack={() => {
                      setCurrentScreen('explorer');
                      setSelectedTab('explorer');
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* Overlay for Create Community */}
            {currentScreen === 'create-community' && (
              <Box
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.7)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  zIndex: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  opacity: 1,
                  transition: 'opacity 0.3s ease',
                }}
                onClick={() => {
                  setCurrentScreen('explorer');
                  setSelectedTab('explorer');
                }}
              >
                <Box
                  style={{
                    background: 'rgba(0, 0, 0, 0.9)',
                    backdropFilter: 'blur(40px)',
                    WebkitBackdropFilter: 'blur(40px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '2rem',
                    maxWidth: '700px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <CreateCommunityScreen
                    onBack={() => {
                      setCurrentScreen('explorer');
                      setSelectedTab('explorer');
                    }}
                    onCreated={() => {
                      // Refresh ExplorerScreen to update membership status
                      setExplorerRefreshKey(prev => prev + 1);
                      setCurrentScreen('explorer');
                      setSelectedTab('explorer');
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* Overlay for Community Detail */}
            {currentScreen === 'community-detail' && selectedCommunityId && (
              <Box
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.7)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  zIndex: 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                  opacity: 1,
                  transition: 'opacity 0.3s ease',
                }}
                onClick={() => {
                  setCurrentScreen('my-community');
                  setSelectedTab('my-community');
                  setSelectedCommunityId(null);
                }}
              >
                <Box
                  style={{
                    background: 'rgba(0, 0, 0, 0.9)',
                    backdropFilter: 'blur(40px)',
                    WebkitBackdropFilter: 'blur(40px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    padding: '2rem',
                    maxWidth: '1400px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <CommunityDetailScreen
                    communityId={selectedCommunityId}
                    onBack={() => {
                      setCurrentScreen('my-community');
                      setSelectedTab('my-community');
                      setSelectedCommunityId(null);
                    }}
                    onViewProposals={() => {
                      setCurrentScreen('proposal-list');
                    }}
                    onCreateProposal={() => {
                      setCurrentScreen('create-proposal');
                    }}
                    onProposalClick={(proposalId) => {
                      setSelectedProposalId(proposalId);
                      setCurrentScreen('proposal-detail');
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* Proposal List Screen */}
            {currentScreen === 'proposal-list' && selectedCommunityId && (
              <Box
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(10px)',
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                }}
                onClick={() => {
                  setCurrentScreen('community-detail');
                }}
              >
                <Box
                  style={{
                    background: 'rgba(0, 0, 0, 0.95)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    width: '100%',
                    maxWidth: '1200px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ProposalListScreen
                    key={proposalListRefreshKey}
                    communityId={selectedCommunityId}
                    onCreateProposal={() => {
                      setCurrentScreen('create-proposal');
                    }}
                    onProposalClick={(proposalId) => {
                      setSelectedProposalId(proposalId);
                      setCurrentScreen('proposal-detail');
                    }}
                    onBack={() => {
                      setCurrentScreen('community-detail');
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* Notification Screen */}
            {currentScreen === 'notifications' && (
              <Box
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(10px)',
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                }}
                onClick={() => {
                  setCurrentScreen('explorer');
                }}
              >
                <Box
                  style={{
                    background: 'rgba(0, 0, 0, 0.95)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    width: '100%',
                    maxWidth: '900px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <NotificationScreen
                    onBack={() => {
                      setCurrentScreen('explorer');
                      // Refresh notification count
                      if (currentAccount) {
                        notificationService.getUnreadCount(currentAccount.address).then((response) => {
                          if (response.success && response.data) {
                            setUnreadNotificationCount(response.data.unreadCount || 0);
                          }
                        });
                      }
                    }}
                    onProposalClick={(proposalId) => {
                      setSelectedProposalId(proposalId);
                      setCurrentScreen('proposal-detail');
                    }}
                    onCommunityClick={(communityId) => {
                      setSelectedCommunityId(communityId);
                      setCurrentScreen('community-detail');
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* Proposal Detail Screen */}
            {currentScreen === 'proposal-detail' && selectedProposalId && (
              <Box
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(10px)',
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                }}
                onClick={() => {
                  setCurrentScreen('proposal-list');
                  setSelectedProposalId(null);
                }}
              >
                <Box
                  style={{
                    background: 'rgba(0, 0, 0, 0.95)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    width: '100%',
                    maxWidth: '1200px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ProposalDetailScreen
                    proposalId={selectedProposalId}
                    onBack={() => {
                      setCurrentScreen('proposal-list');
                      setSelectedProposalId(null);
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* Create Proposal Screen */}
            {currentScreen === 'create-proposal' && selectedCommunityId && (
              <Box
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(10px)',
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                }}
                onClick={() => {
                  setCurrentScreen('proposal-list');
                }}
              >
                <Box
                  style={{
                    background: 'rgba(0, 0, 0, 0.95)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    width: '100%',
                    maxWidth: '1200px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <CreateProposalScreen
                    communityId={selectedCommunityId}
                    onBack={() => {
                      setCurrentScreen('proposal-list');
                    }}
                    onCreated={() => {
                      // Wait a bit for transaction to be indexed, then refresh
                      setTimeout(() => {
                        setProposalListRefreshKey(prev => prev + 1);
                        setCurrentScreen('proposal-list');
                      }, 3000);
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* Join Request Screen */}
            {currentScreen === 'join-request' && joinRequestCommunityId && (
              <Box
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.8)',
                  backdropFilter: 'blur(10px)',
                  zIndex: 1000,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem',
                }}
                onClick={() => {
                  setCurrentScreen('explorer');
                  setJoinRequestCommunityId(null);
                }}
              >
                <Box
                  style={{
                    background: 'rgba(0, 0, 0, 0.95)',
                    borderRadius: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    width: '100%',
                    maxWidth: '1200px',
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <JoinRequestScreen
                    communityId={joinRequestCommunityId}
                    onBack={() => {
                      setCurrentScreen('explorer');
                      setJoinRequestCommunityId(null);
                    }}
                    onRequestSent={() => {
                      setCurrentScreen('explorer');
                      setJoinRequestCommunityId(null);
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
}

export default App;
