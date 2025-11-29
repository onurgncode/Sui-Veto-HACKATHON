import React, { useEffect, useState } from "react";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import { Box, Flex, Heading, Text, Dialog, Button } from "@radix-ui/themes";
import { ConnectButton } from "@mysten/dapp-kit";
import { authService } from "../services/authService";
import Galaxy from "../components/Galaxy";
import { useTranslation } from "react-i18next";

interface LoginScreenProps {
  onLogin: () => void;
}

interface CachedNonce {
  nonce: string;
  message: string;
  timestamp: number;
  address: string;
}

const NONCE_CACHE_KEY = 'sui_veto_nonce_cache';
const NONCE_CACHE_DURATION = 20 * 60 * 1000; // 20 dakika

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { t, i18n } = useTranslation();
  const currentAccount = useCurrentAccount();
  const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signMessage, setSignMessage] = useState<string>("");
  const [signDetails, setSignDetails] = useState<{ address: string; nonce: string; timestamp: string } | null>(null);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'tr' ? 'en' : 'tr';
    i18n.changeLanguage(newLang);
  };

  // Cached nonce'u kontrol et
  const getCachedNonce = (address: string): { nonce: string; message: string } | null => {
    try {
      const cached = localStorage.getItem(NONCE_CACHE_KEY);
      if (!cached) return null;

      const cachedData: CachedNonce = JSON.parse(cached);
      const now = Date.now();
      
      // Aynı adres ve 20 dakika içindeyse cache'i kullan
      if (
        cachedData.address === address &&
        (now - cachedData.timestamp) < NONCE_CACHE_DURATION
      ) {
        console.log('[LoginScreen] Using cached nonce (age:', Math.floor((now - cachedData.timestamp) / 1000), 'seconds)');
        return {
          nonce: cachedData.nonce,
          message: cachedData.message,
        };
      }
      
      // Cache eski veya farklı adres, temizle
      localStorage.removeItem(NONCE_CACHE_KEY);
      return null;
    } catch (error) {
      console.error('[LoginScreen] Error reading cached nonce:', error);
      localStorage.removeItem(NONCE_CACHE_KEY);
      return null;
    }
  };

  // Nonce'u cache'e kaydet
  const cacheNonce = (address: string, nonce: string, message: string) => {
    try {
      const cacheData: CachedNonce = {
        nonce,
        message,
        timestamp: Date.now(),
        address,
      };
      localStorage.setItem(NONCE_CACHE_KEY, JSON.stringify(cacheData));
      console.log('[LoginScreen] Nonce cached for 20 minutes');
    } catch (error) {
      console.error('[LoginScreen] Error caching nonce:', error);
    }
  };

  // Wallet bağlandığında otomatik authentication yap
  // ÇÖZÜM 2: Token olsun ya da olmasın, her zaman authentication yap
  // (Backend token'ı verify edecek ve geçersizse hata dönecek)
  useEffect(() => {
    if (currentAccount && !isAuthenticating) {
      console.log('[LoginScreen] Wallet connected, starting authentication (always authenticate)...');
      // Kısa bir delay sonra authentication başlat (wallet'ın hazır olması için)
      const timer = setTimeout(() => {
        handleAuthenticate();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentAccount, isAuthenticating]);

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


  const handleSignMessage = async (message: string) => {
    if (!currentAccount) {
      throw new Error('Wallet bağlantısı gerekli');
    }

    // 2. Message'i sign et - dapp-kit'in useSignPersonalMessage hook'unu kullan
    // ÖNEMLİ: signPersonalMessage hook'u message'i Uint8Array olarak bekler
    // Wallet'lar message'i string olarak alır ve kendi encoding'lerini yaparlar
    const messageBytes = new TextEncoder().encode(message);
      
      // DEBUG: Message'i log'la
      console.log('[LoginScreen] 🔍 Message to sign:', message);
      console.log('[LoginScreen] 🔍 Message bytes length:', messageBytes.length);
      console.log('[LoginScreen] 🔍 Message bytes (first 50):', Array.from(messageBytes.slice(0, 50)).join(', '));
      console.log('[LoginScreen] 🔍 Message bytes (hex, first 50):', Array.from(messageBytes.slice(0, 50)).map(b => b.toString(16).padStart(2, '0')).join(' '));
      
      let signature: string | undefined;

      try {
        // Dapp-kit'in signPersonalMessage hook'unu kullan
        // message'i Uint8Array olarak gönder (TypeScript tipi böyle)
        const result = await signPersonalMessage({
          message: messageBytes,
        });
        
        // Result format kontrolü
        // Dapp-kit'in signPersonalMessage hook'u { bytes: Uint8Array, signature: string } formatında döndürüyor
        // bytes: SerializedSignature bytes'ı (flag + signature + publicKey)
        // signature: Base64 encoded SerializedSignature string
        const resultAny = result as any;
        
        console.log('[LoginScreen] signPersonalMessage result type:', typeof result);
        console.log('[LoginScreen] signPersonalMessage result keys:', resultAny ? Object.keys(resultAny) : 'null');
        console.log('[LoginScreen] signPersonalMessage result:', resultAny);
        
        // ÖNEMLİ: signature field'ını ÖNCE kontrol et - bu genellikle daha güvenilir
        // bytes field'ı bazen yanlış parse edilebiliyor (log'larda görüldüğü gibi neredeyse tamamen sıfır)
        if (resultAny?.signature && typeof resultAny.signature === 'string') {
          console.log('[LoginScreen] Checking signature field first (PRIORITY)...');
          const sigDecoded = Uint8Array.from(atob(resultAny.signature), c => c.charCodeAt(0));
          
          if (sigDecoded.length >= 1) {
            const firstByte = sigDecoded[0];
            console.log('[LoginScreen] Signature field first byte (flag):', firstByte, `(0x${firstByte.toString(16).padStart(2, '0')})`);
            
            if (firstByte === 0 || firstByte === 1 || firstByte === 2) {
              // Geçerli signature scheme - signature field'ını kullan
              console.log('[LoginScreen] ✅ Using signature field - valid scheme detected');
              signature = resultAny.signature;
            } else if (firstByte === 5) {
              console.log('[LoginScreen] ✅ ZkLogin signature detected - Enoki supported');
              // ZkLogin destekleniyor - Enoki üzerinden çalışıyor
              if (resultAny?.bytes) {
                console.log('[LoginScreen] Bytes field type:', typeof resultAny.bytes);
                console.log('[LoginScreen] Bytes field:', resultAny.bytes);
                console.log('[LoginScreen] Bytes field is Uint8Array?', resultAny.bytes instanceof Uint8Array);
                console.log('[LoginScreen] Bytes field is Array?', Array.isArray(resultAny.bytes));
                
                let bytesArray: Uint8Array;
                try {
                  if (resultAny.bytes instanceof Uint8Array) {
                    bytesArray = resultAny.bytes;
                    console.log('[LoginScreen] ✅ Bytes field is Uint8Array, length:', bytesArray.length);
                  } else if (Array.isArray(resultAny.bytes)) {
                    bytesArray = new Uint8Array(resultAny.bytes as number[]);
                    console.log('[LoginScreen] ✅ Bytes field is Array, converted to Uint8Array, length:', bytesArray.length);
                  } else if (typeof resultAny.bytes === 'object' && resultAny.bytes !== null) {
                    // Object ise, değerleri al
                    const values = Object.values(resultAny.bytes) as number[];
                    if (values.length > 0 && typeof values[0] === 'number') {
                      bytesArray = new Uint8Array(values);
                      console.log('[LoginScreen] ✅ Bytes field is Object, converted to Uint8Array, length:', bytesArray.length);
                    } else {
                      throw new Error(`Invalid bytes field format: object values are not numbers. Type: ${typeof values[0]}`);
                    }
                  } else {
                    throw new Error(`Invalid bytes field format: expected Uint8Array, Array, or Object, got ${typeof resultAny.bytes}`);
                  }
                  
                  // bytesArray oluşturuldu, şimdi kontrol et
                  if (bytesArray.length >= 1) {
                    const bytesFirstByte = bytesArray[0];
                    console.log('[LoginScreen] Bytes field first byte (flag):', bytesFirstByte, `(0x${bytesFirstByte.toString(16).padStart(2, '0')})`);
                    console.log('[LoginScreen] Bytes field (first 20):', Array.from(bytesArray.slice(0, 20)).join(', '));
                    
                    if (bytesFirstByte !== 5) {
                      console.log('[LoginScreen] ✅ Bytes field has valid scheme, using it');
                      // bytes field'ından signature oluştur
                      const expectedLength = bytesFirstByte === 0 ? 97 : bytesFirstByte === 1 || bytesFirstByte === 2 ? 98 : bytesArray.length;
                      const finalBytes = bytesArray.slice(0, expectedLength);
                      const binary = Array.from(finalBytes, byte => String.fromCharCode(byte)).join('');
                      signature = btoa(binary);
                      console.log('[LoginScreen] ✅ Signature created from bytes field, length:', signature.length);
                    } else {
                      // ZkLogin destekleniyor - Enoki üzerinden çalışıyor
                      console.log('[LoginScreen] ✅ ZkLogin signature - Enoki supported');
                      const binary = Array.from(bytesArray, byte => String.fromCharCode(byte)).join('');
                      signature = btoa(binary);
                    }
                  } else {
                    throw new Error('Bytes field is empty or invalid.');
                  }
                } catch (parseError) {
                  console.error('[LoginScreen] ❌ Error parsing bytes field:', parseError);
                  if (parseError instanceof Error) {
                    throw new Error(`Failed to parse bytes field: ${parseError.message}`);
                  }
                  throw new Error('Failed to parse bytes field from wallet.');
                }
              } else {
                // ZkLogin destekleniyor - Enoki üzerinden çalışıyor
                console.log('[LoginScreen] ✅ ZkLogin signature - Enoki supported');
                // signature field'ını direkt kullan
                signature = resultAny.signature;
              }
            } else {
              // Unknown scheme, signature field'ını kullan (fallback)
              console.warn('[LoginScreen] ⚠️ Unknown signature scheme in signature field, using it anyway');
              signature = resultAny.signature;
            }
          }
        } else if (resultAny?.bytes) {
          // signature field yoksa, bytes field'ını kontrol et
          console.log('[LoginScreen] Checking bytes field (signature field not available)...');
          let signatureBytes: Uint8Array;
          
          if (resultAny.bytes instanceof Uint8Array) {
            signatureBytes = resultAny.bytes;
          } else if (Array.isArray(resultAny.bytes)) {
            signatureBytes = new Uint8Array(resultAny.bytes as number[]);
          } else {
            const values = Object.values(resultAny.bytes) as number[];
            signatureBytes = new Uint8Array(values);
          }
          
          console.log('[LoginScreen] Bytes field length:', signatureBytes.length);
          console.log('[LoginScreen] Bytes field (first 20):', Array.from(signatureBytes.slice(0, 20)).join(', '));
          
          // Geçerlilik kontrolü: çok fazla sıfır içeriyorsa, bu geçersiz bir signature
          const nonZeroCount = Array.from(signatureBytes.slice(0, 20)).filter(b => b !== 0).length;
          const isLikelyInvalid = nonZeroCount < 5; // İlk 20 byte'ın 5'inden azı sıfır değilse, muhtemelen geçersiz
          
          if (isLikelyInvalid) {
            console.warn('[LoginScreen] ⚠️ Bytes field appears invalid (too many zeros), this should not happen');
            throw new Error('Invalid signature format from wallet. Please try disconnecting and reconnecting your wallet.');
          }
          
          // Signature scheme kontrolü
          if (signatureBytes.length >= 1) {
            const firstByte = signatureBytes[0];
            console.log('[LoginScreen] Bytes field first byte (flag):', firstByte, `(0x${firstByte.toString(16).padStart(2, '0')})`);
            
            if (firstByte === 0 || firstByte === 1 || firstByte === 2) {
              // Geçerli signature scheme
              console.log('[LoginScreen] ✅ Using bytes field - valid signature scheme detected');
              
              // Sui format'ına göre doğru uzunluğa trim et
              let finalSignatureBytes = signatureBytes;
              if (firstByte === 0 && signatureBytes.length > 97) {
                finalSignatureBytes = signatureBytes.slice(0, 97);
                console.log('[LoginScreen] Trimmed to 97 bytes for Ed25519');
              } else if ((firstByte === 1 || firstByte === 2) && signatureBytes.length > 98) {
                finalSignatureBytes = signatureBytes.slice(0, 98);
                console.log('[LoginScreen] Trimmed to 98 bytes for Secp256k1/Secp256r1');
              }
              
              // Base64'e çevir
              const binary = Array.from(finalSignatureBytes, byte => String.fromCharCode(byte)).join('');
              signature = btoa(binary);
              console.log('[LoginScreen] ✅ Signature created from bytes field, length:', signature.length);
            } else if (firstByte === 5) {
              // ZkLogin destekleniyor - Enoki üzerinden çalışıyor
              console.log('[LoginScreen] ✅ ZkLogin signature - Enoki supported');
              const binary = Array.from(signatureBytes, byte => String.fromCharCode(byte)).join('');
              signature = btoa(binary);
            } else {
              throw new Error(`Unknown signature scheme (${firstByte}). Please use a standard wallet (Ed25519, Secp256k1, or Secp256r1).`);
            }
          }
        } else if (typeof result === 'string') {
          // bytes field yoksa, signature field'ını kullan
          console.log('[LoginScreen] Using signature field (bytes field not available)');
          signature = resultAny.signature;
          
          // Signature'ı decode edip kontrol et
          try {
            const decoded = Uint8Array.from(atob(resultAny.signature), c => c.charCodeAt(0));
            if (decoded.length >= 1 && decoded[0] === 5) {
              // ZkLogin destekleniyor - Enoki üzerinden çalışıyor
              console.log('[LoginScreen] ✅ ZkLogin signature - Enoki supported');
            }
          } catch (error) {
            if (error instanceof Error && error.message.includes('ZkLogin')) {
              throw error;
            }
            console.warn('[LoginScreen] Could not decode signature field for analysis:', error);
          }
        } else if (typeof result === 'string') {
          // Direkt string ise
          console.log('[LoginScreen] Result is string (SerializedSignature), using directly');
          signature = result;
        } else {
          throw new Error('Invalid signature result format - no bytes or signature field found');
        }
        
        if (!signature) {
          throw new Error('Signature could not be extracted from result');
        }
        
        console.log('[LoginScreen] Message signed successfully, signature type:', typeof signature, 'length:', signature.length);
        
        // Signature format analizi - final kontrol
        if (typeof signature === 'string') {
          try {
            const decoded = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
            console.log('[LoginScreen] Final signature decoded from base64, bytes length:', decoded.length);
            
            if (decoded.length >= 1) {
              const firstByte = decoded[0];
              console.log('[LoginScreen] Final signature first byte (flag):', firstByte, `(0x${firstByte.toString(16).padStart(2, '0')})`);
              
              if (firstByte === 5) {
                // ZkLogin destekleniyor - Enoki üzerinden çalışıyor
                console.log('[LoginScreen] ✅ Final signature is ZkLogin - Enoki supported');
              } else if (firstByte === 0 || firstByte === 1 || firstByte === 2) {
                console.log('[LoginScreen] ✅ Final signature has valid scheme:', firstByte === 0 ? 'Ed25519' : firstByte === 1 ? 'Secp256k1' : 'Secp256r1');
              }
            }
          } catch (decodeError) {
            if (decodeError instanceof Error && decodeError.message.includes('ZkLogin')) {
              throw decodeError;
            }
            // Base64 decode başarısız olabilir, bu normal (hex string olabilir)
            console.log('[LoginScreen] Could not decode signature for analysis (may be hex string):', decodeError);
          }
        }
      } catch (signError) {
        console.error('[LoginScreen] Message signing error:', signError);
        throw signError instanceof Error 
          ? signError 
          : new Error('Message imzalama hatası');
      }

      return signature;
  };

  const handleAuthenticate = async () => {
    if (!currentAccount) {
      setAuthError('Wallet bağlantısı gerekli');
      return;
    }

    console.log('[LoginScreen] 🔍 Starting authentication for:');
    console.log('[LoginScreen] 🔍 Address:', currentAccount.address);
    console.log('[LoginScreen] 🔍 Account Label:', currentAccount.label);
    console.log('[LoginScreen] 🔍 Account Public Key:', currentAccount.publicKey);
    console.log('[LoginScreen] 🔍 Account Chains:', currentAccount.chains);
    console.log('[LoginScreen] 🔍 Full Account Object:', JSON.stringify(currentAccount, null, 2));

    setIsAuthenticating(true);
    setAuthError(null);

    try {
      // 1. Önce cache'den nonce kontrol et
      let message: string;
      let nonce: string;
      
      const cached = getCachedNonce(currentAccount.address);
      if (cached) {
        // Cache'den kullan
        message = cached.message;
        nonce = cached.nonce;
        console.log('[LoginScreen] Using cached nonce');
      } else {
        // Cache yok veya eski, backend'den yeni nonce al
        console.log('[LoginScreen] Fetching new nonce from backend');
        const nonceResponse = await authService.generateNonce(currentAccount.address);
        if (!nonceResponse.success || !nonceResponse.data) {
          throw new Error(nonceResponse.error || 'Nonce alınamadı');
        }

        message = nonceResponse.data.message;
        nonce = nonceResponse.data.nonce;
        
        // Yeni nonce'u cache'e kaydet
        cacheNonce(currentAccount.address, nonce, message);
      }

      // Show custom sign modal and wait for user confirmation
      setSignMessage(message);
      setSignDetails({
        address: currentAccount.address,
        nonce: nonce,
        timestamp: Date.now().toString(),
      });
      setShowSignModal(true);

      // Wait for user to confirm in modal, then continue with signing
      // The actual signing will be triggered by the Sign button in the modal
      return;
    } catch (error) {
      console.error('[LoginScreen] Authentication error:', error);
      let errorMessage = 'Authentication hatası';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object') {
        const errorObj = error as any;
        if (errorObj.message) {
          errorMessage = errorObj.message;
        } else if (errorObj.error) {
          errorMessage = errorObj.error;
        } else {
          errorMessage = JSON.stringify(error);
        }
      }
      
      setAuthError(errorMessage);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Box
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: '#000000',
      } as React.CSSProperties}
    >
      {/* Background Galaxy with Purple/Magenta tones */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'auto',
        }}
      >
        <Galaxy
          mouseRepulsion={true}
          mouseInteraction={true}
          density={1.5}
          glowIntensity={0.5}
          saturation={0.8}
          hueShift={280}
          transparent={true}
        />
      </Box>

      {/* Dark overlay for better contrast */}
      <Box
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%)',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      />

      {/* Navigation Bar */}
      <Box
        style={{
          position: 'relative',
          width: '100%',
          padding: '1.5rem 2rem',
          zIndex: 100,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Flex align="center" gap="3">
        <Box
          style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(236, 72, 153, 0.3) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>S</Text>
          </Box>
          <Text
            style={{
              color: 'white',
              fontSize: '1.25rem',
              fontWeight: 600,
              letterSpacing: '-0.02em',
            }}
          >
            {t('login.title')}
          </Text>
        </Flex>
        <Button
          onClick={toggleLanguage}
          variant="soft"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '10px',
            padding: '0.5rem 1rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
            fontSize: '0.875rem',
            fontWeight: 500,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
          }}
        >
          {i18n.language === 'tr' ? 'EN' : 'TR'}
        </Button>
      </Box>

      {/* Main Content */}
      <Flex
        direction="column"
        align="center"
        justify="center"
        style={{
          flex: 1,
          width: '100%',
          padding: '2rem',
          position: 'relative',
          zIndex: 100,
          pointerEvents: 'auto',
          minHeight: 0,
        }}
      >
        {/* Central Login Card */}
        <Box
            style={{
              width: '100%',
              maxWidth: '420px',
            padding: '3rem 2.5rem',
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            borderRadius: '24px',
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
                {t('login.card3.title')}
              </Heading>
              <Text
                size="3"
                style={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontWeight: 400,
                  letterSpacing: '0.01em',
                  fontSize: '0.95rem',
                }}
              >
                {t('login.card3.description')}
              </Text>
            </Box>

            <Flex direction="column" gap="3" style={{ width: '100%', marginTop: '1rem' }}>
              <Box style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ConnectButton
                  connectText={t('login.card3.button')}
                  style={{
                    padding: '0.875rem 2rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: 'linear-gradient(135deg, #ffffff 0%, #e0e0e0 100%)',
                    color: '#000000',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
                    cursor: 'pointer',
                    borderRadius: '12px',
                    transition: 'all 0.2s ease',
                    width: '100%',
                    maxWidth: '280px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                />
              </Box>
              
              {currentAccount && isAuthenticating && (
                <Text
                  size="3"
                  style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    textAlign: 'center',
                    fontSize: '0.95rem',
              marginTop: '1rem',
                  }}
                >
                  Doğrulanıyor...
                </Text>
              )}
              
              {authError && (
                <Text
                  size="2"
                  style={{
                    color: 'rgba(255, 100, 100, 0.9)',
                    textAlign: 'center',
                    fontSize: '0.85rem',
                  }}
                >
                  {authError}
                </Text>
              )}
            </Flex>
          </Flex>
        </Box>
      </Flex>

      {/* Custom Sign Message Modal */}
      <Dialog.Root open={showSignModal} onOpenChange={setShowSignModal}>
        <Dialog.Content
          style={{
            maxWidth: '500px',
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            padding: '2rem',
          }}
        >
          <Dialog.Title
            style={{
              color: 'white',
              fontSize: '1.25rem',
              fontWeight: 600,
              marginBottom: '1rem',
            }}
          >
            {t('login.signModal.title')}
          </Dialog.Title>

          <Box style={{ marginBottom: '1.5rem' }}>
            <Text
              size="2"
              style={{
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: '0.5rem',
                display: 'block',
              }}
            >
              {t('login.signModal.description')}
            </Text>
            <Box
              style={{
                padding: '1rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Text
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: '0.9rem',
                  lineHeight: 1.6,
                }}
              >
                {signMessage}
              </Text>
            </Box>
          </Box>

          <Box style={{ marginBottom: '1.5rem' }}>
            {signDetails && (
              <Box
                style={{
                  padding: '1rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Flex direction="column" gap="2">
                  <Text
                    size="2"
                    style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {t('login.signModal.address')}: {signDetails.address}
                  </Text>
                  <Text
                    size="2"
                    style={{
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {t('login.signModal.nonce')}: {signDetails.nonce}
                  </Text>
        <Text 
                    size="2"
          style={{ 
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontFamily: 'monospace',
                    }}
                  >
                    {t('login.signModal.timestamp')}: {signDetails.timestamp}
        </Text>
      </Flex>
              </Box>
            )}
          </Box>

          <Flex gap="3" justify="end">
            <Dialog.Close>
            <button
              onClick={() => {
                setShowSignModal(false);
                setIsAuthenticating(false);
              }}
              style={{
                  padding: '0.75rem 1.5rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  color: 'white',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                }}
              >
                {t('login.signModal.reject')}
              </button>
            </Dialog.Close>
            <button
              onClick={async () => {
                if (!signMessage || !currentAccount) return;
                
                try {
                  setShowSignModal(false);
                  
                  // Sign the message
                  const signature = await handleSignMessage(signMessage);
                  
                  // 3. Backend'e authenticate et
                  console.log('[LoginScreen] 🔍 Sending to backend:');
                  console.log('[LoginScreen] 🔍 Address:', currentAccount.address);
                  console.log('[LoginScreen] 🔍 Account Label:', currentAccount.label);
                  console.log('[LoginScreen] 🔍 Account Public Key:', currentAccount.publicKey);
                  console.log('[LoginScreen] 🔍 Message:', signMessage);
                  console.log('[LoginScreen] 🔍 Signature length:', signature.length);
                  console.log('[LoginScreen] 🔍 Signature (first 50 chars):', signature.substring(0, 50));
                  console.log('[LoginScreen] 🔍 Full Account Object:', JSON.stringify(currentAccount, null, 2));
                  
                  const authResponse = await authService.authenticate(
                    currentAccount.address,
                    signMessage,
                    signature
                  );

                  if (!authResponse.success) {
                    const errorMsg = authResponse.error || t('login.errors.authError');
                    console.error('[LoginScreen] Authentication failed:', errorMsg, authResponse);
                    throw new Error(errorMsg);
                  }

                  // 4. Başarılı - Token localStorage'da zaten kaydedildi (authService.authenticate içinde)
                  console.log('[LoginScreen] ✅ Authentication successful, token saved');
                  
                  // 5. onLogin callback'ini çağır - App.tsx'te nickname kontrolü yapılacak
                  onLogin();
                } catch (error) {
                  console.error('[LoginScreen] Authentication error:', error);
                  let errorMessage = 'Authentication hatası';
                  
                  if (error instanceof Error) {
                    errorMessage = error.message;
                  } else if (typeof error === 'string') {
                    errorMessage = error;
                  }
                  
                  setAuthError(errorMessage);
                  setIsAuthenticating(false);
                }
              }}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.2s ease',
              }}
            >
              {t('login.signModal.sign')}
            </button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
}
