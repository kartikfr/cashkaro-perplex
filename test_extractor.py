#!/usr/bin/env python3
"""
Test script for Product Image Extractor
======================================

This script tests the image extractor with real product URLs
"""

import sys
import logging
from product_image_extractor import ProductImageExtractor

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_single_url():
    """Test extraction from a single URL"""
    print("=" * 60)
    print("TESTING SINGLE URL EXTRACTION")
    print("=" * 60)
    
    # Test URLs (replace with real product URLs)
    test_urls = [
        "https://amazon.in/dp/B08X123456",  # Replace with real Amazon URL
        "https://flipkart.com/product/xyz",  # Replace with real Flipkart URL
        "https://myntra.com/item/abc",      # Replace with real Myntra URL
    ]
    
    extractor = ProductImageExtractor()
    
    for url in test_urls:
        print(f"\nTesting URL: {url}")
        print("-" * 40)
        
        try:
            # Extract images
            images = extractor.extract_images(url)
            print(f"Images found: {len(images)}")
            
            for i, img_url in enumerate(images, 1):
                print(f"  {i}. {img_url}")
            
            # Get product info
            product_info = extractor.get_product_info(url)
            print(f"Product: {product_info.title}")
            print(f"Retailer: {product_info.retailer}")
            print(f"Price: {product_info.price or 'N/A'}")
            
        except Exception as e:
            print(f"Error: {e}")
        
        print()

def test_multiple_urls():
    """Test extraction from multiple URLs"""
    print("=" * 60)
    print("TESTING MULTIPLE URL EXTRACTION")
    print("=" * 60)
    
    # Test URLs (replace with real product URLs)
    test_urls = [
        "https://amazon.in/dp/B08X123456",
        "https://flipkart.com/product/xyz",
        "https://myntra.com/item/abc",
    ]
    
    extractor = ProductImageExtractor()
    
    try:
        results = extractor.extract_multiple_products(test_urls)
        
        print(f"Processed {len(results)} products:")
        print("-" * 40)
        
        for i, product_info in enumerate(results, 1):
            print(f"{i}. {product_info.title}")
            print(f"   Retailer: {product_info.retailer}")
            print(f"   Images: {len(product_info.image_urls)}")
            print(f"   Price: {product_info.price or 'N/A'}")
            print()
            
    except Exception as e:
        print(f"Error: {e}")

def test_retailer_detection():
    """Test retailer detection"""
    print("=" * 60)
    print("TESTING RETAILER DETECTION")
    print("=" * 60)
    
    test_urls = [
        "https://amazon.in/dp/B08X123456",
        "https://flipkart.com/product/xyz",
        "https://myntra.com/item/abc",
        "https://ajio.com/p/abc",
        "https://nykaa.com/p/abc",
        "https://tatacliq.com/p/abc",
        "https://unknown-site.com/product/abc",
    ]
    
    extractor = ProductImageExtractor()
    
    for url in test_urls:
        retailer = extractor.detect_retailer(url)
        print(f"{url} -> {retailer}")

def main():
    """Main test function"""
    print("Product Image Extractor - Test Suite")
    print("=" * 60)
    
    # Test retailer detection
    test_retailer_detection()
    
    # Test single URL extraction
    test_single_url()
    
    # Test multiple URL extraction
    test_multiple_urls()
    
    print("=" * 60)
    print("TEST COMPLETED")
    print("=" * 60)

if __name__ == "__main__":
    main()

