//! Verisense Timer Examples
//!
//! This file contains comprehensive examples demonstrating best practices
//! for using Verisense timers in Rust/WASM Nucleus development.
//!
//! Examples include:
//! - Basic timer usage
//! - Interval patterns
//! - Error handling
//! - State management
//! - Advanced patterns

use vrs_core_sdk::{init, post, timer, storage, set_timer};
use std::time::Duration;
use serde::{Serialize, Deserialize};

// ============================================================================
// INITIALIZATION EXAMPLES
// ============================================================================

/// Basic initialization example
#[init]
pub fn basic_init() {
    storage::put(b"initialized", b"true").unwrap();
    storage::put(b"init_timestamp", &get_timestamp().to_be_bytes()).unwrap();
}

/// Advanced initialization with configuration
#[derive(Serialize, Deserialize, Clone, Debug)]
struct NucleusConfig {
    interval_seconds: u64,
    max_retries: u32,
    enabled: bool,
}

#[init]
pub fn advanced_init() -> Result<(), String> {
    // Set default configuration
    let config = NucleusConfig {
        interval_seconds: 60,
        max_retries: 3,
        enabled: true,
    };
    
    let config_bytes = bincode::serialize(&config)
        .map_err(|e| format!("Config serialization failed: {}", e))?;
    
    storage::put(b"config", &config_bytes)
        .map_err(|e| format!("Storage put failed: {}", e))?;
    
    // Initialize state
    storage::put(b"state", b"initialized")
        .map_err(|e| format!("Storage put failed: {}", e))?;
    
    // Schedule first timer if enabled
    if config.enabled {
        set_timer!(
            Duration::from_secs(config.interval_seconds),
            first_timer_handler()
        );
    }
    
    Ok(())
}

// ============================================================================
// BASIC TIMER EXAMPLES
// ============================================================================

