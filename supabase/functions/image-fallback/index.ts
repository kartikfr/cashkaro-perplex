import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FallbackRequest {
  url: string;
  retailer?: string;
  title?: string;
}

interface FallbackResponse {
  image_url: string;
  method: string;
  success: boolean;
  error?: string;
}

// Enhanced fallback image generation
class ImageFallbackService {
  
  // Generate image from URL patterns
  generateFromUrl(url: string, retailer?: string): string | null {
    try {
      console.log('Generating image from URL pattern:', url);
      
      if (retailer === 'amazon' || url.includes('amazon')) {
        const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
        if (asinMatch) {
          return `https://images-na.ssl-images-amazon.com/images/P/${asinMatch[1]}.01.L.jpg`;
        }
      }
      
      if (retailer === 'flipkart' || url.includes('flipkart')) {
        const pidMatch = url.match(/pid=([^&]+)/);
        if (pidMatch) {
          return `https://rukminim1.flixcart.com/image/832/832/product/${pidMatch[1]}.jpeg`;
        }
      }
      
      if (retailer === 'myntra' || url.includes('myntra')) {
        const patterns = [
          /\/product\/([^\/]+)/,
          /\/p\/([^\/]+)/,
          /\/item\/([^\/]+)/,
          /pid=([^&]+)/
        ];
        
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) {
            return `https://assets.myntassets.com/images/${match[1]}/1.jpg`;
          }
        }
      }
      
      if (retailer === 'ajio' || url.includes('ajio')) {
        const productIdMatch = url.match(/\/p\/([^\/]+)/);
        if (productIdMatch) {
          return `https://assets.ajio.com/images/${productIdMatch[1]}/1.jpg`;
        }
      }
      
      if (retailer === 'nykaa' || url.includes('nykaa')) {
        const productIdMatch = url.match(/\/p\/([^\/]+)/);
        if (productIdMatch) {
          return `https://images-static.nykaa.com/images/${productIdMatch[1]}/1.jpg`;
        }
      }
      
      if (retailer === 'tatacliq' || url.includes('tatacliq')) {
        const productIdMatch = url.match(/\/p\/([^\/]+)/);
        if (productIdMatch) {
          return `https://img.tatacliq.com/images/${productIdMatch[1]}/1.jpg`;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error generating image from URL:', error);
      return null;
    }
  }
  
  // Generate placeholder based on retailer
  generatePlaceholder(retailer: string, title?: string): string {
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
    const text = title ? encodeURIComponent(title.substring(0, 20)) : retailer.toUpperCase();
    
    return `https://via.placeholder.com/400x400/${color}/FFFFFF?text=${text}`;
  }
  
  // Generate image from product title using external service
  async generateFromTitle(title: string, retailer: string): Promise<string | null> {
    try {
      // Use a placeholder service that can generate images from text
      const searchQuery = encodeURIComponent(`${title} ${retailer} product`);
      return `https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=${encodeURIComponent(title.substring(0, 15))}`;
    } catch (error) {
      console.error('Error generating image from title:', error);
      return null;
    }
  }
  
  // Main fallback method
  async getFallbackImage(url: string, retailer?: string, title?: string): Promise<FallbackResponse> {
    console.log('Getting fallback image for:', { url, retailer, title });
    
    // Method 1: Try URL-based generation
    const urlImage = this.generateFromUrl(url, retailer);
    if (urlImage) {
      return {
        image_url: urlImage,
        method: 'url_pattern',
        success: true
      };
    }
    
    // Method 2: Try title-based generation
    if (title) {
      const titleImage = await this.generateFromTitle(title, retailer || 'unknown');
      if (titleImage) {
        return {
          image_url: titleImage,
          method: 'title_based',
          success: true
        };
      }
    }
    
    // Method 3: Generic placeholder
    const placeholder = this.generatePlaceholder(retailer || 'unknown', title);
    return {
      image_url: placeholder,
      method: 'placeholder',
      success: true
    };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, retailer, title }: FallbackRequest = await req.json();
    
    if (!url) {
      throw new Error('URL is required');
    }

    console.log(`Fallback image request for: ${url}`);

    const fallbackService = new ImageFallbackService();
    const result = await fallbackService.getFallbackImage(url, retailer, title);
    
    console.log(`Fallback image generated: ${result.image_url} using method: ${result.method}`);

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
    console.error('Error in image-fallback function:', error);
    
    return new Response(
      JSON.stringify({ 
        image_url: 'https://via.placeholder.com/400x400/6B7280/FFFFFF?text=ERROR',
        method: 'error',
        success: false,
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
