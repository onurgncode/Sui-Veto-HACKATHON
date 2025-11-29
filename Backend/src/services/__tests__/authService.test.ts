import { AuthService } from '../authService';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService();
  });

  describe('generateNonce', () => {
    it('should generate a nonce and message', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const result = service.generateNonce(address);

      expect(result).toHaveProperty('nonce');
      expect(result).toHaveProperty('message');
      expect(result.nonce).toBeTruthy();
      expect(result.message).toContain(address);
      expect(result.message).toContain(result.nonce);
    });

    it('should generate different nonces for same address', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';
      const result1 = service.generateNonce(address);
      const result2 = service.generateNonce(address);

      expect(result1.nonce).not.toBe(result2.nonce);
      expect(result1.message).not.toBe(result2.message);
    });
  });

  describe('verifyToken', () => {
    it('should generate nonce for token verification flow', () => {
      const address = '0x1234567890abcdef1234567890abcdef12345678';

      // Test nonce generation as part of auth flow
      const nonce = service.generateNonce(address);
      expect(nonce).toBeTruthy();
      expect(nonce.message).toContain('authenticate');
    });
  });
});

