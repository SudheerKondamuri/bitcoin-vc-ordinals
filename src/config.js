import 'dotenv/config';

export const BITCOIN_RPC = {
  host: process.env.BTC_RPC_HOST || '127.0.0.1',
  port: process.env.BTC_RPC_PORT || '8332',
  username: process.env.BTC_RPC_USER || 'bitcoin',
  password: process.env.BTC_RPC_PASS || 'password',
  protocol: process.env.BTC_RPC_PROTOCOL || 'http',
};

export const NETWORK = process.env.BTC_NETWORK || 'regtest'; 
// 'mainnet' | 'testnet' | 'regtest'

export const INSCRIPTION = {
  // Max size we allow per VC payload (in bytes) for safety
  MAX_VC_SIZE_BYTES: 4096,
  // Our custom version for the payload envelope
  SCHEMA_VERSION: 1,
};
