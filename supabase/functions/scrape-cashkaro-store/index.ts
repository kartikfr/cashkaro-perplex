import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StoreParams {
  retailer: string;
  cashKaroId?: string;
  sourceId?: string;
  trackingId?: string;
  campaignId?: string;
  affid?: string;
  link_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { retailer } = await req.json();
    
    if (!retailer) {
      throw new Error('Retailer parameter is required');
    }

    console.log(`Scraping CashKaro store page for: ${retailer}`);

    // Map retailer names to CashKaro store URLs
    const storeUrls: Record<string, string> = {
      'amazon': 'https://cashkaro.com/amazon-coupons',
      'flipkart': 'https://cashkaro.com/flipkart-coupons',
      'myntra': 'https://cashkaro.com/myntra-coupons',
      'ajio': 'https://cashkaro.com/ajio-coupons',
      'nykaa': 'https://cashkaro.com/nykaa-coupons',
      'tatacliq': 'https://cashkaro.com/tatacliq-coupons',
    };

    const storeUrl = storeUrls[retailer.toLowerCase()];
    if (!storeUrl) {
      throw new Error(`Unsupported retailer: ${retailer}`);
    }

    // Fetch the CashKaro store page
    const response = await fetch(storeUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Referer': 'https://cashkaro.com/',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log(`Retrieved ${retailer} store page, extracting parameters`);

    // Extract parameters from the page
    const params: StoreParams = {
      retailer,
    };

    // Look for common CashKaro tracking parameters in links and buttons
    const trackingPatterns = [
      /cashkaro_id[=:]([^&\s"']+)/gi,
      /source_id[=:]([^&\s"']+)/gi,
      /tracking_id[=:]([^&\s"']+)/gi,
      /campaign_id[=:]([^&\s"']+)/gi,
      /affid[=:]([^&\s"']+)/gi,
      /link_id[=:]([^&\s"']+)/gi,
      /ck_id[=:]([^&\s"']+)/gi,
      /ref[=:]([^&\s"']+)/gi,
    ];

    // Extract parameters using regex patterns
    trackingPatterns.forEach(pattern => {
      const matches = html.match(pattern);
      if (matches) {
        matches.forEach(match => {
          const [key, value] = match.split(/[=:]/);
          const cleanKey = key.toLowerCase().replace('_', '');
          const cleanValue = value.replace(/['"&\s]/g, '');
          
          switch (cleanKey) {
            case 'cashkaroid':
            case 'ckid':
              params.cashKaroId = cleanValue;
              break;
            case 'sourceid':
              params.sourceId = cleanValue;
              break;
            case 'trackingid':
              params.trackingId = cleanValue;
              break;
            case 'campaignid':
              params.campaignId = cleanValue;
              break;
            case 'affid':
              params.affid = cleanValue;
              break;
            case 'linkid':
              params.link_id = cleanValue;
              break;
          }
        });
      }
    });

    // Look for "Shop Now" or "Visit Store" buttons and extract their href parameters
    const buttonPatterns = [
      /<a[^>]*class[^>]*shop[^>]*href="([^"]*)"[^>]*>/gi,
      /<a[^>]*href="([^"]*)"[^>]*class[^>]*shop[^>]*>/gi,
      /<button[^>]*data-href="([^"]*)"[^>]*>/gi,
    ];

    buttonPatterns.forEach(pattern => {
      const matches = [...html.matchAll(pattern)];
      matches.forEach(match => {
        const url = match[1];
        if (url && url.includes('cashkaro.com')) {
          const urlParams = new URLSearchParams(url.split('?')[1] || '');
          urlParams.forEach((value, key) => {
            const cleanKey = key.toLowerCase();
            switch (cleanKey) {
              case 'cashkaro_id':
              case 'ck_id':
                params.cashKaroId = value;
                break;
              case 'source_id':
                params.sourceId = value;
                break;
              case 'tracking_id':
                params.trackingId = value;
                break;
              case 'campaign_id':
                params.campaignId = value;
                break;
              case 'affid':
                params.affid = value;
                break;
              case 'link_id':
                params.link_id = value;
                break;
            }
          });
        }
      });
    });

    // If no parameters found, use fallback values
    if (!params.cashKaroId && !params.sourceId && !params.trackingId) {
      console.log('No parameters found, using fallback values');
      params.cashKaroId = 'ck_' + retailer.toLowerCase();
      params.sourceId = 'web';
      params.trackingId = Date.now().toString();
    }

    console.log(`Extracted parameters for ${retailer}:`, params);

    return new Response(
      JSON.stringify(params),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error scraping CashKaro store page:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to scrape CashKaro store page',
        details: error instanceof Error ? error.message : 'Unknown error',
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
})