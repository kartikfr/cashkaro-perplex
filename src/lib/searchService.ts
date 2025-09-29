import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

// Input validation schema
const searchQuerySchema = z.object({
  query: z.string()
    .trim()
    .min(1, { message: "Search query cannot be empty" })
    .max(200, { message: "Search query must be less than 200 characters" })
    .regex(/^[a-zA-Z0-9\s\-_.,₹$€£¥@#%&+()]+$/, { 
      message: "Search query contains invalid characters" 
    }),
  retailer: z.enum(['all', 'amazon', 'flipkart', 'myntra', 'ajio']),
  limit: z.number().min(1).max(20).default(5)
});

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet?: string;
  price?: string;
  image?: string;
  retailer: string;
  timestamp: number;
  relevanceScore?: number;
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  retailer: string;
  metadata?: {
    totalFound: number;
    filtered: number;
    searchQuery: string;
  };
  error?: string;
}

// Simple in-memory cache for search results
interface CacheEntry {
  data: SearchResponse;
  timestamp: number;
}

const searchCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class SearchService {
  async search(query: string, retailer: string = 'all', limit: number = 5): Promise<SearchResult[]> {
    // Validate inputs
    const validatedInput = searchQuerySchema.parse({ query, retailer, limit });
    
    // Check cache first
    const cacheKey = `${validatedInput.query}-${validatedInput.retailer}-${validatedInput.limit}`;
    const cached = searchCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`✅ Cache hit for: "${validatedInput.query}"`);
      return cached.data.results;
    }
    
    try {
      console.log(`🔍 Searching for: "${validatedInput.query}" on ${validatedInput.retailer}`);
      
      // Call the optimized Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('search-products', {
        body: {
          query: validatedInput.query,
          retailer: validatedInput.retailer,
          limit: validatedInput.limit
        }
      });

      if (error) {
        console.error('Search error:', error);
        throw new Error(`Search failed: ${error.message}`);
      }

      const response: SearchResponse = data;
      
      if (response.error) {
        throw new Error(response.error);
      }

      // Cache the results
      searchCache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });

      // Clean up old cache entries
      this.cleanCache();

      console.log(`✅ Search completed: ${response.results.length} results found`);
      if (response.metadata) {
        console.log(`📊 Metadata: ${response.metadata.totalFound} total, ${response.metadata.filtered} after filtering`);
      }
      
      return response.results || [];
      
    } catch (error) {
      console.error('Search error:', error);
      if (error instanceof Error) {
        throw new Error(`Search failed: ${error.message}`);
      }
      throw new Error('Search failed with unknown error');
    }
  }

  // Clean up expired cache entries
  private cleanCache() {
    const now = Date.now();
    for (const [key, entry] of searchCache.entries()) {
      if (now - entry.timestamp > CACHE_DURATION) {
        searchCache.delete(key);
      }
    }
  }

  // Clear all cache
  clearCache() {
    searchCache.clear();
    console.log('🗑️ Search cache cleared');
  }
}

export default SearchService;
