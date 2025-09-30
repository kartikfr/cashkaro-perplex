#!/usr/bin/env python3
"""
Integration Test Script
======================

This script tests the integration between Python image extractor
and Supabase Edge Functions.
"""

import requests
import json
import time
import logging
from typing import Dict, List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class IntegrationTester:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.headers = {
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': 'application/json'
        }
    
    def test_search_products(self, query: str, retailer: str = 'all') -> Dict:
        """Test the search-products Edge Function"""
        try:
            logger.info(f"Testing search-products with query: {query}, retailer: {retailer}")
            
            response = requests.post(
                f"{self.supabase_url}/functions/v1/search-products",
                headers=self.headers,
                json={
                    'query': query,
                    'retailer': retailer,
                    'limit': 3
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Search successful: {len(data.get('results', []))} results")
                return data
            else:
                logger.error(f"Search failed: {response.status_code} - {response.text}")
                return {'error': f'HTTP {response.status_code}', 'results': []}
                
        except Exception as e:
            logger.error(f"Search test failed: {e}")
            return {'error': str(e), 'results': []}
    
    def test_image_extraction(self, url: str, retailer: str = None) -> Dict:
        """Test the extract-product-images Edge Function"""
        try:
            logger.info(f"Testing image extraction for: {url}")
            
            response = requests.post(
                f"{self.supabase_url}/functions/v1/extract-product-images",
                headers=self.headers,
                json={
                    'url': url,
                    'retailer': retailer
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Image extraction successful: {len(data.get('images', []))} images")
                return data
            else:
                logger.error(f"Image extraction failed: {response.status_code} - {response.text}")
                return {'error': f'HTTP {response.status_code}', 'images': []}
                
        except Exception as e:
            logger.error(f"Image extraction test failed: {e}")
            return {'error': str(e), 'images': []}
    
    def test_image_fallback(self, url: str, retailer: str = None, title: str = None) -> Dict:
        """Test the image-fallback Edge Function"""
        try:
            logger.info(f"Testing image fallback for: {url}")
            
            response = requests.post(
                f"{self.supabase_url}/functions/v1/image-fallback",
                headers=self.headers,
                json={
                    'url': url,
                    'retailer': retailer,
                    'title': title
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                logger.info(f"Image fallback successful: {data.get('image_url')}")
                return data
            else:
                logger.error(f"Image fallback failed: {response.status_code} - {response.text}")
                return {'error': f'HTTP {response.status_code}'}
                
        except Exception as e:
            logger.error(f"Image fallback test failed: {e}")
            return {'error': str(e)}
    
    def run_comprehensive_test(self):
        """Run comprehensive integration tests"""
        print("=" * 60)
        print("COMPREHENSIVE INTEGRATION TEST")
        print("=" * 60)
        
        # Test URLs (replace with real product URLs)
        test_cases = [
            {
                'query': 'iPhone 15',
                'retailer': 'all',
                'expected_retailers': ['amazon', 'flipkart']
            },
            {
                'query': 'Nike shoes',
                'retailer': 'myntra',
                'expected_retailers': ['myntra']
            },
            {
                'query': 'Laptop bag',
                'retailer': 'amazon',
                'expected_retailers': ['amazon']
            }
        ]
        
        for i, test_case in enumerate(test_cases, 1):
            print(f"\nTest Case {i}: {test_case['query']} on {test_case['retailer']}")
            print("-" * 40)
            
            # Test search
            search_result = self.test_search_products(
                test_case['query'], 
                test_case['retailer']
            )
            
            if 'results' in search_result and search_result['results']:
                print(f"✅ Search successful: {len(search_result['results'])} products found")
                
                # Test image extraction for each result
                for j, product in enumerate(search_result['results'][:2], 1):
                    print(f"\n  Product {j}: {product.get('title', 'Unknown')}")
                    print(f"  URL: {product.get('url', 'N/A')}")
                    print(f"  Retailer: {product.get('retailer', 'unknown')}")
                    print(f"  Image: {product.get('image', 'N/A')}")
                    
                    # Test individual image extraction
                    if product.get('url'):
                        image_result = self.test_image_extraction(
                            product['url'], 
                            product.get('retailer')
                        )
                        
                        if 'images' in image_result and image_result['images']:
                            print(f"  ✅ Image extraction: {len(image_result['images'])} images")
                        else:
                            print(f"  ⚠️  Image extraction failed, testing fallback")
                            
                            # Test fallback
                            fallback_result = self.test_image_fallback(
                                product['url'],
                                product.get('retailer'),
                                product.get('title')
                            )
                            
                            if fallback_result.get('success'):
                                print(f"  ✅ Fallback successful: {fallback_result.get('image_url')}")
                            else:
                                print(f"  ❌ Fallback failed: {fallback_result.get('error')}")
                    
                    time.sleep(1)  # Rate limiting
            else:
                print(f"❌ Search failed: {search_result.get('error', 'Unknown error')}")
            
            time.sleep(2)  # Rate limiting between test cases
        
        print("\n" + "=" * 60)
        print("INTEGRATION TEST COMPLETED")
        print("=" * 60)

def main():
    """Main test function"""
    # Configuration - Update these with your actual Supabase details
    SUPABASE_URL = "https://wavjjlopdgiiousxdutk.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdmpqbG9wZGdpaW91c3hkdXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDIxNzQsImV4cCI6MjA3NDcxODE3NH0.uRv-a2vQVJia0B2C3UV8Lqzsus6iub7aae-3wn2p4pc"
    
    # Initialize tester
    tester = IntegrationTester(SUPABASE_URL, SUPABASE_KEY)
    
    # Run comprehensive test
    tester.run_comprehensive_test()
    
    # Test individual functions
    print("\n" + "=" * 60)
    print("INDIVIDUAL FUNCTION TESTS")
    print("=" * 60)
    
    # Test search
    print("\n1. Testing search-products function:")
    search_result = tester.test_search_products("blanket", "all")
    print(f"   Results: {len(search_result.get('results', []))}")
    
    # Test image extraction
    print("\n2. Testing extract-product-images function:")
    image_result = tester.test_image_extraction("https://amazon.in/dp/B08X123456")
    print(f"   Images: {len(image_result.get('images', []))}")
    
    # Test fallback
    print("\n3. Testing image-fallback function:")
    fallback_result = tester.test_image_fallback(
        "https://amazon.in/dp/B08X123456", 
        "amazon", 
        "Test Product"
    )
    print(f"   Success: {fallback_result.get('success')}")
    print(f"   Image URL: {fallback_result.get('image_url')}")

if __name__ == "__main__":
    main()
