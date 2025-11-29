import { WalrusClient } from '../../services/walrusClient';
import { logger } from '../../utils/logger';
import {
  UploadBlobRequest,
  UploadBlobResponse,
  BlobInfo,
} from './storage.types';

export class StorageService {
  private walrusClient: WalrusClient;

  constructor() {
    this.walrusClient = new WalrusClient();
  }

  async uploadBlob(
    request: UploadBlobRequest
  ): Promise<UploadBlobResponse> {
    try {
      // Convert base64 to Uint8Array
      const data = Buffer.from(request.data, 'base64');
      const epochs = request.epochs || 2;

      const result = await this.walrusClient.uploadBlob(data, epochs);

      logger.info(`Blob uploaded: ${result.blobId}`);
      return result;
    } catch (error) {
      logger.error('Error uploading blob:', error);
      throw error;
    }
  }

  async readBlob(blobId: string): Promise<string> {
    try {
      const data = await this.walrusClient.readBlob(blobId);
      // Convert Uint8Array to base64
      return Buffer.from(data).toString('base64');
    } catch (error) {
      logger.error('Error reading blob:', error);
      throw error;
    }
  }

  async verifyBlob(blobId: string): Promise<boolean> {
    try {
      return await this.walrusClient.verifyBlob(blobId);
    } catch (error) {
      logger.error('Error verifying blob:', error);
      throw error;
    }
  }

  async deleteBlob(blobId: string): Promise<boolean> {
    try {
      return await this.walrusClient.deleteBlob(blobId);
    } catch (error) {
      logger.error('Error deleting blob:', error);
      throw error;
    }
  }

  async getBlobInfo(blobId: string): Promise<BlobInfo | null> {
    try {
      // TODO: Fetch blob info from Walrus or Sui blockchain
      logger.info(`Fetching blob info: ${blobId}`);

      return null;
    } catch (error) {
      logger.error('Error getting blob info:', error);
      throw error;
    }
  }
}

