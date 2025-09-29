import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');
const PERPLEXITY_SEARCH_API = 'https://api.perplexity.ai/search';

interface SearchRequest {
  query: string;
  retailer?: string;
  limit?: number;
}

interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet?: string;
  price?: string;
  image?: string;
  retailer: string;
  timestamp: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, retailer = 'all', limit = 5 }: SearchRequest = await req.json();
    
    if (!query || query.trim().length === 0) {
      throw new Error('Search query is required');
    }

    if (!PERPLEXITY_API_KEY) {
      throw new Error('Perplexity API key not configured');
    }

    console.log(`Searching for: "${query}" on ${retailer}`);

    const retailerDomains = {
      amazon: 'amazon.in',
      flipkart: 'flipkart.com',
      myntra: 'myntra.com',
      ajio: 'ajio.com'
    };

    // Build search query
    const searchQuery = buildSearchQuery(query, retailer, retailerDomains);

    // Call Perplexity Search API (no domain filter - it's not supported)
    const response = await fetch(PERPLEXITY_SEARCH_API, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: searchQuery,
        max_results: 20, // Get more results to filter by retailer
        return_images: true,
        return_snippets: true,
        country: 'IN' // Focus on Indian results
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Perplexity API Error ${response.status}:`, errorData);
      throw new Error(`Perplexity API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Perplexity Search API response received');

    // Process search results from Perplexity Search API
    const results = processSearchResults(data, retailer, limit, retailerDomains);
    
    console.log(`Returning ${results.length} results`);

    return new Response(
      JSON.stringify({ results, query, retailer }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in search-products function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Search failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        results: []
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

function buildSearchQuery(query: string, retailer: string, retailerDomains: Record<string, string>): string {
  const sanitizedQuery = query.trim();
  
  if (retailer === 'all') {
    return `${sanitizedQuery} products buy online India`;
  }
  
  const retailerName = retailer.charAt(0).toUpperCase() + retailer.slice(1);
  return `${sanitizedQuery} products on ${retailerName} India`;
}


function processSearchResults(data: any, retailer: string, limit: number, retailerDomains: Record<string, string>): SearchResult[] {
  if (!data.results || !Array.isArray(data.results)) {
    console.log('No results found in Search API response');
    return [];
  }

  const results: SearchResult[] = [];
  
  try {
    for (const item of data.results) {
      // Check if URL matches our target retailers
      const url = item.url || '';
      const isRelevantRetailer = Object.values(retailerDomains).some(domain => 
        url.includes(domain)
      );
      
      if (!isRelevantRetailer) {
        continue; // Skip non-retailer results
      }
      
      const detectedRetailer = detectRetailer(url, retailerDomains);
      
      // If filtering by specific retailer, only include matching results
      if (retailer !== 'all' && detectedRetailer !== retailer) {
        continue;
      }
      
      const result: SearchResult = {
        id: generateId(url),
        title: (item.title || 'Product').substring(0, 120),
        url: cleanUrl(url),
        snippet: item.snippet ? item.snippet.substring(0, 150) : undefined,
        price: extractPrice(item.snippet || ''),
        image: item.images && item.images.length > 0 ? item.images[0] : undefined,
        retailer: detectedRetailer,
        timestamp: Date.now()
      };
      
      results.push(result);
      
      if (results.length >= limit) {
        break;
      }
    }
    
  } catch (error) {
    console.error('Error processing search results:', error);
  }
  
  return results;
}

function extractPrice(text: string): string | undefined {
  const priceMatch = text.match(/₹[\d,]+/);
  return priceMatch ? priceMatch[0] : undefined;
}

function cleanUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove tracking parameters but keep essential ones
    const keepParams = ['dp', 'pid', 'id', 'productId'];
    const newSearchParams = new URLSearchParams();
    
    keepParams.forEach(param => {
      if (urlObj.searchParams.has(param)) {
        newSearchParams.set(param, urlObj.searchParams.get(param)!);
      }
    });
    
    urlObj.search = newSearchParams.toString();
    return urlObj.toString();
  } catch {
    return url;
  }
}

function detectRetailer(url: string, retailerDomains: Record<string, string>): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    
    for (const [retailer, domain] of Object.entries(retailerDomains)) {
      if (hostname.includes(domain)) {
        return retailer;
      }
    }
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

function finalizeProduct(product: Partial<SearchResult>): SearchResult {
  return {
    id: generateId(product.url || ''),
    title: product.title || 'Product',
    url: product.url || '',
    snippet: product.snippet,
    price: product.price,
    image: product.image,
    retailer: product.retailer || 'unknown',
    timestamp: product.timestamp || Date.now()
  };
}

function generateId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash) + url.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
