# Timers Quick Reference

A quick reference guide for Verisense timer functionality.

## Syntax Cheat Sheet

### Initialization
```rust
#[init]
pub fn my_init() {
    // Called automatically on deployment/upgrade
}
```

### Schedule Timer
```rust
set_timer!(Duration::from_secs(5), handler_function(arg1, arg2));
```

### Timer Handler
```rust
#[timer]
pub fn handler_function(arg1: Type1, arg2: Type2) {
    // Handler logic
}
```

## Common Patterns

### One-Shot Timer
```rust
#[post]
pub fn schedule() -> Result<(), String> {
    set_timer!(Duration::from_secs(10), handler());
    Ok(())
}

#[timer]
pub fn handler() {
    // Execute once
}
```

### Interval (Recurring)
```rust
#[post]
pub fn start() -> Result<(), String> {
    set_timer!(Duration::from_secs(60), interval());
    Ok(())
}

#[timer]
pub fn interval() {
    // Do work
    set_timer!(Duration::from_secs(60), interval()); // Reschedule
}
```

### Interval with Stop
```rust
#[timer]
pub fn interval() {
    let status = storage::get(b"status").unwrap_or(None);
    if status == Some(b"stopped".to_vec()) {
        return; // Stop
    }
    // Do work
    set_timer!(Duration::from_secs(60), interval());
}
```

### Exponential Backoff
```rust
#[timer]
pub fn retry(count: u32) {
    if count >= 5 { return; }
    let success = try_operation();
    if !success {
        let delay = 2_u64.pow(count);
        set_timer!(Duration::from_secs(delay), retry(count + 1));
    }
}
```

## Duration Helpers

```rust
Duration::from_secs(60)        // 1 minute
Duration::from_secs(300)        // 5 minutes
Duration::from_secs(3600)       // 1 hour
Duration::from_millis(500)      // 500 milliseconds
Duration::from_secs(2_u64.pow(3)) // 8 seconds (for backoff)
```

## Best Practices Checklist

- ✅ Handle errors gracefully in timer handlers
- ✅ Provide stop conditions for intervals
- ✅ Use storage to track timer state
- ✅ Log important events for debugging
- ✅ Avoid infinite loops without exit conditions
- ✅ Consider using exponential backoff for retries
- ✅ Initialize state in `#[init]` when needed

## Common Mistakes to Avoid

❌ **Forgetting to reschedule in intervals**
```rust
#[timer]
pub fn interval() {
    // Missing: set_timer!(..., interval());
}
```

❌ **No stop condition**
```rust
#[timer]
pub fn infinite() {
    set_timer!(Duration::from_secs(1), infinite()); // Runs forever!
}
```

❌ **Not handling errors**
```rust
#[timer]
pub fn unsafe_handler() {
    storage::put(b"key", b"value").unwrap(); // Can panic!
}
```

## See Also

- [Full Timer Documentation](./timers.md) - Comprehensive guide
- [Timer Examples](../examples/verisense_timer_examples.rs) - Complete code examples
- [KV Storage](./kv-storage.md) - Storage API reference


