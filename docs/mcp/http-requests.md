# HTTP Requests

Verisense nucleus supports making HTTP requests asynchronously. The process is split into two parts:
1. **Make request**: Initiate an HTTP request and receive a `request_id` immediately
2. **Handle callback**: A `#[callback]` function is called with the `request_id` when the response is ready

> **Note**: You must maintain request IDs using a global structure such as a `HashMap` to associate requests with their context. The basic example below shows the minimal implementation, but for production use, see the [Improved Implementation](#improved-implementation-with-request-tracking) section.

## Basic Example

Here's a simple example of making an HTTP request:

```rust
use vrs_core_sdk::{CallResult, http::{*, self}, callback, post};

#[post]
pub fn request_google() {
    let id = http::request(HttpRequest {
        head: RequestHead {
            method: HttpMethod::Get,
            uri: "https://www.google.com".to_string(),
            headers: Default::default(),
        },
        body: vec![],
    })
    .unwrap();
    
    vrs_core_sdk::println!("http request {} enqueued", id);
}

#[callback]
pub fn on_response(id: u64, response: CallResult<HttpResponse>) {
    match response {
        Ok(response) => {
            let body = String::from_utf8_lossy(&response.body);
            vrs_core_sdk::println!("id = {}, response: {}", id, body);
        }
        Err(e) => {
            vrs_core_sdk::eprintln!("id = {}, error: {:?}", id, e);
        }
    }
}
```

## Improved Implementation with Request Tracking

For production use, you should maintain request IDs using a global structure such as a `HashMap` to associate requests with their context. Here's an improved implementation:

```rust
use std::collections::HashMap;
use std::sync::Mutex;
use vrs_core_sdk::{CallResult, http::{*, self}, callback, post, get};
use serde::{Serialize, Deserialize};

// Request metadata to track context
#[derive(Debug, Clone, Serialize, Deserialize)]
struct RequestContext {
    uri: String,
    method: String,
    timestamp: u64,
    user_id: Option<String>,
    purpose: String,
}

// Global request tracker
static REQUEST_TRACKER: Mutex<HashMap<u64, RequestContext>> = Mutex::new(HashMap::new());

// Helper function to make HTTP requests with context
fn make_request_with_context(
    uri: &str,
    method: HttpMethod,
    body: Vec<u8>,
    headers: HashMap<String, String>,
    context: RequestContext,
) -> Result<u64, String> {
    let request_id = http::request(HttpRequest {
        head: RequestHead {
            method,
            uri: uri.to_string(),
            headers,
        },
        body,
    })
    .map_err(|e| format!("Failed to enqueue request: {:?}", e))?;
    
    // Store context for later retrieval
    REQUEST_TRACKER
        .lock()
        .unwrap()
        .insert(request_id, context);
    
    vrs_core_sdk::println!("HTTP request {} enqueued for {}", request_id, uri);
    Ok(request_id)
}

// Helper to get current timestamp
fn get_timestamp() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_secs()
}

// Example: Request with full context tracking
#[post]
pub fn fetch_user_profile(user_id: String) -> Result<u64, String> {
    let uri = format!("https://api.example.com/users/{}", user_id);
    let context = RequestContext {
        uri: uri.clone(),
        method: "GET".to_string(),
        timestamp: get_timestamp(),
        user_id: Some(user_id.clone()),
        purpose: "fetch_user_profile".to_string(),
    };
    
    make_request_with_context(
        &uri,
        HttpMethod::Get,
        vec![],
        Default::default(),
        context,
    )
}

// Example: POST request with JSON body
#[post]
pub fn create_order(order_data: String) -> Result<u64, String> {
    let uri = "https://api.example.com/orders".to_string();
    let context = RequestContext {
        uri: uri.clone(),
        method: "POST".to_string(),
        timestamp: get_timestamp(),
        user_id: None,
        purpose: "create_order".to_string(),
    };
    
    let mut headers = HashMap::new();
    headers.insert("Content-Type".to_string(), "application/json".to_string());
    
    make_request_with_context(
        &uri,
        HttpMethod::Post,
        order_data.into_bytes(),
        headers,
        context,
    )
}

// Unified callback handler with context
#[callback]
pub fn on_http_response(id: u64, response: CallResult<HttpResponse>) {
    // Retrieve context
    let context = REQUEST_TRACKER
        .lock()
        .unwrap()
        .remove(&id);
    
    match response {
        Ok(http_response) => {
            let status = http_response.head.status;
            let body = String::from_utf8_lossy(&http_response.body);
            
            if let Some(ctx) = context {
                vrs_core_sdk::println!(
                    "Request {} completed: {} {} -> {} ({} bytes)",
                    id,
                    ctx.method,
                    ctx.uri,
                    status,
                    body.len()
                );
                
                // Handle response based on purpose
                handle_response_by_purpose(&ctx.purpose, &body, ctx.user_id.as_deref());
            } else {
                vrs_core_sdk::println!(
                    "Request {} completed: status {} ({} bytes)",
                    id,
                    status,
                    body.len()
                );
            }
            
            // Process successful response
            if status >= 200 && status < 300 {
                process_successful_response(id, &http_response);
            } else {
                vrs_core_sdk::eprintln!(
                    "Request {} failed with status {}: {}",
                    id,
                    status,
                    body
                );
            }
        }
        Err(e) => {
            if let Some(ctx) = context {
                vrs_core_sdk::eprintln!(
                    "Request {} failed: {} {} -> error: {:?}",
                    id,
                    ctx.method,
                    ctx.uri,
                    e
                );
            } else {
                vrs_core_sdk::eprintln!("Request {} failed: {:?}", id, e);
            }
            
            // Clean up failed request
            REQUEST_TRACKER.lock().unwrap().remove(&id);
        }
    }
}

// Helper to route responses based on purpose
fn handle_response_by_purpose(purpose: &str, body: &str, user_id: Option<&str>) {
    match purpose {
        "fetch_user_profile" => {
            if let Some(uid) = user_id {
                vrs_core_sdk::println!("Processing profile for user: {}", uid);
                // Parse and store profile data
                // Example: storage::put(b"profile", body.as_bytes());
            }
        }
        "create_order" => {
            vrs_core_sdk::println!("Order created successfully");
            // Process order creation response
        }
        _ => {
            vrs_core_sdk::println!("Unknown purpose: {}", purpose);
        }
    }
}

// Helper to process successful responses
fn process_successful_response(id: u64, response: &HttpResponse) {
    // Extract response headers if needed
    let content_type = response.head.headers
        .get("Content-Type")
        .map(|s| s.as_str())
        .unwrap_or("unknown");
    
    vrs_core_sdk::println!(
        "Request {} response Content-Type: {}",
        id,
        content_type
    );
    
    // Additional processing based on content type
    if content_type.contains("application/json") {
        // Parse JSON response
        // Example: let data: Value = serde_json::from_slice(&response.body).unwrap();
    }
}

// Utility: Get pending requests count
#[get]
pub fn get_pending_requests_count() -> Result<usize, String> {
    Ok(REQUEST_TRACKER.lock().unwrap().len())
}

// Utility: Clean up old requests (call periodically)
#[post]
pub fn cleanup_old_requests(max_age_seconds: u64) -> Result<usize, String> {
    let current_time = get_timestamp();
    let mut tracker = REQUEST_TRACKER.lock().unwrap();
    
    let initial_len = tracker.len();
    tracker.retain(|_, ctx| {
        current_time - ctx.timestamp < max_age_seconds
    });
    
    let removed = initial_len - tracker.len();
    vrs_core_sdk::println!("Cleaned up {} old requests", removed);
    Ok(removed)
}
```

## Advanced Features

### Request with Retry Logic

```rust
#[derive(Debug, Clone)]
struct RetryableRequest {
    uri: String,
    method: HttpMethod,
    body: Vec<u8>,
    headers: HashMap<String, String>,
    max_retries: u32,
    current_attempt: u32,
    context: RequestContext,
}

static RETRY_QUEUE: Mutex<Vec<RetryableRequest>> = Mutex::new(Vec::new());

#[post]
pub fn make_request_with_retry(
    uri: String,
    method: HttpMethod,
    body: Vec<u8>,
    max_retries: u32,
) -> Result<u64, String> {
    let context = RequestContext {
        uri: uri.clone(),
        method: format!("{:?}", method),
        timestamp: get_timestamp(),
        user_id: None,
        purpose: "retryable_request".to_string(),
    };
    
    let request_id = make_request_with_context(
        &uri,
        method,
        body.clone(),
        Default::default(),
        context.clone(),
    )?;
    
    // Store retry info
    let retry_request = RetryableRequest {
        uri,
        method,
        body,
        headers: Default::default(),
        max_retries,
        current_attempt: 1,
        context,
    };
    
    RETRY_QUEUE.lock().unwrap().push(retry_request);
    Ok(request_id)
}

// In callback, handle retries for failed requests
fn handle_retry(id: u64, response: &CallResult<HttpResponse>) {
    if let Err(_) = response {
        let mut queue = RETRY_QUEUE.lock().unwrap();
        if let Some(pos) = queue.iter().position(|r| {
            // Match by context or track retry requests separately
            true // Simplified - implement proper matching
        }) {
            let mut retry_req = queue.remove(pos);
            if retry_req.current_attempt < retry_req.max_retries {
                retry_req.current_attempt += 1;
                vrs_core_sdk::println!(
                    "Retrying request (attempt {}/{})",
                    retry_req.current_attempt,
                    retry_req.max_retries
                );
                // Re-enqueue the request
                // make_request_with_context(...)
            }
        }
    }
}
```

### Request with Timeout Tracking

```rust
// Check for timed-out requests periodically
#[post]
pub fn check_timeouts(timeout_seconds: u64) -> Result<usize, String> {
    let current_time = get_timestamp();
    let mut tracker = REQUEST_TRACKER.lock().unwrap();
    
    let timed_out: Vec<u64> = tracker
        .iter()
        .filter(|(_, ctx)| current_time - ctx.timestamp > timeout_seconds)
        .map(|(id, _)| *id)
        .collect();
    
    for id in &timed_out {
        tracker.remove(id);
        vrs_core_sdk::eprintln!("Request {} timed out after {} seconds", id, timeout_seconds);
    }
    
    Ok(timed_out.len())
}
```

## Best Practices

1. **Always track request context**: Use a `HashMap` or similar structure to associate request IDs with their metadata
2. **Handle errors gracefully**: Check response status codes and handle network errors appropriately
3. **Clean up old requests**: Periodically remove stale entries from your request tracker to prevent memory leaks
4. **Use appropriate headers**: Set `Content-Type` and other headers as needed for your API
5. **Implement retry logic**: For critical requests, consider implementing retry mechanisms
6. **Log appropriately**: Log request/response details for debugging while being mindful of sensitive data

## Common Patterns

### JSON API Request

```rust
#[post]
pub fn call_json_api(endpoint: String, payload: String) -> Result<u64, String> {
    let mut headers = HashMap::new();
    headers.insert("Content-Type".to_string(), "application/json".to_string());
    headers.insert("Accept".to_string(), "application/json".to_string());
    
    let context = RequestContext {
        uri: endpoint.clone(),
        method: "POST".to_string(),
        timestamp: get_timestamp(),
        user_id: None,
        purpose: "json_api_call".to_string(),
    };
    
    make_request_with_context(
        &endpoint,
        HttpMethod::Post,
        payload.into_bytes(),
        headers,
        context,
    )
}
```

### Authenticated Request

```rust
#[post]
pub fn authenticated_request(uri: String, token: String) -> Result<u64, String> {
    let mut headers = HashMap::new();
    headers.insert("Authorization".to_string(), format!("Bearer {}", token));
    headers.insert("Content-Type".to_string(), "application/json".to_string());
    
    let context = RequestContext {
        uri: uri.clone(),
        method: "GET".to_string(),
        timestamp: get_timestamp(),
        user_id: None,
        purpose: "authenticated_request".to_string(),
    };
    
    make_request_with_context(
        &uri,
        HttpMethod::Get,
        vec![],
        headers,
        context,
    )
}
```

