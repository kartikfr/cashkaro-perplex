import { z } from 'zod';

// URL building validation schema
const urlBuildSchema = z.object({
  productUrl: z.string().url({ message: "Invalid product URL" }),
  retailer: z.enum(['amazon', 'flipkart', 'myntra', 'ajio'])
});

interface CashKaroParams {
  [key: string]: string;
}

class URLBuilder {
  private retailerParamMapping = {
    amazon: {
      required: ['tag', 'ascsubtag'],
      optional: ['linkCode', 'creative', 'creativeASIN']
    },
    flipkart: {
      required: ['affid'],
      optional: ['affExtParam1', 'affExtParam2']
    },
    myntra: {
      required: ['utm_source', 'utm_medium'],
      optional: ['utm_campaign']
    },
    ajio: {
      required: ['source', 'affid'],
      optional: ['subid']
    }
  };

  // Simulated CashKaro parameters (in real implementation, these would come from scraping)
  private mockCashKaroParams = {
    amazon: {
      tag: 'cashkacom-21',
      ascsubtag: 'CKXYZ123',
      linkCode: 'as2',
      creative: '374005'
    },
    flipkart: {
      affid: 'cashkaro',
      affExtParam1: 'ck001',
      affExtParam2: 'ck_search'
    },
    myntra: {
      utm_source: 'cashkaro',
      utm_medium: 'affiliate',
      utm_campaign: 'ck2024'
    },
    ajio: {
      source: 'cashkaro',
      affid: 'ck_ajio',
      subid: 'ck123'
    }
  };

  /**
   * Build final URL with CashKaro affiliate parameters
   */
  buildFinalUrl(productUrl: string, retailer: string): string {
    // Validate inputs
    const validatedInput = urlBuildSchema.parse({ productUrl, retailer });
    
    try {
      const url = new URL(validatedInput.productUrl);
      const ckParams = this.getCashKaroParams(validatedInput.retailer);
      
      // Add CashKaro parameters
      Object.entries(ckParams).forEach(([key, value]) => {
        url.searchParams.set(key, value);
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
   * Get CashKaro parameters for retailer (simulated)
   * In real implementation, this would come from scraping CashKaro store pages
   */
  private getCashKaroParams(retailer: string): CashKaroParams {
    const params = this.mockCashKaroParams[retailer as keyof typeof this.mockCashKaroParams];
    
    if (!params) {
      console.warn(`No CashKaro parameters found for retailer: ${retailer}`);
      return {};
    }
    
    return { ...params };
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
      const mapping = this.retailerParamMapping[retailer as keyof typeof this.retailerParamMapping];
      
      if (!mapping) return false;
      
      return mapping.required.every(param => urlObj.searchParams.has(param));
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
      
      return urlObj.toString();
    } catch {
      return url;
    }
  }
}

export default URLBuilder;