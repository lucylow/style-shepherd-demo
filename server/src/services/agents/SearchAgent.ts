/**
 * Search Agent - Agent-to-Site Pattern
 * Interacts directly with merchant APIs/websites to find products
 */

import { userMemory, orderSQL, styleInference } from '../../lib/raindrop-config.js';
import { vultrValkey } from '../../lib/vultr-valkey.js';
import { ExternalServiceError } from '../../lib/errors.js';

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  brand: string;
  category: string;
  color?: string;
  sizes?: string[];
  imageUrl?: string;
  rating?: number;
  merchantId?: string;
  merchantName?: string;
  inStock?: boolean;
  url?: string;
}

export interface SearchParams {
  query: string;
  preferences?: {
    colors?: string[];
    brands?: string[];
    styles?: string[];
    sizes?: string[];
    maxPrice?: number;
    minPrice?: number;
  };
  limit?: number;
}

export interface SearchResult {
  products: Product[];
  totalFound: number;
  searchTime: number;
  merchants: string[];
}

export class SearchAgent {
  private readonly DEFAULT_LIMIT = 20;
  private readonly CACHE_TTL = 300; // 5 minutes

  /**
   * Search for products across multiple merchants (Agent-to-Site)
   */
  async search(params: SearchParams, userId?: string): Promise<SearchResult> {
    const startTime = Date.now();
    const limit = Math.min(params.limit || this.DEFAULT_LIMIT, 100); // Cap at 100

    // Check cache first
    const cacheKey = `search:${JSON.stringify(params)}:${userId || 'anonymous'}`;
    try {
      const cached = await vultrValkey.get<SearchResult>(cacheKey);
      if (cached) {
        console.log('[SearchAgent] ✅ Returning cached search results');
        return cached;
      }
    } catch (error) {
      // Cache miss is fine, continue
      console.debug('[SearchAgent] Cache miss:', error instanceof Error ? error.message : String(error));
    }

    try {
      // Get user preferences if available (with timeout)
      let userPreferences: Record<string, unknown> | null = null;
      if (userId) {
        try {
          const preferencesPromise = userMemory.get(userId);
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('User preferences fetch timeout')), 2000)
          );
          userPreferences = await Promise.race([preferencesPromise, timeoutPromise]);
        } catch (error) {
          console.warn('[SearchAgent] Failed to get user preferences:', {
            userId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Merge user preferences with search params
      const enhancedParams = this.enhanceSearchParams(params, userPreferences);

      // Simulate multi-merchant search (in production, this would call actual merchant APIs)
      const products = await this.searchMultipleMerchants(enhancedParams, limit);

      // Rank products using SmartInference if available (with timeout)
      let rankedProducts = products;
      if (styleInference && userId && products.length > 0) {
        try {
          const rankingPromise = this.rankWithAI(products, userId, enhancedParams);
          const timeoutPromise = new Promise<Product[]>((resolve) =>
            setTimeout(() => resolve(products), 3000)
          );
          rankedProducts = await Promise.race([rankingPromise, timeoutPromise]);
        } catch (error) {
          console.warn('[SearchAgent] AI ranking failed, using default ranking:', {
            userId,
            productCount: products.length,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      // Limit results
      const finalProducts = rankedProducts.slice(0, limit);

      const result: SearchResult = {
        products: finalProducts,
        totalFound: products.length,
        searchTime: Date.now() - startTime,
        merchants: [...new Set(finalProducts.map(p => p.merchantName || 'Unknown').filter(Boolean))],
      };

      // Cache results (fire and forget to avoid blocking)
      vultrValkey.set(cacheKey, result, this.CACHE_TTL).catch((error) => {
        console.warn('[SearchAgent] Failed to cache search results:', {
          cacheKey: cacheKey.substring(0, 50),
          error: error instanceof Error ? error.message : String(error),
        });
      });

      return result;
    } catch (error) {
      throw new ExternalServiceError(
        'SearchAgent',
        `Product search failed: ${error instanceof Error ? error.message : String(error)}`,
        error as Error,
        { 
          params: { ...params, query: params.query.substring(0, 50) }, // Truncate for logging
          userId 
        }
      );
    }
  }

  /**
   * Search across multiple merchants (simulated - in production, call real APIs)
   */
  private async searchMultipleMerchants(params: SearchParams, limit: number): Promise<Product[]> {
    // In production, this would:
    // 1. Call merchant APIs in parallel (e.g., Shopify, WooCommerce, custom APIs)
    // 2. Aggregate results
    // 3. Deduplicate products

    // For now, simulate with mock data
    const mockProducts: Product[] = [
      {
        id: 'prod_1',
        name: `${params.query} - Premium Edition`,
        description: `High-quality ${params.query} with premium materials`,
        price: 89.99,
        brand: 'StyleCo',
        category: params.query.toLowerCase(),
        color: params.preferences?.colors?.[0] || 'Black',
        sizes: ['S', 'M', 'L', 'XL'],
        imageUrl: 'https://via.placeholder.com/300',
        rating: 4.5,
        merchantId: 'merchant_1',
        merchantName: 'StyleCo Store',
        inStock: true,
      },
      {
        id: 'prod_2',
        name: `${params.query} - Classic Style`,
        description: `Classic ${params.query} for everyday wear`,
        price: 59.99,
        brand: 'FashionHub',
        category: params.query.toLowerCase(),
        color: params.preferences?.colors?.[0] || 'Navy',
        sizes: ['XS', 'S', 'M', 'L'],
        imageUrl: 'https://via.placeholder.com/300',
        rating: 4.2,
        merchantId: 'merchant_2',
        merchantName: 'FashionHub',
        inStock: true,
      },
      {
        id: 'prod_3',
        name: `${params.query} - Designer Collection`,
        description: `Designer ${params.query} with unique styling`,
        price: 129.99,
        brand: 'DesignerBrand',
        category: params.query.toLowerCase(),
        color: params.preferences?.colors?.[0] || 'Gray',
        sizes: ['M', 'L', 'XL', 'XXL'],
        imageUrl: 'https://via.placeholder.com/300',
        rating: 4.8,
        merchantId: 'merchant_3',
        merchantName: 'DesignerBrand Boutique',
        inStock: true,
      },
    ];

    // Filter by preferences
    let filtered = mockProducts;
    if (params.preferences) {
      if (params.preferences.maxPrice) {
        filtered = filtered.filter(p => p.price <= params.preferences!.maxPrice!);
      }
      if (params.preferences.minPrice) {
        filtered = filtered.filter(p => p.price >= params.preferences!.minPrice!);
      }
      if (params.preferences.brands && params.preferences.brands.length > 0) {
        filtered = filtered.filter(p => 
          params.preferences!.brands!.some(b => 
            p.brand.toLowerCase().includes(b.toLowerCase())
          )
        );
      }
      if (params.preferences.colors && params.preferences.colors.length > 0) {
        filtered = filtered.filter(p => 
          params.preferences!.colors!.some(c => 
            p.color?.toLowerCase().includes(c.toLowerCase())
          )
        );
      }
    }

    return filtered.slice(0, limit);
  }

  /**
   * Enhance search params with user preferences
   */
  private enhanceSearchParams(
    params: SearchParams, 
    userProfile: Record<string, unknown> | null
  ): SearchParams {
    if (!userProfile) return params;

    const enhanced: SearchParams = { ...params };
    const prefs = userProfile.preferences as Record<string, unknown> | undefined;
    const sizePrefs = userProfile.sizePreferences as Record<string, string> | undefined;

    enhanced.preferences = {
      ...params.preferences,
      colors: params.preferences?.colors || 
        (Array.isArray(prefs?.favoriteColors) ? prefs.favoriteColors as string[] : undefined),
      brands: params.preferences?.brands || 
        (Array.isArray(prefs?.preferredBrands) ? prefs.preferredBrands as string[] : undefined),
      styles: params.preferences?.styles || 
        (Array.isArray(prefs?.preferredStyles) ? prefs.preferredStyles as string[] : undefined),
      sizes: params.preferences?.sizes || 
        (sizePrefs ? Object.values(sizePrefs).filter((s): s is string => typeof s === 'string') : undefined),
    };

    return enhanced;
  }

  /**
   * Rank products using SmartInference
   */
  private async rankWithAI(
    products: Product[],
    userId: string,
    params: SearchParams
  ): Promise<Product[]> {
    if (!styleInference || !styleInference.predict) {
      return products;
    }

    try {
      // Use SmartInference to score products
      const scores = await Promise.all(
        products.map(async (product) => {
          try {
            const prediction = await styleInference.predict({
              userId,
              product: {
                id: product.id,
                name: product.name,
                brand: product.brand,
                category: product.category,
                color: product.color,
                price: product.price,
              },
              context: {
                query: params.query,
                preferences: params.preferences,
              },
            });

            return {
              product,
              score: prediction.score || 0.5,
            };
          } catch (error) {
            console.warn(`Failed to score product ${product.id}:`, error);
            return { product, score: 0.5 };
          }
        })
      );

      // Sort by score (descending)
      scores.sort((a, b) => b.score - a.score);
      return scores.map(s => s.product);
    } catch (error) {
      console.warn('AI ranking failed:', error);
      return products;
    }
  }
}

export const searchAgent = new SearchAgent();

