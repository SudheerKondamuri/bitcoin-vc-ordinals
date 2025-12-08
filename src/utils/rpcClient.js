import axios from 'axios';
import { BITCOIN_RPC } from '../config.js';

let rpcId = 0;

export async function callRpc(method, params = []) {
  const payload = {
    jsonrpc: '1.0',
    id: rpcId++,
    method,
    params,
  };

  const auth = {
    username: BITCOIN_RPC.username,
    password: BITCOIN_RPC.password,
  };

  const url = `${BITCOIN_RPC.protocol}://${BITCOIN_RPC.host}:${BITCOIN_RPC.port}`;

  try {
    const { data } = await axios.post(url, payload, { auth });
    if (data.error) {
      throw new Error(`RPC Error [${method}]: ${JSON.stringify(data.error)}`);
    }
    return data.result;
  } catch (err) {
    console.error(`RPC call failed [${method}]`, err.message);
    throw err;
  }
}
