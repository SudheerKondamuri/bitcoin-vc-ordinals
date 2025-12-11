import { inscribeVc } from './inscription/inscriber.js';
import { verifyInscription } from './verification/verifier.js';

async function main() {
  const action = process.argv[2];

  try {
    if (action === 'inscribe') {
      const { inscriptionId, hashHex } = await inscribeVc();
      console.log('SUCCESS: Inscription ID:', inscriptionId);
      console.log('Payload hash:', hashHex);
    } else if (action === 'verify') {
      const inscriptionId = process.argv[3];
      if (!inscriptionId) {
        console.error('Usage: node src/index.js verify <inscriptionId>');
        process.exit(1);
      }
      const result = await verifyInscription(inscriptionId);
      console.log('Verification result:');
      console.log(JSON.stringify(result, null, 2));
    } else if (action === 'test') {
      console.log('Test flow: inscribe then verify.');
      const { inscriptionId } = await inscribeVc();
      const result = await verifyInscription(inscriptionId);
      console.log('Round-trip successful:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`
Usage:
  node src/index.js inscribe         # Encode sampleVC.json and inscribe it
  node src/index.js verify <txid>    # Verify an inscription by txid
  node src/index.js test             # End-to-end test (inscribe + verify)
`);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
