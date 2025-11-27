/**
 * SenseSpace Client Factory
 * Creates a SenseSpace client instance for frontend use
 * Follows official SDK best practices from @verisense-network/sensespace-miniapp-sdk
 */

// Lazy-loaded SDK instance
let sdkModule: any = null;
let sdkLoadPromise: Promise<any> | null = null;

/**
 * Lazy load the SenseSpace SDK
 * This allows the module to work even if SDK is not installed
 */
async function loadSDK(): Promise<any> {
  if (sdkModule !== null) {
    return sdkModule;
  }
  
  if (sdkLoadPromise) {
    return sdkLoadPromise;
  }
  
  sdkLoadPromise = import('@verisense-network/sensespace-miniapp-sdk')
    .then((module) => {
      sdkModule = module;
      return module;
    })
    .catch((error) => {
      console.warn('SenseSpace SDK not found. Install @verisense-network/sensespace-miniapp-sdk');
      sdkModule = null;
      return null;
    });
  
  return sdkLoadPromise;
}

// Type definitions (fallback if SDK types are not available)
export interface UserProfileData {
  id: string;
  username?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  created_at?: string;
  preferences?: Record<string, any>;
  demo?: boolean;
  _cached?: boolean;
}

export interface UserProfileResponse {
  success: boolean;
  data?: UserProfileData;
  error?: string;
}

export interface SenseSpaceClientConfig {
  token: string;
  endpoint?: string;
}

export interface SenseSpaceClient {
  getUserProfile: (userId: string) => Promise<UserProfileResponse>;
}

/**
 * Create a SenseSpace client instance
 * @param token - Miniapp token (will be fetched from server if not provided)
 * @param endpoint - Optional custom API endpoint (defaults to api.sensespace.xyz)
 * @returns SenseSpace client instance with type-safe methods
 */
export async function createClient(
  token?: string, 
  endpoint?: string
): Promise<SenseSpaceClient> {
  // Try to load SDK
  const sdk = await loadSDK();
  const createSenseSpaceClient = sdk?.createSenseSpaceClient || sdk?.default?.createSenseSpaceClient;
  
  // If SDK is available, use it
  if (createSenseSpaceClient) {
    const apiEndpoint = endpoint || 
      import.meta.env.VITE_SENSESPACE_API_ENDPOINT || 
      'https://api.sensespace.xyz';

    let clientToken = token || '';
    
    if (!clientToken) {
      // Try to fetch token from server
      try {
        const response = await fetch('/api/sensespace/token');
        if (response.ok) {
          const data = await response.json();
          clientToken = data.token || '';
        }
      } catch (error) {
        console.warn('Failed to fetch token from server, using empty token');
      }
    }

    const client = createSenseSpaceClient({
      token: clientToken,
      endpoint: apiEndpoint,
    });

    // Wrap the SDK client to ensure consistent response format
    return {
      getUserProfile: async (userId: string): Promise<UserProfileResponse> => {
        try {
          const response = await client.getUserProfile(userId);
          
          // Handle SDK response format (may vary)
          if (response && typeof response === 'object') {
            // If response already has success/data structure
            if ('success' in response) {
              return response as UserProfileResponse;
            }
            // If response is the data directly
            if ('id' in response) {
              return {
                success: true,
                data: response as UserProfileData,
              };
            }
          }
          
          // Default: assume success if we got data
          return {
            success: true,
            data: response as UserProfileData,
          };
        } catch (error: any) {
          return {
            success: false,
            error: error.message || 'Failed to fetch user profile',
          };
        }
      },
    };
  }

  // Fallback client for development/demo mode
  return {
    getUserProfile: async (userId: string): Promise<UserProfileResponse> => {
      // Fallback to server proxy
      try {
        const response = await fetch(`/api/sensespace/profile/${userId}`, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          return {
            success: false,
            error: errorData.error || `Failed to fetch profile: ${response.statusText}`,
          };
        }
        
        const data = await response.json();
        return {
          success: true,
          data,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message || 'Network error while fetching profile',
        };
      }
    },
  };
}

/**
 * Get user ID from URL search parameters
 * This is useful when MiniApps are opened with userId parameter
 * @returns User ID from URL parameters, or null if not found
 */
export function getUserIdFromUrl(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('userId');
}

