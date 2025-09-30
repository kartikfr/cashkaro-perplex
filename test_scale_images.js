// Test script to verify image extraction at scale
// Run this in browser console or Node.js

const testScaleImageExtraction = async () => {
  const SUPABASE_URL = "https://wavjjlopdgiiousxdutk.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdmpqbG9wZGdpaW91c3hkdXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDIxNzQsImV4cCI6MjA3NDcxODE3NH0.uRv-a2vQVJia0B2C3UV8Lqzsus6iub7aae-3wn2p4pc";
  
  const headers = {
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  console.log("🧪 Testing Image Extraction at Scale");
  console.log("=" * 60);

  // Test 1: Multiple products from different retailers
  console.log("\n1. Testing multiple products from different retailers...");
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/search-products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: "smartphone",
        retailer: "all",
        limit: 5
      })
    });

    const result = await response.json();
    console.log("✅ Search result:", result);
    
    if (result.results && result.results.length > 0) {
      console.log(`\n📊 Found ${result.results.length} products:`);
      
      result.results.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.title}`);
        console.log(`   Retailer: ${product.retailer}`);
        console.log(`   URL: ${product.url}`);
        console.log(`   Image: ${product.image || 'No image'}`);
        console.log(`   Quality: ${product.image_quality || 'Unknown'}`);
        console.log(`   Method: ${product.image_method || 'Unknown'}`);
        
        if (product.image) {
          // Test if image is accessible
          const img = new Image();
          img.onload = () => console.log(`   ✅ Image loads successfully!`);
          img.onerror = () => console.log(`   ❌ Image failed to load`);
          img.src = product.image;
        }
      });
      
      // Count images by quality
      const qualityCount = result.results.reduce((acc, product) => {
        const quality = product.image_quality || 'unknown';
        acc[quality] = (acc[quality] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`\n📈 Image Quality Summary:`);
      Object.entries(qualityCount).forEach(([quality, count]) => {
        console.log(`   ${quality}: ${count} products`);
      });
    }
  } catch (error) {
    console.error("❌ Multiple products test failed:", error);
  }

  // Test 2: Specific retailer (Amazon)
  console.log("\n2. Testing Amazon products...");
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/search-products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: "laptop",
        retailer: "amazon",
        limit: 3
      })
    });

    const result = await response.json();
    console.log("✅ Amazon search result:", result);
    
    if (result.results && result.results.length > 0) {
      console.log(`\n📊 Found ${result.results.length} Amazon products:`);
      
      result.results.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.title}`);
        console.log(`   Image: ${product.image || 'No image'}`);
        console.log(`   Quality: ${product.image_quality || 'Unknown'}`);
        
        if (product.image) {
          const img = new Image();
          img.onload = () => console.log(`   ✅ Amazon image loads!`);
          img.onerror = () => console.log(`   ❌ Amazon image failed`);
          img.src = product.image;
        }
      });
    }
  } catch (error) {
    console.error("❌ Amazon test failed:", error);
  }

  // Test 3: Flipkart products
  console.log("\n3. Testing Flipkart products...");
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/search-products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: "headphones",
        retailer: "flipkart",
        limit: 3
      })
    });

    const result = await response.json();
    console.log("✅ Flipkart search result:", result);
    
    if (result.results && result.results.length > 0) {
      console.log(`\n📊 Found ${result.results.length} Flipkart products:`);
      
      result.results.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.title}`);
        console.log(`   Image: ${product.image || 'No image'}`);
        console.log(`   Quality: ${product.image_quality || 'Unknown'}`);
        
        if (product.image) {
          const img = new Image();
          img.onload = () => console.log(`   ✅ Flipkart image loads!`);
          img.onerror = () => console.log(`   ❌ Flipkart image failed`);
          img.src = product.image;
        }
      });
    }
  } catch (error) {
    console.error("❌ Flipkart test failed:", error);
  }

  // Test 4: Myntra products
  console.log("\n4. Testing Myntra products...");
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/search-products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: "shoes",
        retailer: "myntra",
        limit: 3
      })
    });

    const result = await response.json();
    console.log("✅ Myntra search result:", result);
    
    if (result.results && result.results.length > 0) {
      console.log(`\n📊 Found ${result.results.length} Myntra products:`);
      
      result.results.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.title}`);
        console.log(`   Image: ${product.image || 'No image'}`);
        console.log(`   Quality: ${product.image_quality || 'Unknown'}`);
        
        if (product.image) {
          const img = new Image();
          img.onload = () => console.log(`   ✅ Myntra image loads!`);
          img.onerror = () => console.log(`   ❌ Myntra image failed`);
          img.src = product.image;
        }
      });
    }
  } catch (error) {
    console.error("❌ Myntra test failed:", error);
  }

  console.log("\n" + "=" * 60);
  console.log("🎉 Scale testing completed! Check the results above.");
  console.log("💡 All products should now have images with quality indicators.");
};

// Run the test
testScaleImageExtraction();