/// Simple one-shot timer
#[post]
pub fn schedule_simple_timer() -> Result<(), String> {
    let message = "Hello from timer!".to_string();
    let count = 42;
    
    set_timer!(
        Duration::from_secs(4),
        simple_timer_handler(message, count)
    );
    
    storage::put(b"timer_status", b"scheduled")
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[timer]
pub fn simple_timer_handler(message: String, count: i32) {
    let result = format!("Timer fired: {} (count: {})", message, count);
    storage::put(b"timer_result", result.as_bytes()).unwrap();
}

/// Timer with complex data structures
#[derive(Serialize, Deserialize, Clone, Debug)]
struct TaskData {
    task_id: String,
    user_id: String,
    priority: u8,
    metadata: Vec<String>,
}

#[post]
pub fn schedule_task(task: TaskData) -> Result<(), String> {
    let delay = Duration::from_secs(30);
    
    set_timer!(delay, process_task(task.clone()));
    
    // Log the scheduled task
    let log_entry = format!(
        "Task {} scheduled for user {} (priority: {})",
        task.task_id, task.user_id, task.priority
    );
    storage::put(b"task_log", log_entry.as_bytes())
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[timer]
pub fn process_task(task: TaskData) {
    // Process the task
    let result = format!(
        "Processed task {} for user {} with {} metadata items",
        task.task_id, task.user_id, task.metadata.len()
    );
    storage::put(b"task_result", result.as_bytes()).unwrap();
    
    // Update task status
    storage::put(
        b"task_status",
        format!("completed:{}", task.task_id).as_bytes()
    ).unwrap();
}

// ============================================================================
// INTERVAL EXAMPLES
// ============================================================================

/// Basic interval pattern
#[post]
pub fn start_basic_interval() -> Result<(), String> {
    // Reset counter
    storage::put(b"interval_count", &0u64.to_be_bytes())
        .map_err(|e| e.to_string())?;
    
    // Start interval with initial delay
    set_timer!(Duration::from_secs(2), basic_interval_handler());
    
    storage::put(b"interval_status", b"started")
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[timer]
pub fn basic_interval_handler() {
    // Read current count
    let count: u64 = storage::get(b"interval_count")
        .unwrap_or(None)
        .and_then(|bytes| {
            if bytes.len() >= 8 {
                Some(u64::from_be_bytes([
                    bytes[0], bytes[1], bytes[2], bytes[3],
                    bytes[4], bytes[5], bytes[6], bytes[7],
                ]))
            } else {
                None
            }
        })
        .unwrap_or(0);
    
    // Increment and store
    let new_count = count + 1;
    storage::put(b"interval_count", &new_count.to_be_bytes()).unwrap();
    storage::put(b"interval", b"running").unwrap();
    
    // Schedule next execution
    set_timer!(Duration::from_secs(1), basic_interval_handler());
}

/// Interval with stop condition
#[post]
pub fn start_controlled_interval() -> Result<(), String> {
    storage::put(b"processing", b"active").unwrap();
    storage::put(b"processed_count", &0u64.to_be_bytes()).unwrap();
    storage::put(b"max_iterations", &100u64.to_be_bytes()).unwrap();
    
    set_timer!(Duration::from_secs(5), controlled_interval_handler());
    Ok(())
}

#[post]
pub fn stop_controlled_interval() -> Result<(), String> {
    storage::put(b"processing", b"stopped")
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[timer]
pub fn controlled_interval_handler() {
    // Check if processing should continue
    let status = storage::get(b"processing")
        .unwrap_or(None)
        .unwrap_or_else(|| b"stopped".to_vec());
    
    if status == b"stopped" {
        storage::put(b"interval_status", b"stopped").unwrap();
        return; // Stop the interval
    }
    
    // Check max iterations
    let current: u64 = read_u64_from_storage(b"processed_count").unwrap_or(0);
    let max: u64 = read_u64_from_storage(b"max_iterations").unwrap_or(100);
    
    if current >= max {
        storage::put(b"processing", b"stopped").unwrap();
        storage::put(b"interval_status", b"max_reached").unwrap();
        return;
    }
    
    // Process a batch
    let new_count = current + 1;
    storage::put(b"processed_count", &new_count.to_be_bytes()).unwrap();
    
    // Log progress
    let progress = format!("Processed {}/{}", new_count, max);
    storage::put(b"progress", progress.as_bytes()).unwrap();
    
    // Continue processing
    set_timer!(Duration::from_secs(5), controlled_interval_handler());
}

// ============================================================================
// ADVANCED PATTERNS
// ============================================================================

/// Exponential backoff retry pattern
#[post]
pub fn start_retry_with_backoff() -> Result<(), String> {
    storage::put(b"retry_count", &0u32.to_be_bytes()).unwrap();
    storage::put(b"retry_status", b"active").unwrap();
    
    set_timer!(Duration::from_secs(1), retry_with_backoff_handler());
    Ok(())
}

#[timer]
pub fn retry_with_backoff_handler() {
    let retry_count: u32 = read_u32_from_storage(b"retry_count").unwrap_or(0);
    const MAX_RETRIES: u32 = 5;
    
    if retry_count >= MAX_RETRIES {
        storage::put(b"retry_status", b"max_retries_reached").unwrap();
        return;
    }
    
    // Attempt operation
    let success = attempt_operation(retry_count);
    
    if !success {
        // Exponential backoff: 2^retry_count seconds (capped at 60s)
        let delay_secs = (2_u64.pow(retry_count)).min(60);
        let new_count = retry_count + 1;
        
        storage::put(b"retry_count", &new_count.to_be_bytes()).unwrap();
        storage::put(
            b"retry_log",
            format!("Retry {} scheduled in {}s", new_count, delay_secs).as_bytes()
        ).unwrap();
        
        set_timer!(Duration::from_secs(delay_secs), retry_with_backoff_handler());
    } else {
        storage::put(b"retry_status", b"success").unwrap();
        storage::put(b"retry_count", &0u32.to_be_bytes()).unwrap();
    }
}

fn attempt_operation(attempt: u32) -> bool {
    // Simulate operation that might fail
    // In real code, this would be your actual operation
    attempt >= 2 // Succeed on 3rd attempt
}

/// Chained timer workflow
#[post]
pub fn start_workflow() -> Result<(), String> {
    storage::put(b"workflow_step", b"starting").unwrap();
    set_timer!(Duration::from_secs(1), workflow_step_one());
    Ok(())
}

#[timer]
pub fn workflow_step_one() {
    storage::put(b"workflow_step", b"one").unwrap();
    storage::put(b"workflow_log", b"Step 1: Initialization complete").unwrap();
    
    // Do step one work...
    set_timer!(Duration::from_secs(2), workflow_step_two());
}

#[timer]
pub fn workflow_step_two() {
    storage::put(b"workflow_step", b"two").unwrap();
    storage::put(b"workflow_log", b"Step 2: Processing data").unwrap();
    
    // Do step two work...
    set_timer!(Duration::from_secs(3), workflow_step_three());
}

#[timer]
pub fn workflow_step_three() {
    storage::put(b"workflow_step", b"three").unwrap();
    storage::put(b"workflow_log", b"Step 3: Finalizing").unwrap();
    storage::put(b"workflow_status", b"completed").unwrap();
}

/// Timer with data passing through workflow
#[derive(Clone, Debug)]
struct ProcessingContext {
    batch_id: String,
    items: Vec<String>,
    current_index: usize,
    errors: Vec<String>,
}

#[post]
pub fn start_batch_processing(batch_id: String, items: Vec<String>) -> Result<(), String> {
    let context = ProcessingContext {
        batch_id: batch_id.clone(),
        items,
        current_index: 0,
        errors: Vec::new(),
    };
    
    storage::put(
        b"batch_status",
        format!("started:{}", batch_id).as_bytes()
    ).unwrap();
    
    set_timer!(Duration::from_secs(1), process_next_item(context));
    Ok(())
}

#[timer]
pub fn process_next_item(mut context: ProcessingContext) {
    if context.current_index >= context.items.len() {
        // All items processed
        let status = if context.errors.is_empty() {
            format!("completed:{}:success", context.batch_id)
        } else {
            format!("completed:{}:errors:{}", context.batch_id, context.errors.len())
        };
        storage::put(b"batch_status", status.as_bytes()).unwrap();
        return;
    }
    
    let item = &context.items[context.current_index];
    
    // Process item (simulate potential error)
    let result = process_item(&context.batch_id, item);
    if let Err(e) = result {
        context.errors.push(e);
    }
    
    // Update progress
    storage::put(
        b"current_item",
        format!("{}:{}:{}", context.batch_id, context.current_index, item).as_bytes()
    ).unwrap();
    
    context.current_index += 1;
    set_timer!(Duration::from_secs(1), process_next_item(context));
}

fn process_item(batch_id: &str, item: &str) -> Result<(), String> {
    // Simulate processing
    if item.contains("error") {
        Err(format!("Failed to process item: {}", item))
    } else {
        Ok(())
    }
}

// ============================================================================
// ERROR HANDLING EXAMPLES
// ============================================================================

/// Resilient timer with error handling
#[post]
pub fn start_resilient_timer() -> Result<(), String> {
    storage::put(b"resilient_status", b"active").unwrap();
    set_timer!(Duration::from_secs(60), resilient_timer_handler());
    Ok(())
}

#[timer]
pub fn resilient_timer_handler() {
    // Try to perform operation, but don't fail if it errors
    match perform_critical_operation() {
        Ok(_) => {
            storage::put(b"resilient_status", b"success").unwrap();
        }
        Err(e) => {
            // Log error but continue
            let error_log = format!("Error at {}: {}", get_timestamp(), e);
            let _ = storage::put(b"error_log", error_log.as_bytes());
            storage::put(b"resilient_status", b"error_handled").unwrap();
        }
    }
    
    // Always schedule next execution (graceful degradation)
    set_timer!(Duration::from_secs(60), resilient_timer_handler());
}

fn perform_critical_operation() -> Result<(), String> {
    // Simulate operation that might fail
    // In real code, this would be your actual operation
    Ok(())
}

// ============================================================================
// COMMON USE CASES
// ============================================================================

/// Periodic data synchronization
#[post]
pub fn start_data_sync() -> Result<(), String> {
    set_timer!(Duration::from_secs(300), sync_data_handler()); // Every 5 minutes
    storage::put(b"sync_status", b"started").unwrap();
    Ok(())
}

#[timer]
pub fn sync_data_handler() {
    // Sync logic here
    let timestamp = get_timestamp();
    storage::put(b"last_sync", &timestamp.to_be_bytes()).unwrap();
    storage::put(b"sync_status", b"syncing").unwrap();
    
    // Perform sync operations...
    
    storage::put(b"sync_status", b"completed").unwrap();
    
    // Schedule next sync
    set_timer!(Duration::from_secs(300), sync_data_handler());
}

/// Cleanup task
#[post]
pub fn start_cleanup_task() -> Result<(), String> {
    set_timer!(Duration::from_secs(3600), cleanup_old_data()); // Every hour
    storage::put(b"cleanup_status", b"started").unwrap();
    Ok(())
}

#[timer]
pub fn cleanup_old_data() {
    let now = get_timestamp();
    let cutoff = now.saturating_sub(86400); // 24 hours ago
    
    // Cleanup logic here
    storage::put(b"last_cleanup", &now.to_be_bytes()).unwrap();
    storage::put(b"cleanup_cutoff", &cutoff.to_be_bytes()).unwrap();
    
    // Delete old entries...
    storage::put(b"cleanup_status", b"completed").unwrap();
    
    // Schedule next cleanup
    set_timer!(Duration::from_secs(3600), cleanup_old_data());
}

/// Heartbeat/Keepalive
#[post]
pub fn start_heartbeat() -> Result<(), String> {
    set_timer!(Duration::from_secs(30), send_heartbeat());
    storage::put(b"heartbeat_status", b"active").unwrap();
    Ok(())
}

#[timer]
pub fn send_heartbeat() {
    let timestamp = get_timestamp();
    storage::put(b"heartbeat", &timestamp.to_be_bytes()).unwrap();
    storage::put(b"heartbeat_status", b"active").unwrap();
    
    // Schedule next heartbeat
    set_timer!(Duration::from_secs(30), send_heartbeat());
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/// Helper to read u64 from storage
fn read_u64_from_storage(key: &[u8]) -> Option<u64> {
    storage::get(key)
        .unwrap_or(None)
        .and_then(|bytes| {
            if bytes.len() >= 8 {
                Some(u64::from_be_bytes([
                    bytes[0], bytes[1], bytes[2], bytes[3],
                    bytes[4], bytes[5], bytes[6], bytes[7],
                ]))
            } else {
                None
            }
        })
}

/// Helper to read u32 from storage
fn read_u32_from_storage(key: &[u8]) -> Option<u32> {
    storage::get(key)
        .unwrap_or(None)
        .and_then(|bytes| {
            if bytes.len() >= 4 {
                Some(u32::from_be_bytes([
                    bytes[0], bytes[1], bytes[2], bytes[3],
                ]))
            } else {
                None
            }
        })
}

/// Get current timestamp (placeholder - implementation depends on SDK)
fn get_timestamp() -> u64 {
    // In real implementation, this would get the current Unix timestamp
    // This is a placeholder that should be replaced with actual SDK function
    0
}

// ============================================================================
// FIRST TIMER HANDLER (used in init)
// ============================================================================

#[timer]
pub fn first_timer_handler() {
    storage::put(b"first_timer", b"fired").unwrap();
    storage::put(b"first_timer_timestamp", &get_timestamp().to_be_bytes()).unwrap();
}


