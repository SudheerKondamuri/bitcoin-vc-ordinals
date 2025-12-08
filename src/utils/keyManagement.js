import * as bitcoin from 'bitcoinjs-lib';
import bs58check from 'bs58check';
import 'dotenv/config';
import { NETWORK } from '../config.js';

function getBitcoinNetwork() {
  switch (NETWORK) {
    case 'mainnet':
      return bitcoin.networks.bitcoin;
    case 'testnet':
    case 'regtest':
      return bitcoin.networks.testnet;
    default:
      return bitcoin.networks.testnet;
  }
}

export function loadKeyPair() {
  const network = getBitcoinNetwork();
  const wif = process.env.BTC_WIF;

  if (!wif) {
    throw new Error('BTC_WIF not set in environment. Provide a funded key.');
  }

  const keyPair = bitcoin.ECPair.fromWIF(wif, network);
  return keyPair;
}

export function getAddressFromKeyPair(keyPair) {
  const network = getBitcoinNetwork();
  const { address } = bitcoin.payments.p2wpkh({
    pubkey: keyPair.publicKey,
    network,
  });
  return address;
}

// Optional: sign arbitrary data (not needed for tx signing, but useful for VC integrity signatures if you want)
export function signMessage(keyPair, messageBuffer) {
  const hash = bitcoin.crypto.sha256(messageBuffer);
  const signature = keyPair.sign(hash);
  return signature.toString('hex');
}
