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

    // Check for specific authentication indicators - more precise detection
    const loggedInIndicators = [
      /class[^>]*user-menu/i,
      /class[^>]*user-profile/i,
      /href[^>]*logout/i,
      /href[^>]*\/logout/i,
      /href[^>]*profile/i,
      /data-user/i,
      /Welcome[^<]*[A-Za-z]+/i  // Welcome with actual name
    ];
    
    const loggedOutIndicators = [
      /href[^>]*login/i,
      /href[^>]*signin/i,
      /href[^>]*register/i,
      /href[^>]*signup/i,
      /class[^>]*login-button/i,
      /Sign.*In/i,
      /Log.*In/i
    ];

    let loggedInScore = 0;
    let loggedOutScore = 0;

    // Check for logged in indicators
    loggedInIndicators.forEach(pattern => {
      if (pattern.test(html)) {
        loggedInScore++;
      }
    });

    // Check for logged out indicators  
    loggedOutIndicators.forEach(pattern => {
      if (pattern.test(html)) {
        loggedOutScore++;
      }
    });

    // More stringent check - require clear logged in indicators and no logged out indicators
    const isSignedIn = loggedInScore >= 2 && loggedOutScore === 0;

    // Extract user info only if clearly signed in
    let userInfo = null;
    if (isSignedIn) {
      // Look for more specific user information patterns
      const emailMatch = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const nameMatch = html.match(/Welcome\s+([^<,\s]+)/i) || 
                       html.match(/Hi\s+([^<,\s]+)/i) ||
                       html.match(/Hello\s+([^<,\s]+)/i);
      
      // Only set user info if we find actual user data, not promotional content
      if (emailMatch || (nameMatch && nameMatch[1].length < 50 && !nameMatch[1].includes('Rs.'))) {
        userInfo = {
          email: emailMatch ? emailMatch[0] : null,
          name: nameMatch ? nameMatch[1].trim() : null,
        };
      }
    }

    const result = {
      isSignedIn,
      userInfo,
      timestamp: new Date().toISOString(),
      debugInfo: {
        loggedInScore,
        loggedOutScore,
        hasLoginButton: /href[^>]*login/i.test(html),
        hasLogoutButton: /href[^>]*logout/i.test(html)
      }
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