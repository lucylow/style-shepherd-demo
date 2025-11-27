# Timers

Verisense provides a powerful timer module that enables developers to schedule delayed or recurring function executions. The module consists of:

- `#[init]` - Initialization hook
- `#[timer]` - Timer handler decorator
- `set_timer!()` - Timer scheduling macro

## Table of Contents

- [Initialization Hook](#init-initialization-hook)
- [Scheduling Timers](#set_timer-and-timer-scheduling-timers)
- [Implementing Intervals](#implementing-intervals-recurring-timers)
- [Best Practices](#best-practices)
- [Advanced Patterns](#advanced-patterns)
- [Error Handling](#error-handling)
- [Common Use Cases](#common-use-cases)

---

## #[init]: Initialization Hook

A Rust function decorated with the `#[init]` attribute macro serves as a special initialization handler. This function is automatically invoked when a new version of the WASM module is deployed or upgraded.

### Basic Example

```rust
use vrs_core_sdk::{init, storage};

#[init]
pub fn timer_init() {
    storage::put(b"delay", b"init").unwrap();
    storage::put(b"initialized_at", &get_timestamp().to_be_bytes()).unwrap();
}
```

### Advanced Initialization Pattern

```rust
use vrs_core_sdk::{init, storage};

#[init]
pub fn initialize_nucleus() -> Result<(), String> {
    // Initialize default configuration
    let config = NucleusConfig {
        interval_seconds: 60,
        max_retries: 3,
        enabled: true,
    };
    
    let config_bytes = bincode::serialize(&config)
        .map_err(|e| format!("Serialization error: {}", e))?;
    
    storage::put(b"config", &config_bytes)
        .map_err(|e| format!("Storage error: {}", e))?;
    
    // Set initial state
    storage::put(b"state", b"initialized")
        .map_err(|e| format!("Storage error: {}", e))?;
    
    // Schedule first timer if needed
    set_timer!(
        std::time::Duration::from_secs(10),
        first_timer_handler()
    );
    
    Ok(())
}
```

**Key Points:**
- `#[init]` functions are called automatically on deployment/upgrade
- Use for setting up initial state, configuration, or scheduling the first timer
- Can return `Result<(), String>` for error handling
- Only one `#[init]` function per module (if multiple exist, behavior is undefined)

---

## set_timer! and #[timer]: Scheduling Timers

The `set_timer!` macro is used to schedule a new timer that triggers a handler function after a specified delay. Its syntax is:

```rust
set_timer!(Duration, timer_handler(params));
```

### Basic Usage

```rust
use vrs_core_sdk::{post, timer, storage, set_timer};
use std::time::Duration;

#[post]
pub fn test_set_timer() -> Result<(), String> {
    let message = "Hello from timer!".to_string();
    let count = 42;
    
    set_timer!(
        Duration::from_secs(4),
        test_delay(message, count)
    );
    
    storage::put(b"timer_status", b"scheduled")
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[timer]
pub fn test_delay(message: String, count: i32) {
    let result = format!("delay_complete {} {}", message, count);
    storage::put(b"delay", result.as_bytes()).unwrap();
}
```

### Timer with Complex Data

```rust
use vrs_core_sdk::{post, timer, storage, set_timer};
use std::time::Duration;
use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone)]
struct TaskData {
    task_id: String,
    user_id: String,
    priority: u8,
}

#[post]
pub fn schedule_task(task: TaskData) -> Result<(), String> {
    let delay = Duration::from_secs(30);
    
    set_timer!(delay, process_task(task));
    
    // Log the scheduled task
    let log_entry = format!("Task {} scheduled for user {}", task.task_id, task.user_id);
    storage::put(b"task_log", log_entry.as_bytes())
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[timer]
pub fn process_task(task: TaskData) {
    // Process the task
    let result = format!("Processed task {} for user {}", task.task_id, task.user_id);
    storage::put(b"task_result", result.as_bytes()).unwrap();
}
```

**Key Points:**
- All timer handler functions must be decorated with `#[timer]`
- Arguments are automatically serialized and deserialized
- Timer handlers cannot return values (they return `()`)
- Use `Duration` from `std::time` for specifying delays

---

## Implementing Intervals (Recurring Timers)

By default, `set_timer!` schedules one-shot timers. To implement periodic execution (intervals), you can schedule the next timer within the timer handler itself, effectively creating a recursive loop.

### Basic Interval Pattern

```rust
use vrs_core_sdk::{post, timer, storage, set_timer};
use std::time::Duration;

#[post]
pub fn start_interval() -> Result<(), String> {
    // Start the interval with initial delay
    set_timer!(Duration::from_secs(2), run_interval());
    storage::put(b"interval_status", b"started")
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[timer]
pub fn run_interval() {
    // Business logic executed on each interval
    let count: u64 = storage::get(b"interval_count")
        .unwrap_or(None)
        .map(|bytes| u64::from_be_bytes([
            bytes[0], bytes[1], bytes[2], bytes[3],
            bytes[4], bytes[5], bytes[6], bytes[7]
        ]))
        .unwrap_or(0);
    
    let new_count = count + 1;
    storage::put(b"interval_count", &new_count.to_be_bytes()).unwrap();
    storage::put(b"interval", b"running").unwrap();
    
    // Schedule the next execution
    set_timer!(Duration::from_secs(1), run_interval());
}
```

### Interval with Conditional Logic

```rust
use vrs_core_sdk::{post, timer, storage, set_timer};
use std::time::Duration;

#[post]
pub fn start_health_check() -> Result<(), String> {
    set_timer!(Duration::from_secs(10), health_check());
    Ok(())
}

#[timer]
pub fn health_check() {
    // Perform health check
    let is_healthy = perform_health_check();
    
    storage::put(
        b"health_status",
        if is_healthy { b"healthy" } else { b"unhealthy" }
    ).unwrap();
    
    // Continue checking every 10 seconds
    set_timer!(Duration::from_secs(10), health_check());
}

fn perform_health_check() -> bool {
    // Your health check logic here
    true
}
```

### Interval with Stop Condition

```rust
use vrs_core_sdk::{post, timer, storage, set_timer};
use std::time::Duration;

#[post]
pub fn start_processing() -> Result<(), String> {
    // Reset processing state
    storage::put(b"processing", b"active").unwrap();
    storage::put(b"processed_count", &0u64.to_be_bytes()).unwrap();
    
    set_timer!(Duration::from_secs(5), process_batch());
    Ok(())
}

#[post]
pub fn stop_processing() -> Result<(), String> {
    storage::put(b"processing", b"stopped").unwrap();
    Ok(())
}

#[timer]
pub fn process_batch() {
    // Check if processing should continue
    let status = storage::get(b"processing")
        .unwrap_or(None)
        .unwrap_or_default();
    
    if status == b"stopped" {
        return; // Stop the interval
    }
    
    // Process a batch
    let count: u64 = storage::get(b"processed_count")
        .unwrap_or(None)
        .map(|bytes| {
            let mut arr = [0u8; 8];
            arr.copy_from_slice(&bytes[..8]);
            u64::from_be_bytes(arr)
        })
        .unwrap_or(0);
    
    let new_count = count + 1;
    storage::put(b"processed_count", &new_count.to_be_bytes()).unwrap();
    
    // Continue processing
    set_timer!(Duration::from_secs(5), process_batch());
}
```

---

## Best Practices

### 1. Error Handling in Timer Handlers

Timer handlers should handle errors gracefully since they cannot return error values:

```rust
#[timer]
pub fn safe_timer_handler(data: String) {
    match storage::put(b"key", data.as_bytes()) {
        Ok(_) => {
            // Success
        }
        Err(e) => {
            // Log error to storage for later retrieval
            let error_msg = format!("Timer error: {}", e);
            let _ = storage::put(b"error_log", error_msg.as_bytes());
        }
    }
}
```

### 2. State Management

Always check and update state atomically:

```rust
#[timer]
pub fn stateful_timer() {
    // Read current state
    let state = storage::get(b"timer_state")
        .unwrap_or(None)
        .unwrap_or_else(|| b"idle".to_vec());
    
    // Update state
    let new_state = b"processing";
    storage::put(b"timer_state", new_state).unwrap();
    
    // Do work...
    
    // Update state back
    storage::put(b"timer_state", b"idle").unwrap();
}
```

### 3. Avoiding Timer Leaks

For intervals, always provide a way to stop them:

```rust
#[post]
pub fn start_with_max_iterations() -> Result<(), String> {
    storage::put(b"max_iterations", &100u64.to_be_bytes()).unwrap();
    storage::put(b"current_iteration", &0u64.to_be_bytes()).unwrap();
    
    set_timer!(Duration::from_secs(1), limited_interval());
    Ok(())
}

#[timer]
pub fn limited_interval() {
    let current: u64 = storage::get(b"current_iteration")
        .unwrap_or(None)
        .map(|bytes| {
            let mut arr = [0u8; 8];
            arr.copy_from_slice(&bytes[..8]);
            u64::from_be_bytes(arr)
        })
        .unwrap_or(0);
    
    let max: u64 = storage::get(b"max_iterations")
        .unwrap_or(None)
        .map(|bytes| {
            let mut arr = [0u8; 8];
            arr.copy_from_slice(&bytes[..8]);
            u64::from_be_bytes(arr)
        })
        .unwrap_or(100);
    
    if current >= max {
        // Stop the interval
        storage::put(b"interval_status", b"completed").unwrap();
        return;
    }
    
    // Do work...
    
    // Increment and schedule next
    storage::put(b"current_iteration", &(current + 1).to_be_bytes()).unwrap();
    set_timer!(Duration::from_secs(1), limited_interval());
}
```

---

## Advanced Patterns

### Exponential Backoff

```rust
use vrs_core_sdk::{post, timer, storage, set_timer};
use std::time::Duration;

#[post]
pub fn start_with_backoff() -> Result<(), String> {
    storage::put(b"retry_count", &0u32.to_be_bytes()).unwrap();
    set_timer!(Duration::from_secs(1), retry_with_backoff());
    Ok(())
}

#[timer]
pub fn retry_with_backoff() {
    let retry_count: u32 = storage::get(b"retry_count")
        .unwrap_or(None)
        .map(|bytes| {
            let mut arr = [0u8; 4];
            arr.copy_from_slice(&bytes[..4]);
            u32::from_be_bytes(arr)
        })
        .unwrap_or(0);
    
    if retry_count >= 5 {
        storage::put(b"status", b"max_retries_reached").unwrap();
        return;
    }
    
    // Attempt operation
    let success = attempt_operation();
    
    if !success {
        // Exponential backoff: 2^retry_count seconds
        let delay_secs = 2_u64.pow(retry_count);
        let new_count = retry_count + 1;
        storage::put(b"retry_count", &new_count.to_be_bytes()).unwrap();
        
        set_timer!(Duration::from_secs(delay_secs), retry_with_backoff());
    } else {
        storage::put(b"status", b"success").unwrap();
    }
}

fn attempt_operation() -> bool {
    // Your operation logic
    false
}
```

### Chained Timers

```rust
use vrs_core_sdk::{post, timer, storage, set_timer};
use std::time::Duration;

#[post]
pub fn start_workflow() -> Result<(), String> {
    set_timer!(Duration::from_secs(1), step_one());
    Ok(())
}

#[timer]
pub fn step_one() {
    storage::put(b"workflow_step", b"one").unwrap();
    // Do step one work...
    set_timer!(Duration::from_secs(2), step_two());
}

#[timer]
pub fn step_two() {
    storage::put(b"workflow_step", b"two").unwrap();
    // Do step two work...
    set_timer!(Duration::from_secs(3), step_three());
}

#[timer]
pub fn step_three() {
    storage::put(b"workflow_step", b"three").unwrap();
    storage::put(b"workflow_status", b"completed").unwrap();
}
```

### Timer with Data Passing

```rust
use vrs_core_sdk::{post, timer, storage, set_timer};
use std::time::Duration;

#[derive(Clone)]
struct ProcessingContext {
    batch_id: String,
    items: Vec<String>,
    current_index: usize,
}

#[post]
pub fn start_batch_processing(batch_id: String, items: Vec<String>) -> Result<(), String> {
    let context = ProcessingContext {
        batch_id,
        items,
        current_index: 0,
    };
    
    set_timer!(Duration::from_secs(1), process_next_item(context));
    Ok(())
}

#[timer]
pub fn process_next_item(mut context: ProcessingContext) {
    if context.current_index >= context.items.len() {
        storage::put(b"batch_status", b"completed").unwrap();
        return;
    }
    
    let item = &context.items[context.current_index];
    // Process item...
    storage::put(
        b"current_item",
        format!("{}:{}", context.batch_id, item).as_bytes()
    ).unwrap();
    
    context.current_index += 1;
    set_timer!(Duration::from_secs(1), process_next_item(context));
}
```

---

## Error Handling

### Graceful Degradation

```rust
#[timer]
pub fn resilient_timer() {
    // Try to perform operation, but don't fail if it errors
    if let Err(e) = perform_critical_operation() {
        // Log error but continue
        let error_log = format!("Error at {}: {}", get_timestamp(), e);
        let _ = storage::put(b"error_log", error_log.as_bytes());
    }
    
    // Always schedule next execution
    set_timer!(Duration::from_secs(60), resilient_timer());
}

fn perform_critical_operation() -> Result<(), String> {
    // Your operation
    Ok(())
}

fn get_timestamp() -> u64 {
    // Get current timestamp (implementation depends on your SDK)
    0
}
```

---

## Common Use Cases

### 1. Periodic Data Sync

```rust
#[post]
pub fn start_sync() -> Result<(), String> {
    set_timer!(Duration::from_secs(300), sync_data()); // Every 5 minutes
    Ok(())
}

#[timer]
pub fn sync_data() {
    // Sync logic here
    storage::put(b"last_sync", &get_timestamp().to_be_bytes()).unwrap();
    set_timer!(Duration::from_secs(300), sync_data());
}
```

### 2. Cleanup Tasks

```rust
#[post]
pub fn start_cleanup() -> Result<(), String> {
    set_timer!(Duration::from_secs(3600), cleanup_old_data()); // Every hour
    Ok(())
}

#[timer]
pub fn cleanup_old_data() {
    // Cleanup logic
    let cutoff = get_timestamp() - 86400; // 24 hours ago
    // Delete old entries...
    
    set_timer!(Duration::from_secs(3600), cleanup_old_data());
}
```

### 3. Heartbeat/Keepalive

```rust
#[post]
pub fn start_heartbeat() -> Result<(), String> {
    set_timer!(Duration::from_secs(30), send_heartbeat());
    Ok(())
}

#[timer]
pub fn send_heartbeat() {
    storage::put(b"heartbeat", &get_timestamp().to_be_bytes()).unwrap();
    set_timer!(Duration::from_secs(30), send_heartbeat());
}
```

---

## Summary

| Component | Description | Usage |
|-----------|-------------|-------|
| `#[init]` | Initialization hook | Automatically called on WASM deployment/upgrade |
| `set_timer!()` | Schedule timer | Schedules a one-shot timer to invoke handler after delay |
| `#[timer]` | Timer handler decorator | Marks function as valid timer handler |
| Intervals | Recurring timers | Achieved by recursively scheduling timers within handlers |

### Key Takeaways

1. **Initialization**: Use `#[init]` for setup tasks when the module is deployed
2. **One-shot timers**: Use `set_timer!` with a handler function for delayed execution
3. **Intervals**: Schedule the next timer at the end of the current handler
4. **Error handling**: Handle errors gracefully within timer handlers
5. **State management**: Use storage to track timer state and prevent leaks
6. **Stop conditions**: Always provide a way to stop intervals to prevent infinite loops


