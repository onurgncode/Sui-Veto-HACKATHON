import { apiClient } from '../config/api';
import type { ApiResponse } from '../config/api';

export interface GenerateNonceResponse {
  nonce: string;
  message: string;
}

export interface AuthenticateResponse {
  token: string;
  address: string;
}

export const authService = {
  async generateNonce(address: string): Promise<ApiResponse<GenerateNonceResponse>> {
    return apiClient.post<GenerateNonceResponse>('/auth/nonce', { address });
  },

  async authenticate(
    address: string,
    message: string,
    signature: string
  ): Promise<ApiResponse<AuthenticateResponse>> {
    const response = await apiClient.post<AuthenticateResponse>('/auth/authenticate', {
      address,
      message,
      signature,
    });

    if (response.success && response.data?.token) {
      apiClient.setToken(response.data.token);
    }

    return response;
  },

  logout(): void {
    apiClient.clearToken();
  },
};

