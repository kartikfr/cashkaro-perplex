import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Checking CashKaro authentication status');
    
    // Check if user is signed in to CashKaro by visiting the main page
    const response = await fetch('https://cashkaro.com/', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    console.log('Retrieved CashKaro page, checking authentication status');

    // Check for common authentication indicators
    const isSignedIn = html.includes('logout') || 
                      html.includes('account') || 
                      html.includes('profile') ||
                      html.includes('dashboard') ||
                      !html.includes('login');

    // Extract user info if available
    let userInfo = null;
    if (isSignedIn) {
      // Try to extract user email or name from the page
      const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const nameMatch = html.match(/Welcome\s+([^<]+)/i) || html.match(/Hi\s+([^<]+)/i);
      
      userInfo = {
        email: emailMatch ? emailMatch[0] : null,
        name: nameMatch ? nameMatch[1].trim() : null,
      };
    }

    const result = {
      isSignedIn,
      userInfo,
      timestamp: new Date().toISOString(),
    };

    console.log('CashKaro auth check result:', result);

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
    console.error('Error checking CashKaro authentication:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to check CashKaro authentication',
        details: error instanceof Error ? error.message : 'Unknown error',
        isSignedIn: false,
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