# Threshold Signatures (TSS)

Verisense provides built-in support for Threshold Signature Scheme (TSS), enabling secure multi-party control over cryptographic operations. TSS distributes private key shares among multiple participants, eliminating single points of failure.

## Table of Contents

- [What is Threshold Signature Scheme?](#what-is-threshold-signature-scheme)
- [TSS Use Cases in Verisense](#tss-use-cases-in-verisense)
- [Code Examples](#code-examples)
- [Supported Signature Algorithms](#supported-signature-algorithms)
- [Best Practices](#best-practices)
- [Advanced Patterns](#advanced-patterns)
- [Error Handling](#error-handling)
- [Example: 2-of-3 Signing Process](#example-2-of-3-signing-process)

---

## What is Threshold Signature Scheme?

In traditional signature schemes, the private signing key is usually held by a single entity. Once this private key is compromised, the entire system's security is broken. In Threshold Signature Scheme (TSS), the private key is split into multiple shares and distributed among multiple participants. No single participant can reconstruct the full private key alone.

TSS allows us to set a threshold. For example:

- **2-of-3 TSS**: Three participants hold key shares. Any two participants can jointly generate a valid signature, but no single participant can sign alone.
- **3-of-5 TSS**: Five participants hold key shares. Any three participants can jointly generate a valid signature.

This greatly improves security and eliminates single points of failure.

---

## TSS Use Cases in Verisense

On the Verisense platform, TSS is mainly used for:

1. **Cross-chain bridge custody**: Ensuring secure multi-party control over cross-chain assets
2. **Vault locking**: For multi-party governance or multi-signature wallets, ensuring that sensitive operations require multiple parties to jointly authorize
3. **Monadring Consensus Algorithm**: Participating in the consensus mechanism with distributed key management

---

## Code Examples

### Retrieve TSS Public Key

Obtaining a public key is usually for generating transfer addresses or on-chain address binding. The public key can be derived deterministically using a tweak parameter.

```rust
use hex;
use vrs_core_sdk::{get, tss::{tss_get_public_key, CryptoType}, storage};
use std::convert::TryFrom;

/// Get TSS public key for a given crypto type and tweak
/// 
/// # Arguments
/// * `crypto_type` - The signature algorithm type (0-6, see CryptoType enum)
/// * `tweak` - Used to derive a child public key based on the master key share.
///            Different tweaks generate different deterministic child keys.
/// 
/// # Returns
/// Hex-encoded public key string
#[get]
pub fn get_public_key(crypto_type: u8, tweak: String) -> Result<String, String> {
    // Validate crypto type
    let crypto = CryptoType::try_from(crypto_type)
        .map_err(|_| format!("Invalid crypto type: {}. Must be 0-6", crypto_type))?;
    
    // Validate tweak is not empty
    if tweak.is_empty() {
        return Err("Tweak cannot be empty".to_string());
    }
    
    // Get the public key
    let public_key_bytes = tss_get_public_key(crypto, tweak)
        .map_err(|e| format!("Failed to get TSS public key: {}", e))?;
    
    // Encode as hex for easy transmission/storage
    Ok(hex::encode(public_key_bytes))
}

/// Get TSS public key with caching
/// Caches the result in storage to avoid repeated computations
#[get]
pub fn get_public_key_cached(crypto_type: u8, tweak: String) -> Result<String, String> {
    // Create cache key
    let cache_key = format!("tss_pubkey:{}:{}", crypto_type, tweak);
    
    // Check cache first
    if let Some(cached) = storage::get(cache_key.as_bytes())
        .map_err(|e| format!("Storage read error: {}", e))?
    {
        if let Ok(cached_str) = String::from_utf8(cached) {
            return Ok(cached_str);
        }
    }
    
    // Compute public key
    let crypto = CryptoType::try_from(crypto_type)
        .map_err(|_| format!("Invalid crypto type: {}", crypto_type))?;
    
    let public_key_bytes = tss_get_public_key(crypto, tweak.clone())
        .map_err(|e| format!("Failed to get TSS public key: {}", e))?;
    
    let hex_key = hex::encode(public_key_bytes);
    
    // Cache the result
    storage::put(cache_key.as_bytes(), hex_key.as_bytes())
        .map_err(|e| format!("Failed to cache public key: {}", e))?;
    
    Ok(hex_key)
}

/// Batch retrieve multiple public keys
#[derive(serde::Deserialize)]
pub struct PublicKeyRequest {
    crypto_type: u8,
    tweak: String,
}

#[get]
pub fn get_multiple_public_keys(requests: Vec<PublicKeyRequest>) -> Result<Vec<String>, String> {
    let mut results = Vec::new();
    
    for req in requests {
        let key = get_public_key(req.crypto_type, req.tweak)?;
        results.push(key);
    }
    
    Ok(results)
}
```

### Generate TSS Signature

In actual transfer or authorization scenarios, the system can initiate a TSS signing request. The message is typically a hash of the transaction data.

```rust
use hex;
use vrs_core_sdk::{post, get, tss::{tss_sign, CryptoType}, storage};
use std::convert::TryFrom;
use serde::{Serialize, Deserialize};

/// Sign a message using TSS
/// 
/// # Arguments
/// * `crypto_type` - The signature algorithm type
/// * `tweak` - The tweak used to derive the signing key
/// * `message` - The message to be signed (usually a hash value, hex-encoded)
/// 
/// # Returns
/// Hex-encoded signature
#[post]
pub fn sign(crypto_type: u8, tweak: String, message: String) -> Result<String, String> {
    // Validate inputs
    let crypto = CryptoType::try_from(crypto_type)
        .map_err(|_| format!("Invalid crypto type: {}", crypto_type))?;
    
    if tweak.is_empty() {
        return Err("Tweak cannot be empty".to_string());
    }
    
    if message.is_empty() {
        return Err("Message cannot be empty".to_string());
    }
    
    // Validate message is valid hex
    let message_bytes = hex::decode(&message)
        .map_err(|e| format!("Invalid hex message: {}", e))?;
    
    // Perform TSS signing
    let signature_bytes = tss_sign(crypto, tweak.clone(), message)
        .map_err(|e| format!("TSS signing failed: {}", e))?;
    
    // Log the signing operation for audit trail
    log_signing_operation(crypto_type, &tweak, &message, &signature_bytes)?;
    
    Ok(hex::encode(signature_bytes))
}

/// Enhanced signing with metadata and verification
#[derive(Serialize, Deserialize)]
pub struct SigningRequest {
    crypto_type: u8,
    tweak: String,
    message: String,
    purpose: Option<String>,
    transaction_id: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct SigningResponse {
    signature: String,
    public_key: String,
    timestamp: u64,
    transaction_id: Option<String>,
}

#[post]
pub fn sign_with_metadata(request: SigningRequest) -> Result<SigningResponse, String> {
    // Validate crypto type
    let crypto = CryptoType::try_from(request.crypto_type)
        .map_err(|_| format!("Invalid crypto type: {}", request.crypto_type))?;
    
    // Validate message format
    hex::decode(&request.message)
        .map_err(|e| format!("Invalid hex message: {}", e))?;
    
    // Get the public key for verification context
    let public_key = get_public_key(request.crypto_type, request.tweak.clone())?;
    
    // Perform signing
    let signature_bytes = tss_sign(crypto, request.tweak.clone(), request.message.clone())
        .map_err(|e| format!("TSS signing failed: {}", e))?;
    
    let signature = hex::encode(signature_bytes);
    
    // Get current timestamp (implement based on your SDK)
    let timestamp = get_timestamp();
    
    // Store signing record
    store_signing_record(&request, &signature, timestamp)?;
    
    Ok(SigningResponse {
        signature,
        public_key,
        timestamp,
        transaction_id: request.transaction_id,
    })
}

/// Store signing record for audit trail
fn store_signing_record(
    request: &SigningRequest,
    signature: &str,
    timestamp: u64,
) -> Result<(), String> {
    #[derive(Serialize)]
    struct SigningRecord {
        crypto_type: u8,
        tweak: String,
        message_hash: String,
        signature: String,
        timestamp: u64,
        purpose: Option<String>,
        transaction_id: Option<String>,
    }
    
    let record = SigningRecord {
        crypto_type: request.crypto_type,
        tweak: request.tweak.clone(),
        message_hash: request.message.clone(),
        signature: signature.to_string(),
        timestamp,
        purpose: request.purpose.clone(),
        transaction_id: request.transaction_id.clone(),
    };
    
    let record_json = serde_json::to_string(&record)
        .map_err(|e| format!("Failed to serialize record: {}", e))?;
    
    // Store with timestamp key for chronological lookup
    let key = format!("signing_record:{}", timestamp);
    storage::put(key.as_bytes(), record_json.as_bytes())
        .map_err(|e| format!("Failed to store signing record: {}", e))?;
    
    Ok(())
}

/// Log signing operation
fn log_signing_operation(
    crypto_type: u8,
    tweak: &str,
    message: &str,
    signature: &[u8],
) -> Result<(), String> {
    let log_entry = format!(
        "TSS_SIGN crypto={} tweak={} msg_len={} sig_len={}",
        crypto_type,
        tweak,
        message.len(),
        signature.len()
    );
    
    // Append to log (implement log storage as needed)
    let log_key = b"tss_signing_log";
    let existing = storage::get(log_key)
        .map_err(|e| format!("Failed to read log: {}", e))?
        .unwrap_or_default();
    
    let mut logs = String::from_utf8(existing).unwrap_or_default();
    logs.push_str(&format!("{}\n", log_entry));
    
    storage::put(log_key, logs.as_bytes())
        .map_err(|e| format!("Failed to write log: {}", e))?;
    
    Ok(())
}

/// Get signing history
#[get]
pub fn get_signing_history(limit: Option<usize>) -> Result<Vec<String>, String> {
    let limit = limit.unwrap_or(100);
    let log_key = b"tss_signing_log";
    
    let logs = storage::get(log_key)
        .map_err(|e| format!("Failed to read log: {}", e))?
        .map(|bytes| String::from_utf8(bytes).unwrap_or_default())
        .unwrap_or_default();
    
    let entries: Vec<String> = logs
        .lines()
        .rev()
        .take(limit)
        .map(|s| s.to_string())
        .collect();
    
    Ok(entries)
}

/// Helper to get timestamp (implement based on your SDK)
fn get_timestamp() -> u64 {
    // In real implementation, use SDK function to get current timestamp
    // This is a placeholder
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}
```

### Complete Example: Cross-Chain Bridge Signing

```rust
use hex;
use vrs_core_sdk::{post, get, tss::{tss_sign, tss_get_public_key, CryptoType}, storage};
use serde::{Serialize, Deserialize};
use std::convert::TryFrom;

/// Cross-chain bridge transaction data
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct BridgeTransaction {
    pub source_chain: String,
    pub target_chain: String,
    pub amount: String,
    pub recipient: String,
    pub transaction_id: String,
    pub nonce: u64,
}

/// Prepare bridge transaction for signing
#[post]
pub fn prepare_bridge_transaction(tx: BridgeTransaction) -> Result<BridgeTransactionHash, String> {
    // Serialize transaction
    let tx_bytes = serde_json::to_vec(&tx)
        .map_err(|e| format!("Serialization error: {}", e))?;
    
    // Hash the transaction (implement hash function based on your needs)
    let hash = hash_transaction(&tx_bytes);
    let hash_hex = hex::encode(hash);
    
    // Store transaction with its hash
    let tx_key = format!("bridge_tx:{}", tx.transaction_id);
    storage::put(tx_key.as_bytes(), &tx_bytes)
        .map_err(|e| format!("Storage error: {}", e))?;
    
    // Store hash -> transaction_id mapping
    let hash_key = format!("bridge_hash:{}", hash_hex);
    storage::put(hash_key.as_bytes(), tx.transaction_id.as_bytes())
        .map_err(|e| format!("Storage error: {}", e))?;
    
    Ok(BridgeTransactionHash {
        hash: hash_hex,
        transaction_id: tx.transaction_id,
    })
}

#[derive(Serialize, Deserialize)]
pub struct BridgeTransactionHash {
    pub hash: String,
    pub transaction_id: String,
}

/// Sign bridge transaction using TSS
#[post]
pub fn sign_bridge_transaction(
    crypto_type: u8,
    tweak: String,
    transaction_hash: String,
) -> Result<BridgeSignature, String> {
    // Verify transaction exists
    let hash_key = format!("bridge_hash:{}", transaction_hash);
    let tx_id_bytes = storage::get(hash_key.as_bytes())
        .map_err(|e| format!("Storage error: {}", e))?
        .ok_or_else(|| "Transaction hash not found".to_string())?;
    
    let transaction_id = String::from_utf8(tx_id_bytes)
        .map_err(|_| "Invalid transaction ID encoding".to_string())?;
    
    // Get public key
    let crypto = CryptoType::try_from(crypto_type)
        .map_err(|_| format!("Invalid crypto type: {}", crypto_type))?;
    
    let public_key_bytes = tss_get_public_key(crypto, tweak.clone())
        .map_err(|e| format!("Failed to get public key: {}", e))?;
    let public_key = hex::encode(public_key_bytes);
    
    // Sign the transaction hash
    let signature_bytes = tss_sign(crypto, tweak, transaction_hash.clone())
        .map_err(|e| format!("TSS signing failed: {}", e))?;
    let signature = hex::encode(signature_bytes);
    
    // Store signature
    let sig_key = format!("bridge_sig:{}", transaction_id);
    let sig_data = serde_json::to_string(&BridgeSignature {
        signature: signature.clone(),
        public_key: public_key.clone(),
        transaction_hash: transaction_hash.clone(),
        transaction_id: transaction_id.clone(),
        timestamp: get_timestamp(),
    })
    .map_err(|e| format!("Serialization error: {}", e))?;
    
    storage::put(sig_key.as_bytes(), sig_data.as_bytes())
        .map_err(|e| format!("Storage error: {}", e))?;
    
    Ok(BridgeSignature {
        signature,
        public_key,
        transaction_hash,
        transaction_id,
        timestamp: get_timestamp(),
    })
}

#[derive(Serialize, Deserialize)]
pub struct BridgeSignature {
    pub signature: String,
    pub public_key: String,
    pub transaction_hash: String,
    pub transaction_id: String,
    pub timestamp: u64,
}

/// Get bridge transaction signature
#[get]
pub fn get_bridge_signature(transaction_id: String) -> Result<BridgeSignature, String> {
    let sig_key = format!("bridge_sig:{}", transaction_id);
    let sig_data = storage::get(sig_key.as_bytes())
        .map_err(|e| format!("Storage error: {}", e))?
        .ok_or_else(|| "Signature not found".to_string())?;
    
    let signature: BridgeSignature = serde_json::from_slice(&sig_data)
        .map_err(|e| format!("Deserialization error: {}", e))?;
    
    Ok(signature)
}

/// Hash transaction (placeholder - implement with actual hash function)
fn hash_transaction(data: &[u8]) -> Vec<u8> {
    // In real implementation, use appropriate hash function (e.g., SHA256, Keccak256)
    // This is a placeholder
    use sha2::{Sha256, Digest};
    let mut hasher = Sha256::new();
    hasher.update(data);
    hasher.finalize().to_vec()
}
```

---

## Supported Signature Algorithms

Verisense currently supports the following signature algorithms:

```rust
#[repr(u8)]
#[derive(Encode, Decode, Clone, Copy, Debug, PartialEq, Eq)]
pub enum CryptoType {
    P256 = 0,
    Ed25519 = 1,
    Secp256k1 = 2,
    Secp256k1Tr = 3,
    Ed448 = 4,
    Ristretto255 = 5,
    EcdsaSecp256k1 = 6,
}
```

### Algorithm Details

- **EcdsaSecp256k1 (6)**: Used for ETH/BSC and other Ethereum-compatible chains. Uses ECDSA signature scheme.
- **Ed25519 (1), Ristretto255 (5), Secp256k1 (2), Secp256k1Tr (3), P256 (0), Ed448 (4)**: Use Schnorr signature schemes, which provide better aggregation properties and security in multi-party signature (MPC/TSS) scenarios, making them ideal for high-performance and decentralized use cases.

### Crypto Type Helper Functions

```rust
use vrs_core_sdk::tss::CryptoType;
use std::convert::TryFrom;

/// Get crypto type name as string
pub fn crypto_type_name(crypto_type: u8) -> Result<&'static str, String> {
    match CryptoType::try_from(crypto_type)? {
        CryptoType::P256 => Ok("P256"),
        CryptoType::Ed25519 => Ok("Ed25519"),
        CryptoType::Secp256k1 => Ok("Secp256k1"),
        CryptoType::Secp256k1Tr => Ok("Secp256k1Tr"),
        CryptoType::Ed448 => Ok("Ed448"),
        CryptoType::Ristretto255 => Ok("Ristretto255"),
        CryptoType::EcdsaSecp256k1 => Ok("EcdsaSecp256k1"),
    }
}

/// Check if crypto type uses Schnorr signatures
pub fn is_schnorr(crypto_type: u8) -> Result<bool, String> {
    let crypto = CryptoType::try_from(crypto_type)?;
    Ok(crypto != CryptoType::EcdsaSecp256k1)
}

/// Get recommended crypto type for blockchain
pub fn crypto_type_for_chain(chain: &str) -> Result<u8, String> {
    match chain.to_lowercase().as_str() {
        "ethereum" | "eth" | "bsc" | "polygon" | "arbitrum" | "optimism" => {
            Ok(CryptoType::EcdsaSecp256k1 as u8)
        }
        "solana" | "sui" | "aptos" => Ok(CryptoType::Ed25519 as u8),
        "bitcoin" | "btc" => Ok(CryptoType::Secp256k1 as u8),
        _ => Err(format!("Unknown chain: {}", chain)),
    }
}
```

---

## Best Practices

1. **Always validate inputs**: Check that `crypto_type`, `tweak`, and `message` are valid before calling TSS functions
2. **Use appropriate crypto types**: Choose the correct algorithm for your use case (EcdsaSecp256k1 for Ethereum, Ed25519 for Solana, etc.)
3. **Cache public keys**: Public keys can be cached since they're deterministic based on the tweak
4. **Maintain audit trails**: Log all signing operations for security and compliance
5. **Handle errors gracefully**: TSS operations can fail due to network issues, insufficient participants, etc.
6. **Use meaningful tweaks**: Use domain-specific tweaks (e.g., "bridge:eth", "vault:main") to organize keys
7. **Verify message format**: Ensure messages are properly hashed and encoded before signing

---

## Advanced Patterns

### TSS Key Management

```rust
use vrs_core_sdk::{post, get, storage, tss::{tss_get_public_key, CryptoType}};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct KeyMetadata {
    pub crypto_type: u8,
    pub tweak: String,
    pub purpose: String,
    pub created_at: u64,
    pub public_key: String,
}

/// Register a new TSS key with metadata
#[post]
pub fn register_tss_key(
    crypto_type: u8,
    tweak: String,
    purpose: String,
) -> Result<KeyMetadata, String> {
    // Validate crypto type
    CryptoType::try_from(crypto_type)
        .map_err(|_| format!("Invalid crypto type: {}", crypto_type))?;
    
    // Check if key already exists
    let key_id = format!("tss_key:{}:{}", crypto_type, tweak);
    if storage::get(key_id.as_bytes())
        .map_err(|e| format!("Storage error: {}", e))?
        .is_some()
    {
        return Err("Key already registered".to_string());
    }
    
    // Get public key
    let crypto = CryptoType::try_from(crypto_type).unwrap();
    let public_key_bytes = tss_get_public_key(crypto, tweak.clone())
        .map_err(|e| format!("Failed to get public key: {}", e))?;
    let public_key = hex::encode(public_key_bytes);
    
    // Create metadata
    let metadata = KeyMetadata {
        crypto_type,
        tweak: tweak.clone(),
        purpose,
        created_at: get_timestamp(),
        public_key,
    };
    
    // Store metadata
    let metadata_json = serde_json::to_string(&metadata)
        .map_err(|e| format!("Serialization error: {}", e))?;
    storage::put(key_id.as_bytes(), metadata_json.as_bytes())
        .map_err(|e| format!("Storage error: {}", e))?;
    
    Ok(metadata)
}

/// List all registered TSS keys
#[get]
pub fn list_tss_keys() -> Result<Vec<KeyMetadata>, String> {
    // In production, use get_range to fetch all keys with "tss_key:" prefix
    // This is a simplified version
    Ok(vec![])
}
```

---

## Error Handling

TSS operations can fail for various reasons. Always handle errors appropriately:

```rust
use vrs_core_sdk::tss::{tss_sign, CryptoType};

pub fn safe_tss_sign(
    crypto_type: u8,
    tweak: String,
    message: String,
) -> Result<String, TssError> {
    // Validate crypto type
    let crypto = CryptoType::try_from(crypto_type)
        .map_err(|_| TssError::InvalidCryptoType(crypto_type))?;
    
    // Validate inputs
    if tweak.is_empty() {
        return Err(TssError::EmptyTweak);
    }
    
    if message.is_empty() {
        return Err(TssError::EmptyMessage);
    }
    
    // Validate hex format
    hex::decode(&message)
        .map_err(|e| TssError::InvalidHex(e.to_string()))?;
    
    // Attempt signing
    tss_sign(crypto, tweak, message)
        .map(|sig| hex::encode(sig))
        .map_err(|e| TssError::SigningFailed(e.to_string()))
}

#[derive(Debug)]
pub enum TssError {
    InvalidCryptoType(u8),
    EmptyTweak,
    EmptyMessage,
    InvalidHex(String),
    SigningFailed(String),
}

impl std::fmt::Display for TssError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            TssError::InvalidCryptoType(t) => write!(f, "Invalid crypto type: {}", t),
            TssError::EmptyTweak => write!(f, "Tweak cannot be empty"),
            TssError::EmptyMessage => write!(f, "Message cannot be empty"),
            TssError::InvalidHex(e) => write!(f, "Invalid hex: {}", e),
            TssError::SigningFailed(e) => write!(f, "Signing failed: {}", e),
        }
    }
}

impl std::error::Error for TssError {}
```

---

## Example: 2-of-3 Signing Process

Suppose we have Alice, Bob, and Charlie forming a 2-of-3 TSS group:

1. **System Initialization**: During system initialization, each of the three participants receives a private key share. The system generates a master public key and derives child keys using tweaks.

2. **Signature Request**: When a signature is needed (e.g., for a cross-chain transaction), the request is broadcast to all participants.

3. **Collaborative Signing**: Alice and Bob collaborate through secure channels to generate a valid signature. The TSS protocol ensures that:
   - Neither Alice nor Bob alone can generate a signature
   - Charlie's participation is not required (threshold is 2-of-3)
   - The signature is valid even if Charlie is offline or compromised

4. **Signature Verification**: The generated signature can be verified using the public key, which matches standard signature verification.

### Code Example for 2-of-3 Scenario

```rust
use vrs_core_sdk::{post, get, storage, tss::{tss_get_public_key, tss_sign, CryptoType}};
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct TssGroup {
    pub group_id: String,
    pub threshold: u8,
    pub total_participants: u8,
    pub crypto_type: u8,
    pub master_tweak: String,
    pub created_at: u64,
}

/// Initialize a 2-of-3 TSS group
#[post]
pub fn initialize_tss_group(group_id: String, crypto_type: u8) -> Result<TssGroup, String> {
    let master_tweak = format!("group:{}", group_id);
    
    // Get master public key (this will be distributed to all participants)
    let crypto = CryptoType::try_from(crypto_type)
        .map_err(|_| format!("Invalid crypto type: {}", crypto_type))?;
    
    let master_pubkey = tss_get_public_key(crypto, master_tweak.clone())
        .map_err(|e| format!("Failed to get master public key: {}", e))?;
    
    let group = TssGroup {
        group_id: group_id.clone(),
        threshold: 2,
        total_participants: 3,
        crypto_type,
        master_tweak: master_tweak.clone(),
        created_at: get_timestamp(),
    };
    
    // Store group configuration
    let group_key = format!("tss_group:{}", group_id);
    let group_json = serde_json::to_string(&group)
        .map_err(|e| format!("Serialization error: {}", e))?;
    storage::put(group_key.as_bytes(), group_json.as_bytes())
        .map_err(|e| format!("Storage error: {}", e))?;
    
    Ok(group)
}

/// Sign a message with 2-of-3 TSS
/// Note: The actual TSS protocol handles the multi-party coordination
/// This function initiates the signing process
#[post]
pub fn sign_with_group(
    group_id: String,
    message: String,
    purpose: String,
) -> Result<String, String> {
    // Get group configuration
    let group_key = format!("tss_group:{}", group_id);
    let group_data = storage::get(group_key.as_bytes())
        .map_err(|e| format!("Storage error: {}", e))?
        .ok_or_else(|| "Group not found".to_string())?;
    
    let group: TssGroup = serde_json::from_slice(&group_data)
        .map_err(|e| format!("Deserialization error: {}", e))?;
    
    // Use group-specific tweak for this signing operation
    let operation_tweak = format!("{}:{}", group.master_tweak, purpose);
    
    // Initiate TSS signing
    // The SDK handles the multi-party coordination internally
    let crypto = CryptoType::try_from(group.crypto_type).unwrap();
    let signature_bytes = tss_sign(crypto, operation_tweak, message.clone())
        .map_err(|e| format!("TSS signing failed: {}", e))?;
    
    let signature = hex::encode(signature_bytes);
    
    // Log the signing operation
    let log_entry = format!(
        "Group {} signed message for purpose {} at {}",
        group_id,
        purpose,
        get_timestamp()
    );
    
    storage::put(b"tss_group_log", log_entry.as_bytes())
        .map_err(|e| format!("Logging error: {}", e))?;
    
    Ok(signature)
}
```

This mechanism ensures both the security and flexibility of asset control, making it very suitable for decentralized custody, cross-chain bridges, DAO governance, and other multi-party control scenarios.

