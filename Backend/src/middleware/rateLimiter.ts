import rateLimit from 'express-rate-limit';

const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes
const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

// More lenient rate limiting for development
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
const effectiveMaxRequests = isDevelopment ? 1000 : maxRequests; // Much higher limit in development

export const rateLimiter = rateLimit({
  windowMs,
  max: effectiveMaxRequests,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => {
    return req.path === '/health' || req.path === '/api';
  },
});

