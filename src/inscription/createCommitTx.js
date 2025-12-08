import { callRpc } from '../utils/rpcClient.js';
import { getAddressFromKeyPair, loadKeyPair } from '../utils/keyManagement.js';

export async function createCommitTx(amountSats = 10000) {
  const keyPair = loadKeyPair();
  const commitAddress = getAddressFromKeyPair(keyPair);

  // Use Bitcoin Core to create, fund, and send a tx to commitAddress
  // walletcreatefundedpsbt -> finalizepsbt -> sendrawtransaction

  // 1. Define output
  const outputs = {};
  outputs[commitAddress] = amountSats / 1e8; // convert sats to BTC

  const psbt = await callRpc('walletcreatefundedpsbt', [[], outputs, 0, { replaceable: true }, true]);

  const finalized = await callRpc('finalizepsbt', [psbt.psbt]);
  if (!finalized.complete) {
    throw new Error('Failed to finalize commit PSBT');
  }

  const txid = await callRpc('sendrawtransaction', [finalized.hex]);

  return {
    txid,
    commitAddress,
    amountSats
  };
}
