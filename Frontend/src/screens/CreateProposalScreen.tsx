import { useState, useEffect } from "react";
import { useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Button, TextField } from "@radix-ui/themes";
import { proposalService } from "../services/proposalService";
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
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [quorumThreshold, setQuorumThreshold] = useState('50');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !deadline || !quorumThreshold) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    const deadlineTimestamp = new Date(deadline).getTime();
    if (deadlineTimestamp <= Date.now()) {
      setError('Son tarih gelecekte bir tarih olmalıdır');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get transaction from backend
      const response = await proposalService.createProposal({
        commityId: communityId,
        messageId: '', // Can be empty for now
        title: title.trim(),
        description: description.trim(),
        deadline: deadlineTimestamp,
        quorumThreshold: parseInt(quorumThreshold, 10),
      });

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to create proposal transaction');
      }

      // Deserialize transaction
      const { Transaction } = await import("@mysten/sui/transactions");
      const base64String = response.data.transaction.transactionBlock;
      const binaryString = atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const tx = Transaction.from(bytes);

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: () => {
            onCreated();
          },
          onError: (error) => {
            console.error('Proposal creation failed:', error);
            setError('Öneri oluşturma başarısız: ' + (error.message || 'Bilinmeyen hata'));
            setIsSubmitting(false);
          },
        }
      );
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

