import { callRpc } from '../utils/rpcClient.js';
import { decodeOrdinalPayloadHex } from '../encoding/cborDecoder.js';

function extractOpReturnHexFromTx(rawTxVerbose) {
  for (const vout of rawTxVerbose.vout) {
    const asm = vout.scriptPubKey.asm || '';
    if (asm.startsWith('OP_RETURN')) {
      const parts = asm.split(' ');
      // OP_RETURN <data-in-hex>
      if (parts.length >= 2) {
        return parts[1];
      }
    }
  }
  throw new Error('No OP_RETURN output found in transaction.');
}

export async function verifyInscription(inscriptionId) {
  const tx = await callRpc('getrawtransaction', [inscriptionId, true]);

  const payloadHex = extractOpReturnHexFromTx(tx);

  const { version, alg, hashHex, vcJson } = decodeOrdinalPayloadHex(payloadHex);

  // Basic VC validation: check required fields
  if (!vcJson['@context'] || !vcJson.type || !vcJson.issuer || !vcJson.credentialSubject) {
    throw new Error('Decoded VC is missing required fields.');
  }

  return {
    version,
    alg,
    hashHex,
    vc: vcJson
  };
}
