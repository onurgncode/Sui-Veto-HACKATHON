import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { toB64 } from '@mysten/sui.js/utils';

// Create a new Ed25519 keypair
const keypair = new Ed25519Keypair();

// Get the secret key (64 bytes: 32 bytes private + 32 bytes public)
const secretKey = keypair.getSecretKey();

// For Ed25519, fromSecretKey() expects only the first 32 bytes (private key)
// Extract just the private key part
const privateKey = secretKey.slice(0, 32);

// Convert to base64
const privateKeyBase64 = toB64(privateKey);
const address = keypair.toSuiAddress();

console.log('='.repeat(60));
console.log('Sponsor Gas Service Keypair Generated');
console.log('='.repeat(60));
console.log('Address:', address);
console.log('Private Key (Base64):', privateKeyBase64);
console.log('Private Key Length (bytes):', privateKey.length);
console.log('='.repeat(60));
console.log('\nAdd this to your .env file:');
console.log(`SPONSOR_PRIVATE_KEY=${privateKeyBase64}`);
console.log('='.repeat(60));
console.log('\nTo verify, you can test with:');
console.log('node -e "require(\'dotenv\').config(); const { fromB64 } = require(\'@mysten/sui.js/utils\'); const { Ed25519Keypair } = require(\'@mysten/sui.js/keypairs/ed25519\'); const bytes = fromB64(process.env.SPONSOR_PRIVATE_KEY); const kp = Ed25519Keypair.fromSecretKey(bytes); console.log(\'✅ Keypair loaded successfully, address:\', kp.toSuiAddress());"');
console.log('='.repeat(60));

