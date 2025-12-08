import { callRpc } from '../utils/rpcClient.js';

/**
 * Simplified "reveal" tx:
 * - Finds the UTXO from the commit tx
 * - Creates a tx:
 *    input: that UTXO
 *    outputs:
 *      - OP_RETURN with our payload bytes
 *      - change back to wallet
 */
export async function createRevealTx(commitTxid, payloadHex) {
  // 1. Find the UTXO from commit tx
  const rawTx = await callRpc('getrawtransaction', [commitTxid, true]);

  if (!rawTx || !rawTx.vout || rawTx.vout.length === 0) {
    throw new Error('Commit tx has no outputs?');
  }

  // For this simple model, we assume vout[0] is our UTXO
  const voutIndex = 0;
  const vout = rawTx.vout[voutIndex];

  const utxo = {
    txid: commitTxid,
    vout: voutIndex
  };

  // 2. Build outputs: OP_RETURN + automatic change via walletcreatefundedpsbt
  const dataScript = `6a${payloadHex}`;
  // 6a = OP_RETURN, then push data. For simplicity we let walletcreatefundedpsbt handle script via "data" field.

  // walletcreatefundedpsbt format: inputs, outputs, locktime, options, bip32derivs
  // We can use the "data" pseudo-output for OP_RETURN:
  const outputs = [
    // OP_RETURN output described with "data" field in psbt options doesn't work directly here,
    // So we do a small trick: empty outputs, let options include 'data'.
  ];

  const options = {
    change_position: 1,
    include_unsafe: true,
    // Add raw data output using the special "data" feature in psbt options
    // But walletcreatefundedpsbt's standard interface is "outputs": { "address": amount, "data": "hex" }
  };

  // So: we can't mix array + object. Instead:
  const outputsObj = {
    data: payloadHex
  };

  const psbt = await callRpc('walletcreatefundedpsbt', [[utxo], outputsObj, 0, options, true]);

  const finalized = await callRpc('finalizepsbt', [psbt.psbt]);
  if (!finalized.complete) {
    throw new Error('Failed to finalize reveal PSBT');
  }

  const revealTxid = await callRpc('sendrawtransaction', [finalized.hex]);

  // "Ordinal ID" in this simplified world = revealTxid + ":0" (the OP_RETURN vout index is usually 0 or 1 depending on change)
  // To keep it deterministic, we’ll just say "revealTxid".
  const inscriptionId = revealTxid;

  return {
    revealTxid,
    inscriptionId
  };
}
