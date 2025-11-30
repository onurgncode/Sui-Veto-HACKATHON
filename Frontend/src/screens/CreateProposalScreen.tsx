import { useState, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button, TextField } from "@radix-ui/themes";
import { Transaction } from "@mysten/sui/transactions";
import { profileService } from "../services/profileService";

interface CreateProposalScreenProps {
  communityId: string;
  onBack: () => void;
  onCreated: () => void;
}

export function CreateProposalScreen({ 
  communityId, 
  onBack, 
  onCreated 
}: CreateProposalScreenProps) {
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [quorumThreshold, setQuorumThreshold] = useState('50');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      if (currentAccount) {
        const response = await profileService.getProfile(currentAccount.address);
        if (response.success && response.data?.profile) {
          setProfileId(response.data.profile.id);
        }
      }
    };
    loadProfile();
  }, [currentAccount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !deadline || !quorumThreshold) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    const deadlineDate = new Date(deadline);
    const deadlineTimestamp = deadlineDate.getTime(); // Keep in milliseconds (contract expects milliseconds)
    const nowTimestamp = Date.now();
    
    if (deadlineTimestamp <= nowTimestamp) {
      setError('Son tarih gelecekte bir tarih olmalıdır');
      return;
    }

    if (!currentAccount || !profileId) {
      setError('Wallet bağlantısı veya profil gerekli');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const packageId = import.meta.env.VITE_PACKAGE_ID || '0x6b30552018493c6daaef95c7a1956aca5adc1528513a7bc0d831cd9b136a8f90';
      
      // Frontend'de transaction'ı direkt oluştur
      const tx = new Transaction();
      
      // messageId için placeholder - boş string'i ID'ye çeviriyoruz
      const quorumValue = parseInt(quorumThreshold, 10);
      const messageId = ''; // Backend'de de boş string kullanılıyor
      
      tx.moveCall({
        target: `${packageId}::dao_app::create_proposal`,
        arguments: [
          tx.object(communityId),
          tx.pure.id(messageId || '0x0'), // messageId - boş string için 0x0 fallback
          tx.pure.string(title.trim()),
          tx.pure.string(description.trim()),
          tx.pure.u64(deadlineTimestamp),
          tx.pure.u64(quorumValue),
          tx.pure.bool(false), // is_join_request = false for regular proposals
        ],
      });

      await signAndExecute({
        transaction: tx,
      });
      
      onCreated();
      setIsSubmitting(false);
    } catch (error) {
      console.error('Proposal creation error:', error);
      setError('Öneri oluşturma hatası: ' + (error instanceof Error ? error.message : 'Bilinmeyen hata'));
      setIsSubmitting(false);
    }
  };

  // Get minimum date (tomorrow)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().slice(0, 16);

  return (
    <Box style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <Flex justify="between" align="center" mb="6">
        <Heading 
          size="8" 
          style={{ 
            color: 'rgba(255, 255, 255, 0.95)', 
            fontWeight: 700,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
          }}
        >
          Yeni Öneri
        </Heading>
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

      <Box
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '2rem',
        }}
      >
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="5">
            <Box>
              <Text 
                size="3" 
                weight="bold" 
                mb="2" 
                style={{ 
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                }}
              >
                Başlık
              </Text>
              <TextField.Root
                size="3"
                placeholder="Öneri başlığı"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                }}
                required
              />
            </Box>

            <Box>
              <Text 
                size="3" 
                weight="bold" 
                mb="2" 
                style={{ 
                  display: 'block',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                }}
              >
                Açıklama
              </Text>
              <textarea
                placeholder="Öneri açıklaması"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '120px',
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  fontSize: '1rem',
                  resize: 'vertical',
                }}
                required
              />
            </Box>

            <Flex gap="4">
              <Box style={{ flex: 1 }}>
                <Text 
                  size="3" 
                  weight="bold" 
                  mb="2" 
                  style={{ 
                    display: 'block',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  }}
                >
                  Son Tarih
                </Text>
                <TextField.Root
                  type="datetime-local"
                  size="3"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  min={minDateString}
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  }}
                  required
                />
              </Box>

              <Box style={{ flex: 1 }}>
                <Text 
                  size="3" 
                  weight="bold" 
                  mb="2" 
                  style={{ 
                    display: 'block',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  }}
                >
                  Yeter Sayı (%)
                </Text>
                <TextField.Root
                  type="number"
                  size="3"
                  placeholder="50"
                  value={quorumThreshold}
                  onChange={(e) => setQuorumThreshold(e.target.value)}
                  min="1"
                  max="100"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  }}
                  required
                />
              </Box>
            </Flex>

            {error && (
              <Box
                style={{
                  padding: '1rem',
                  background: 'rgba(244, 67, 54, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(244, 67, 54, 0.3)',
                }}
              >
                <Text 
                  size="3" 
                  style={{ 
                    color: 'rgba(244, 67, 54, 0.9)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                  }}
                >
                  {error}
                </Text>
              </Box>
            )}

            <Flex gap="3" justify="end" mt="2">
              <Button
                type="button"
                variant="soft"
                onClick={onBack}
                disabled={isSubmitting}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '12px',
                  padding: '0.75rem 1.5rem',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                }}
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: isSubmitting
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(236, 72, 153, 0.9) 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.75rem 2rem',
                  fontWeight: 600,
                  fontSize: '1rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.5 : 1,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
                }}
              >
                {isSubmitting ? 'Oluşturuluyor...' : 'Oluştur'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Box>
    </Box>
  );
}

