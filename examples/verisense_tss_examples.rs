//! Verisense TSS (Threshold Signature Scheme) Examples
//!
//! This file contains comprehensive examples demonstrating best practices
//! for using Verisense TSS in Rust/WASM Nucleus development.
//!
//! Examples include:
//! - Basic TSS public key retrieval
//! - TSS signing operations
//! - Error handling patterns
//! - Key management
//! - Cross-chain bridge patterns
//! - Multi-party governance patterns

use vrs_core_sdk::{get, post, init, storage, tss::{tss_get_public_key, tss_sign, CryptoType}};
use serde::{Serialize, Deserialize};
use std::convert::TryFrom;
use hex;

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct KeyMetadata {
    pub crypto_type: u8,
    pub tweak: String,
    pub purpose: String,
    pub created_at: u64,
    pub public_key: String,
    pub description: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SigningRequest {
    pub crypto_type: u8,
    pub tweak: String,
    pub message: String,
    pub purpose: Option<String>,
    pub transaction_id: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SigningResponse {
    pub signature: String,
    pub public_key: String,
    pub timestamp: u64,
    pub transaction_id: Option<String>,
    pub crypto_type: u8,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct BridgeTransaction {
    pub source_chain: String,
    pub target_chain: String,
    pub amount: String,
    pub recipient: String,
    pub transaction_id: String,
    pub nonce: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct TssGroup {
    pub group_id: String,
    pub threshold: u8,
    pub total_participants: u8,
    pub crypto_type: u8,
    pub master_tweak: String,
    pub created_at: u64,
}

#[derive(Debug, Clone)]
pub enum TssError {
    InvalidCryptoType(u8),
    EmptyTweak,
    EmptyMessage,
    InvalidHex(String),
    SigningFailed(String),
    PublicKeyFailed(String),
    StorageError(String),
    SerializationError(String),
}

impl std::fmt::Display for TssError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            TssError::InvalidCryptoType(t) => write!(f, "Invalid crypto type: {}", t),
            TssError::EmptyTweak => write!(f, "Tweak cannot be empty"),
            TssError::EmptyMessage => write!(f, "Message cannot be empty"),
            TssError::InvalidHex(e) => write!(f, "Invalid hex: {}", e),
            TssError::SigningFailed(e) => write!(f, "Signing failed: {}", e),
            TssError::PublicKeyFailed(e) => write!(f, "Public key retrieval failed: {}", e),
            TssError::StorageError(e) => write!(f, "Storage error: {}", e),
            TssError::SerializationError(e) => write!(f, "Serialization error: {}", e),
        }
    }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Get current timestamp
fn get_timestamp() -> u64 {
    // In real implementation, use SDK function to get current timestamp
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

/// Hash transaction data (placeholder)
fn hash_transaction(data: &[u8]) -> Vec<u8> {
    // In real implementation, use appropriate hash function (e.g., SHA256, Keccak256)
    // This is a placeholder - in production, use a proper hash crate
    data.to_vec() // Simplified
}

/// Validate crypto type
fn validate_crypto_type(crypto_type: u8) -> Result<CryptoType, TssError> {
    CryptoType::try_from(crypto_type)
        .map_err(|_| TssError::InvalidCryptoType(crypto_type))
}

/// Get crypto type name as string
fn crypto_type_name(crypto_type: u8) -> Result<&'static str, TssError> {
    match validate_crypto_type(crypto_type)? {
        CryptoType::P256 => Ok("P256"),
        CryptoType::Ed25519 => Ok("Ed25519"),
        CryptoType::Secp256k1 => Ok("Secp256k1"),
        CryptoType::Secp256k1Tr => Ok("Secp256k1Tr"),
        CryptoType::Ed448 => Ok("Ed448"),
        CryptoType::Ristretto255 => Ok("Ristretto255"),
        CryptoType::EcdsaSecp256k1 => Ok("EcdsaSecp256k1"),
    }
}

// ============================================================================
// BASIC TSS OPERATIONS
// ============================================================================

/// Get TSS public key - basic example
#[get]
pub fn get_public_key_basic(crypto_type: u8, tweak: String) -> Result<String, String> {
    let crypto = validate_crypto_type(crypto_type)
        .map_err(|e| e.to_string())?;
    
    if tweak.is_empty() {
        return Err("Tweak cannot be empty".to_string());
    }
    
    let public_key_bytes = tss_get_public_key(crypto, tweak)
        .map_err(|e| format!("Failed to get TSS public key: {}", e))?;
    
    Ok(hex::encode(public_key_bytes))
}

/// Get TSS public key with validation and error handling
#[get]
pub fn get_public_key(crypto_type: u8, tweak: String) -> Result<String, String> {
    // Validate inputs
    let crypto = validate_crypto_type(crypto_type)
        .map_err(|e| e.to_string())?;
    
    if tweak.is_empty() {
        return Err("Tweak cannot be empty".to_string());
    }
    
    // Get the public key
    let public_key_bytes = tss_get_public_key(crypto, tweak.clone())
        .map_err(|e| format!("Failed to get TSS public key for tweak '{}': {}", tweak, e))?;
    
    Ok(hex::encode(public_key_bytes))
}

/// Get TSS public key with caching
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
    let crypto = validate_crypto_type(crypto_type)
        .map_err(|e| e.to_string())?;
    
    let public_key_bytes = tss_get_public_key(crypto, tweak.clone())
        .map_err(|e| format!("Failed to get TSS public key: {}", e))?;
    
    let hex_key = hex::encode(public_key_bytes);
    
    // Cache the result
    storage::put(cache_key.as_bytes(), hex_key.as_bytes())
        .map_err(|e| format!("Failed to cache public key: {}", e))?;
    
    Ok(hex_key)
}

/// Sign a message using TSS - basic example
#[post]
pub fn sign_basic(crypto_type: u8, tweak: String, message: String) -> Result<String, String> {
    let crypto = validate_crypto_type(crypto_type)
        .map_err(|e| e.to_string())?;
    
    if tweak.is_empty() {
        return Err("Tweak cannot be empty".to_string());
    }
    
    if message.is_empty() {
        return Err("Message cannot be empty".to_string());
    }
    
    // Validate message is valid hex
    hex::decode(&message)
        .map_err(|e| format!("Invalid hex message: {}", e))?;
    
    // Perform TSS signing
    let signature_bytes = tss_sign(crypto, tweak.clone(), message.clone())
        .map_err(|e| format!("TSS signing failed: {}", e))?;
    
    Ok(hex::encode(signature_bytes))
}

/// Sign a message with comprehensive error handling
#[post]
pub fn sign(crypto_type: u8, tweak: String, message: String) -> Result<String, String> {
    // Validate inputs
    let crypto = validate_crypto_type(crypto_type)
        .map_err(|e| e.to_string())?;
    
    if tweak.is_empty() {
        return Err("Tweak cannot be empty".to_string());
    }
    
    if message.is_empty() {
        return Err("Message cannot be empty".to_string());
    }
    
    // Validate message is valid hex
    hex::decode(&message)
        .map_err(|e| format!("Invalid hex message: {}", e))?;
    
    // Perform TSS signing
    let signature_bytes = tss_sign(crypto, tweak.clone(), message.clone())
        .map_err(|e| format!("TSS signing failed: {}", e))?;
    
    // Log the signing operation for audit trail
    log_signing_operation(crypto_type, &tweak, &message, &signature_bytes)?;
    
    Ok(hex::encode(signature_bytes))
}

/// Sign with metadata and full response
#[post]
pub fn sign_with_metadata(request: SigningRequest) -> Result<SigningResponse, String> {
    // Validate crypto type
    let crypto = validate_crypto_type(request.crypto_type)
        .map_err(|e| e.to_string())?;
    
    // Validate message format
    hex::decode(&request.message)
        .map_err(|e| format!("Invalid hex message: {}", e))?;
    
    // Get the public key for verification context
    let public_key_bytes = tss_get_public_key(crypto, request.tweak.clone())
        .map_err(|e| format!("Failed to get public key: {}", e))?;
    let public_key = hex::encode(public_key_bytes);
    
    // Perform signing
    let signature_bytes = tss_sign(crypto, request.tweak.clone(), request.message.clone())
        .map_err(|e| format!("TSS signing failed: {}", e))?;
    
    let signature = hex::encode(signature_bytes);
    let timestamp = get_timestamp();
    
    // Store signing record
    store_signing_record(&request, &signature, timestamp)?;
    
    Ok(SigningResponse {
        signature,
        public_key,
        timestamp,
        transaction_id: request.transaction_id,
        crypto_type: request.crypto_type,
    })
}

// ============================================================================
// KEY MANAGEMENT
// ============================================================================

/// Register a new TSS key with metadata
#[post]
pub fn register_tss_key(
    crypto_type: u8,
    tweak: String,
    purpose: String,
    description: Option<String>,
) -> Result<KeyMetadata, String> {
    // Validate crypto type
    validate_crypto_type(crypto_type)
        .map_err(|e| e.to_string())?;
    
    // Check if key already exists
    let key_id = format!("tss_key:{}:{}", crypto_type, tweak);
    if storage::get(key_id.as_bytes())
        .map_err(|e| format!("Storage error: {}", e))?
        .is_some()
    {
        return Err("Key already registered".to_string());
    }
    
    // Get public key
    let crypto = validate_crypto_type(crypto_type).unwrap();
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
        description,
    };
    
    // Store metadata
    let metadata_json = serde_json::to_string(&metadata)
        .map_err(|e| format!("Serialization error: {}", e))?;
    storage::put(key_id.as_bytes(), metadata_json.as_bytes())
        .map_err(|e| format!("Storage error: {}", e))?;
    
    Ok(metadata)
}

