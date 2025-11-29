import { Router } from 'express';
import { StorageController } from './storage.controller';

const router = Router();
const storageController = new StorageController();

// POST /api/storage/upload
router.post('/upload', storageController.uploadBlob);

// GET /api/storage/:blobId
router.get('/:blobId', storageController.readBlob);

// GET /api/storage/:blobId/verify
router.get('/:blobId/verify', storageController.verifyBlob);

// GET /api/storage/:blobId/info
router.get('/:blobId/info', storageController.getBlobInfo);

// DELETE /api/storage/:blobId
router.delete('/:blobId', storageController.deleteBlob);

export default router;

