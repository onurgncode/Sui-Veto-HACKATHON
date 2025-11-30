import { logger } from '../utils/logger';

const apiKey = process.env.SURFLUX_API_KEY || '';
const fluxStreamName = process.env.SURFLUX_FLUX_STREAM_NAME || 'gulf-menhaden';
const baseApiUrl = process.env.SURFLUX_API_URL || 'https://api.surflux.dev';

// Construct API URL with flux stream name
const apiUrl = fluxStreamName 
  ? `${baseApiUrl}/flux-streams/${fluxStreamName}`
  : baseApiUrl;

// Only enable if API key is explicitly provided
const isEnabled = !!process.env.SURFLUX_API_KEY && apiKey.length > 0;

if (!isEnabled) {
  logger.info('Surflux API key not provided. Surflux features will be disabled.');
}

export const SURFLUX_CONFIG = {
  apiKey: apiKey || '',
  apiUrl,
  baseApiUrl,
  fluxStreamName,
  enabled: isEnabled,
};

logger.info(`Surflux config initialized: ${SURFLUX_CONFIG.enabled ? 'enabled' : 'disabled'}`);
logger.info(`Surflux flux stream: ${fluxStreamName}`);
logger.info(`Surflux API URL: ${apiUrl}`);

