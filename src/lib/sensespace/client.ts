/**
 * SenseSpace Client Factory
 * Creates a SenseSpace client instance for frontend use
 */

// Try to import the SDK, but handle gracefully if not available
let createSenseSpaceClient: any = null;

try {
  // Dynamic import to handle cases where SDK might not be installed
  const sdk = require('@verisense-network/sensespace-miniapp-sdk');
  createSenseSpaceClient = sdk.createSenseSpaceClient || sdk.default?.createSenseSpaceClient;
} catch (error) {
  console.warn('SenseSpace SDK not found. Install @verisense-network/sensespace-miniapp-sdk');
}

export interface SenseSpaceClientConfig {
  token: string;
  endpoint?: string;
}

/**
 * Create a SenseSpace client instance
 * @param token - Miniapp token (will be fetched from server if not provided)
 * @param endpoint - Optional custom API endpoint
 */
export function createClient(token?: string, endpoint?: string): any {
  if (!createSenseSpaceClient) {
    // Return a mock client for development/demo mode
    return {
      getUserProfile: async (userId: string) => {
        // Fallback to server proxy
        const response = await fetch(`/api/sensespace/profile/${userId}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }
        return response.json();
      },
    };
  }

  const apiEndpoint = endpoint || 
    import.meta.env.VITE_SENSESPACE_API_ENDPOINT || 
    'https://api.sensespace.xyz';

  return createSenseSpaceClient({
    token: token || '',
    endpoint: apiEndpoint,
  });
}

