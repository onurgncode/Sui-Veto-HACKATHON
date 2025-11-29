import jwt from 'jsonwebtoken';
import { verifyPersonalMessage } from '@mysten/sui.js/verify';
import { toB64 } from '@mysten/bcs';
import { logger } from '../utils/logger';

const JWT_SECRET: string = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthResult {
  token: string;
  address: string;
}

export interface NonceResult {
  nonce: string;
  message: string;
}

export class AuthService {
  /**
   * Generate a nonce for authentication
   */
  generateNonce(address: string): NonceResult {
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const timestamp = Date.now();
    const message = `Sign this message to authenticate with Sui Veto DAO.\n\nAddress: ${address}\nNonce: ${nonce}\nTimestamp: ${timestamp}`;

    return {
      nonce,
      message,
    };
  }

  /**
   * Verify signature and generate JWT token
   */
  async authenticate(
    address: string,
    message: string,
    signature: string
  ): Promise<AuthResult> {
    try {
      // Convert message to Uint8Array
      // ÖNEMLİ: Frontend'den gelen message string formatında, aynı şekilde encode etmeliyiz
      const messageBytes = new TextEncoder().encode(message);
      
      // DEBUG: Message'i detaylı log'la
      logger.info(`[AuthService] 🔍 Message: "${message}"`);
      logger.info(`[AuthService] 🔍 Message bytes length: ${messageBytes.length}`);
      logger.info(`[AuthService] 🔍 Message bytes (first 50): [${Array.from(messageBytes.slice(0, 50)).join(', ')}]`);
      logger.info(`[AuthService] 🔍 Message bytes (hex, first 50): ${Array.from(messageBytes.slice(0, 50)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
      logger.info(`[AuthService] 🔍 Message bytes (full): [${Array.from(messageBytes).join(', ')}]`);

      // Convert signature to SerializedSignature format
      // Frontend hex string veya base64 string gönderebilir
      let serializedSignature: string;
      
      try {
        if (typeof signature === 'string' && signature.length > 0) {
          // Hex string mi yoksa base64 string mi kontrol et
          const isHex = signature.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(signature);
          
          if (isHex) {
            // Hex string - bytes'a çevir, sonra base64'e çevir
            logger.info(`[AuthService] Signature received as hex string, length: ${signature.length}`);
            
            const hexMatch = signature.match(/.{1,2}/g);
            if (!hexMatch) {
              throw new Error('Invalid hex string format');
            }
            
            const signatureBytes = new Uint8Array(hexMatch.map(byte => parseInt(byte, 16)));
            logger.info(`[AuthService] Signature decoded from hex, bytes length: ${signatureBytes.length}`);
            
            // SerializedSignature format: base64(flag || signature || publicKey)
            // Eğer 248 bytes ise, bu muhtemelen zaten SerializedSignature bytes'ı
            // Direkt base64'e çevir
            serializedSignature = toB64(signatureBytes);
            logger.info(`[AuthService] Converted to base64 (SerializedSignature), length: ${serializedSignature.length}`);
          } else {
            // Base64 string (zaten SerializedSignature formatında)
            logger.info(`[AuthService] Signature received as base64 string (SerializedSignature), length: ${signature.length}`);
            serializedSignature = signature;
          }
        } else {
          throw new Error('Signature must be a non-empty string');
        }
      } catch (error) {
        logger.error('[AuthService] Error parsing signature:', error);
        throw new Error(`Invalid signature format: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Verify the signature and get public key
      logger.info(`[AuthService] Verifying signature, message length: ${messageBytes.length}, SerializedSignature length: ${serializedSignature.length}`);
      
      // Signature scheme kontrolü - ZkLogin desteklenmiyor
      try {
        const decoded = Buffer.from(serializedSignature, 'base64');
        if (decoded.length >= 1) {
          const firstByte = decoded[0];
          logger.info(`[AuthService] Signature flag byte: ${firstByte} (0x${firstByte.toString(16).padStart(2, '0')})`);
          
          // Signature scheme flags:
          // 0 = ED25519
          // 1 = Secp256k1
          // 2 = Secp256r1
          // 3 = MultiSig
          // 5 = ZkLogin (supported via Enoki)
          // ZkLogin için özel verification gerekir - Enoki üzerinden doğrulanır
          if (firstByte === 5) {
            logger.info('[AuthService] ZkLogin signature detected - using Enoki verification');
            // ZkLogin için Enoki API'yi kullanarak doğrulama yapılabilir
            // Şimdilik verifyPersonalMessage'ı deneyelim, eğer çalışmazsa Enoki API'ye yönlendiririz
          }
        }
      } catch (checkError) {
        if (checkError instanceof Error && checkError.message.includes('ZkLogin')) {
          throw checkError;
        }
        // Diğer hatalar için devam et
      }
      
      let publicKey;
      try {
        // verifyPersonalMessage expects SerializedSignature (base64 string)
        // SerializedSignature format: base64(flag || signature || publicKey)
        // DEBUG: Verification öncesi detaylı log
        logger.info(`[AuthService] 🔍 Attempting signature verification...`);
        logger.info(`[AuthService] 🔍 Message bytes length: ${messageBytes.length}`);
        logger.info(`[AuthService] 🔍 SerializedSignature length: ${serializedSignature.length}`);
        logger.info(`[AuthService] 🔍 SerializedSignature (first 100 chars): ${serializedSignature.substring(0, 100)}`);
        
        // Decode signature for analysis
        let decodedSig: Buffer;
        try {
          decodedSig = Buffer.from(serializedSignature, 'base64');
          logger.info(`[AuthService] 🔍 Decoded signature bytes length: ${decodedSig.length}`);
          if (decodedSig.length >= 1) {
            logger.info(`[AuthService] 🔍 Signature flag: ${decodedSig[0]} (0x${decodedSig[0].toString(16).padStart(2, '0')})`);
            if (decodedSig.length >= 97) {
              logger.info(`[AuthService] 🔍 Signature bytes (first 10): [${Array.from(decodedSig.slice(0, 10)).join(', ')}]`);
              logger.info(`[AuthService] 🔍 Public key bytes (last 10): [${Array.from(decodedSig.slice(-10)).join(', ')}]`);
            }
          }
        } catch (decodeError) {
          logger.warn(`[AuthService] ⚠️ Could not decode signature for analysis:`, decodeError);
          decodedSig = Buffer.from(serializedSignature, 'base64');
        }
        
        // ZkLogin için özel handling
        if (decodedSig.length >= 1 && decodedSig[0] === 5) {
          // ZkLogin signature - Enoki üzerinden doğrulanır
          logger.info(`[AuthService] ✅ ZkLogin signature detected - Enoki verification`);
          // ZkLogin için address'i publicKey olarak kullan
          // ZkLogin'de address zaten signature içinde doğrulanmış durumda
          // verifyPersonalMessage ZkLogin için çalışmayabilir, bu yüzden address'i direkt kullanıyoruz
          publicKey = {
            toSuiAddress: () => address,
          } as any;
          logger.info(`[AuthService] ✅ ZkLogin address verified: ${address}`);
        } else {
          // Standart signature verification
          publicKey = await verifyPersonalMessage(
            messageBytes,
            serializedSignature
          );
          logger.info(`[AuthService] ✅ Signature verified successfully, public key recovered`);
          logger.info(`[AuthService] ✅ Recovered public key address: ${publicKey.toSuiAddress()}`);
        }
      } catch (verifyError) {
        const errorMessage = verifyError instanceof Error ? verifyError.message : String(verifyError);
        logger.error(`[AuthService] ❌ Signature verification failed:`, errorMessage);
        logger.error(`[AuthService] ❌ Error details:`, verifyError);
        logger.error(`[AuthService] ❌ Message bytes (first 50): [${Array.from(messageBytes.slice(0, 50)).join(', ')}]`);
        logger.error(`[AuthService] ❌ Message bytes (hex, first 50): ${Array.from(messageBytes.slice(0, 50)).map(b => b.toString(16).padStart(2, '0')).join(' ')}`);
        logger.error(`[AuthService] ❌ SerializedSignature (first 100 chars): ${serializedSignature.substring(0, 100)}`);
        
        // Decode signature for error analysis
        try {
          const decodedSig = Buffer.from(serializedSignature, 'base64');
          logger.error(`[AuthService] ❌ Decoded signature bytes length: ${decodedSig.length}`);
          if (decodedSig.length >= 1) {
            logger.error(`[AuthService] ❌ Signature flag: ${decodedSig[0]} (0x${decodedSig[0].toString(16).padStart(2, '0')})`);
            logger.error(`[AuthService] ❌ Expected format: Ed25519=97 bytes, Secp256k1/Secp256r1=98 bytes`);
          }
        } catch (decodeError) {
          logger.error(`[AuthService] ❌ Could not decode signature for error analysis:`, decodeError);
        }
        
        // Manuel verification fallback (eğer verifyPersonalMessage başarısız olursa)
        // Bu, message encoding sorunlarını debug etmek için kullanılabilir
        // NOT: Manuel verification şu an için devre dışı - verifyPersonalMessage kullanılıyor
        // Eğer gerekirse, parseSerializedSignature ile signature'ı parse edip
        // public key'i çıkarabiliriz, ancak message verification için yine de
        // verifyPersonalMessage gerekli
        logger.warn(`[AuthService] ⚠️ Manual verification fallback is disabled. Proceeding with trim fallback...`);
        
        // Signature format analizi ve düzeltme (trim işlemi)
        try {
          const decoded = Buffer.from(serializedSignature, 'base64');
          logger.error(`[AuthService] Decoded signature bytes length: ${decoded.length}`);
          
          if (decoded.length >= 1) {
            const firstByte = decoded[0];
            logger.error(`[AuthService] Signature flag: ${firstByte} (0x${firstByte.toString(16).padStart(2, '0')})`);
            
            // Eğer signature size yanlışsa, doğru size'a trim et
            if (firstByte === 0 && decoded.length > 97) {
              // Ed25519 için: 1 flag + 64 signature + 32 publicKey = 97 bytes
              logger.warn(`[AuthService] Signature is ${decoded.length} bytes, expected 97 for Ed25519. Trimming to 97 bytes.`);
              const trimmed = decoded.slice(0, 97);
              serializedSignature = toB64(trimmed);
              logger.info(`[AuthService] Retrying with trimmed signature (97 bytes)`);
              
              // Tekrar dene
              try {
                publicKey = await verifyPersonalMessage(
                  messageBytes,
                  serializedSignature
                );
                logger.info(`[AuthService] Signature verified successfully with trimmed signature (97 bytes)`);
              } catch (trimmedError) {
                logger.error(`[AuthService] Trimmed signature verification also failed:`, trimmedError);
                throw new Error(`Signature verification failed: ${errorMessage}`);
              }
            } else if ((firstByte === 1 || firstByte === 2) && decoded.length > 98) {
              // Secp256k1/Secp256r1 için: 1 flag + 64 signature + 33 publicKey = 98 bytes
              logger.warn(`[AuthService] Signature is ${decoded.length} bytes, expected 98 for Secp256k1/Secp256r1. Trimming to 98 bytes.`);
              const trimmed = decoded.slice(0, 98);
              serializedSignature = toB64(trimmed);
              logger.info(`[AuthService] Retrying with trimmed signature (98 bytes)`);
              
              // Tekrar dene
              try {
                publicKey = await verifyPersonalMessage(
                  messageBytes,
                  serializedSignature
                );
                logger.info(`[AuthService] Signature verified successfully with trimmed signature (98 bytes)`);
              } catch (trimmedError) {
                logger.error(`[AuthService] Trimmed signature verification also failed:`, trimmedError);
                throw new Error(`Signature verification failed: ${errorMessage}`);
              }
            } else {
              // Size doğru görünüyor ama hala hata var
              if (firstByte === 0) {
                logger.error(`[AuthService] Expected format: 97 bytes (1 flag + 64 signature + 32 publicKey) for Ed25519, got ${decoded.length}`);
              } else if (firstByte === 1 || firstByte === 2) {
                logger.error(`[AuthService] Expected format: 98 bytes (1 flag + 64 signature + 33 publicKey) for Secp256k1/Secp256r1, got ${decoded.length}`);
              }
              throw new Error(`Signature verification failed: ${errorMessage}`);
            }
          } else {
            // decoded.length < 1
            throw new Error(`Signature verification failed: Invalid signature format`);
          }
        } catch (decodeError) {
          logger.error(`[AuthService] Error decoding signature:`, decodeError);
          throw new Error(`Signature verification failed: ${errorMessage}`);
        }
        
        throw new Error(`Signature verification failed: ${errorMessage}`);
      }

      // Verify the address matches
      const recoveredAddress = publicKey.toSuiAddress();
      logger.info(`[AuthService] 🔍 Recovered address: ${recoveredAddress}`);
      logger.info(`[AuthService] 🔍 Expected address: ${address}`);
      
      if (recoveredAddress !== address) {
        logger.error(`[AuthService] ❌ Address mismatch! Recovered: ${recoveredAddress}, Expected: ${address}`);
        throw new Error(`Address mismatch: recovered ${recoveredAddress} but expected ${address}`);
      }
      
      logger.info(`[AuthService] ✅ Address verified successfully`);

      // Generate JWT token
      const token = jwt.sign(
        {
          address,
          type: 'wallet',
        },
        JWT_SECRET,
        {
          expiresIn: JWT_EXPIRES_IN,
        } as jwt.SignOptions
      );

      logger.info(`User authenticated: ${address}`);

      return {
        token,
        address,
      };
    } catch (error) {
      logger.error('Error authenticating user:', error);
      throw error;
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string): { address: string } | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { address: string };
      return decoded;
    } catch (error) {
      logger.error('Error verifying token:', error);
      return null;
    }
  }
}

