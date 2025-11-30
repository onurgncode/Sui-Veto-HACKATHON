import { logger } from '../utils/logger';

const apiKey = process.env.SURFLUX_API_KEY || 'fc664ac9-caa6-4123-96ca-e564c569d910';
const fluxStreamName = process.env.SURFLUX_FLUX_STREAM_NAME || 'gulf-menhaden';
const baseApiUrl = process.env.SURFLUX_API_URL || 'https://api.surflux.dev';

// Construct API URL with flux stream name
const apiUrl = fluxStreamName 
  ? `${baseApiUrl}/flux-streams/${fluxStreamName}`
  : baseApiUrl;

if (!apiKey) {
  logger.warn('Surflux API key not found. Surflux features will be disabled.');
}

export const SURFLUX_CONFIG = {
  apiKey: apiKey || '',
  apiUrl,
  baseApiUrl,
  fluxStreamName,
  enabled: !!apiKey,
};

logger.info(`Surflux config initialized: ${SURFLUX_CONFIG.enabled ? 'enabled' : 'disabled'}`);
logger.info(`Surflux flux stream: ${fluxStreamName}`);
logger.info(`Surflux API URL: ${apiUrl}`);

