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
  confidence?: number; // URL validation confidence score
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

    // Build search prompt with stricter instructions
    const searchPrompt = buildSearchPrompt(query, retailer, retailerDomains);
    const domainFilter = getDomainFilter(retailer, retailerDomains);

    console.log('Search prompt:', searchPrompt);

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
            content: 'You are a product search assistant for Indian e-commerce. CRITICAL: Return ONLY direct product detail page URLs (Amazon: /dp/ASIN format, Flipkart: /p/ pages, Myntra: /[productId]/buy, AJIO: /p/ pages). Never return category pages, search result pages, or collection pages. Return product information in a structured format with title, direct product URL, price (in ₹ if available), and brief description. Format your response as a clear numbered list.'
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
    console.log('Response content preview:', data.choices?.[0]?.message?.content?.substring(0, 500));

    // Parse and validate search results
    let results = await parseAndValidateResults(data, retailer, limit, retailerDomains);
    
    console.log(`Parsed ${results.length} initial results`);
    
    // If we have results, follow redirects for top results
    if (results.length > 0) {
      results = await followRedirectsForTopResults(results, Math.min(3, results.length));
    }
    
    console.log(`Returning ${results.length} validated results`);

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
    return `Find "${sanitizedQuery}" products on Indian e-commerce websites. IMPORTANT: Provide ONLY direct product detail page URLs:
- Amazon: Use /dp/ASIN format only (e.g., amazon.in/dp/B08X123)
- Flipkart: Use /p/ product pages only
- Myntra: Use /[productId]/buy format only
- AJIO: Use /p/ product pages only
For each product provide: 1) Product title, 2) Direct product page URL, 3) Price in ₹, 4) Brief description. Format as numbered list.`;
  }
  
  const domainFilter = retailerDomains[retailer as keyof typeof retailerDomains];
  const retailerInstructions = getRetailerSpecificInstructions(retailer);
  return `Find "${sanitizedQuery}" products on ${domainFilter}. ${retailerInstructions} For each product provide: 1) Product title, 2) Direct product page URL, 3) Price in ₹, 4) Brief description. Format as numbered list.`;
}

function getRetailerSpecificInstructions(retailer: string): string {
  const instructions: Record<string, string> = {
    amazon: 'Return ONLY URLs in /dp/ASIN format (e.g., amazon.in/dp/B08X123ABC).',
    flipkart: 'Return ONLY /p/ product detail page URLs, not search or category pages.',
    myntra: 'Return ONLY /[productId]/buy product page URLs.',
    ajio: 'Return ONLY /p/ product detail page URLs.'
  };
  return instructions[retailer] || 'Return only direct product page URLs.';
}

function getDomainFilter(retailer: string, retailerDomains: Record<string, string>): string[] {
  if (retailer === 'all') {
    return Object.values(retailerDomains);
  }
  
  const domain = retailerDomains[retailer as keyof typeof retailerDomains];
  return domain ? [domain] : Object.values(retailerDomains);
}

