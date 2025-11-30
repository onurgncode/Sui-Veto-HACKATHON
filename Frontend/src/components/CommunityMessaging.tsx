/**
 * Community Messaging Component
 * Displays messages and allows sending messages in a community channel
 */

import { useState, useEffect, useRef } from 'react';
import { useCurrentAccount, useSuiClient, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Box, Flex, Text, TextField, Button, ScrollArea } from '@radix-ui/themes';
import { messagingService, type Message, type Channel } from '../services/messagingService';
import { formatAddress } from '../utils/formatters';

interface CommunityMessagingProps {
  communityId: string;
  memberAddresses: string[];
}

export function CommunityMessaging({ communityId, memberAddresses }: CommunityMessagingProps) {
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [pollingState, setPollingState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize messaging service
  useEffect(() => {
    const initMessaging = async () => {
      if (!currentAccount || !suiClient || isInitialized) {
        return;
      }

      try {
        // Initialize messaging service with base client
        // Service will add Seal, Walrus, and Messaging extensions internally
        await messagingService.initialize(suiClient);
        setIsInitialized(true);

        // Get or create channel for this community
        // First, try to find existing channel by checking all members
        let communityChannel = await messagingService.findCommunityChannel(communityId, memberAddresses);

        if (!communityChannel) {
          // Channel doesn't exist yet - create it automatically with all members
          console.log('[CommunityMessaging] Channel not found, creating new channel for community:', communityId, 'with', memberAddresses.length, 'members');
          
          // Get signer from current account
          if (!currentAccount) {
            throw new Error('Current account not available');
          }

          // Create channel with all community members
          // We need to use a signer that works with executeCreateChannelTransaction
          // The SDK's executeCreateChannelTransaction expects a signer that can sign transactions
          const client = messagingService.getClient();
          
          // Use createChannelFlow for more control, or executeCreateChannelTransaction for simplicity
          // For now, use executeCreateChannelTransaction which handles everything
          const createChannelFlow = client.createChannelFlow({
            creatorAddress: currentAccount.address,
            initialMemberAddresses: memberAddresses,
          });

          // Build the transaction
          const transaction = createChannelFlow.build();
          transaction.setSender(currentAccount.address);

          // Execute the transaction
          const executeResult = await signAndExecute({
            transaction,
            account: currentAccount,
          });

          // Wait for transaction to be indexed
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Get generated caps
          const { creatorCap, creatorMemberCap } = await createChannelFlow.getGeneratedCaps({
            digest: executeResult.digest,
          });

          // Generate and attach encryption key
          const { transaction: encryptionTx } = await createChannelFlow.generateAndAttachEncryptionKey({
            creatorMemberCap,
          });
          encryptionTx.setSender(currentAccount.address);

          // Execute encryption key transaction
          await signAndExecute({
            transaction: encryptionTx,
            account: currentAccount,
          });

          // Wait for encryption transaction to be indexed
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Get the channel ID
          const { channelId } = createChannelFlow.getGeneratedEncryptionKey();

          // Get channel members
          const members = await client.getChannelMembers(channelId);
          const userMemberCap = members.members.find((m) => m.memberAddress === currentAccount.address);

          const createChannelResult = {
            id: channelId,
            name: `Community ${communityId.slice(0, 8)}`,
            type: 'group' as const,
            members: memberAddresses,
            createdAt: Date.now(),
            memberCapId: userMemberCap?.memberCapId || creatorMemberCap?.memberCapId || undefined,
          };

          console.log('[CommunityMessaging] Channel created successfully:', {
            channelId: createChannelResult.id,
            hasMemberCap: !!createChannelResult.memberCapId,
            memberCount: memberAddresses.length,
          });

          communityChannel = createChannelResult;
        } else {
          // Channel exists, but check if all current members are in it
          const channelMemberAddresses = communityChannel.members;
          const missingMembers = memberAddresses.filter(addr => !channelMemberAddresses.includes(addr));
          
          if (missingMembers.length > 0) {
            console.log('[CommunityMessaging] Channel exists but missing members, adding:', missingMembers);
            // Add missing members to channel
            // Note: This requires creatorCap, which we might not have
            // For now, we'll just log it - in production, we'd need to store creatorCap
            console.warn('[CommunityMessaging] Cannot add missing members without creatorCap');
          }
        }

        setChannel(communityChannel);
        setError(null); // Clear any previous errors

        if (communityChannel) {
          if (communityChannel.memberCapId) {
            // Load messages
            try {
              const loadedMessages = await messagingService.getMessages(
                communityChannel.id,
                currentAccount.address,
                communityChannel.memberCapId,
                50
              );
              setMessages(loadedMessages.reverse()); // Reverse to show newest at bottom

              // Set up polling for new messages
              startPolling(communityChannel.id, communityChannel.memberCapId);
            } catch (messageError) {
              console.error('[CommunityMessaging] Error loading messages:', messageError);
              // Don't fail the whole component if message loading fails
              setMessages([]);
            }
          } else {
            console.warn('[CommunityMessaging] Channel created but memberCapId not found. Messages cannot be loaded.');
            setMessages([]);
          }
        }
      } catch (error) {
        console.error('[CommunityMessaging] Initialization error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Kanal oluşturulurken bir hata oluştu';
        setError(errorMessage);
        // Channel state'i null kalacak, bu yüzden "kanal oluşturulmamış" mesajı gösterilecek
        setChannel(null);
      } finally {
        setIsLoading(false);
      }
    };

    initMessaging();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [currentAccount, suiClient, communityId, memberAddresses, isInitialized]);

  const startPolling = (channelId: string, memberCapId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    pollingIntervalRef.current = setInterval(async () => {
      if (!currentAccount) return;

      try {
        const newMessages = await messagingService.getLatestMessages(
          channelId,
          currentAccount.address,
          pollingState,
          20
        );

        if (newMessages.length > 0) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((m) => m.id));
            const uniqueNew = newMessages.filter((m) => !existingIds.has(m.id));
            return [...prev, ...uniqueNew].sort((a, b) => a.timestamp - b.timestamp);
          });
          scrollToBottom();
        }
      } catch (error) {
        console.error('[CommunityMessaging] Polling error:', error);
      }
    }, 5000); // Poll every 5 seconds
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !channel || !channel.memberCapId || isSending || !currentAccount) {
      return;
    }

    setIsSending(true);
    try {
      // For sending messages, we need to:
      // 1. Get the encrypted key for the channel
      // 2. Build and execute the transaction
      // This is complex and requires the full SDK flow
      // For now, show an error that this feature is not fully implemented
      console.warn('[CommunityMessaging] Message sending requires full SDK integration');
      alert('Mesaj gönderme özelliği henüz tam olarak entegre edilmedi. SDK dokümantasyonuna göre tam entegrasyon gerekiyor.');
      
      // TODO: Implement full message sending flow with encrypted keys
      // const result = await messagingService.sendMessage(...);
      
      setMessageInput('');
    } catch (error) {
      console.error('[CommunityMessaging] Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Az önce';
    if (minutes < 60) return `${minutes} dakika önce`;
    if (diff < 86400000) return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  };

  if (isLoading) {
    return (
      <Box
        className="liquid-glass-card"
        style={{
          padding: '2rem',
          minHeight: '400px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          Mesajlaşma yükleniyor...
        </Text>
      </Box>
    );
  }

  if (!channel) {
    return (
      <Box
        className="liquid-glass-card"
        style={{
          padding: '2rem',
          minHeight: '400px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
        }}
      >
        {error ? (
          <>
            <Text size="3" style={{ color: 'rgba(255, 100, 100, 0.9)', textAlign: 'center', fontWeight: 600 }}>
              Kanal Oluşturma Hatası
            </Text>
            <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
              {error}
            </Text>
            <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center', marginTop: '0.5rem' }}>
              Lütfen sayfayı yenileyip tekrar deneyin.
            </Text>
          </>
        ) : (
          <>
            <Text size="3" style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center' }}>
              Bu topluluk için henüz bir mesajlaşma kanalı oluşturulmamış.
            </Text>
            <Text size="2" style={{ color: 'rgba(255, 255, 255, 0.5)', textAlign: 'center' }}>
              Kanal oluşturuluyor...
            </Text>
          </>
        )}
      </Box>
    );
  }

  return (
    <Box
      className="liquid-glass-card"
      style={{
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        height: '600px',
      }}
    >
      {/* Messages Area */}
      <ScrollArea
        style={{
          flex: 1,
          padding: '1.5rem',
          overflowY: 'auto',
        }}
      >
        <Flex direction="column" gap="3">
          {messages.length === 0 ? (
            <Box
              style={{
                textAlign: 'center',
                padding: '3rem',
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              <Text size="3">Henüz mesaj yok. İlk mesajı sen gönder!</Text>
            </Box>
          ) : (
            messages.map((message) => {
              const isOwnMessage = message.sender === currentAccount?.address;
              return (
                <Flex
                  key={message.id}
                  justify={isOwnMessage ? 'end' : 'start'}
                  style={{
                    width: '100%',
                  }}
                >
                  <Box
                    style={{
                      maxWidth: '70%',
                      padding: '0.75rem 1rem',
                      borderRadius: '12px',
                      background: isOwnMessage
                        ? 'rgba(102, 126, 234, 0.3)'
                        : 'rgba(255, 255, 255, 0.08)',
                      border: `1px solid ${isOwnMessage ? 'rgba(102, 126, 234, 0.5)' : 'rgba(255, 255, 255, 0.12)'}`,
                    }}
                  >
                    {!isOwnMessage && (
                      <Text
                        size="1"
                        style={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          display: 'block',
                          marginBottom: '0.25rem',
                        }}
                      >
                        {formatAddress(message.sender)}
                      </Text>
                    )}
                    <Text
                      size="3"
                      style={{
                        color: 'rgba(255, 255, 255, 0.95)',
                        wordBreak: 'break-word',
                      }}
                    >
                      {message.content}
                    </Text>
                    <Text
                      size="1"
                      style={{
                        color: 'rgba(255, 255, 255, 0.4)',
                        display: 'block',
                        marginTop: '0.25rem',
                      }}
                    >
                      {formatTime(message.timestamp)}
                    </Text>
                  </Box>
                </Flex>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </Flex>
      </ScrollArea>

      {/* Input Area */}
      <Box
        style={{
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.02)',
        }}
      >
        <Flex gap="2" align="center">
          <TextField.Root
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Mesaj yazın... (Henüz tam entegre edilmedi)"
            disabled={isSending || !channel.memberCapId}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: 'white',
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!messageInput.trim() || isSending || !channel.memberCapId}
            style={{
              background: 'rgba(102, 126, 234, 0.6)',
              border: '1px solid rgba(102, 126, 234, 0.8)',
              color: 'white',
              cursor: !messageInput.trim() || isSending || !channel.memberCapId ? 'not-allowed' : 'pointer',
            }}
          >
            {isSending ? 'Gönderiliyor...' : 'Gönder'}
          </Button>
        </Flex>
      </Box>
    </Box>
  );
}
