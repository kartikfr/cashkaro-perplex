import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PERPLEXITY_API_KEY = Deno.env.get('PERPLEXITY_API_KEY');

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

    // Build search prompt
    const searchPrompt = buildSearchPrompt(query, retailer, retailerDomains);
    const domainFilter = getDomainFilter(retailer, retailerDomains);

    // Call Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          {
            role: 'system',
            content: 'You are a product search assistant for Indian e-commerce. Return product information in a structured format with title, URL, price (in ₹ if available), and brief description. Focus on Indian e-commerce sites. Format your response as a clear numbered list with each product on separate lines.'
          },
          {
            role: 'user',
            content: searchPrompt
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1000,
        return_images: false,
        return_related_questions: false,
        search_domain_filter: domainFilter,
        search_recency_filter: 'month',
        frequency_penalty: 1,
        presence_penalty: 0
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Perplexity API Error ${response.status}:`, errorData);
      throw new Error(`Perplexity API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Perplexity response received');

    // Parse search results
    const results = parseSearchResults(data, retailer, limit, retailerDomains);
    
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

function buildSearchPrompt(query: string, retailer: string, retailerDomains: Record<string, string>): string {
  const sanitizedQuery = query.trim();
  
  if (retailer === 'all') {
    return `Find "${sanitizedQuery}" products on Indian e-commerce websites (Amazon.in, Flipkart, Myntra, AJIO). For each product, provide: 1) Product title, 2) Direct product URL, 3) Price in rupees if available, 4) Brief description. Format as a numbered list with clear product entries.`;
  }
  
  const domainFilter = retailerDomains[retailer as keyof typeof retailerDomains];
  return `Find "${sanitizedQuery}" products specifically on ${domainFilter}. For each product, provide: 1) Product title, 2) Direct product URL, 3) Price in rupees if available, 4) Brief description. Format as a numbered list with clear product entries.`;
}

function getDomainFilter(retailer: string, retailerDomains: Record<string, string>): string[] {
  if (retailer === 'all') {
    return Object.values(retailerDomains);
  }
  
  const domain = retailerDomains[retailer as keyof typeof retailerDomains];
  return domain ? [domain] : Object.values(retailerDomains);
}

function parseSearchResults(data: any, retailer: string, limit: number, retailerDomains: Record<string, string>): SearchResult[] {
  if (!data.choices || data.choices.length === 0) {
    return [];
  }

  const content = data.choices[0].message.content;
  const results: SearchResult[] = [];
  
  try {
    const lines = content.split('\n').filter((line: string) => line.trim());
    let currentProduct: Partial<SearchResult> = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Look for product titles (numbered list)
      if (trimmedLine.match(/^\d+\./) && trimmedLine.length > 10) {
        // Save previous product if complete
        if (currentProduct.title && currentProduct.url) {
          results.push(finalizeProduct(currentProduct));
          if (results.length >= limit) break;
        }
        
        // Start new product
        currentProduct = {
          title: cleanTitle(trimmedLine),
          timestamp: Date.now()
        };
      }
      
      // Look for URLs
      if (trimmedLine.includes('http') && (
        trimmedLine.includes('amazon.in') || 
        trimmedLine.includes('flipkart.com') || 
        trimmedLine.includes('myntra.com') || 
        trimmedLine.includes('ajio.com')
      )) {
        const urlMatch = trimmedLine.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          currentProduct.url = cleanUrl(urlMatch[1]);
          currentProduct.retailer = detectRetailer(currentProduct.url, retailerDomains);
        }
      }
      
      // Look for prices
      const priceMatch = trimmedLine.match(/₹[\d,]+/);
      if (priceMatch && !currentProduct.price) {
        currentProduct.price = priceMatch[0];
      }
      
      // Look for descriptions
      if (!trimmedLine.includes('http') && 
          !trimmedLine.match(/^\d+\./) && 
          trimmedLine.length > 20 && 
          !currentProduct.snippet) {
        currentProduct.snippet = trimmedLine.substring(0, 150);
      }
    }
    
    // Don't forget the last product
    if (currentProduct.title && currentProduct.url && results.length < limit) {
      results.push(finalizeProduct(currentProduct));
    }
    
  } catch (error) {
    console.error('Error parsing search results:', error);
  }
  
  return results.slice(0, limit);
}

function cleanTitle(title: string): string {
  return title
    .replace(/^\d+\.\s*/, '')
    .replace(/^[-*]\s*/, '')
    .trim()
    .substring(0, 120);
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