async function parseAndValidateResults(data: any, retailer: string, limit: number, retailerDomains: Record<string, string>): Promise<SearchResult[]> {
  if (!data.choices || data.choices.length === 0) {
    return [];
  }

  const content = data.choices[0].message.content;
  const results: SearchResult[] = [];
  
  try {
    const lines = content.split('\n').filter((line: string) => line.trim());
    let currentProduct: Partial<SearchResult> = {};
    
    console.log(`Processing ${lines.length} lines from Perplexity response`);
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Look for product titles (numbered list or bullet points)
      if ((trimmedLine.match(/^\d+\./) || trimmedLine.match(/^[-*•]\s/)) && trimmedLine.length > 10) {
        // Save previous product if it has at least a title and URL
        if (currentProduct.title && currentProduct.url) {
          console.log(`Found product: ${currentProduct.title} - ${currentProduct.url}`);
          results.push(finalizeProduct(currentProduct));
          if (results.length >= limit * 2) break; // Get more candidates
        }
        
        // Start new product
        currentProduct = {
          title: cleanTitle(trimmedLine),
          timestamp: Date.now()
        };
      }
      
      // Look for URLs (accept absolute, domain-only, or retailer-rooted paths)
      const urlMatch = trimmedLine.match(new RegExp('(https?:\\/\\/[^\\s)]+|(?:www\\.)?(?:amazon\\.in|flipkart\\.com|myntra\\.com|ajio\\.com)[^\\s)]+|\\/(?:dp\\/[A-Z0-9]{8,12}|p\\/[^\\s)]+))','i'));
      if (urlMatch) {
        let candidate = urlMatch[0];
        // Build absolute URL if needed
        if (!/^https?:\/\//i.test(candidate)) {
          if (candidate.startsWith('/')) {
            const host = retailer !== 'all' ? retailerDomains[retailer as keyof typeof retailerDomains] : '';
            if (host) candidate = `https://www.${host}${candidate}`;
          } else if (/^(?:www\.)?(amazon\.in|flipkart\.com|myntra\.com|ajio\.com)/i.test(candidate)) {
            candidate = candidate.startsWith('www.') ? `https://${candidate}` : `https://www.${candidate}`;
          }
        }
        const cleanedUrl = cleanUrl(candidate);
        const detectedRetailer = detectRetailer(cleanedUrl, retailerDomains);
        const confidence = validateRetailerUrl(cleanedUrl, detectedRetailer);
        console.log(`URL found: ${cleanedUrl} (retailer: ${detectedRetailer}, confidence: ${confidence})`);
        if (confidence >= 0.3) {
          currentProduct.url = cleanedUrl;
          currentProduct.retailer = detectedRetailer;
          (currentProduct as any).confidence = confidence;
        } else {
          console.log(`URL rejected due to low confidence: ${confidence}`);
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
    if (currentProduct.title && currentProduct.url && results.length < limit * 2) {
      console.log(`Found product: ${currentProduct.title} - ${currentProduct.url}`);
      results.push(finalizeProduct(currentProduct));
    }
    
    console.log(`Total products parsed: ${results.length}`);
    
  } catch (error) {
    console.error('Error parsing search results:', error);
  }
  
  // If nothing parsed, salvage any direct product-looking URLs from the full content
  if (results.length === 0) {
    const salvageRegex = /(https?:\/\/)?(?:www\.)?(amazon\.in\/dp\/[A-Z0-9]{8,12}|flipkart\.com\/p\/[^\s)]+|myntra\.com\/[^\s)]+|ajio\.com\/[^\s)]+)/ig;
    const seen = new Set<string>();
    let m: RegExpExecArray | null;
    let count = 0;
    while ((m = salvageRegex.exec(content)) && count < Math.max(3, limit)) {
      let built = m[0];
      if (!/^https?:\/\//i.test(built)) built = `https://${built.startsWith('www.') ? built : 'www.' + built}`;
      built = cleanUrl(built);
      if (seen.has(built)) continue;
      seen.add(built);
      const r = detectRetailer(built, retailerDomains);
      const conf = validateRetailerUrl(built, r);
      if (conf >= 0.3) {
        results.push({
          id: generateId(built),
          title: built,
          url: built,
          retailer: r,
          timestamp: Date.now(),
          confidence: conf,
        } as any);
        count++;
      }
    }
    console.log(`Salvage added ${count} results`);
  }

  // Sort by confidence score (higher is better)
  results.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  
  console.log(`Returning ${results.length} results after sorting`);
  
  return results.slice(0, limit * 2); // Return more candidates for redirect checking
}

