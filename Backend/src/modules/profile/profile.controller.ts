import { Request, Response, NextFunction } from 'express';
import { ProfileService } from './profile.service';
import { ApiResponse } from '../../types';
import { logger } from '../../utils/logger';
import { sponsorGasService } from '../../services/sponsorGasService';
import { enokiSponsorService } from '../../services/enokiSponsorService';

export class ProfileController {
  private profileService: ProfileService;

  constructor() {
    this.profileService = new ProfileService();
  }

  getProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { address } = req.params;

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'Address parameter is required',
        } as ApiResponse);
        return;
      }

      const profile = await this.profileService.getProfile(address);

      if (!profile) {
        res.status(404).json({
          success: false,
          error: 'Profile not found',
        } as ApiResponse);
        return;
      }

      res.json({
        success: true,
        data: {
          profile,
        },
      } as ApiResponse);
    } catch (error) {
      logger.error('ProfileController.getProfile error:', error);
      next(error);
    }
  };

  getMemberStats = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { address } = req.params;
      const { commityId } = req.query;

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'Address parameter is required',
        } as ApiResponse);
        return;
      }

      if (!commityId || typeof commityId !== 'string') {
        res.status(400).json({
          success: false,
          error: 'commityId query parameter is required',
        } as ApiResponse);
        return;
      }

      const stats = await this.profileService.getMemberStats(
        address,
        commityId
      );

      res.json({
        success: true,
        data: {
          stats,
          commityId,
        },
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  createProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { nickname } = req.body;

      if (!nickname || typeof nickname !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Nickname is required',
        } as ApiResponse);
        return;
      }

      const transaction = await this.profileService.createProfileTransaction(
        nickname
      );

      res.json({
        success: true,
        data: {
          transaction,
        },
        message: 'Profile creation transaction created',
      } as ApiResponse);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create profile with sponsored gas
   * User signs the transaction, backend sponsors the gas
   */
  sponsorCreateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { nickname, transactionBlock, signature } = req.body;

      if (!nickname || typeof nickname !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Nickname is required',
        } as ApiResponse);
        return;
      }

      if (!transactionBlock || typeof transactionBlock !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Transaction block is required',
        } as ApiResponse);
        return;
      }

      if (!signature || typeof signature !== 'string') {
        res.status(400).json({
          success: false,
          error: 'User signature is required',
        } as ApiResponse);
        return;
      }

      if (!sponsorGasService.isAvailable()) {
        res.status(503).json({
          success: false,
          error: 'Sponsor gas is not available. SPONSOR_PRIVATE_KEY not configured.',
        } as ApiResponse);
        return;
      }

      // Sponsor and execute transaction
      const result = await sponsorGasService.sponsorAndExecuteTransaction(
        transactionBlock,
        signature
      );

      res.json({
        success: true,
        data: {
          digest: result.digest,
          effects: result.effects,
          events: result.events,
          objectChanges: result.objectChanges,
        },
        message: 'Profile created with sponsored gas',
      } as ApiResponse);
    } catch (error) {
      logger.error('ProfileController.sponsorCreateProfile error:', error);
      next(error);
    }
  };

  getSponsorAddress = async (
    _req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const sponsorAddress = sponsorGasService.getSponsorAddress();

      if (!sponsorAddress) {
        res.status(503).json({
          success: false,
          error: 'Sponsor gas is not available',
        } as ApiResponse);
        return;
      }

      // Also get sponsor's gas coins for setting gas payment
      // Retry mechanism is built into getSponsorGasCoins
      let gasCoins: string[] = [];
      try {
        gasCoins = await sponsorGasService.getSponsorGasCoins();
        logger.info(`[ProfileController] Retrieved ${gasCoins.length} sponsor gas coins`);
      } catch (gasError: any) {
        logger.warn('ProfileController.getSponsorAddress: Could not get sponsor gas coins:', gasError);
        // Continue without gas coins - client can still use setGasOwner
        // getSponsorGasCoins already returns empty array on final retry failure
        gasCoins = [];
      }

      res.json({
        success: true,
        data: { 
          sponsorAddress,
          gasCoins, // Optional: gas coins for setGasPayment
        },
      } as ApiResponse);
    } catch (error) {
      logger.error('ProfileController.getSponsorAddress error:', error);
      next(error);
    }
  };

  /**
   * Build sponsored transaction block on backend (avoids CORS issues)
   * Frontend sends transaction details, backend builds full transaction with sponsor gas
   */
  buildSponsoredTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { sender, moveCallTarget, moveCallArgs } = req.body;

      if (!sender || typeof sender !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Sender address is required',
        } as ApiResponse);
        return;
      }

      if (!moveCallTarget || typeof moveCallTarget !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Move call target is required',
        } as ApiResponse);
        return;
      }

      if (!moveCallArgs || !Array.isArray(moveCallArgs)) {
        res.status(400).json({
          success: false,
          error: 'Move call arguments are required',
        } as ApiResponse);
        return;
      }

      if (!sponsorGasService.isAvailable()) {
        res.status(503).json({
          success: false,
          error: 'Sponsor gas is not available. SPONSOR_PRIVATE_KEY not configured.',
        } as ApiResponse);
        return;
      }

      // Build sponsored transaction block on backend
      const result = await sponsorGasService.buildSponsoredTransactionBlock(
        sender,
        moveCallTarget,
        moveCallArgs
      );

      res.json({
        success: true,
        data: {
          transactionBlock: result.bytes,
        },
        message: 'Sponsored transaction block built successfully',
      } as ApiResponse);
    } catch (error) {
      logger.error('ProfileController.buildSponsoredTransaction error:', error);
      next(error);
    }
  };

  /**
   * Enoki sponsored transaction - Step 1: Sponsor transaction
   * Frontend sends transaction kind bytes, backend sponsors it via Enoki API
   */
  enokiSponsorTransaction = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { transactionBlockKindBytes, sender, zkLoginJwt } = req.body;

      if (!transactionBlockKindBytes) {
        res.status(400).json({
          success: false,
          error: 'Transaction block kind bytes are required',
        } as ApiResponse);
        return;
      }

      if (!sender && !zkLoginJwt) {
        res.status(400).json({
          success: false,
          error: 'Either sender address or zkLoginJwt is required',
        } as ApiResponse);
        return;
      }

      if (!enokiSponsorService.isAvailable()) {
        res.status(503).json({
          success: false,
          error: 'Enoki sponsor service is not available. ENOKI_API_KEY not configured.',
        } as ApiResponse);
        return;
      }

      // Convert base64 to Uint8Array
      const kindBytes = typeof transactionBlockKindBytes === 'string' 
        ? Uint8Array.from(Buffer.from(transactionBlockKindBytes, 'base64'))
        : transactionBlockKindBytes;

      // Sponsor transaction via Enoki API
      const result = await enokiSponsorService.sponsorTransaction(
        kindBytes,
        sender,
        zkLoginJwt
      );

      res.json({
        success: true,
        data: {
          bytes: result.bytes,
          digest: result.digest,
        },
        message: 'Transaction sponsored via Enoki',
      } as ApiResponse);
    } catch (error) {
      logger.error('ProfileController.enokiSponsorTransaction error:', error);
      next(error);
    }
  };

  /**
   * Enoki sponsored transaction - Step 2: Submit signature
   * Frontend sends user signature, backend submits it to Enoki API and gets sponsor-signed transaction
   */
  enokiSubmitSignature = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { digest, signature, zkLoginJwt } = req.body;

      if (!digest || typeof digest !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Transaction digest is required',
        } as ApiResponse);
        return;
      }

      if (!signature || typeof signature !== 'string') {
        res.status(400).json({
          success: false,
          error: 'User signature is required',
        } as ApiResponse);
        return;
      }

      if (!enokiSponsorService.isAvailable()) {
        res.status(503).json({
          success: false,
          error: 'Enoki sponsor service is not available. ENOKI_API_KEY not configured.',
        } as ApiResponse);
        return;
      }

      // Submit signature to Enoki API
      const sponsorSignedTransaction = await enokiSponsorService.submitSignature(
        digest,
        signature,
        zkLoginJwt
      );

      res.json({
        success: true,
        data: {
          transaction: sponsorSignedTransaction,
        },
        message: 'Signature submitted, sponsor-signed transaction received',
      } as ApiResponse);
    } catch (error) {
      logger.error('ProfileController.enokiSubmitSignature error:', error);
      next(error);
    }
  };

  debugProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { address } = req.params;

      if (!address) {
        res.status(400).json({
          success: false,
          error: 'Address parameter is required',
        } as ApiResponse);
        return;
      }

      // Direct SuiObjectFetcher kullanarak debug bilgisi al
      const { SuiObjectFetcher } = await import('../../services/suiObjectFetcher');
      const objectFetcher = new SuiObjectFetcher();

      // Tüm owned objects'leri al
      const allObjects = await objectFetcher.getOwnedObjects(address);
      
      // Profile type ile filter
      const { PACKAGE_ID } = await import('../../config/sui');
      const profileType = `${PACKAGE_ID}::profile::Profile`;
      const profileObjects = await objectFetcher.getOwnedObjects(address, profileType);

      res.json({
        success: true,
        data: {
          address,
          profileType,
          packageId: PACKAGE_ID,
          totalObjects: allObjects.length,
          profileObjectsCount: profileObjects.length,
          allObjectTypes: allObjects.map((o) => o.type),
          profileObjectTypes: profileObjects.map((o) => o.type),
          profileObjectsDetails: profileObjects.map((o) => ({
            objectId: o.objectId,
            type: o.type,
            hasNickname: !!o.data.nickname,
            nickname: o.data.nickname,
            owner: o.data.owner,
          })),
        },
      } as ApiResponse);
    } catch (error) {
      logger.error('ProfileController.debugProfile error:', error);
      next(error);
    }
  };
}

