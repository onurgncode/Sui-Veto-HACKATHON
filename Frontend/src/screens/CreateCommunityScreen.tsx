import { useState } from "react";
import { Box, Flex, Heading, Text, Button, TextField, TextArea } from "@radix-ui/themes";

interface CreateCommunityScreenProps {
  onBack: () => void;
  onCreated: () => void;
}

export function CreateCommunityScreen({ onBack, onCreated }: CreateCommunityScreenProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && description.trim()) {
      try {
        const { communityService } = await import('../services/communityService');
        const response = await communityService.createCommunity({
          name: name.trim(),
          description: description.trim(),
        });
        if (response.success) {
          onCreated();
        }
      } catch (error) {
        console.error('Failed to create community:', error);
      }
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
          }}
        >
          ← Geri
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
                size="4"
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
                Açıklama
              </Text>
              <TextArea
                className="liquid-glass-input"
                size="4"
                placeholder="Topluluğunuz hakkında bilgi verin..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  resize: 'vertical',
                }}
                required
              />
            </Box>

            <Flex gap="3" justify="end" mt="2">
              <Button
                type="button"
                variant="soft"
                onClick={onBack}
                size="4"
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
                size="4"
                disabled={!name.trim() || !description.trim()}
              >
                Oluştur
              </Button>
            </Flex>
          </Flex>
        </form>
      </Box>
    </Box>
  );
}
