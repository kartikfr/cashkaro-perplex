import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';

interface CashKaroParams {
  cashkaro_id?: string;
  source_id?: string;
  tracking_id?: string;
  affid?: string;
  link_id?: string;
}

// URL building validation schema
const urlBuildSchema = z.object({
  productUrl: z.string().url({ message: "Invalid product URL" }),
  retailer: z.enum(['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'tatacliq'])
});

class URLBuilder {
  /**
   * Build the final redirect URL with CashKaro tracking parameters
   */
  public async buildFinalUrl(productUrl: string, retailer: string): Promise<string> {
    // Validate inputs
    const validatedInput = urlBuildSchema.parse({ productUrl, retailer });
    
    try {
      const url = new URL(this.normalizeRetailerUrl(validatedInput.productUrl));
      
      // Get CashKaro parameters for this retailer
      const cashKaroParams = await this.getCashKaroParams(retailer);
      
      // Add CashKaro parameters to URL
      Object.entries(cashKaroParams).forEach(([key, value]) => {
        if (value) {
          url.searchParams.set(key, value);
        }
      });
      
      // Clean unwanted parameters
      this.cleanUrl(url);
      
      return url.toString();
    } catch (error) {
      console.error('URL building error:', error);
      // Return original URL as fallback
      return validatedInput.productUrl;
    }
  }

  /**
   * Get CashKaro tracking parameters for a retailer
   * This fetches real parameters from CashKaro's store pages
   */
  private async getCashKaroParams(retailer: string): Promise<CashKaroParams> {
    try {
      console.log(`Fetching CashKaro parameters for ${retailer}`);
      
      const { data, error } = await supabase.functions.invoke('scrape-cashkaro-store', {
        body: { retailer }
      });

      if (error) {
        console.error('Error fetching CashKaro parameters:', error);
        return this.getFallbackParams(retailer);
      }

      if (data && !data.error) {
        console.log(`Retrieved CashKaro parameters for ${retailer}:`, data);
        return {
          cashkaro_id: data.cashKaroId,
          source_id: data.sourceId,
          tracking_id: data.trackingId,
          affid: data.affid,
          link_id: data.link_id
        };
      }

      return this.getFallbackParams(retailer);
    } catch (error) {
      console.error('Failed to fetch CashKaro parameters:', error);
      return this.getFallbackParams(retailer);
    }
  }

  /**
   * Fallback parameters when scraping fails
   */
  private getFallbackParams(retailer: string): CashKaroParams {
    const normalizedRetailer = retailer.toLowerCase();
    return {
      cashkaro_id: `ck_${normalizedRetailer}_${Date.now()}`,
      source_id: 'web_search',
      tracking_id: `${normalizedRetailer}_${Date.now()}`,
      affid: 'cashkaro_generic',
      link_id: 'product_search'
    };
  }

  /**
   * Clean unwanted tracking parameters while preserving CashKaro and essential ones
   */
  private cleanUrl(url: URL): void {
    const unwantedParams = [
      'gclid', 'fbclid', '_ga', 'ref', 'ref_', 'utm_term', 'utm_content',
      'gclsrc', 'dclid', 'wbraid', 'gbraid', 'msclkid'
    ];
    
    unwantedParams.forEach(param => {
      url.searchParams.delete(param);
    });
  }

  /**
   * Validate that required CashKaro parameters are present
   */
  validateCKParams(url: string, retailer: string): boolean {
    try {
      const urlObj = new URL(url);
      const cashKaroParams = ['cashkaro_id', 'source_id', 'tracking_id'];
      
      return cashKaroParams.some(param => urlObj.searchParams.has(param));
    } catch {
      return false;
    }
  }

  /**
   * Normalize retailer domain (e.g., m.amazon.in -> www.amazon.in)
   */
  normalizeRetailerUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Amazon normalization
      if (urlObj.hostname.includes('amazon')) {
        urlObj.hostname = 'www.amazon.in';
      }
      
      // Flipkart normalization
      if (urlObj.hostname.includes('flipkart')) {
        urlObj.hostname = 'www.flipkart.com';
      }
      
      // Myntra normalization
      if (urlObj.hostname.includes('myntra')) {
        urlObj.hostname = 'www.myntra.com';
      }
      
      // AJIO normalization
      if (urlObj.hostname.includes('ajio')) {
        urlObj.hostname = 'www.ajio.com';
      }

      // Nykaa normalization
      if (urlObj.hostname.includes('nykaa')) {
        urlObj.hostname = 'www.nykaa.com';
      }

      // TataCliq normalization
      if (urlObj.hostname.includes('tatacliq')) {
        urlObj.hostname = 'www.tatacliq.com';
      }
      
      return urlObj.toString();
    } catch {
      return url;
    }
  }
}

export default URLBuilder;