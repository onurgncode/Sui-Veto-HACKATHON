import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { logger } from '../utils/logger';

const network = (process.env.SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet' | 'localnet') || 'testnet';
const rpcUrl = process.env.SUI_RPC_URL || getFullnodeUrl(network);

export const suiClient = new SuiClient({ url: rpcUrl });

export const PACKAGE_ID = process.env.PACKAGE_ID || '0x115bbd92212fbab8f1408a5d12e697a410fae1dafc171a61bfe5ded4554a1f45';

logger.info(`Sui client initialized for network: ${network}`);
logger.info(`Package ID: ${PACKAGE_ID}`);

