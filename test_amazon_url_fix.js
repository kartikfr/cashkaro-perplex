// Test script for Amazon URL cleaning
// Run this in browser console or Node.js

const testAmazonUrlCleaning = async () => {
  const SUPABASE_URL = "https://wavjjlopdgiiousxdutk.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdmpqbG9wZGdpaW91c3hkdXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDIxNzQsImV4cCI6MjA3NDcxODE3NH0.uRv-a2vQVJia0B2C3UV8Lqzsus6iub7aae-3wn2p4pc";
  
  const headers = {
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  console.log("🧪 TESTING AMAZON URL CLEANING");
  console.log("=" * 50);

  // Test URLs from the user's examples
  const testUrls = [
    {
      name: "Sony TV with complex tracking",
      original: "https://www.amazon.in/Sony-inches-BRAVIA-Google-K-43S22BM2/dp/B0F7X29WXX/?_encoding=UTF8&pd_rd_w=WXfnn&content-id=amzn1.sym.1014e596-2817-4003-a89c-b44bcab1a9bb&pf_rd_p=1014e596-2817-4003-a89c-b44bcab1a9bb&pf_rd_r=3W5E2QMPYF234849A641&pd_rd_wg=qXfYl&pd_rd_r=a76d4935-761e-4774-8b1c-3949fbef23f4&ref_=pd_hp_d_atf_dealz_cs",
      expected: "https://www.amazon.in/dp/B0F7X29WXX"
    },
    {
      name: "Simple dp format",
      original: "https://www.amazon.in/dp/B0B6Q9Z5XJ",
      expected: "https://www.amazon.in/dp/B0B6Q9Z5XJ"
    },
    {
      name: "Samsung phone from earlier test",
      original: "https://www.amazon.in/Samsung-Awesome-Iceblue-Storage-Nightography/dp/B0CWPCFSM3?pd_rd_w=8ex7z&content-id=amzn1.sym.a324903e-1f30-4243-bf0d-6da5ebc52115&pf_rd_p=a324903e-1f30-4243-bf0d-6da5ebc52115&pf_rd_r=CN0X6D7FQ2PH2S0ZCTHA&pd_rd_wg=G1GSX&pd_rd_r=6bb38e88-3fb7-45c0-8a29-d862199fd7d2&pd_rd_i=B0CWPCFSM3&ref_=pd_hp_d_btf_unk_B0CWPCFSM3&th=1",
      expected: "https://www.amazon.in/dp/B0CWPCFSM3"
    }
  ];

  console.log("\n🔧 TESTING URL CLEANING IN BACKEND:");
  console.log("-" * 40);

  for (const testCase of testUrls) {
    console.log(`\n📱 Testing: ${testCase.name}`);
    console.log(`Original: ${testCase.original}`);
    console.log(`Expected: ${testCase.expected}`);
    
    try {
      // Test via search to see how URLs are cleaned
      const response = await fetch(`${SUPABASE_URL}/functions/v1/search-products`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: "test product",
          retailer: "amazon",
          limit: 1,
          test_url: testCase.original // Add test URL for cleaning
        })
      });

      const result = await response.json();
      console.log(`✅ Backend response received`);
      
      // Check if any results have cleaned URLs
      if (result.results && result.results.length > 0) {
        const cleanedUrl = result.results[0].url;
        console.log(`Cleaned: ${cleanedUrl}`);
        
        if (cleanedUrl === testCase.expected) {
          console.log(`✅ URL cleaning PASSED!`);
        } else {
          console.log(`⚠️  URL cleaning needs improvement`);
          console.log(`   Expected: ${testCase.expected}`);
          console.log(`   Got: ${cleanedUrl}`);
        }
      }
    } catch (error) {
      console.error(`❌ Test failed for ${testCase.name}:`, error);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("\n🔧 TESTING FRONTEND URL BUILDER:");
  console.log("-" * 40);
  
  // Test frontend URL cleaning (if running in browser)
  if (typeof window !== 'undefined') {
    console.log("Frontend URL builder test would run here in browser context");
    console.log("Open browser console and run this script to test frontend URL building");
  } else {
    console.log("Frontend URL builder test requires browser environment");
  }

  console.log("\n📋 MANUAL TESTING STEPS:");
  console.log("-" * 40);
  console.log("1. Search for 'Sony TV' or 'Samsung phone' in the UI");
  console.log("2. Check that product URLs in results are clean (no tracking params)");
  console.log("3. Click 'Shop Now' button on any Amazon product");
  console.log("4. Verify the opened URL is in format: https://www.amazon.in/dp/ASIN");
  console.log("5. Check browser console for URL cleaning logs");

  console.log("\n" + "=" * 50);
  console.log("🎉 AMAZON URL CLEANING TEST COMPLETED!");
  console.log("💡 Check the results above and test the UI manually.");
};

// Helper function to test URL patterns
const testUrlPatterns = () => {
  console.log("🧪 Testing ASIN extraction patterns:");
  
  const testUrls = [
    "https://www.amazon.in/Sony-inches-BRAVIA-Google-K-43S22BM2/dp/B0F7X29WXX/?_encoding=UTF8",
    "https://www.amazon.in/dp/B0B6Q9Z5XJ",
    "https://www.amazon.in/gp/product/B0CWPCFSM3",
    "https://www.amazon.in/Samsung-Awesome-Iceblue-Storage-Nightography/dp/B0CWPCFSM3?ref=test"
  ];
  
  testUrls.forEach((url, index) => {
    console.log(`\nURL ${index + 1}: ${url}`);
    
    // Test ASIN extraction patterns
    const asinMatch =
      url.match(/\/dp\/([A-Z0-9]{10})/i) ||
      url.match(/\/gp\/product\/([A-Z0-9]{10})/i) ||
      url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/i) ||
      url.match(/([A-Z0-9]{10})/i);
    
    if (asinMatch) {
      const asin = asinMatch[1].toUpperCase();
      console.log(`✅ ASIN extracted: ${asin}`);
      console.log(`   Clean URL: https://www.amazon.in/dp/${asin}`);
    } else {
      console.log(`❌ No ASIN found`);
    }
  });
};

// Run the tests
console.log("🚀 Starting Amazon URL cleaning test...");
testAmazonUrlCleaning();

console.log("\n🔍 Testing URL patterns...");
testUrlPatterns();

// Export for browser use
if (typeof window !== 'undefined') {
  window.testAmazonUrlCleaning = testAmazonUrlCleaning;
  window.testUrlPatterns = testUrlPatterns;
  console.log("\n💡 Functions available in browser:");
  console.log("- testAmazonUrlCleaning()");
  console.log("- testUrlPatterns()");
}
