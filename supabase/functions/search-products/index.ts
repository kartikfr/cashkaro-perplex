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
  relevanceScore?: number;
}

const RETAILER_CONFIG = {
  amazon: {
    domain: 'amazon.in',
    name: 'Amazon India',
    searchHints: 'Amazon.in online shopping',
    priceIndicators: ['₹', 'MRP', 'Price']
  },
  flipkart: {
    domain: 'flipkart.com',
    name: 'Flipkart',
    searchHints: 'Flipkart online store',
    priceIndicators: ['₹', 'Price']
  },
  myntra: {
    domain: 'myntra.com',
    name: 'Myntra',
    searchHints: 'Myntra fashion store',
    priceIndicators: ['₹', 'MRP']
  },
  ajio: {
    domain: 'ajio.com',
    name: 'AJIO',
    searchHints: 'AJIO fashion shopping',
    priceIndicators: ['₹', 'Price']
  }
};

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

    console.log(`🔍 Optimized search for: "${query}" on ${retailer}`);

    // Build optimized search query
    const searchQuery = buildOptimizedSearchQuery(query, retailer);
    console.log(`📝 Search query: "${searchQuery}"`);

    // Call Perplexity Search API with retry logic
    const searchResults = await searchWithRetry(searchQuery, 3);
    
    // Process and rank results
    const processedResults = processAndRankResults(
      searchResults,
      query,
      retailer,
      limit
    );
    
    console.log(`✅ Returning ${processedResults.length} optimized results`);

    return new Response(
      JSON.stringify({ 
        results: processedResults, 
        query, 
        retailer,
        metadata: {
          totalFound: searchResults.results?.length || 0,
          filtered: processedResults.length,
          searchQuery
        }
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('❌ Error in search-products function:', error);
    
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

// Build optimized search query with retailer-specific hints
function buildOptimizedSearchQuery(query: string, retailer: string): string {
  const sanitizedQuery = query.trim();
  
  if (retailer === 'all') {
    // Multi-retailer search with India-specific keywords
    return `${sanitizedQuery} buy online India e-commerce shopping Amazon Flipkart Myntra AJIO product price`;
  }
  
  const config = RETAILER_CONFIG[retailer as keyof typeof RETAILER_CONFIG];
  if (config) {
    // Retailer-specific optimized query
    return `${sanitizedQuery} ${config.searchHints} ${config.name} India product buy online price`;
  }
  
  return `${sanitizedQuery} buy online India`;
}

// Search with retry logic for better reliability
async function searchWithRetry(query: string, maxRetries: number): Promise<any> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Search attempt ${attempt}/${maxRetries}`);
      
      const response = await fetch(PERPLEXITY_SEARCH_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          max_results: 25, // Get more results for better filtering
          return_images: true,
          return_snippets: true,
          country: 'IN'
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error(`❌ Perplexity API Error ${response.status}:`, errorData);
        throw new Error(`Perplexity API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log(`✅ Search successful on attempt ${attempt}`);
      return data;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.error(`⚠️ Attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = Math.pow(2, attempt) * 500;
        console.log(`⏳ Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Search failed after retries');
}

// Process and rank results with quality scoring
function processAndRankResults(
  data: any,
  originalQuery: string,
  retailer: string,
  limit: number
): SearchResult[] {
  if (!data.results || !Array.isArray(data.results)) {
    console.log('⚠️ No results found in Search API response');
    return [];
  }

  const results: SearchResult[] = [];
  const queryLower = originalQuery.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(term => term.length > 2);
  
  console.log(`📊 Processing ${data.results.length} raw results`);

  for (const item of data.results) {
    const url = item.url || '';
    
    // Check if URL matches our target retailers
    const detectedRetailer = detectRetailer(url);
    if (!detectedRetailer) {
      continue; // Skip non-retailer results
    }
    
    // Filter by specific retailer if requested
    if (retailer !== 'all' && detectedRetailer !== retailer) {
      continue;
    }
    
    const title = (item.title || 'Product').substring(0, 120);
    const snippet = item.snippet ? item.snippet.substring(0, 200) : undefined;
    const fullText = `${title} ${snippet || ''}`.toLowerCase();
    
    // Calculate relevance score
    const relevanceScore = calculateRelevanceScore(
      fullText,
      queryTerms,
      detectedRetailer,
      retailer
    );
    
    // Skip low-quality results
    if (relevanceScore < 0.3) {
      continue;
    }
    
    // Extract and format price
    const price = extractPrice(fullText, detectedRetailer);
    
    // Select best image
    const image = selectBestImage(item.images);
    
    const result: SearchResult = {
      id: generateId(url),
      title: cleanTitle(title),
      url: cleanUrl(url),
      snippet,
      price,
      image,
      retailer: detectedRetailer,
      timestamp: Date.now(),
      relevanceScore
    };
    
    results.push(result);
  }
  
  // Sort by relevance score (highest first)
  results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  
  console.log(`✨ Processed ${results.length} quality results`);
  
  return results.slice(0, limit);
}

// Calculate relevance score based on multiple factors
function calculateRelevanceScore(
  text: string,
  queryTerms: string[],
  detectedRetailer: string,
  targetRetailer: string
): number {
  let score = 0;
  
  // Term matching score (0-0.5)
  const matchedTerms = queryTerms.filter(term => text.includes(term));
  score += (matchedTerms.length / queryTerms.length) * 0.5;
  
  // Exact phrase bonus (0-0.2)
  const originalPhrase = queryTerms.join(' ');
  if (text.includes(originalPhrase)) {
    score += 0.2;
  }
  
  // Retailer match bonus (0-0.2)
  if (targetRetailer === 'all' || detectedRetailer === targetRetailer) {
    score += 0.2;
  }
  
  // Product indicators bonus (0-0.1)
  const productIndicators = ['buy', 'price', '₹', 'mrp', 'offer', 'sale', 'product'];
  const hasIndicators = productIndicators.some(indicator => text.includes(indicator));
  if (hasIndicators) {
    score += 0.1;
  }
  
  return Math.min(score, 1.0);
}

// Improved price extraction with multiple patterns
function extractPrice(text: string, retailer: string): string | undefined {
  const config = RETAILER_CONFIG[retailer as keyof typeof RETAILER_CONFIG];
  
  // Try multiple price patterns
  const patterns = [
    /₹\s*[\d,]+(?:\.\d{2})?/,           // ₹1,999 or ₹1,999.00
    /(?:MRP|Price|Rs\.?)\s*₹?\s*[\d,]+/, // MRP ₹1999 or Price 1999
    /₹[\d,]+\s*onwards?/i,               // ₹999 onwards
    /(?:from|starting)\s*₹?\s*[\d,]+/i   // from ₹999
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let price = match[0];
      
      // Clean up the price string
      price = price.replace(/(?:MRP|Price|Rs\.?|from|starting|onwards?)/gi, '')
                   .trim();
      
      // Ensure it starts with ₹
      if (!price.startsWith('₹')) {
        price = '₹' + price;
      }
      
      return price;
    }
  }
  
  return undefined;
}

// Select best quality image from available images
function selectBestImage(images: string[] | undefined): string | undefined {
  if (!images || images.length === 0) {
    return undefined;
  }
  
  // Prefer product images over generic ones
  const productImages = images.filter(img => 
    !img.includes('logo') && 
    !img.includes('icon') &&
    !img.includes('favicon')
  );
  
  return productImages[0] || images[0];
}

// Detect retailer from URL
function detectRetailer(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    
    for (const [retailer, config] of Object.entries(RETAILER_CONFIG)) {
      if (hostname.includes(config.domain)) {
        return retailer;
      }
    }
    
    return null;
  } catch {
    return null;
  }
}

// Clean and format product title
function cleanTitle(title: string): string {
  return title
    .replace(/^\d+\.\s*/, '')           // Remove list numbers
    .replace(/^[-*]\s*/, '')            // Remove bullet points
    .replace(/\s+/g, ' ')               // Normalize whitespace
    .trim()
    .substring(0, 120);
}

// Clean URL by removing tracking parameters
function cleanUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    
    // Keep only essential parameters
    const keepParams = ['dp', 'pid', 'id', 'productId', 'skuId'];
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

// Generate unique ID from URL
function generateId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash) + url.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
