import { logger } from '../utils/logger';

const aggregatorUrl = process.env.WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space';
const publisherUrl = process.env.WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space';
const apiUrl = process.env.WALRUS_API_URL || aggregatorUrl;

export const WALRUS_CONFIG = {
  aggregatorUrl,
  publisherUrl,
  apiUrl,
  enabled: true,
};

logger.info(`Walrus config initialized: ${aggregatorUrl}`);

