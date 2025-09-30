// Test script to verify Samsung Galaxy S24 Ultra image extraction
// Run this in browser console or Node.js

const testImageExtraction = async () => {
  const SUPABASE_URL = "https://wavjjlopdgiiousxdutk.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdmpqbG9wZGdpaW91c3hkdXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDIxNzQsImV4cCI6MjA3NDcxODE3NH0.uRv-a2vQVJia0B2C3UV8Lqzsus6iub7aae-3wn2p4pc";
  
  const headers = {
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  console.log("🧪 Testing Samsung Galaxy S24 Ultra Image Extraction");
  console.log("=" * 60);

  // Test 1: Direct image extraction
  console.log("\n1. Testing direct image extraction...");
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/extract-product-images`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url: "https://www.amazon.in/Samsung-Awesome-Iceblue-Storage-Nightography/dp/B0CWPCFSM3",
        retailer: "amazon"
      })
    });

    const result = await response.json();
    console.log("✅ Direct extraction result:", result);
    
    if (result.images && result.images.length > 0) {
      console.log("🖼️ Generated image URL:", result.images[0]);
      
      // Test if image is accessible
      const img = new Image();
      img.onload = () => console.log("✅ Image loads successfully!");
      img.onerror = () => console.log("❌ Image failed to load");
      img.src = result.images[0];
    }
  } catch (error) {
    console.error("❌ Direct extraction failed:", error);
  }

  // Test 2: Search with image
  console.log("\n2. Testing search with image generation...");
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/search-products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: "Samsung Galaxy S24 Ultra",
        retailer: "amazon",
        limit: 1
      })
    });

    const result = await response.json();
    console.log("✅ Search result:", result);
    
    if (result.results && result.results.length > 0) {
      const product = result.results[0];
      console.log("🛍️ Product:", product.title);
      console.log("🔗 URL:", product.url);
      console.log("🖼️ Image:", product.image);
      console.log("📊 Quality:", product.image_quality);
      console.log("🔧 Method:", product.image_method);
      
      if (product.image) {
        // Test if image is accessible
        const img = new Image();
        img.onload = () => console.log("✅ Product image loads successfully!");
        img.onerror = () => console.log("❌ Product image failed to load");
        img.src = product.image;
      }
    }
  } catch (error) {
    console.error("❌ Search test failed:", error);
  }

  // Test 3: Test the specific Samsung URL
  console.log("\n3. Testing specific Samsung URL...");
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/search-products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: "Samsung Galaxy S24 Ultra B0CWPCFSM3",
        retailer: "amazon",
        limit: 1
      })
    });

    const result = await response.json();
    console.log("✅ Specific URL result:", result);
  } catch (error) {
    console.error("❌ Specific URL test failed:", error);
  }

  console.log("\n" + "=" * 60);
  console.log("🎉 Test completed! Check the results above.");
};

// Run the test
testImageExtraction();
