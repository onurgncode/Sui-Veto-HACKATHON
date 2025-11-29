import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import apiRoutes from './routes';
import { EventService } from './services/eventService';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const eventService = new EventService();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use(rateLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api', apiRoutes);

// API Info
app.get('/api', (_req, res) => {
  res.json({
    message: 'Sui Veto Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      profile: '/api/profile',
      community: '/api/community',
      proposal: '/api/proposal',
      notification: '/api/notification',
      storage: '/api/storage',
    },
  });
});

// Error handling
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Start server and event service
app.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Start event processing
  try {
    await eventService.start();
  } catch (error) {
    logger.error('Failed to start event service:', error);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await eventService.stop();
  process.exit(0);
});

export default app;

