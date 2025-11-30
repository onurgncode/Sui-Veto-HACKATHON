import { useState, useEffect } from "react";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button, Badge, Separator, Select } from "@radix-ui/themes";
import { notificationService, type Notification } from "../services/notificationService";
import { formatAddress } from "../utils/formatters";
import { useWebSocket } from "../hooks/useWebSocket";

interface NotificationScreenProps {
  onBack: () => void;
  onProposalClick?: (proposalId: string) => void;
  onCommunityClick?: (communityId: string) => void;
}

type FilterType = 'all' | 'unread' | 'read' | Notification['type'];

export function NotificationScreen({ onBack, onProposalClick, onCommunityClick }: NotificationScreenProps) {
  const currentAccount = useCurrentAccount();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMarkingRead, setIsMarkingRead] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [usePolling, setUsePolling] = useState(false);

  // WebSocket for real-time updates
  const { isConnected: isWebSocketConnected } = useWebSocket({
    enabled: !!currentAccount,
    onNotification: (data) => {
      if (data.address === currentAccount?.address) {
        // Reload notifications when new notification arrives
        loadNotifications();
      }
    },
  });

  const loadNotifications = async () => {
    if (currentAccount) {
      setIsLoading(true);
      try {
        const [notificationsResponse, countResponse] = await Promise.all([
          notificationService.getNotifications(currentAccount.address),
          notificationService.getUnreadCount(currentAccount.address),
        ]);

        if (notificationsResponse.success && notificationsResponse.data) {
          const loadedNotifications = notificationsResponse.data.notifications || [];
          setAllNotifications(loadedNotifications);
          applyFilter(loadedNotifications, filter);
        }

        if (countResponse.success && countResponse.data) {
          setUnreadCount(countResponse.data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const applyFilter = (notifs: Notification[], currentFilter: FilterType) => {
    let filtered = notifs;

    if (currentFilter === 'unread') {
      filtered = notifs.filter(n => !n.read);
    } else if (currentFilter === 'read') {
      filtered = notifs.filter(n => n.read);
    } else if (currentFilter !== 'all' && typeof currentFilter === 'string') {
      filtered = notifs.filter(n => n.type === currentFilter);
    }

    setNotifications(filtered);
  };

  useEffect(() => {
    loadNotifications();
    
    // Use polling fallback if WebSocket is not connected
    if (!isWebSocketConnected || usePolling) {
      const interval = setInterval(loadNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [currentAccount, isWebSocketConnected, usePolling]);

  useEffect(() => {
    applyFilter(allNotifications, filter);
  }, [filter, allNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!currentAccount) return;

    setIsMarkingRead(notificationId);
    try {
      const response = await notificationService.markAsRead(currentAccount.address, notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setIsMarkingRead(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!currentAccount) return;

    try {
      const response = await notificationService.markAllAsRead(currentAccount.address);
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification.id);
    }

    if (notification.data?.proposalId && onProposalClick) {
      onProposalClick(notification.data.proposalId as string);
    } else if (notification.data?.commityId && onCommunityClick) {
      onCommunityClick(notification.data.commityId as string);
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'proposal_created':
        return '📋';
      case 'vote_casted':
        return '✅';
      case 'proposal_finalized':
        return '🏁';
      case 'proposal_expiring':
        return '⏰';
      default:
        return '🔔';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dakika önce`;
    if (hours < 24) return `${hours} saat önce`;
    if (days < 7) return `${days} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  const unreadNotifications = notifications.filter((n) => !n.read);
  const readNotifications = notifications.filter((n) => n.read);

  return (
    <Box style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <Flex justify="between" align="center" mb="5">
        <Flex align="center" gap="3">
          <Heading size="8" style={{ color: 'white', fontWeight: 700 }}>
            Bildirimler
          </Heading>
          {unreadCount > 0 && (
            <Badge size="2" style={{ background: 'rgba(236, 72, 153, 0.3)', color: 'white' }}>
              {unreadCount}
            </Badge>
          )}
          {!isWebSocketConnected && (
            <Badge size="1" style={{ background: 'rgba(255, 165, 0, 0.3)', color: 'white' }}>
              Polling
            </Badge>
          )}
        </Flex>
        <Flex gap="2">
          {unreadCount > 0 && (
            <Button
              size="2"
              variant="soft"
              onClick={handleMarkAllAsRead}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              Tümünü Okundu İşaretle
            </Button>
          )}
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
      </Flex>

      {/* Filter Section */}
      <Box mb="4">
        <Flex gap="3" align="center">
          <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Filtrele:
          </Text>
          <Select.Root value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
            <Select.Trigger
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: 'white',
                borderRadius: '8px',
              }}
            />
            <Select.Content>
              <Select.Item value="all">Tümü</Select.Item>
              <Select.Item value="unread">Okunmamış</Select.Item>
              <Select.Item value="read">Okunmuş</Select.Item>
              <Select.Item value="proposal_created">Proposal Oluşturuldu</Select.Item>
              <Select.Item value="vote_casted">Oy Verildi</Select.Item>
              <Select.Item value="proposal_finalized">Proposal Finalize Edildi</Select.Item>
              <Select.Item value="proposal_expiring">Proposal Süresi Doluyor</Select.Item>
            </Select.Content>
          </Select.Root>
        </Flex>
      </Box>

      <Box
        className="liquid-glass-card"
        style={{
          padding: '2rem',
        }}
      >
        {isLoading ? (
          <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Yükleniyor...
          </Text>
        ) : notifications.length === 0 ? (
          <Box style={{ textAlign: 'center', padding: '3rem' }}>
            <Text size="4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Henüz bildiriminiz yok
            </Text>
          </Box>
        ) : (
          <Flex direction="column" gap="3">
            {unreadNotifications.length > 0 && (
              <>
                <Heading size="4" mb="2" style={{ color: 'white', fontWeight: 600 }}>
                  Okunmamış ({unreadNotifications.length})
                </Heading>
                {unreadNotifications.map((notification) => (
                  <Box
                    key={notification.id}
                    className="liquid-glass-card"
                    style={{
                      padding: '1.5rem',
                      background: 'rgba(102, 126, 234, 0.1)',
                      borderRadius: '12px',
                      border: '1px solid rgba(102, 126, 234, 0.3)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <Flex justify="between" align="start" gap="3">
                      <Flex gap="3" style={{ flex: 1 }}>
                        <Text size="5" style={{ fontSize: '1.5rem' }}>
                          {getNotificationIcon(notification.type)}
                        </Text>
                        <Box style={{ flex: 1 }}>
                          <Flex align="center" gap="2" mb="1">
                            <Heading size="4" style={{ color: 'white', fontWeight: 600 }}>
                              {notification.title}
                            </Heading>
                            <Badge
                              size="1"
                              style={{
                                background: 'rgba(236, 72, 153, 0.3)',
                                color: 'white',
                              }}
                            >
                              Yeni
                            </Badge>
                          </Flex>
                          <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.8)', display: 'block', mb: '0.5rem' }}>
                            {notification.message}
                          </Text>
                          <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            {formatTimestamp(notification.timestamp)}
                          </Text>
                        </Box>
                      </Flex>
                      <Button
                        size="1"
                        variant="soft"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification.id);
                        }}
                        disabled={isMarkingRead === notification.id}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: 'white',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                        }}
                      >
                        {isMarkingRead === notification.id ? '...' : '✓'}
                      </Button>
                    </Flex>
                  </Box>
                ))}
                {readNotifications.length > 0 && <Separator my="4" style={{ background: 'rgba(255, 255, 255, 0.1)' }} />}
              </>
            )}

            {readNotifications.length > 0 && (
              <>
                <Heading size="4" mb="2" style={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 600 }}>
                  Okunmuş ({readNotifications.length})
                </Heading>
                {readNotifications.map((notification) => (
                  <Box
                    key={notification.id}
                    className="liquid-glass-card"
                    style={{
                      padding: '1.5rem',
                      background: 'rgba(255, 255, 255, 0.04)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      cursor: 'pointer',
                      opacity: 0.7,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = '0.7';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <Flex gap="3">
                      <Text size="5" style={{ fontSize: '1.5rem' }}>
                        {getNotificationIcon(notification.type)}
                      </Text>
                      <Box style={{ flex: 1 }}>
                        <Heading size="4" mb="1" style={{ color: 'rgba(255, 255, 255, 0.8)', fontWeight: 600 }}>
                          {notification.title}
                        </Heading>
                        <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', mb: '0.5rem' }}>
                          {notification.message}
                        </Text>
                        <Text size="1" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                          {formatTimestamp(notification.timestamp)}
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                ))}
              </>
            )}
          </Flex>
        )}
      </Box>
    </Box>
  );
}

