import cbor from 'cbor';
import crypto from 'crypto';

export function decodeOrdinalPayloadHex(payloadHex) {
  const envelopeBuffer = Buffer.from(payloadHex, 'hex');

  const envelope = cbor.decode(envelopeBuffer);

  if (!envelope || envelope.t !== 'vc') {
    throw new Error('Invalid envelope type. Expected t="vc".');
  }

  const { v, alg, h, d } = envelope;

  if (alg !== 'sha256') {
    throw new Error(`Unsupported hash algorithm: ${alg}`);
  }

  const recomputedHash = crypto.createHash('sha256').update(d).digest();

  if (!recomputedHash.equals(h)) {
    throw new Error('Integrity check failed: hash mismatch.');
  }

  const vcJson = cbor.decode(d);

  return {
    version: v,
    alg,
    hashHex: Buffer.from(h).toString('hex'),
    vcJson
  };
}