// Validate and score URL patterns for each retailer
function validateRetailerUrl(url: string, retailer: string): number {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    
    console.log(`Validating ${retailer} URL: ${pathname}`);
    
    switch (retailer) {
      case 'amazon':
        // Must have /dp/ or /gp/product/ with ASIN
        if (pathname.match(/\/(dp|gp\/product)\/[A-Z0-9]{10}/i)) return 1.0;
        if (pathname.includes('/dp/') || pathname.includes('/gp/product/')) return 0.8;
        return 0.4; // Be more lenient
        
      case 'flipkart':
        // Must have /p/ for product pages
        if (pathname.match(/\/p\/[^\/]+\/p\/itm[a-z0-9]+/i)) return 1.0;
        if (pathname.startsWith('/p/')) return 0.9;
        if (pathname.includes('/search') || pathname.includes('/category')) return 0.2;
        return 0.5; // Accept by default
        
      case 'myntra':
        // Must have /[productId]/buy format
        if (pathname.match(/\/\d+\/buy/)) return 1.0;
        if (pathname.match(/\/\d+$/)) return 0.9;
        if (pathname.includes('/shop/')) return 0.3;
        return 0.6; // Be more lenient
        
      case 'ajio':
        // Must have /p/ for product pages
        if (pathname.startsWith('/p/')) return 1.0;
        if (pathname.includes('/s/') || pathname.includes('/shop/')) return 0.3;
        return 0.6; // Be more lenient
        
      default:
        return 0.5;
    }
  } catch (error) {
    console.error('Error validating URL:', error);
    return 0.0;
  }
}

// Follow redirects for top N results to ensure correct landing pages
async function followRedirectsForTopResults(results: SearchResult[], topN: number): Promise<SearchResult[]> {
  if (results.length === 0) return results;
  
  const topResults = results.slice(0, topN);
  const restResults = results.slice(topN);
  
  console.log(`Checking redirects for top ${topResults.length} results`);
  
  const validatedTop = await Promise.all(
    topResults.map(async (result) => {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000); // Increased timeout
        
        const response = await fetch(result.url, {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          redirect: 'follow',
          signal: controller.signal
        });
        
        clearTimeout(timeout);
        
        // Update URL if redirected
        if (response.url && response.url !== result.url) {
          console.log(`Redirect detected: ${result.url} -> ${response.url}`);
          const finalUrl = cleanUrl(response.url);
          const finalRetailer = detectRetailer(finalUrl, {
            amazon: 'amazon.in',
            flipkart: 'flipkart.com',
            myntra: 'myntra.com',
            ajio: 'ajio.com'
          });
          const confidence = validateRetailerUrl(finalUrl, finalRetailer);
          
          if (confidence >= 0.3) {
            return { ...result, url: finalUrl, retailer: finalRetailer, confidence };
          }
        }
        
        return result;
      } catch (error) {
        console.log(`Could not check redirect for ${result.url}, keeping original`);
        return result;
      }
    })
  );
  
  // Filter out invalid results after redirect checking
  const validResults = validatedTop.filter(r => (r.confidence || 0) >= 0.3);
  
  console.log(`After redirect check: ${validResults.length} valid results`);
  
  return [...validResults, ...restResults].slice(0, 5);
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
    // Strip common trailing punctuation sometimes introduced by formatting
    const sanitized = url.trim().replace(/[)\]>,\.;]+$/g, '');
    const urlObj = new URL(sanitized);

    // Canonicalize Amazon product URLs to https://www.amazon.in/dp/ASIN with no params/hash
    if (urlObj.hostname.includes('amazon')) {
      urlObj.hostname = 'www.amazon.in';

      // Extract ASIN from various Amazon URL formats
      const asinMatch =
        urlObj.pathname.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i) ||
        urlObj.pathname.match(/\/([A-Z0-9]{10})(?:[/?]|$)/i);

      const asin = asinMatch ? asinMatch[1].toUpperCase() : null;

      urlObj.search = '';
      urlObj.hash = '';
      urlObj.pathname = asin ? `/dp/${asin}` : urlObj.pathname.replace(/[)]+$/, '');

      return urlObj.toString();
    }

    // For other retailers, keep only essential params
    const keepParams = ['pid', 'id', 'productId'];
    const newSearchParams = new URLSearchParams();

    keepParams.forEach((param) => {
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
