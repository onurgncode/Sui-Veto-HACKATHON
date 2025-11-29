export interface GenerateNonceRequest {
  address: string;
}

export interface GenerateNonceResponse {
  nonce: string;
  message: string;
}

export interface AuthenticateRequest {
  address: string;
  message: string;
  signature: string;
}

export interface AuthenticateResponse {
  token: string;
  address: string;
}

