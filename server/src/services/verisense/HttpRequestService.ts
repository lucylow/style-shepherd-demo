/**
 * Verisense HTTP Request Service
 * 
 * Provides proactive network request capabilities for Nucleus applications.
 * In Verisense, Nucleus can autonomously initiate network requests, enabling
 * dynamic interactions with external data sources and systems.
 * 
 * This service abstracts HTTP operations and can be used for:
 * - Fetching external data
 * - Calling external APIs
 * - Webhook notifications
 * - Data synchronization
 */

export interface HttpRequestOptions {
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: any;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Whether to retry on failure */
  retry?: {
    maxRetries: number;
    retryDelay: number;
    retryableStatusCodes?: number[];
  };
  /** Request metadata */
  metadata?: Record<string, any>;
}

export interface HttpResponse {
  /** Response status code */
  status: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Response body */
  body: any;
  /** Response time in milliseconds */
  responseTime: number;
  /** Request metadata */
  metadata?: Record<string, any>;
}

export interface HttpRequestStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsByMethod: Record<string, number>;
  requestsByStatus: Record<number, number>;
}

export class HttpRequestService {
  private stats: HttpRequestStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageResponseTime: 0,
    requestsByMethod: {},
    requestsByStatus: {},
  };

  private responseTimes: number[] = [];

  /**
   * Make an HTTP request
   * @param url - Request URL
   * @param options - Request options
   */
  async request(
    url: string,
    options: HttpRequestOptions = {}
  ): Promise<HttpResponse> {
    const startTime = Date.now();
    const method = options.method || 'GET';

    try {
      // Prepare request
      const requestOptions: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      if (options.body) {
        requestOptions.body =
          typeof options.body === 'string'
            ? options.body
            : JSON.stringify(options.body);
      }

      // Set timeout if specified
      let timeoutId: NodeJS.Timeout | null = null;
      if (options.timeout) {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), options.timeout);
        requestOptions.signal = controller.signal;
      }

      // Make request with retry logic if specified
      let response: Response | undefined;
      let lastError: Error | null = null;

      const maxRetries = options.retry?.maxRetries || 0;
      const retryableStatusCodes =
        options.retry?.retryableStatusCodes || [500, 502, 503, 504];

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          response = await fetch(url, requestOptions);
          lastError = null;
          break;
        } catch (error: any) {
          lastError = error;

          // Check if we should retry
          if (attempt < maxRetries) {
            const delay = options.retry?.retryDelay || 1000;
            await this.sleep(delay * (attempt + 1)); // Exponential backoff
            continue;
          }

          throw error;
        }
      }

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (lastError || !response) {
        throw lastError || new Error('HTTP request failed: No response received');
      }

      // At this point, response is guaranteed to be defined
      const finalResponse: Response = response;

      // Parse response
      const responseTime = Date.now() - startTime;
      const contentType = finalResponse.headers.get('content-type') || '';

      let body: any;
      if (contentType.includes('application/json')) {
        body = await finalResponse.json();
      } else {
        body = await finalResponse.text();
      }

      // Convert headers to plain object
      const headers: Record<string, string> = {};
      finalResponse.headers.forEach((value, key) => {
        headers[key] = value;
      });

      // Update stats
      this.updateStats(method, finalResponse.status, responseTime, true);

      // Check if status code is retryable and we haven't exhausted retries
      if (
        !finalResponse.ok &&
        retryableStatusCodes.includes(finalResponse.status) &&
        maxRetries > 0
      ) {
        // This would trigger a retry in a more sophisticated implementation
        // For now, we just return the error response
      }

      return {
        status: finalResponse.status,
        headers,
        body,
        responseTime,
        metadata: options.metadata,
      };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      // Update stats
      this.updateStats(method, 0, responseTime, false);

      throw new Error(
        `HTTP request failed: ${error.message || 'Unknown error'}`
      );
    }
  }

  /**
   * Make a GET request
   */
  async get(url: string, options?: Omit<HttpRequestOptions, 'method'>): Promise<HttpResponse> {
    return this.request(url, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post(
    url: string,
    body?: any,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>
  ): Promise<HttpResponse> {
    return this.request(url, { ...options, method: 'POST', body });
  }

  /**
   * Make a PUT request
   */
  async put(
    url: string,
    body?: any,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>
  ): Promise<HttpResponse> {
    return this.request(url, { ...options, method: 'PUT', body });
  }

  /**
   * Make a DELETE request
   */
  async delete(
    url: string,
    options?: Omit<HttpRequestOptions, 'method'>
  ): Promise<HttpResponse> {
    return this.request(url, { ...options, method: 'DELETE' });
  }

  /**
   * Make a PATCH request
   */
  async patch(
    url: string,
    body?: any,
    options?: Omit<HttpRequestOptions, 'method' | 'body'>
  ): Promise<HttpResponse> {
    return this.request(url, { ...options, method: 'PATCH', body });
  }

  /**
   * Get request statistics
   */
  getStats(): HttpRequestStats {
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      requestsByMethod: {},
      requestsByStatus: {},
    };
    this.responseTimes = [];
  }

  /**
   * Update statistics
   */
  private updateStats(
    method: string,
    status: number,
    responseTime: number,
    success: boolean
  ): void {
    this.stats.totalRequests++;
    this.responseTimes.push(responseTime);

    if (success) {
      this.stats.successfulRequests++;
    } else {
      this.stats.failedRequests++;
    }

    // Update method stats
    this.stats.requestsByMethod[method] =
      (this.stats.requestsByMethod[method] || 0) + 1;

    // Update status stats
    if (status > 0) {
      this.stats.requestsByStatus[status] =
        (this.stats.requestsByStatus[status] || 0) + 1;
    }

    // Calculate average response time
    const sum = this.responseTimes.reduce((a, b) => a + b, 0);
    this.stats.averageResponseTime = sum / this.responseTimes.length;

    // Keep only last 1000 response times for memory efficiency
    if (this.responseTimes.length > 1000) {
      this.responseTimes = this.responseTimes.slice(-1000);
    }
  }

  /**
   * Sleep utility for retries
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

