import { Request, Response, NextFunction } from 'express';
import { StorageService } from './storage.service';
import { ApiResponse } from '../../types';

export class StorageController {
  private storageService: StorageService;

  constructor() {
    this.storageService = new StorageService();
  }

  uploadBlob = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { data, epochs } = req.body;

      if (!data || typeof data !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Data (base64) is required',
        } as ApiResponse);
        return;
      }

      const result = await this.storageService.uploadBlob({
        data,
        epochs,
      });

      res.json({
        success: true,
        data: result,
        message: 'Blob uploaded successfully',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  readBlob = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { blobId } = req.params;

      if (!blobId) {
        res.status(400).json({
          success: false,
          error: 'Blob ID is required',
        } as ApiResponse);
        return;
      }

      const data = await this.storageService.readBlob(blobId);

      res.json({
        success: true,
        data: {
          blobId,
          data,
        },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  verifyBlob = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { blobId } = req.params;

      if (!blobId) {
        res.status(400).json({
          success: false,
          error: 'Blob ID is required',
        } as ApiResponse);
        return;
      }

      const verified = await this.storageService.verifyBlob(blobId);

      res.json({
        success: true,
        data: {
          blobId,
          verified,
        },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  deleteBlob = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { blobId } = req.params;

      if (!blobId) {
        res.status(400).json({
          success: false,
          error: 'Blob ID is required',
        } as ApiResponse);
        return;
      }

      const deleted = await this.storageService.deleteBlob(blobId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          error: 'Blob not found or could not be deleted',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        message: 'Blob deleted successfully',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  getBlobInfo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { blobId } = req.params;

      if (!blobId) {
        res.status(400).json({
          success: false,
          error: 'Blob ID is required',
        } as ApiResponse);
        return;
      }

      const info = await this.storageService.getBlobInfo(blobId);

      if (!info) {
        res.status(404).json({
          success: false,
          error: 'Blob not found',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: info,
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };
}