/// Get registered key metadata
#[get]
pub fn get_key_metadata(crypto_type: u8, tweak: String) -> Result<KeyMetadata, String> {
    let key_id = format!("tss_key:{}:{}", crypto_type, tweak);
    let metadata_data = storage::get(key_id.as_bytes())
        .map_err(|e| format!("Storage error: {}", e))?
        .ok_or_else(|| "Key not found".to_string())?;
    
    let metadata: KeyMetadata = serde_json::from_slice(&metadata_data)
        .map_err(|e| format!("Deserialization error: {}", e))?;
    
    Ok(metadata)
}

// ============================================================================
// CROSS-CHAIN BRIDGE PATTERNS
// ============================================================================

/// Prepare bridge transaction for signing
#[post]
pub fn prepare_bridge_transaction(tx: BridgeTransaction) -> Result<String, String> {
    // Serialize transaction
    let tx_bytes = serde_json::to_vec(&tx)
        .map_err(|e| format!("Serialization error: {}", e))?;
    
    // Hash the transaction
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
    
    Ok(hash_hex)
}

/// Sign bridge transaction using TSS
#[post]
pub fn sign_bridge_transaction(
    crypto_type: u8,
    tweak: String,
    transaction_hash: String,
) -> Result<SigningResponse, String> {
    // Verify transaction exists
    let hash_key = format!("bridge_hash:{}", transaction_hash);
    let tx_id_bytes = storage::get(hash_key.as_bytes())
        .map_err(|e| format!("Storage error: {}", e))?
        .ok_or_else(|| "Transaction hash not found".to_string())?;
    
    let transaction_id = String::from_utf8(tx_id_bytes)
        .map_err(|_| "Invalid transaction ID encoding".to_string())?;
    
    // Get public key
    let crypto = validate_crypto_type(crypto_type)
        .map_err(|e| e.to_string())?;
    
    let public_key_bytes = tss_get_public_key(crypto, tweak.clone())
        .map_err(|e| format!("Failed to get public key: {}", e))?;
    let public_key = hex::encode(public_key_bytes);
    
    // Sign the transaction hash
    let signature_bytes = tss_sign(crypto, tweak, transaction_hash.clone())
        .map_err(|e| format!("TSS signing failed: {}", e))?;
    let signature = hex::encode(signature_bytes);
    
    // Create signing record
    let request = SigningRequest {
        crypto_type,
        tweak: tweak.clone(),
        message: transaction_hash.clone(),
        purpose: Some("bridge_transaction".to_string()),
        transaction_id: Some(transaction_id.clone()),
    };
    
    let timestamp = get_timestamp();
    store_signing_record(&request, &signature, timestamp)?;
    
    Ok(SigningResponse {
        signature,
        public_key,
        timestamp,
        transaction_id: Some(transaction_id),
        crypto_type,
    })
}

