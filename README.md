# Bitcoin Verifiable Credential Ordinal Inscription System

This project provides a functional system to inscribe W3C Verifiable Credentials (VCs) onto the Bitcoin blockchain using a simplified, Ordinal-like model. It includes scripts for inscribing new VCs and for retrieving and verifying existing ones from the blockchain, with a strong focus on data integrity and a clear architectural design.

## System Architecture

The system is composed of two main workflows: Inscription and Verification.

**1. Inscription Flow**
```
VC (JSON-LD) -> [CBOR Encoder] -> [Envelope Builder] -> [Bitcoin Inscriber] -> OP_RETURN TX -> Bitcoin Blockchain
```
- **CBOR Encoder:** The input VC is encoded into the efficient CBOR format.
- **Envelope Builder:** A custom envelope is constructed containing the CBOR-encoded VC, a schema version, and a SHA256 hash for integrity.
- **Bitcoin Inscriber:** This module constructs and broadcasts a Bitcoin transaction containing the envelope payload in an `OP_RETURN` output.

**2. Verification Flow**
```
TxID -> [Tx Fetcher] -> Extract Payload -> [Envelope Decoder] -> [Integrity Check] -> VC (JSON-LD)
```
- **Tx Fetcher:** Retrieves the raw transaction from the blockchain using the provided transaction ID (`inscriptionId`).
- **Envelope Decoder:** Extracts the `OP_RETURN` payload and decodes the CBOR envelope.
- **Integrity Check:** Re-computes the hash of the VC data and compares it against the hash stored in the envelope to guarantee it hasn't been tampered with.

---

## Design Justifications

### Verifiable Credential (VC) Standard: W3C VC Data Model v1.0

The **W3C Verifiable Credentials Data Model** was chosen for three key reasons:
1.  **Interoperability:** It is the prevailing industry standard, ensuring the VCs created are compatible with a wide ecosystem of wallets, verifiers, and issuers.
2.  **Expressiveness:** The model is flexible and can represent a wide variety of credential types, from university degrees to KYC attestations.
3.  **Structured Data:** Its JSON-LD (JSON for Linked Data) structure is machine-readable and well-defined, making it ideal for programmatic encoding and verification.

### Encoding Scheme: Custom CBOR Envelope

A custom encoding scheme built on **CBOR (Concise Binary Object Representation)** was chosen for its efficiency and robustness.

**Why CBOR?**
- **Encoding Efficiency:** CBOR is a binary format, making it significantly more compact than text-based formats like JSON. For on-chain data, where every byte costs money and space, this is a critical optimization. A sample VC that is **488 bytes** as a canonical JSON string can be reduced to **~350-400 bytes** in CBOR, a saving of **~20-25%**.
- **Why Not JSON?** Storing raw JSON on-chain is inefficient. It's verbose and requires more space.
- **Why Not Plain Base64?** Base64 is not an encoding *scheme*; it's a way to represent binary data in ASCII text. It actually *increases* data size by ~33%. Our process uses CBOR to create the compact binary data first, which can then be represented as hex for the `OP_RETURN` script.

---

## In-Depth: The Custom Encoding Scheme

The custom envelope is designed to make verification secure and straightforward.

```
{
  "v": 1,                         // Schema version
  "t": "vc",                      // Type identifier
  "alg": "sha256",                // Hashing algorithm for integrity check
  "h": <Buffer>,                  // SHA256 hash of the VC's CBOR representation
  "d": <Buffer>                   // The raw VC data, itself encoded in CBOR
}
```

**Field Explanations:**
- `v` **(Version):** A schema version number. If we ever need to change the envelope structure, this field allows verifiers to handle old and new formats correctly.
- `t` **(Type):** A type identifier (`'vc'`). This acts as a "magic number" to quickly identify the payload as a verifiable credential, distinguishing it from other data that might be on the blockchain.
- `alg` **(Algorithm):** Specifies the hashing algorithm used. While currently hardcoded to `sha256`, this field makes the system future-proof if a stronger algorithm is needed later.
- `h` **(Hash):** The SHA256 hash of the raw VC data (`d`). This is the core of our data integrity check.
- `d` **(Data):** The CBOR-encoded Verifiable Credential.

**Why hash the CBOR data, not the JSON?**
Hashing the canonical JSON string is brittle. Even a tiny change in whitespace or key order (if canonicalization fails) would produce a different hash. By hashing the final CBOR binary data (`d`), we are hashing the exact bytes that are stored, which is a much more robust and reliable method for an integrity check.

---

## Data Integrity Flow

Data integrity is guaranteed by a hash-and-compare mechanism:

1.  **During Inscription:**
    - The VC is encoded into a CBOR buffer (`d`).
    - A SHA256 hash is computed from this buffer (`h`).
    - Both `h` and `d` are stored together in the CBOR envelope, which is then placed on-chain.

