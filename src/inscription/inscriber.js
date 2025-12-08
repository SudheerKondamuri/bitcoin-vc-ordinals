import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { encodeVcToOrdinalPayload } from '../encoding/cborEncoder.js';
import { createCommitTx } from './createCommitTx.js';
import { createRevealTx } from './createRevealTx.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function inscribeVc() {
  const vcPath = path.join(__dirname, '..', 'vc-data', 'sampleVC.json');
  const vcRaw = fs.readFileSync(vcPath, 'utf8');
  const vcJson = JSON.parse(vcRaw);

  console.log('Loaded VC:', vcJson.id || '(no id)');

  const { payloadHex, hashHex } = encodeVcToOrdinalPayload(vcJson);

  console.log('VC encoded to envelope. Hash:', hashHex);
  console.log('Payload hex length:', payloadHex.length / 2, 'bytes');

  // 1. Commit
  const { txid: commitTxid } = await createCommitTx();
  console.log('Commit txid:', commitTxid);

  // 2. Reveal + embed payload
  const { inscriptionId } = await createRevealTx(commitTxid, payloadHex);

  console.log('Inscription created with ID:', inscriptionId);

  return {
    inscriptionId,
    hashHex
  };
}