/// Get bridge transaction signature
#[get]
pub fn get_bridge_signature(transaction_id: String) -> Result<SigningResponse, String> {
    let sig_key = format!("bridge_sig:{}", transaction_id);
    let sig_data = storage::get(sig_key.as_bytes())
        .map_err(|e| format!("Storage error: {}", e))?
        .ok_or_else(|| "Signature not found".to_string())?;
    
    let signature: SigningResponse = serde_json::from_slice(&sig_data)
        .map_err(|e| format!("Deserialization error: {}", e))?;
    
    Ok(signature)
}

// ============================================================================
// TSS GROUP MANAGEMENT (2-of-3, 3-of-5, etc.)
// ============================================================================

/// Initialize a TSS group
#[post]
pub fn initialize_tss_group(group_id: String, crypto_type: u8, threshold: u8, total_participants: u8) -> Result<TssGroup, String> {
    // Validate parameters
    if threshold > total_participants {
        return Err("Threshold cannot exceed total participants".to_string());
    }
    
    if threshold == 0 {
        return Err("Threshold must be at least 1".to_string());
    }
    
    validate_crypto_type(crypto_type)
        .map_err(|e| e.to_string())?;
    
    let master_tweak = format!("group:{}", group_id);
    
    // Get master public key
    let crypto = validate_crypto_type(crypto_type).unwrap();
    let _master_pubkey = tss_get_public_key(crypto, master_tweak.clone())
        .map_err(|e| format!("Failed to get master public key: {}", e))?;
    
    let group = TssGroup {
        group_id: group_id.clone(),
        threshold,
        total_participants,
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

/// Sign a message with TSS group
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
    let crypto = validate_crypto_type(group.crypto_type).unwrap();
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

/// Get TSS group information
#[get]
pub fn get_tss_group(group_id: String) -> Result<TssGroup, String> {
    let group_key = format!("tss_group:{}", group_id);
    let group_data = storage::get(group_key.as_bytes())
        .map_err(|e| format!("Storage error: {}", e))?
        .ok_or_else(|| "Group not found".to_string())?;
    
    let group: TssGroup = serde_json::from_slice(&group_data)
        .map_err(|e| format!("Deserialization error: {}", e))?;
    
    Ok(group)
}

// ============================================================================
// AUDIT TRAIL AND LOGGING
// ============================================================================

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
    
    // Also store bridge signature if transaction_id exists
    if let Some(ref tx_id) = request.transaction_id {
        let sig_key = format!("bridge_sig:{}", tx_id);
        let response = SigningResponse {
            signature: signature.to_string(),
            public_key: String::new(), // Would need to fetch this
            timestamp,
            transaction_id: Some(tx_id.clone()),
            crypto_type: request.crypto_type,
        };
        
        let sig_json = serde_json::to_string(&response)
            .map_err(|e| format!("Serialization error: {}", e))?;
        storage::put(sig_key.as_bytes(), sig_json.as_bytes())
            .map_err(|e| format!("Storage error: {}", e))?;
    }
    
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
    
    // Append to log
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

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/// Get crypto type name as string
#[get]
pub fn get_crypto_type_name(crypto_type: u8) -> Result<String, String> {
    crypto_type_name(crypto_type)
        .map(|s| s.to_string())
        .map_err(|e| e.to_string())
}

/// Check if crypto type uses Schnorr signatures
#[get]
pub fn is_schnorr_signature(crypto_type: u8) -> Result<bool, String> {
    let crypto = validate_crypto_type(crypto_type)
        .map_err(|e| e.to_string())?;
    Ok(crypto != CryptoType::EcdsaSecp256k1)
}

/// Get recommended crypto type for blockchain
#[get]
pub fn get_crypto_type_for_chain(chain: String) -> Result<u8, String> {
    match chain.to_lowercase().as_str() {
        "ethereum" | "eth" | "bsc" | "polygon" | "arbitrum" | "optimism" => {
            Ok(CryptoType::EcdsaSecp256k1 as u8)
        }
        "solana" | "sui" | "aptos" => Ok(CryptoType::Ed25519 as u8),
        "bitcoin" | "btc" => Ok(CryptoType::Secp256k1 as u8),
        _ => Err(format!("Unknown chain: {}", chain)),
    }
}

/// Batch retrieve multiple public keys
#[derive(Deserialize)]
pub struct PublicKeyRequest {
    pub crypto_type: u8,
    pub tweak: String,
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

// ============================================================================
// INITIALIZATION
// ============================================================================

#[init]
pub fn tss_init() -> Result<(), String> {
    // Initialize TSS logging
    storage::put(b"tss_signing_log", b"")
        .map_err(|e| format!("Initialization error: {}", e))?;
    
    storage::put(b"tss_initialized_at", &get_timestamp().to_be_bytes())
        .map_err(|e| format!("Initialization error: {}", e))?;
    
    Ok(())
}


