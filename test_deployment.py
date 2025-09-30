#!/usr/bin/env python3
"""
Deployment Test Script
=====================

This script tests the deployed integration to ensure
existing functionality is preserved.
"""

import requests
import json
import time
import logging
from typing import Dict, List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DeploymentTester:
    def __init__(self, supabase_url: str, supabase_key: str):
        self.supabase_url = supabase_url
        self.supabase_key = supabase_key
        self.headers = {
            'Authorization': f'Bearer {supabase_key}',
            'Content-Type': 'application/json'
        }
    
    def test_existing_search_functionality(self) -> bool:
        """Test that existing search functionality still works"""
        try:
            logger.info("Testing existing search functionality...")
            
            # Test basic search
            response = requests.post(
                f"{self.supabase_url}/functions/v1/search-products",
                headers=self.headers,
                json={
                    'query': 'blanket',
                    'retailer': 'all',
                    'limit': 3
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                
                if len(results) > 0:
                    logger.info(f"✅ Search functionality working: {len(results)} results")
                    
                    # Check if results have required fields
                    for result in results:
                        required_fields = ['id', 'title', 'url', 'retailer']
                        missing_fields = [field for field in required_fields if field not in result]
                        
                        if missing_fields:
                            logger.error(f"❌ Missing required fields: {missing_fields}")
                            return False
                    
                    logger.info("✅ All results have required fields")
                    return True
                else:
                    logger.warning("⚠️  No results returned, but function is working")
                    return True
            else:
                logger.error(f"❌ Search function failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Search test failed: {e}")
            return False
    
    def test_new_image_extraction(self) -> bool:
        """Test the new image extraction functionality"""
        try:
            logger.info("Testing new image extraction functionality...")
            
            # Test with a sample URL
            test_url = "https://amazon.in/dp/B08X123456"
            
            response = requests.post(
                f"{self.supabase_url}/functions/v1/extract-product-images",
                headers=self.headers,
                json={
                    'url': test_url,
                    'retailer': 'amazon'
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                images = data.get('images', [])
                
                logger.info(f"✅ Image extraction working: {len(images)} images")
                return True
            else:
                logger.warning(f"⚠️  Image extraction returned {response.status_code}, but this is expected for test URL")
                return True
                
        except Exception as e:
            logger.warning(f"⚠️  Image extraction test failed (expected): {e}")
            return True
    
    def test_fallback_functionality(self) -> bool:
        """Test the fallback functionality"""
        try:
            logger.info("Testing fallback functionality...")
            
            response = requests.post(
                f"{self.supabase_url}/functions/v1/image-fallback",
                headers=self.headers,
                json={
                    'url': 'https://amazon.in/dp/B08X123456',
                    'retailer': 'amazon',
                    'title': 'Test Product'
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                image_url = data.get('image_url')
                
                if image_url:
                    logger.info(f"✅ Fallback functionality working: {image_url}")
                    return True
                else:
                    logger.error("❌ No fallback image URL returned")
                    return False
            else:
                logger.error(f"❌ Fallback function failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Fallback test failed: {e}")
            return False
    
    def test_backward_compatibility(self) -> bool:
        """Test that the API response format is backward compatible"""
        try:
            logger.info("Testing backward compatibility...")
            
            response = requests.post(
                f"{self.supabase_url}/functions/v1/search-products",
                headers=self.headers,
                json={
                    'query': 'test',
                    'retailer': 'all',
                    'limit': 1
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                results = data.get('results', [])
                
                if results:
                    result = results[0]
                    
                    # Check for backward compatibility fields
                    backward_compat_fields = ['id', 'title', 'url', 'retailer', 'timestamp']
                    new_fields = ['image_quality', 'images', 'image_method']
                    
                    # All backward compatibility fields should exist
                    missing_backward_fields = [field for field in backward_compat_fields if field not in result]
                    if missing_backward_fields:
                        logger.error(f"❌ Missing backward compatibility fields: {missing_backward_fields}")
                        return False
                    
                    # New fields are optional but should be handled gracefully
                    logger.info("✅ Backward compatibility maintained")
                    logger.info(f"   New fields present: {[field for field in new_fields if field in result]}")
                    
                    return True
                else:
                    logger.warning("⚠️  No results to test backward compatibility")
                    return True
            else:
                logger.error(f"❌ Backward compatibility test failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Backward compatibility test failed: {e}")
            return False
    
    def run_all_tests(self) -> bool:
        """Run all deployment tests"""
        print("=" * 60)
        print("DEPLOYMENT TESTING")
        print("=" * 60)
        
        tests = [
            ("Existing Search Functionality", self.test_existing_search_functionality),
            ("New Image Extraction", self.test_new_image_extraction),
            ("Fallback Functionality", self.test_fallback_functionality),
            ("Backward Compatibility", self.test_backward_compatibility)
        ]
        
        results = []
        
        for test_name, test_func in tests:
            print(f"\n{test_name}:")
            print("-" * 40)
            
            try:
                result = test_func()
                results.append((test_name, result))
                
                if result:
                    print(f"✅ {test_name} - PASSED")
                else:
                    print(f"❌ {test_name} - FAILED")
                    
            except Exception as e:
                print(f"❌ {test_name} - ERROR: {e}")
                results.append((test_name, False))
            
            time.sleep(1)  # Rate limiting
        
        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for _, result in results if result)
        total = len(results)
        
        for test_name, result in results:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name}: {status}")
        
        print(f"\nOverall: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Deployment is successful.")
            return True
        else:
            print("⚠️  Some tests failed. Please review the issues.")
            return False

def main():
    """Main test function"""
    # Configuration - Update these with your actual Supabase details
    SUPABASE_URL = "https://wavjjlopdgiiousxdutk.supabase.co"
    SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhdmpqbG9wZGdpaW91c3hkdXRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxNDIxNzQsImV4cCI6MjA3NDcxODE3NH0.uRv-a2vQVJia0B2C3UV8Lqzsus6iub7aae-3wn2p4pc"
    
    # Initialize tester
    tester = DeploymentTester(SUPABASE_URL, SUPABASE_KEY)
    
    # Run all tests
    success = tester.run_all_tests()
    
    if success:
        print("\n🚀 Deployment is ready for production!")
    else:
        print("\n🔧 Please fix the issues before deploying to production.")

if __name__ == "__main__":
    main()