2.  **During Verification:**
    - The CBOR envelope is retrieved from the blockchain and decoded.
    - The verifier extracts the stored hash (`h`) and the VC data (`d`).
    - It **re-computes** the SHA256 hash of `d` independently.
    - It then **compares** its re-computed hash with the stored hash `h`.
    - **If the hashes match,** the data is proven to be integral and has not been tampered with.
    - **If the hashes do not match,** the verification fails, indicating the data is corrupt or invalid.

---

## Bitcoin Ordinals vs. `OP_RETURN` Implementation

This project uses a simplified, Ordinal-like model rather than a true Ordinal inscription.

-   **True Ordinals Protocol:** Inscribes data directly into the witness portion of a Taproot transaction. This allows for much larger data sizes (up to the block limit, ~4MB) and is the standard for modern Bitcoin NFTs and artifacts.
-   **Our `OP_RETURN` Implementation:** This project embeds the data in an `OP_RETURN` output. This was a deliberate design choice for simplification, as it does not require complex Taproot scripting. It achieves the goal of putting immutable data on-chain, but with significant limitations.

**Limitations of `OP_RETURN`:**
-   **Size Limit:** Most Bitcoin nodes enforce a default `OP_RETURN` size limit of **80 bytes**. This is the single biggest limitation of this implementation, making it unsuitable for most VCs.
-   **Pruning:** `OP_RETURN` outputs are provably unspendable and can be pruned by nodes, meaning the data may not be perpetually stored by all full nodes.

To implement **true Ordinals**, the `createRevealTx.js` script would need to be significantly modified to construct a Taproot-spend transaction with the VC data embedded in the witness script.

---

## Tools Used

| Tool | How It Was Used in This Project |
| :--- | :--- |
| **Node.js** | The primary runtime for the inscription and verification scripts. |
| **CBOR** | The core component of the custom encoding scheme to ensure data efficiency. |
| **Bitcoin Core** | Used via RPC to create, fund, and broadcast transactions, and to retrieve transaction data. |
| **Hashing (crypto)** | Used to generate the SHA256 hash for the data integrity check. |
| **Digital Signatures** | The VC `proof` block contains a signature, but this system **does not** verify it. The focus is on proving the on-chain data's integrity, not the issuer's signature. |
| **Base64** | Not used directly for encoding efficiency, as it increases size. Hex encoding is used for representing the binary payload in the `OP_RETURN` script. |
| **Ord** | The project follows the *conceptual model* of Ordinals (inscribing data to the chain) but uses a simplified `OP_RETURN` implementation. |
| **Typescript, Electrum, Libbitcoin** | These tools were not used in this implementation to maintain simplicity and focus on a minimal, Node.js-centric solution. |

---

## Limitations

-   **`OP_RETURN` Size Limit:** The 80-byte limit on `OP_RETURN` outputs makes this system unsuitable for VCs larger than this small size.
-   **Network:** This system is designed for `regtest` or `testnet`. Due to the high fees and size limitations, it is not economically viable for `mainnet`.
-   **No VC Signature Verification:** The system verifies that the data on-chain is what was originally inscribed, but it does not validate the digital signature within the VC's `proof` block.

---

## Test Cases

| Test Scenario | Expected Outcome | How to Test |
| :--- | :--- | :--- |
| **Successful Inscription** | The `inscribe` script runs without error and returns a transaction ID. | `npm run inscribe` |
| **Successful Verification** | The `verify` script correctly decodes the VC and confirms its integrity. | `npm run verify <txid>` |
| **End-to-End Flow** | The `test` script successfully inscribes and then immediately verifies the same VC. | `npm run test` |
| **Hash Mismatch (Corrupt Data)** | The `decodeOrdinalPayloadHex` function should throw a "hash mismatch" error. | Manually alter the payload hex in `verifier.js` before decoding. |
| **Invalid Inscription ID** | The `callRpc` function should fail when `getrawtransaction` is called with a non-existent TxID. | `npm run verify <invalid_txid>` |

---

## Prerequisites & Installation

- **Node.js** (v18+)
- **Bitcoin Core** (v24+) with a funded RPC-enabled wallet.

1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Configure Environment:**
    Create a `.env` file in the root directory with your Bitcoin Core RPC credentials:
    ```
    BITCOIN_RPC_USER=your_rpc_user
    BITCOIN_RPC_PASSWORD=your_rpc_password
    BITCOIN_RPC_HOST=127.0.0.1
    BITCOIN_RPC_PORT=18443 # Regtest default
    ```

---

## Usage

### Inscribe a VC
```bash
npm run inscribe
```

### Verify a VC
```bash
npm run verify <inscriptionId>
```

### Run an End-to-End Test
```bash
npm run test
```

---

## Future Improvements

-   **Migrate to True Ordinals:** The most critical improvement would be to replace the `OP_RETURN` method with a proper Taproot-based inscription to support larger data sizes.
-   **VC Signature Verification:** Implement cryptographic verification of the `proof` block within the VC to fully validate its authenticity.
-   **Batch Inscription:** Add functionality to inscribe multiple VCs in a single transaction to save on fees.