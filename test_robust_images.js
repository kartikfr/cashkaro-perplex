// Comprehensive test script for robust image extraction
// Run this in browser console

const testRobustImageExtraction = async () => {
  const SUPABASE_URL = "https://wavjjlopdgiiousxdutk.supabase.co";
  const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdmpqbG9wZGdpaW91c3hkdXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDIxNzQsImV4cCI6MjA3NDcxODE3NH0.uRv-a2vQVJia0B2C3UV8Lqzsus6iub7aae-3wn2p4pc";
  
  const headers = {
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json'
  };

  console.log("🧪 ROBUST IMAGE EXTRACTION TEST");
  console.log("=" * 60);

  // Test 1: Direct scraping service
  console.log("\n1. Testing direct scraping service...");
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-product-images`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url: "https://www.amazon.in/Samsung-Awesome-Iceblue-Storage-Nightography/dp/B0CWPCFSM3",
        retailer: "amazon"
      })
    });

    const result = await response.json();
    console.log("✅ Direct scraping result:", result);
    
    if (result.images && result.images.length > 0) {
      console.log(`🖼️ Found ${result.images.length} images using ${result.method}:`);
      result.images.forEach((img, index) => {
        console.log(`   ${index + 1}. ${img}`);
        
        // Test if image loads
        const testImg = new Image();
        testImg.onload = () => console.log(`   ✅ Image ${index + 1} loads successfully!`);
        testImg.onerror = () => console.log(`   ❌ Image ${index + 1} failed to load`);
        testImg.src = img;
      });
    }
  } catch (error) {
    console.error("❌ Direct scraping test failed:", error);
  }

  // Test 2: Full search integration
  console.log("\n2. Testing full search integration...");
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/search-products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: "Samsung Galaxy S24 Ultra",
        retailer: "amazon",
        limit: 2
      })
    });

    const result = await response.json();
    console.log("✅ Search integration result:", result);
    
    if (result.results && result.results.length > 0) {
      console.log(`\n📊 Found ${result.results.length} products with images:`);
      
      result.results.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.title}`);
        console.log(`   URL: ${product.url}`);
        console.log(`   Image: ${product.image}`);
        console.log(`   Images: ${product.images ? product.images.length : 0} total`);
        console.log(`   Quality: ${product.image_quality}`);
        console.log(`   Method: ${product.image_method}`);
        console.log(`   Price: ${product.price || 'N/A'}`);
        
        if (product.image) {
          const testImg = new Image();
          testImg.onload = () => console.log(`   ✅ Product ${index + 1} image loads!`);
          testImg.onerror = () => console.log(`   ❌ Product ${index + 1} image failed`);
          testImg.src = product.image;
        }
        
        // Test additional images
        if (product.images && product.images.length > 1) {
          product.images.slice(1).forEach((img, imgIndex) => {
            const testImg = new Image();
            testImg.onload = () => console.log(`   ✅ Additional image ${imgIndex + 2} loads!`);
            testImg.onerror = () => console.log(`   ❌ Additional image ${imgIndex + 2} failed`);
            testImg.src = img;
          });
        }
      });
    }
  } catch (error) {
    console.error("❌ Search integration test failed:", error);
  }

  // Test 3: Multiple retailers
  console.log("\n3. Testing multiple retailers...");
  const retailers = ['amazon', 'flipkart', 'myntra'];
  const queries = ['smartphone', 'laptop', 'shoes'];
  
  for (let i = 0; i < retailers.length; i++) {
    const retailer = retailers[i];
    const query = queries[i];
    
    try {
      console.log(`\n   Testing ${retailer} with query: ${query}`);
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/search-products`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query,
          retailer,
          limit: 1
        })
      });

      const result = await response.json();
      
      if (result.results && result.results.length > 0) {
        const product = result.results[0];
        console.log(`   ✅ ${retailer}: Found "${product.title}"`);
        console.log(`   📸 Image: ${product.image ? 'Yes' : 'No'}`);
        console.log(`   🔧 Method: ${product.image_method}`);
        console.log(`   ⭐ Quality: ${product.image_quality}`);
        
        if (product.image) {
          const testImg = new Image();
          testImg.onload = () => console.log(`   ✅ ${retailer} image loads!`);
          testImg.onerror = () => console.log(`   ❌ ${retailer} image failed`);
          testImg.src = product.image;
        }
      } else {
        console.log(`   ⚠️ ${retailer}: No results found`);
      }
    } catch (error) {
      console.error(`   ❌ ${retailer} test failed:`, error);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Test 4: Performance metrics
  console.log("\n4. Testing performance...");
  const startTime = performance.now();
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/search-products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        query: "iPhone 15",
        retailer: "all",
        limit: 3
      })
    });

    const result = await response.json();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`⚡ Performance Results:`);
    console.log(`   Total time: ${duration.toFixed(2)}ms`);
    console.log(`   Products: ${result.results ? result.results.length : 0}`);
    console.log(`   Avg per product: ${result.results ? (duration / result.results.length).toFixed(2) : 'N/A'}ms`);
    
    if (result.results) {
      const withImages = result.results.filter(p => p.image).length;
      const successRate = (withImages / result.results.length * 100).toFixed(1);
      console.log(`   Image success rate: ${successRate}%`);
      
      // Count by method
      const methodCount = result.results.reduce((acc, product) => {
        const method = product.image_method || 'unknown';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`   Methods used:`, methodCount);
    }
  } catch (error) {
    console.error("❌ Performance test failed:", error);
  }

  // Test 5: Error handling
  console.log("\n5. Testing error handling...");
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-product-images`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url: "https://invalid-url-that-does-not-exist.com/product/123",
        retailer: "unknown"
      })
    });

    const result = await response.json();
    console.log("✅ Error handling result:", result);
    
    if (!result.success && result.error) {
      console.log("✅ Error handling works correctly");
    }
  } catch (error) {
    console.log("✅ Error handling caught exception:", error.message);
  }

  console.log("\n" + "=" * 60);
  console.log("🎉 ROBUST IMAGE EXTRACTION TEST COMPLETED!");
  console.log("💡 Check the results above to verify image extraction is working.");
  console.log("🔍 Open Network tab to see actual image requests.");
};

// Helper function to validate images in the UI
const validateImagesInUI = () => {
  console.log("🔍 Validating images in current UI...");
  
  const images = document.querySelectorAll('img');
  let validImages = 0;
  let totalImages = 0;
  
  images.forEach((img, index) => {
    totalImages++;
    
    if (img.complete && img.naturalHeight !== 0) {
      validImages++;
      console.log(`✅ Image ${index + 1}: ${img.src.substring(0, 50)}...`);
    } else {
      console.log(`❌ Image ${index + 1}: ${img.src.substring(0, 50)}...`);
    }
  });
  
  console.log(`📊 UI Image Summary: ${validImages}/${totalImages} images loaded successfully`);
  return { validImages, totalImages };
};

// Run the comprehensive test
console.log("🚀 Starting robust image extraction test...");
testRobustImageExtraction();

// Also validate current UI images
setTimeout(() => {
  validateImagesInUI();
}, 5000);
