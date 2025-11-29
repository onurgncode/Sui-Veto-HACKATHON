import request from 'supertest';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import apiRoutes from '../../../routes';
import { errorHandler } from '../../../middleware/errorHandler';
import { rateLimiter } from '../../../middleware/rateLimiter';

const app = express();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

describe('API Integration Tests', () => {
  describe('Health Check', () => {
    it('GET /health should return 200', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('API Info', () => {
    it('GET /api should return API info', async () => {
      const response = await request(app).get('/api');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('Profile Endpoints', () => {
    it('POST /api/profile should require nickname', async () => {
      const response = await request(app).post('/api/profile').send({});
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });

    it('POST /api/profile should create transaction with valid nickname', async () => {
      const response = await request(app)
        .post('/api/profile')
        .send({ nickname: 'testuser' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('transaction');
    });

    it('GET /api/profile/:address should handle real address', async () => {
      const realAddress = '0x6db331729a299df9a9ebe73d36abb11584380748bbc6283d51eddbdea7a8943c';
      const response = await request(app).get(`/api/profile/${realAddress}`);

      // Should return 200 (with null data) or 404 (profile might not exist yet)
      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
      }
    }, 15000);
  });

  describe('Community Endpoints', () => {
    it('POST /api/community should require name', async () => {
      const response = await request(app).post('/api/community').send({});
      expect(response.status).toBe(400);
    });

    it('POST /api/community should create transaction with valid name', async () => {
      const response = await request(app)
        .post('/api/community')
        .send({ name: 'Test Community' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('transaction');
    });
  });

  describe('Proposal Endpoints', () => {
    it('POST /api/proposal should require all fields', async () => {
      const response = await request(app).post('/api/proposal').send({});
      expect(response.status).toBe(400);
    });

    it('POST /api/proposal should create transaction with valid data', async () => {
      const response = await request(app)
        .post('/api/proposal')
        .send({
          commityId: '0x123',
          messageId: '0x456',
          title: 'Test Proposal',
          description: 'Test Description',
          deadline: 1735689600000,
          quorumThreshold: 100,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Auth Endpoints', () => {
    it('POST /api/auth/nonce should require address', async () => {
      const response = await request(app).post('/api/auth/nonce').send({});
      expect(response.status).toBe(400);
    });

    it('POST /api/auth/nonce should generate nonce', async () => {
      const response = await request(app)
        .post('/api/auth/nonce')
        .send({ address: '0x1234567890abcdef1234567890abcdef12345678' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('nonce');
      expect(response.body.data).toHaveProperty('message');
    });
  });
});

