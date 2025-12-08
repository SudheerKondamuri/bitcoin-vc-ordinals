import cbor from 'cbor';
import crypto from 'crypto';
import { INSCRIPTION } from '../config.js';

function canonicalizeJson(obj) {
  // Simple canonicalization: stringify with sorted keys
  const allKeys = [];
  JSON.stringify(obj, (k, v) => (allKeys.push(k), v));
  allKeys.sort();
  return JSON.stringify(obj, allKeys);
}

export function encodeVcToOrdinalPayload(vcJson) {
  const canonicalJson = canonicalizeJson(vcJson);
  const vcBuffer = Buffer.from(canonicalJson, 'utf8');

  if (vcBuffer.length > INSCRIPTION.MAX_VC_SIZE_BYTES) {
    throw new Error(
      `VC too large (${vcBuffer.length} bytes). Limit is ${INSCRIPTION.MAX_VC_SIZE_BYTES} bytes.`
    );
  }

  // CBOR encode the VC JSON string (or you can encode the parsed object – either is fine as long as you are consistent)
  const vcCbor = cbor.encode(vcJson);

  // Hash over VC CBOR
  const hash = crypto.createHash('sha256').update(vcCbor).digest();

  const envelope = {
    v: INSCRIPTION.SCHEMA_VERSION,
    t: 'vc',
    alg: 'sha256',
    h: hash,    // raw bytes
    d: vcCbor   // raw bytes
  };

  const envelopeCbor = cbor.encode(envelope);

  const payloadHex = envelopeCbor.toString('hex');
  const payloadBase64 = envelopeCbor.toString('base64');

  return {
    vcCbor,
    hashHex: hash.toString('hex'),
    envelopeCbor,
    payloadHex,
    payloadBase64
  };
}
