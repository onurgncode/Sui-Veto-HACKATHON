import { logger } from '../utils/logger';

const apiKey = process.env.SURFLUX_API_KEY;
const apiUrl = process.env.SURFLUX_API_URL || 'https://api.surflux.dev';

if (!apiKey) {
  logger.warn('Surflux API key not found. Surflux features will be disabled.');
}

export const SURFLUX_CONFIG = {
  apiKey: apiKey || '',
  apiUrl,
  enabled: !!apiKey,
};

logger.info(`Surflux config initialized: ${SURFLUX_CONFIG.enabled ? 'enabled' : 'disabled'}`);

