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
            content: 'You are a product search assistant for Indian e-commerce. Return product information in a structured format with title, URL, price (in ₹ if available), image URL, and brief description. Include the main product image URL for each item. Focus on Indian e-commerce sites. Format your response as a clear numbered list with each product on separate lines.'
          },
          {
            role: 'user',
            content: searchPrompt
          }
        ],
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 1200,
        return_images: true,
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
    console.log('Perplexity response structure:', JSON.stringify(data, null, 2));

    // Parse search results
    const results = await parseSearchResults(data, retailer, limit, retailerDomains);
    
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

async function parseSearchResults(data: any, retailer: string, limit: number, retailerDomains: Record<string, string>): Promise<SearchResult[]> {
  if (!data.choices || data.choices.length === 0) {
    return [];
  }

  const content = data.choices[0].message.content;
  const results: SearchResult[] = [];
  
  // Check if Perplexity returned images in the response
  const images = data.choices[0].message.images || [];
  let imageIndex = 0;
  
  console.log('Images from Perplexity:', images);
  console.log('Content from Perplexity:', content);
  
  try {
    const lines = content.split('\n').filter((line: string) => line.trim());
    let currentProduct: Partial<SearchResult> = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Look for product titles (numbered list)
      if (trimmedLine.match(/^\d+\./) && trimmedLine.length > 10) {
        // Save previous product if complete
        if (currentProduct.title && currentProduct.url) {
          // Assign image if available from Perplexity response
          if (images[imageIndex]) {
            currentProduct.image = images[imageIndex].url;
            imageIndex++;
          }
          results.push(await finalizeProduct(currentProduct));
          if (results.length >= limit) break;
        }
        
        // Start new product
        currentProduct = {
          title: cleanTitle(trimmedLine),
          timestamp: Date.now()
        };
      }
      
      // Look for product URLs
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
      
      // Look for image URLs in the text content
      const imageMatch = trimmedLine.match(/(https?:\/\/[^\s]+\.(jpg|jpeg|png|webp|gif))/i);
      if (imageMatch && !currentProduct.image) {
        currentProduct.image = imageMatch[1];
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
      // Assign image if available for the last product
      if (images[imageIndex]) {
        currentProduct.image = images[imageIndex].url;
      }
      results.push(await finalizeProduct(currentProduct));
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

async function finalizeProduct(product: Partial<SearchResult>): Promise<SearchResult> {
  // If no image from Perplexity, try to extract using Python service
  let finalImage = product.image;
  if (!finalImage && product.url) {
    console.log('No image from Perplexity, trying Python extraction for:', product.url);
    try {
      const imageResult = await extractImagesFromPythonService(product.url, product.retailer);
      if (imageResult.success && imageResult.images.length > 0) {
        finalImage = imageResult.images[0];
        console.log('Python extraction successful:', finalImage);
      }
    } catch (error) {
      console.warn('Python extraction failed, trying fallback:', error);
    }
  }

  // Fallback to URL-based generation
  if (!finalImage && product.url) {
    console.log('No image from Python service, generating from URL:', product.url);
    finalImage = generateImageFromUrl(product.url);
  }

  // If still no image, use a generic placeholder
  if (!finalImage) {
    console.log('No image generated, using generic placeholder for retailer:', product.retailer);
    finalImage = generateGenericPlaceholder(product.retailer || 'unknown');
  }

  const finalProduct = {
    id: generateId(product.url || ''),
    title: product.title || 'Product',
    url: product.url || '',
    snippet: product.snippet,
    price: product.price,
    image: finalImage,
    retailer: product.retailer || 'unknown',
    timestamp: product.timestamp || Date.now()
  };

  console.log('Finalized product:', finalProduct);
  return finalProduct;
}

// Python image extraction service integration
async function extractImagesFromPythonService(url: string, retailer?: string): Promise<{success: boolean, images: string[]}> {
  try {
    console.log('Calling Python image extraction service for:', url);
    
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/extract-product-images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        retailer
      })
    });

    if (!response.ok) {
      throw new Error(`Python service error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Python service response:', result);
    
    return {
      success: result.success,
      images: result.images || []
    };
  } catch (error) {
    console.error('Python image extraction failed:', error);
    return {
      success: false,
      images: []
    };
  }
}

function generateGenericPlaceholder(retailer: string): string {
  const retailerColors: Record<string, string> = {
    amazon: 'FF9900',
    flipkart: '2874F0',
    myntra: 'FF3F6C',
    ajio: 'FF6B35',
    nykaa: 'FF1493',
    tatacliq: '000000',
    unknown: '6B7280'
  };
  
  const color = retailerColors[retailer] || '6B7280';
  return `https://via.placeholder.com/300x300/${color}/FFFFFF?text=${retailer.toUpperCase()}`;
}

function generateImageFromUrl(url: string): string | undefined {
  try {
    console.log('Generating image from URL:', url);
    const urlObj = new URL(url);
    
    // Amazon image patterns
    if (urlObj.hostname.includes('amazon')) {
      const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
      if (asinMatch) {
        const imageUrl = `https://images-na.ssl-images-amazon.com/images/P/${asinMatch[1]}.01.L.jpg`;
        console.log('Generated Amazon image URL:', imageUrl);
        return imageUrl;
      }
    }
    
    // Flipkart image patterns
    if (urlObj.hostname.includes('flipkart')) {
      const pidMatch = url.match(/pid=([^&]+)/);
      if (pidMatch) {
        const imageUrl = `https://rukminim1.flixcart.com/image/416/416/product/${pidMatch[1]}.jpeg`;
        console.log('Generated Flipkart image URL:', imageUrl);
        return imageUrl;
      }
    }
    
    // Myntra image patterns - Enhanced to handle more URL formats
    if (urlObj.hostname.includes('myntra')) {
      // Try multiple patterns for Myntra
      const patterns = [
        /\/product\/([^\/]+)/,
        /\/p\/([^\/]+)/,
        /\/item\/([^\/]+)/,
        /pid=([^&]+)/
      ];
      
      for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
          const productId = match[1];
          const imageUrl = `https://assets.myntassets.com/images/${productId}/1.jpg`;
          console.log('Generated Myntra image URL:', imageUrl);
          return imageUrl;
        }
      }
    }
    
    // AJIO image patterns
    if (urlObj.hostname.includes('ajio')) {
      const productIdMatch = url.match(/\/p\/([^\/]+)/);
      if (productIdMatch) {
        const imageUrl = `https://assets.ajio.com/images/${productIdMatch[1]}/1.jpg`;
        console.log('Generated AJIO image URL:', imageUrl);
        return imageUrl;
      }
    }
    
    console.log('No image pattern matched for URL:', url);
    return undefined;
  } catch (error) {
    console.error('Error generating image from URL:', url, error);
    return undefined;
  }
}

function generateId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash) + url.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
