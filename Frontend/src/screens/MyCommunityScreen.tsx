import { useState } from "react";
import { Box, Flex, Heading, Text, Button, TextField, Separator } from "@radix-ui/themes";
import { ArrowRightIcon } from "@radix-ui/react-icons";

interface MyCommunityScreenProps {
  nickname: string;
  onBack: () => void;
}

export function MyCommunityScreen({ nickname, onBack }: MyCommunityScreenProps) {
  const [message, setMessage] = useState('');

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      try {
        // TODO: Implement message sending via backend
        console.log('Sending message:', message);
        setMessage('');
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  };

  return (
    <Box>
      <Flex justify="between" align="center" mb="5">
        <Heading size="8" style={{ color: 'white', fontWeight: 700 }}>
          My Community
        </Heading>
        <Button 
          variant="soft" 
          onClick={onBack}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
          }}
        >
          ← Geri
        </Button>
      </Flex>

      <Flex gap="4" direction={{ initial: 'column', md: 'row' }}>
        <Box
          className="liquid-glass-card"
          style={{
            flex: 2,
            padding: '2rem',
            minHeight: '600px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Heading 
            size="6" 
            mb="4"
            style={{ 
              color: 'white',
              fontWeight: 600,
            }}
          >
            Kanal
          </Heading>
          <Box
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1.5rem',
              background: 'rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              marginBottom: '1.5rem',
            }}
          >
            <Text 
              size="3" 
              style={{ 
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              Henüz mesaj yok. İlk mesajınızı gönderin!
            </Text>
          </Box>

          <Separator size="4" style={{ background: 'rgba(255, 255, 255, 0.1)' }} />

          <form onSubmit={handleSendMessage} style={{ marginTop: '1.5rem' }}>
            <Flex gap="2" align="center">
              <TextField.Root
                className="liquid-glass-input"
                size="3"
                placeholder="Mesajınızı yazın..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ 
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                }}
              />
              <Button
                className="liquid-glass-button"
                type="submit"
                size="3"
                disabled={!message.trim()}
                style={{
                  minWidth: '50px',
                }}
              >
                <ArrowRightIcon width="20" height="20" />
              </Button>
            </Flex>
          </form>

          <Button
            className="liquid-glass-button"
            size="3"
            variant="outline"
            style={{
              width: '100%',
              marginTop: '1rem',
              border: '1px solid rgba(102, 126, 234, 0.5)',
              background: 'rgba(102, 126, 234, 0.1)',
            }}
          >
            Oylama Başlat
          </Button>
        </Box>

        <Box
          className="liquid-glass-card"
          style={{
            flex: 1,
            padding: '2.5rem',
            height: 'fit-content',
          }}
        >
          <Flex direction="column" gap="5" align="center">
            <Box
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '2.5rem',
                fontWeight: 'bold',
                boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
              }}
            >
              {nickname.charAt(0).toUpperCase()}
            </Box>
            <Box style={{ textAlign: 'center' }}>
              <Heading 
                size="6" 
                style={{ 
                  color: 'white',
                  fontWeight: 600,
                }}
              >
                {nickname}
              </Heading>
              <Text 
                size="4" 
                style={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  display: 'block',
                  marginTop: '0.5rem',
                }}
              >
                Level 10
              </Text>
            </Box>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );
}
