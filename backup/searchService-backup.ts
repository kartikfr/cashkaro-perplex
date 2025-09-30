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
  images?: string[]; // Multiple images support
  retailer: string;
  timestamp: number;
  image_method?: string; // How the image was obtained
  image_quality?: 'high' | 'medium' | 'low' | 'placeholder';
}

interface SearchResponse {
  results: SearchResult[];
  query: string;
  retailer: string;
  error?: string;
}

class SearchService {
  async search(query: string, retailer: string = 'all', limit: number = 5): Promise<SearchResult[]> {
    // Validate inputs
    const validatedInput = searchQuerySchema.parse({ query, retailer, limit });
    
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
      
      // Process results to ensure image compatibility
      const processedResults = (response.results || []).map(result => ({
        ...result,
        // Ensure backward compatibility
        image: result.image || (result.images && result.images[0]) || undefined,
        // Set image quality based on method
        image_quality: result.image_method === 'perplexity' ? 'high' : 
                      result.image_method === 'python' ? 'high' :
                      result.image_method === 'url_pattern' ? 'medium' :
                      result.image_method === 'placeholder' ? 'placeholder' : 'low'
      }));
      
      return processedResults;
      
    } catch (error) {
      console.error('Search error:', error);
      if (error instanceof Error) {
        throw new Error(`Search failed: ${error.message}`);
      }
      throw new Error('Search failed with unknown error');
    }
  }
}

export default SearchService;
