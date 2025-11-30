import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { logger } from '../utils/logger';

const network = (process.env.SUI_NETWORK as 'testnet' | 'mainnet' | 'devnet' | 'localnet') || 'testnet';
const rpcUrl = process.env.SUI_RPC_URL || getFullnodeUrl(network);

export const suiClient = new SuiClient({ url: rpcUrl });

export const PACKAGE_ID = process.env.PACKAGE_ID || '0x6b30552018493c6daaef95c7a1956aca5adc1528513a7bc0d831cd9b136a8f90';

logger.info(`Sui client initialized for network: ${network}`);
logger.info(`Package ID: ${PACKAGE_ID}`);

