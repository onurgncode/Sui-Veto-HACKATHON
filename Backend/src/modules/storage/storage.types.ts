export interface UploadBlobRequest {
  data: string; // Base64 encoded data
  epochs?: number;
}

export interface UploadBlobResponse {
  blobId: string;
  suiObjectId: string;
}

export interface BlobInfo {
  blobId: string;
  suiObjectId: string;
  size: number;
  createdAt: number;
  expiresAt?: number;
}

