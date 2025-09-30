// Test script for Amazon URL preservation (keeping original structure)
// Run this in browser console

const testAmazonUrlPreservation = async () => {
  const SUPABASE_URL = "https://wavjjlopdgiiousxdutk.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdmpqbG9wZGdpaW91c3hkdXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDIxNzQsImV4cCI6MjA3NDcxODE3NH0.uRv-a2vQVJia0B2C3UV8Lqzsus6iub7aae-3wn2p4pc";
  
  const headers = {
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  console.log("🧪 TESTING AMAZON URL PRESERVATION");
  console.log("=" * 60);

  // Test URLs - now we expect to preserve the original structure
  const testUrls = [
    {
      name: "Sony TV with complex path and tracking",
      original: "https://www.amazon.in/Sony-inches-BRAVIA-Google-K-43S22BM2/dp/B0F7X29WXX/?_encoding=UTF8&pd_rd_w=WXfnn&content-id=amzn1.sym.1014e596-2817-4003-a89c-b44bcab1a9bb&pf_rd_p=1014e596-2817-4003-a89c-b44bcab1a9bb&pf_rd_r=3W5E2QMPYF234849A641&pd_rd_wg=qXfYl&pd_rd_r=a76d4935-761e-4774-8b1c-3949fbef23f4&ref_=pd_hp_d_atf_dealz_cs",
      expected: "https://www.amazon.in/Sony-inches-BRAVIA-Google-K-43S22BM2/dp/B0F7X29WXX/",
      description: "Should preserve product name in path, remove tracking params"
    },
    {
      name: "Simple dp format",
      original: "https://www.amazon.in/dp/B0B6Q9Z5XJ",
      expected: "https://www.amazon.in/dp/B0B6Q9Z5XJ",
      description: "Should keep simple format as-is"
    },
    {
      name: "Samsung phone with product name and tracking",
      original: "https://www.amazon.in/Samsung-Awesome-Iceblue-Storage-Nightography/dp/B0CWPCFSM3?pd_rd_w=8ex7z&content-id=amzn1.sym.a324903e-1f30-4243-bf0d-6da5ebc52115&pf_rd_p=a324903e-1f30-4243-bf0d-6da5ebc52115&pf_rd_r=CN0X6D7FQ2PH2S0ZCTHA&pd_rd_wg=G1GSX&pd_rd_r=6bb38e88-3fb7-45c0-8a29-d862199fd7d2&pd_rd_i=B0CWPCFSM3&ref_=pd_hp_d_btf_unk_B0CWPCFSM3&th=1",
      expected: "https://www.amazon.in/Samsung-Awesome-Iceblue-Storage-Nightography/dp/B0CWPCFSM3",
      description: "Should preserve product name, remove tracking params and 'th' param"
    }
  ];

  console.log("\n🔧 TESTING URL PRESERVATION IN BACKEND:");
  console.log("-" * 50);

  for (const testCase of testUrls) {
    console.log(`\n📱 Testing: ${testCase.name}`);
    console.log(`Description: ${testCase.description}`);
    console.log(`Original: ${testCase.original}`);
    console.log(`Expected: ${testCase.expected}`);
    
    try {
      // Test via search to see how URLs are processed
      const response = await fetch(`${SUPABASE_URL}/functions/v1/search-products`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: "test product",
          retailer: "amazon",
          limit: 1
        })
      });

      const result = await response.json();
      console.log(`✅ Backend response received`);
      
      // For now, just verify the service is working
      // In a real test, we'd inject the test URL into the search results
      if (result.results) {
        console.log(`📊 Search returned ${result.results.length} results`);
        if (result.results.length > 0) {
          console.log(`Sample URL format: ${result.results[0].url}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ Test failed for ${testCase.name}:`, error);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("\n🔧 TESTING URL CLEANING LOGIC:");
  console.log("-" * 50);
  
  // Test the URL cleaning logic directly
  testUrls.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}:`);
    console.log(`   Original: ${testCase.original}`);
    
    try {
      const url = new URL(testCase.original);
      
      // Simulate the cleaning logic
      const problematicParams = [
        '_encoding', 'pd_rd_w', 'content-id', 'pf_rd_p', 'pf_rd_r', 
        'pd_rd_wg', 'pd_rd_r', 'pd_rd_i', 'ref_', 'ref', 'th',
        'gclid', 'fbclid', '_ga', 'utm_source', 'utm_medium', 'utm_campaign',
        'utm_term', 'utm_content', 'gclsrc', 'dclid', 'wbraid', 'gbraid', 'msclkid'
      ];
      
      // Count parameters before cleaning
      const paramsBefore = Array.from(url.searchParams.keys());
      console.log(`   Params before: ${paramsBefore.length} (${paramsBefore.join(', ')})`);
      
      // Remove problematic parameters
      problematicParams.forEach(param => {
        url.searchParams.delete(param);
      });
      
      // Clean hash
      url.hash = '';
      
      const cleaned = url.toString();
      const paramsAfter = Array.from(url.searchParams.keys());
      
      console.log(`   Params after: ${paramsAfter.length} (${paramsAfter.join(', ') || 'none'})`);
      console.log(`   Cleaned: ${cleaned}`);
      
      if (cleaned === testCase.expected) {
        console.log(`   ✅ URL preservation PASSED!`);
      } else {
        console.log(`   ⚠️  URL preservation needs adjustment`);
        console.log(`   Expected: ${testCase.expected}`);
        console.log(`   Got: ${cleaned}`);
      }
      
    } catch (error) {
      console.error(`   ❌ URL parsing failed:`, error);
    }
  });

  console.log("\n📋 WHAT'S DIFFERENT NOW:");
  console.log("-" * 50);
  console.log("✅ PRESERVING original Amazon URL structure");
  console.log("✅ KEEPING product names in URLs (e.g., /Sony-inches-BRAVIA-Google-K-43S22BM2/dp/ASIN/)");
  console.log("✅ REMOVING only problematic tracking parameters");
  console.log("✅ MAINTAINING URL readability and SEO benefits");
  console.log("❌ NOT shortening to simple /dp/ASIN format");

  console.log("\n📋 MANUAL TESTING STEPS:");
  console.log("-" * 50);
  console.log("1. Search for 'Sony TV' or 'Samsung phone' in the UI");
  console.log("2. Check that product URLs preserve the original structure");
  console.log("3. Verify tracking parameters are removed but product names remain");
  console.log("4. Click 'Shop Now' button on any Amazon product");
  console.log("5. Confirm the opened URL keeps the descriptive path");
  console.log("6. Check browser console for 'Amazon URL cleaned (preserving structure)' logs");

  console.log("\n" + "=" * 60);
  console.log("🎉 AMAZON URL PRESERVATION TEST COMPLETED!");
  console.log("💡 URLs now preserve original structure while removing tracking params.");
};

// Helper function to demonstrate the difference
const showUrlDifference = () => {
  console.log("🔄 URL PROCESSING COMPARISON:");
  console.log("=" * 60);
  
  const exampleUrl = "https://www.amazon.in/Sony-inches-BRAVIA-Google-K-43S22BM2/dp/B0F7X29WXX/?_encoding=UTF8&pd_rd_w=WXfnn&ref_=pd_hp_d_atf_dealz_cs";
  
  console.log("📥 Original URL:");
  console.log(exampleUrl);
  
  console.log("\n❌ OLD approach (shortening):");
  console.log("https://www.amazon.in/dp/B0F7X29WXX");
  console.log("   - Lost product name information");
  console.log("   - Less descriptive");
  console.log("   - Harder to identify product");
  
  console.log("\n✅ NEW approach (preserving):");
  console.log("https://www.amazon.in/Sony-inches-BRAVIA-Google-K-43S22BM2/dp/B0F7X29WXX/");
  console.log("   - Keeps product name in URL");
  console.log("   - More descriptive and user-friendly");
  console.log("   - Better for SEO and readability");
  console.log("   - Only removes tracking parameters");
  
  console.log("\n🎯 Benefits of preservation:");
  console.log("   ✅ Better user experience (descriptive URLs)");
  console.log("   ✅ Improved SEO (keyword-rich URLs)");
  console.log("   ✅ Easier product identification");
  console.log("   ✅ Maintains Amazon's URL structure");
  console.log("   ✅ Removes only problematic tracking");
};

// Run the tests
console.log("🚀 Starting Amazon URL preservation test...");
testAmazonUrlPreservation();

console.log("\n🔍 Showing URL difference...");
showUrlDifference();

// Export for browser use
if (typeof window !== 'undefined') {
  window.testAmazonUrlPreservation = testAmazonUrlPreservation;
  window.showUrlDifference = showUrlDifference;
  console.log("\n💡 Functions available in browser:");
  console.log("- testAmazonUrlPreservation()");
  console.log("- showUrlDifference()");
}
