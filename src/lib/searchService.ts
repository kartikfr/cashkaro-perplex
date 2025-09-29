import { z } from 'zod';

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

interface PerplexityResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  citations?: string[];
}

class SearchService {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai/chat/completions';
  
  private retailerDomains = {
    amazon: 'amazon.in',
    flipkart: 'flipkart.com',
    myntra: 'myntra.com',
    ajio: 'ajio.com'
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async search(query: string, retailer: string = 'all', limit: number = 5): Promise<SearchResult[]> {
    // Validate inputs
    const validatedInput = searchQuerySchema.parse({ query, retailer, limit });
    
    try {
      const searchPrompt = this.buildSearchPrompt(validatedInput.query, validatedInput.retailer);
      
      // Use raw fetch instead of SDK to avoid CORS issues
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar', // Correct model name from Perplexity docs
          messages: [
            {
              role: 'system',
              content: 'You are a product search assistant. Return product information in a structured format with title, URL, price (if available), and brief description. Focus on Indian e-commerce sites. Format your response as a clear list with each product on separate lines.'
            },
            {
              role: 'user',
              content: searchPrompt
            }
          ],
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 1000,
          search_domain_filter: this.getDomainFilter(validatedInput.retailer),
          search_recency_filter: 'month',
          return_images: false,
          return_related_questions: false,
          frequency_penalty: 1,
          presence_penalty: 0
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error ${response.status}: ${errorData}`);
      }

      const data: PerplexityResponse = await response.json();
      return this.parseSearchResults(data, validatedInput.retailer, validatedInput.limit);
      
    } catch (error) {
      console.error('Search error:', error);
      if (error instanceof Error) {
        throw new Error(`Search failed: ${error.message}`);
      }
      throw new Error('Search failed with unknown error');
    }
  }

  private buildSearchPrompt(query: string, retailer: string): string {
    const sanitizedQuery = encodeURIComponent(query.trim());
    
    if (retailer === 'all') {
      return `Find ${sanitizedQuery} products on Indian e-commerce websites (Amazon.in, Flipkart, Myntra, AJIO). For each product, provide: title, direct product URL, price in rupees if available, and brief description. Format as a list with clear product entries.`;
    }
    
    const domainFilter = this.retailerDomains[retailer as keyof typeof this.retailerDomains];
    return `Find ${sanitizedQuery} products specifically on ${domainFilter}. For each product, provide: title, direct product URL, price in rupees if available, and brief description. Format as a list with clear product entries.`;
  }

  private getDomainFilter(retailer: string): string[] {
    if (retailer === 'all') {
      return Object.values(this.retailerDomains);
    }
    
    const domain = this.retailerDomains[retailer as keyof typeof this.retailerDomains];
    return domain ? [domain] : Object.values(this.retailerDomains);
  }

  private parseSearchResults(data: PerplexityResponse, retailer: string, limit: number): SearchResult[] {
    if (!data.choices || data.choices.length === 0) {
      return [];
    }

    const content = data.choices[0].message.content;
    const results: SearchResult[] = [];
    
    try {
      // Parse the structured response from Perplexity
      const lines = content.split('\n').filter(line => line.trim());
      let currentProduct: Partial<SearchResult> = {};
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Look for product titles (usually start with numbers or bullets)
        if (trimmedLine.match(/^\d+\.|^-|^\*/) && trimmedLine.length > 10) {
          // Save previous product if complete
          if (currentProduct.title && currentProduct.url) {
            results.push(this.finalizeProduct(currentProduct));
            if (results.length >= limit) break;
          }
          
          // Start new product
          currentProduct = {
            title: this.cleanTitle(trimmedLine),
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
            currentProduct.url = this.cleanUrl(urlMatch[1]);
            currentProduct.retailer = this.detectRetailer(currentProduct.url);
          }
        }
        
        // Look for prices
        const priceMatch = trimmedLine.match(/₹[\d,]+/);
        if (priceMatch && !currentProduct.price) {
          currentProduct.price = priceMatch[0];
        }
        
        // Look for descriptions (lines that don't contain URLs or start markers)
        if (!trimmedLine.includes('http') && 
            !trimmedLine.match(/^\d+\.|^-|^\*/) && 
            trimmedLine.length > 20 && 
            !currentProduct.snippet) {
          currentProduct.snippet = trimmedLine.substring(0, 150);
        }
      }
      
      // Don't forget the last product
      if (currentProduct.title && currentProduct.url && results.length < limit) {
        results.push(this.finalizeProduct(currentProduct));
      }
      
    } catch (error) {
      console.error('Error parsing search results:', error);
    }
    
    return results.slice(0, limit);
  }

  private cleanTitle(title: string): string {
    // Remove numbering, bullets, and clean up
    return title
      .replace(/^\d+\.\s*/, '')
      .replace(/^[-*]\s*/, '')
      .replace(/^\**\s*/, '')
      .trim()
      .substring(0, 120);
  }

  private cleanUrl(url: string): string {
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

  private detectRetailer(url: string): string {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      
      for (const [retailer, domain] of Object.entries(this.retailerDomains)) {
        if (hostname.includes(domain)) {
          return retailer;
        }
      }
      
      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  private finalizeProduct(product: Partial<SearchResult>): SearchResult {
    return {
      id: this.generateId(product.url || ''),
      title: product.title || 'Product',
      url: product.url || '',
      snippet: product.snippet,
      price: product.price,
      image: product.image,
      retailer: product.retailer || 'unknown',
      timestamp: product.timestamp || Date.now()
    };
  }

  private generateId(url: string): string {
    // Simple hash function for ID generation
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      hash = ((hash << 5) - hash) + url.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

export default SearchService;
