import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImageExtractionRequest {
  url: string;
  retailer?: string;
}

interface ImageExtractionResponse {
  images: string[];
  product_id?: string;
  retailer: string;
  success: boolean;
  error?: string;
}

// Python image extraction service
class PythonImageExtractor {
  private pythonServiceUrl: string;

  constructor() {
    // This would be your Python service URL (could be a separate service or local)
    this.pythonServiceUrl = Deno.env.get('PYTHON_IMAGE_SERVICE_URL') || 'http://localhost:8000';
  }

  async extractImages(url: string, retailer?: string): Promise<ImageExtractionResponse> {
    try {
      console.log(`Extracting images from: ${url} for retailer: ${retailer}`);
      
      const response = await fetch(`${this.pythonServiceUrl}/extract-images`, {
        method: 'POST',
        headers: {
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
        images: result.image_urls || [],
        product_id: result.product_id,
        retailer: result.retailer || retailer || 'unknown',
        success: true
      };
    } catch (error) {
      console.error('Python image extraction failed:', error);
      return {
        images: [],
        retailer: retailer || 'unknown',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Fallback image extraction using existing logic
class FallbackImageExtractor {
  generateImageFromUrl(url: string): string | undefined {
    try {
      console.log('Generating fallback image from URL:', url);
      
      // Amazon image patterns
      if (url.includes('amazon')) {
        const asinMatch = url.match(/\/dp\/([A-Z0-9]{10})/);
        if (asinMatch) {
          return `https://images-na.ssl-images-amazon.com/images/P/${asinMatch[1]}.01.L.jpg`;
        }
      }
      
      // Flipkart image patterns
      if (url.includes('flipkart')) {
        const pidMatch = url.match(/pid=([^&]+)/);
        if (pidMatch) {
          return `https://rukminim1.flixcart.com/image/416/416/product/${pidMatch[1]}.jpeg`;
        }
      }
      
      // Myntra image patterns
      if (url.includes('myntra')) {
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
      
      // AJIO image patterns
      if (url.includes('ajio')) {
        const productIdMatch = url.match(/\/p\/([^\/]+)/);
        if (productIdMatch) {
          return `https://assets.ajio.com/images/${productIdMatch[1]}/1.jpg`;
        }
      }
      
      // Nykaa image patterns
      if (url.includes('nykaa')) {
        const productIdMatch = url.match(/\/p\/([^\/]+)/);
        if (productIdMatch) {
          return `https://images-static.nykaa.com/images/${productIdMatch[1]}/1.jpg`;
        }
      }
      
      // TataCliq image patterns
      if (url.includes('tatacliq')) {
        const productIdMatch = url.match(/\/p\/([^\/]+)/);
        if (productIdMatch) {
          return `https://img.tatacliq.com/images/${productIdMatch[1]}/1.jpg`;
        }
      }
      
      return undefined;
    } catch (error) {
      console.error('Error generating fallback image:', error);
      return undefined;
    }
  }

  generatePlaceholder(retailer: string): string {
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
}

// Main image extraction service
class ImageExtractionService {
  private pythonExtractor: PythonImageExtractor;
  private fallbackExtractor: FallbackImageExtractor;

  constructor() {
    this.pythonExtractor = new PythonImageExtractor();
    this.fallbackExtractor = new FallbackImageExtractor();
  }

  async extractImages(url: string, retailer?: string): Promise<ImageExtractionResponse> {
    console.log(`Starting image extraction for: ${url}`);
    
    // Try Python service first
    try {
      const pythonResult = await this.pythonExtractor.extractImages(url, retailer);
      if (pythonResult.success && pythonResult.images.length > 0) {
        console.log(`Python extraction successful: ${pythonResult.images.length} images`);
        return pythonResult;
      }
    } catch (error) {
      console.warn('Python extraction failed, trying fallback:', error);
    }

    // Fallback to URL-based generation
    console.log('Using fallback image extraction');
    const fallbackImage = this.fallbackExtractor.generateImageFromUrl(url);
    
    if (fallbackImage) {
      return {
        images: [fallbackImage],
        retailer: retailer || 'unknown',
        success: true
      };
    }

    // Last resort: placeholder
    const placeholder = this.fallbackExtractor.generatePlaceholder(retailer || 'unknown');
    return {
      images: [placeholder],
      retailer: retailer || 'unknown',
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
    const { url, retailer }: ImageExtractionRequest = await req.json();
    
    if (!url) {
      throw new Error('URL is required');
    }

    console.log(`Image extraction request for: ${url}`);

    const imageService = new ImageExtractionService();
    const result = await imageService.extractImages(url, retailer);
    
    console.log(`Image extraction completed: ${result.images.length} images found`);

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
    console.error('Error in extract-product-images function:', error);
    
    return new Response(
      JSON.stringify({ 
        images: [],
        retailer: 'unknown',
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
