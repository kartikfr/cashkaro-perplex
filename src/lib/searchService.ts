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
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  retailer: string;
  error?: string;
}

interface CacheEntry {
  results: SearchResult[];
  timestamp: number;
}

class SearchService {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly CACHE_TTL = 3 * 60 * 1000; // 3 minutes

  async search(query: string, retailer: string = 'all', limit: number = 5): Promise<SearchResult[]> {
    // Validate inputs
    const validatedInput = searchQuerySchema.parse({ query, retailer, limit });
    
    // Check cache first
    const cacheKey = `${validatedInput.query}|${validatedInput.retailer}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('Returning cached results for:', validatedInput.query);
      return cached.results;
    }
    
    try {
      console.log(`Searching for: "${validatedInput.query}" on ${validatedInput.retailer}`);
      
      // Call the secure Supabase Edge Function
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

      console.log(`Search completed: ${response.results.length} results found`);
      
      // Cache the results
      this.cache.set(cacheKey, {
        results: response.results || [],
        timestamp: Date.now()
      });
      
      // Clean old cache entries
      this.cleanCache();
      
      return response.results || [];
      
    } catch (error) {
      console.error('Search error:', error);
      if (error instanceof Error) {
        throw new Error(`Search failed: ${error.message}`);
      }
      throw new Error('Search failed with unknown error');
    }
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
}

export default SearchService;
