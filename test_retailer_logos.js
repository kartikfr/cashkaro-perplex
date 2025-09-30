// Test script for retailer logo fallbacks
// Run this in browser console

const testRetailerLogoFallbacks = async () => {
  const SUPABASE_URL = "https://wavjjlopdgiiousxdutk.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdmpqbG9wZGdpaW91c3hkdXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDIxNzQsImV4cCI6MjA3NDcxODE3NH0.uRv-a2vQVJia0B2C3UV8Lqzsus6iub7aae-3wn2p4pc";
  
  const headers = {
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  console.log("🧪 TESTING RETAILER LOGO FALLBACKS");
  console.log("=" * 60);

  // Test each retailer
  const retailers = [
    { name: 'amazon', query: 'smartphone', expectedLogo: '/Amazon Logo.webp' },
    { name: 'flipkart', query: 'laptop', expectedLogo: '/flipkart-logo-icon-hd-png-701751694706828v1habfry9b.png' },
    { name: 'myntra', query: 'shoes', expectedLogo: '/myntra-logo-myntra-icon-transparent-background-free-png.webp' },
    { name: 'ajio', query: 'shirt', expectedLogo: '/ajio-logo-app-icon-hd.webp' }
  ];

  for (const retailer of retailers) {
    console.log(`\n🏪 Testing ${retailer.name.toUpperCase()}:`);
    console.log("-" * 40);
    
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/search-products`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query: retailer.query,
          retailer: retailer.name,
          limit: 2
        })
      });

      const result = await response.json();
      
      if (result.results && result.results.length > 0) {
        console.log(`✅ Found ${result.results.length} products`);
        
        result.results.forEach((product, index) => {
          console.log(`\n   Product ${index + 1}: ${product.title}`);
          console.log(`   Image: ${product.image || 'No image'}`);
          console.log(`   Quality: ${product.image_quality}`);
          console.log(`   Method: ${product.image_method}`);
          
          // Check if it's using placeholder (retailer logo)
          if (product.image_method === 'placeholder') {
            console.log(`   🎯 Using retailer logo: ${product.image}`);
            if (product.image === retailer.expectedLogo) {
              console.log(`   ✅ Correct logo used!`);
            } else {
              console.log(`   ⚠️  Expected: ${retailer.expectedLogo}`);
              console.log(`   ⚠️  Got: ${product.image}`);
            }
          }
          
          // Test image loading
          if (product.image) {
            const img = new Image();
            img.onload = () => console.log(`   ✅ Image loads successfully!`);
            img.onerror = () => {
              console.log(`   ❌ Image failed to load - this should trigger popup`);
              console.log(`   🔔 Error popup should show: "Sorry right now we are facing issue to load the product image"`);
            };
            img.src = product.image;
          }
        });
      } else {
        console.log(`⚠️  No results found for ${retailer.name}`);
      }
    } catch (error) {
      console.error(`❌ ${retailer.name} test failed:`, error);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Test logo accessibility
  console.log("\n🖼️  TESTING LOGO ACCESSIBILITY:");
  console.log("-" * 40);
  
  const logoUrls = [
    '/Amazon Logo.webp',
    '/flipkart-logo-icon-hd-png-701751694706828v1habfry9b.png',
    '/myntra-logo-myntra-icon-transparent-background-free-png.webp',
    '/ajio-logo-app-icon-hd.webp'
  ];
  
  logoUrls.forEach((logoUrl, index) => {
    const img = new Image();
    img.onload = () => {
      console.log(`✅ Logo ${index + 1} loads: ${logoUrl}`);
      console.log(`   Dimensions: ${img.naturalWidth}x${img.naturalHeight}`);
    };
    img.onerror = () => {
      console.log(`❌ Logo ${index + 1} failed: ${logoUrl}`);
    };
    img.src = logoUrl;
  });

  // Test error popup functionality
  console.log("\n🚨 TESTING ERROR POPUP:");
  console.log("-" * 40);
  console.log("To test the error popup:");
  console.log("1. Search for products in the UI");
  console.log("2. If any image fails to load, you should see:");
  console.log("   - A popup with the message: 'Sorry right now we are facing issue to load the product image'");
  console.log("   - Product title and retailer name in the popup");
  console.log("   - A 'Got it' button to close the popup");
  console.log("3. The popup should appear only once per image failure");

  console.log("\n" + "=" * 60);
  console.log("🎉 RETAILER LOGO FALLBACK TEST COMPLETED!");
  console.log("💡 Check the results above and test the UI for error popups.");
};

// Helper function to simulate image error for testing popup
const simulateImageError = () => {
  console.log("🧪 Simulating image error to test popup...");
  
  // Find any image in the current page and force an error
  const images = document.querySelectorAll('img');
  if (images.length > 0) {
    const testImg = images[0];
    console.log("Forcing error on image:", testImg.src);
    testImg.src = 'https://invalid-url-that-does-not-exist.com/image.jpg';
    console.log("🔔 This should trigger the error popup!");
  } else {
    console.log("No images found on page to test with");
  }
};

// Run the test
console.log("🚀 Starting retailer logo fallback test...");
testRetailerLogoFallbacks();

// Also provide helper for testing popup
console.log("\n💡 To test error popup manually, run: simulateImageError()");
window.simulateImageError = simulateImageError;
