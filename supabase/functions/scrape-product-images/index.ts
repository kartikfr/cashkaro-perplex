import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScrapeRequest {
  url: string;
  retailer?: string;
}

interface ScrapeResponse {
  images: string[];
  title?: string;
  price?: string;
  success: boolean;
  method: string;
  error?: string;
}

class ProductImageScraper {
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  async scrapeImages(url: string, retailer?: string): Promise<ScrapeResponse> {
    console.log(`Scraping images from: ${url}`);
    
    try {
      // First, try to fetch the page
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: AbortSignal.timeout(10000) // 10 second timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const html = await response.text();
      console.log(`Fetched HTML content, length: ${html.length}`);

      // Extract images based on retailer
      const images = this.extractImagesFromHtml(html, url, retailer);
      
      // Extract additional product info
      const title = this.extractTitle(html);
      const price = this.extractPrice(html);

      return {
        images: images.slice(0, 5), // Limit to 5 images
        title,
        price,
        success: true,
        method: 'web_scraping'
      };

    } catch (error) {
      console.error(`Scraping failed for ${url}:`, error);
      
      // Fallback to pattern-based generation
      const fallbackImages = this.generateFallbackImages(url, retailer);
      
      return {
        images: fallbackImages,
        success: fallbackImages.length > 0,
        method: 'pattern_fallback',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private extractImagesFromHtml(html: string, url: string, retailer?: string): string[] {
    const images: string[] = [];
    const domain = new URL(url).hostname;

    // Amazon-specific selectors
    if (domain.includes('amazon')) {
      // Amazon image patterns
      const amazonPatterns = [
        /"hiRes":"([^"]+)"/g,
        /"large":"([^"]+)"/g,
        /data-old-hires="([^"]+)"/g,
        /data-a-dynamic-image="[^"]*([^"]+\.jpg)[^"]*"/g,
        /"mainUrl":"([^"]+)"/g
      ];

      for (const pattern of amazonPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          const imageUrl = match[1].replace(/\\u002F/g, '/').replace(/\\/g, '');
          if (this.isValidImageUrl(imageUrl)) {
            images.push(imageUrl);
          }
        }
      }

      // Amazon img tags
      const imgMatches = html.match(/<img[^>]+src="([^"]*amazon[^"]*\.(jpg|jpeg|png|webp))[^"]*"[^>]*>/gi);
      if (imgMatches) {
        imgMatches.forEach(match => {
          const srcMatch = match.match(/src="([^"]+)"/);
          if (srcMatch && this.isValidImageUrl(srcMatch[1])) {
            images.push(srcMatch[1]);
          }
        });
      }
    }

    // Flipkart-specific selectors
    else if (domain.includes('flipkart')) {
      const flipkartPatterns = [
        /"url":"([^"]*rukminim[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/g,
        /src="([^"]*rukminim[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/g,
        /"src":"([^"]*rukminim[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/g
      ];

      for (const pattern of flipkartPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          const imageUrl = match[1].replace(/\\u002F/g, '/').replace(/\\/g, '');
          if (this.isValidImageUrl(imageUrl)) {
            images.push(imageUrl);
          }
        }
      }
    }

    // Myntra-specific selectors
    else if (domain.includes('myntra')) {
      const myntraPatterns = [
        /"src":"([^"]*assets\.myntassets[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/g,
        /src="([^"]*assets\.myntassets[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/g,
        /"url":"([^"]*assets\.myntassets[^"]*\.(jpg|jpeg|png|webp)[^"]*)"/g
      ];

      for (const pattern of myntraPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          const imageUrl = match[1].replace(/\\u002F/g, '/').replace(/\\/g, '');
          if (this.isValidImageUrl(imageUrl)) {
            images.push(imageUrl);
          }
        }
      }
    }

    // Generic image extraction for other retailers
    else {
      const genericPatterns = [
        /<img[^>]+src="([^"]*\.(jpg|jpeg|png|webp))[^"]*"[^>]*>/gi,
        /"image":"([^"]*\.(jpg|jpeg|png|webp)[^"]*)"/g,
        /"src":"([^"]*\.(jpg|jpeg|png|webp)[^"]*)"/g
      ];

      for (const pattern of genericPatterns) {
        let match;
        while ((match = pattern.exec(html)) !== null) {
          const imageUrl = match[1];
          if (this.isValidImageUrl(imageUrl) && imageUrl.includes(domain)) {
            images.push(imageUrl);
          }
        }
      }
    }

    // Remove duplicates and return
    return [...new Set(images)];
  }

  private extractTitle(html: string): string | undefined {
    const titlePatterns = [
      /<title>([^<]+)<\/title>/i,
      /<h1[^>]*>([^<]+)<\/h1>/i,
      /"title":"([^"]+)"/,
      /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i
    ];

    for (const pattern of titlePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1].trim().substring(0, 100);
      }
    }

    return undefined;
  }

  private extractPrice(html: string): string | undefined {
    const pricePatterns = [
      /₹[\s]*([0-9,]+)/,
      /Rs\.[\s]*([0-9,]+)/,
      /INR[\s]*([0-9,]+)/,
      /"price":"[^"]*₹([^"]+)"/,
      /<span[^>]*price[^>]*>₹([^<]+)<\/span>/i
    ];

    for (const pattern of pricePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return `₹${match[1].trim()}`;
      }
    }

    return undefined;
  }

  private generateFallbackImages(url: string, retailer?: string): string[] {
    const images: string[] = [];

    try {
      if (url.includes('amazon')) {
        const asinMatch = url.match(/\/dp\/([A-Z0-9]+)/);
        if (asinMatch) {
          images.push(`https://images-na.ssl-images-amazon.com/images/P/${asinMatch[1]}.01.L.jpg`);
          images.push(`https://images-na.ssl-images-amazon.com/images/P/${asinMatch[1]}.02.L.jpg`);
        }
      } else if (url.includes('flipkart')) {
        const pidMatch = url.match(/pid=([^&]+)/);
        if (pidMatch) {
          images.push(`https://rukminim1.flixcart.com/image/832/832/product/${pidMatch[1]}.jpeg`);
        }
      } else if (url.includes('myntra')) {
        const patterns = [/\/product\/([^\/]+)/, /\/p\/([^\/]+)/, /\/item\/([^\/]+)/];
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) {
            images.push(`https://assets.myntassets.com/images/${match[1]}/1.jpg`);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error generating fallback images:', error);
    }

    return images;
  }

  private isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    
    // Clean the URL
    url = url.trim();
    
    // Must be a valid URL
    try {
      new URL(url);
    } catch {
      return false;
    }

    // Must have image extension or be from known image domains
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const imageDomains = ['amazon', 'rukminim', 'myntassets', 'ajio', 'nykaa', 'tatacliq'];
    
    const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext));
    const isFromImageDomain = imageDomains.some(domain => url.toLowerCase().includes(domain));
    
    return hasImageExtension && isFromImageDomain;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, retailer }: ScrapeRequest = await req.json();
    
    if (!url) {
      throw new Error('URL is required');
    }

    console.log(`Image scraping request for: ${url}`);

    const scraper = new ProductImageScraper();
    const result = await scraper.scrapeImages(url, retailer);
    
    console.log(`Scraping completed: ${result.images.length} images found using ${result.method}`);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in scrape-product-images function:', error);
    
    return new Response(
      JSON.stringify({ 
        images: [],
        success: false,
        method: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
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
