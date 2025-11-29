import { AuthService } from '../../services/authService';
import { logger } from '../../utils/logger';
import {
  GenerateNonceRequest,
  GenerateNonceResponse,
  AuthenticateRequest,
  AuthenticateResponse,
} from './auth.types';

export class AuthModuleService {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async generateNonce(
    request: GenerateNonceRequest
  ): Promise<GenerateNonceResponse> {
    try {
      const result = this.authService.generateNonce(request.address);
      logger.info(`Generated nonce for address: ${request.address}`);
      return result;
    } catch (error) {
      logger.error('Error generating nonce:', error);
      throw error;
    }
  }

  async authenticate(
    request: AuthenticateRequest
  ): Promise<AuthenticateResponse> {
    try {
      const result = await this.authService.authenticate(
        request.address,
        request.message,
        request.signature
      );
      logger.info(`User authenticated: ${request.address}`);
      return result;
    } catch (error) {
      logger.error('Error authenticating user:', error);
      throw error;
    }
  }
}

