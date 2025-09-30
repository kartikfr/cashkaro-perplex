#!/usr/bin/env python3
"""
Product Image Extractor for Indian E-commerce Retailers
=======================================================

This script extracts product images from various Indian e-commerce websites
including Amazon, Flipkart, Myntra, AJIO, Nykaa, and TataCliq.

Author: AI Assistant
Version: 1.0.0
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import time
import logging
from urllib.parse import urljoin, urlparse
from typing import Optional, Dict, List, Tuple
import argparse
import sys
from dataclasses import dataclass
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('image_extractor.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ProductInfo:
    """Data class to store product information"""
    title: str
    url: str
    retailer: str
    image_urls: List[str]
    price: Optional[str] = None
    description: Optional[str] = None

class ImageExtractor:
    """Base class for image extraction"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
        })
    
    def extract_images(self, url: str) -> List[str]:
        """Extract images from product URL"""
        raise NotImplementedError
    
    def get_product_info(self, url: str) -> ProductInfo:
        """Get comprehensive product information"""
        raise NotImplementedError

class AmazonImageExtractor(ImageExtractor):
    """Amazon.in image extractor"""
    
    def extract_images(self, url: str) -> List[str]:
        """Extract images from Amazon product page"""
        try:
            logger.info(f"Extracting images from Amazon URL: {url}")
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            images = []
            
            # Method 1: Extract from image carousel
            img_selectors = [
                '#landingImage',
                '.a-dynamic-image',
                '#imgTagWrapperId img',
                '.a-button-selected img',
                '[data-old-hires]'
            ]
            
            for selector in img_selectors:
                img_elements = soup.select(selector)
                for img in img_elements:
                    src = img.get('src') or img.get('data-src') or img.get('data-old-hires')
                    if src and self._is_valid_image_url(src):
                        # Convert to high resolution
                        high_res_url = self._convert_to_high_res(src)
                        if high_res_url not in images:
                            images.append(high_res_url)
            
            # Method 2: Extract from JSON data
            script_tags = soup.find_all('script', type='application/json')
            for script in script_tags:
                try:
                    data = json.loads(script.string)
                    if 'imageGalleryData' in str(data):
                        # Extract image URLs from JSON
                        json_str = str(data)
                        img_pattern = r'https://[^"]*\.jpg[^"]*'
                        found_images = re.findall(img_pattern, json_str)
                        for img_url in found_images:
                            if self._is_valid_image_url(img_url):
                                high_res_url = self._convert_to_high_res(img_url)
                                if high_res_url not in images:
                                    images.append(high_res_url)
                except (json.JSONDecodeError, TypeError):
                    continue
            
            # Method 3: Extract ASIN and generate image URL
            asin_match = re.search(r'/dp/([A-Z0-9]{10})', url)
            if asin_match:
                asin = asin_match.group(1)
                generated_url = f"https://images-na.ssl-images-amazon.com/images/P/{asin}.01.L.jpg"
                if generated_url not in images:
                    images.append(generated_url)
            
            logger.info(f"Found {len(images)} images for Amazon product")
            return images[:5]  # Return top 5 images
            
        except Exception as e:
            logger.error(f"Error extracting Amazon images: {e}")
            return []
    
    def _convert_to_high_res(self, url: str) -> str:
        """Convert Amazon image URL to high resolution"""
        # Remove size parameters and add high-res suffix
        url = re.sub(r'\._[A-Z0-9_]+\.', '.', url)
        if not url.endswith('.jpg'):
            url += '.jpg'
        return url
    
    def _is_valid_image_url(self, url: str) -> bool:
        """Check if URL is a valid Amazon image"""
        return (url and 
                'amazon' in url.lower() and 
                any(ext in url.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']))
    
    def get_product_info(self, url: str) -> ProductInfo:
        """Get comprehensive Amazon product information"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract title
            title_selectors = [
                '#productTitle',
                '.product-title',
                'h1.a-size-large'
            ]
            title = "Amazon Product"
            for selector in title_selectors:
                title_elem = soup.select_one(selector)
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    break
            
            # Extract price
            price_selectors = [
                '.a-price-whole',
                '.a-price .a-offscreen',
                '#priceblock_dealprice',
                '#priceblock_ourprice'
            ]
            price = None
            for selector in price_selectors:
                price_elem = soup.select_one(selector)
                if price_elem:
                    price = price_elem.get_text(strip=True)
                    break
            
            # Extract description
            desc_selectors = [
                '#feature-bullets ul',
                '.a-unordered-list'
            ]
            description = None
            for selector in desc_selectors:
                desc_elem = soup.select_one(selector)
                if desc_elem:
                    description = desc_elem.get_text(strip=True)[:200]
                    break
            
            images = self.extract_images(url)
            
            return ProductInfo(
                title=title,
                url=url,
                retailer='amazon',
                image_urls=images,
                price=price,
                description=description
            )
            
        except Exception as e:
            logger.error(f"Error getting Amazon product info: {e}")
            return ProductInfo(
                title="Amazon Product",
                url=url,
                retailer='amazon',
                image_urls=[]
            )

class FlipkartImageExtractor(ImageExtractor):
    """Flipkart.com image extractor"""
    
    def extract_images(self, url: str) -> List[str]:
        """Extract images from Flipkart product page"""
        try:
            logger.info(f"Extracting images from Flipkart URL: {url}")
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            images = []
            
            # Method 1: Extract from image gallery
            img_selectors = [
                '._396cs4',
                '._2r_T1I',
                '._1BweB1',
                '.CXW8mj img',
                '[data-testid="product-image"]'
            ]
            
            for selector in img_selectors:
                img_elements = soup.select(selector)
                for img in img_elements:
                    src = img.get('src') or img.get('data-src')
                    if src and self._is_valid_image_url(src):
                        high_res_url = self._convert_to_high_res(src)
                        if high_res_url not in images:
                            images.append(high_res_url)
            
            # Method 2: Extract from JSON data
            script_tags = soup.find_all('script')
            for script in script_tags:
                if script.string and 'imageGallery' in script.string:
                    try:
                        # Extract image URLs from script content
                        img_pattern = r'https://[^"]*\.(?:jpg|jpeg|png|webp)[^"]*'
                        found_images = re.findall(img_pattern, script.string)
                        for img_url in found_images:
                            if self._is_valid_image_url(img_url):
                                high_res_url = self._convert_to_high_res(img_url)
                                if high_res_url not in images:
                                    images.append(high_res_url)
                    except Exception:
                        continue
            
            # Method 3: Generate from PID
            pid_match = re.search(r'pid=([^&]+)', url)
            if pid_match:
                pid = pid_match.group(1)
                generated_url = f"https://rukminim1.flixcart.com/image/416/416/product/{pid}.jpeg"
                if generated_url not in images:
                    images.append(generated_url)
            
            logger.info(f"Found {len(images)} images for Flipkart product")
            return images[:5]
            
        except Exception as e:
            logger.error(f"Error extracting Flipkart images: {e}")
            return []
    
    def _convert_to_high_res(self, url: str) -> str:
        """Convert Flipkart image URL to high resolution"""
        # Replace size parameters with high resolution
        url = re.sub(r'/image/\d+/\d+/', '/image/832/832/', url)
        return url
    
    def _is_valid_image_url(self, url: str) -> bool:
        """Check if URL is a valid Flipkart image"""
        return (url and 
                'flipkart' in url.lower() and 
                any(ext in url.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']))
    
    def get_product_info(self, url: str) -> ProductInfo:
        """Get comprehensive Flipkart product information"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract title
            title_selectors = [
                '.B_NuCI',
                '._35KyD6',
                'h1[class*="title"]'
            ]
            title = "Flipkart Product"
            for selector in title_selectors:
                title_elem = soup.select_one(selector)
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    break
            
            # Extract price
            price_selectors = [
                '._30jeq3',
                '._1vC4OE',
                '._3qQ9m1'
            ]
            price = None
            for selector in price_selectors:
                price_elem = soup.select_one(selector)
                if price_elem:
                    price = price_elem.get_text(strip=True)
                    break
            
            images = self.extract_images(url)
            
            return ProductInfo(
                title=title,
                url=url,
                retailer='flipkart',
                image_urls=images,
                price=price
            )
            
        except Exception as e:
            logger.error(f"Error getting Flipkart product info: {e}")
            return ProductInfo(
                title="Flipkart Product",
                url=url,
                retailer='flipkart',
                image_urls=[]
            )

class MyntraImageExtractor(ImageExtractor):
    """Myntra.com image extractor"""
    
    def extract_images(self, url: str) -> List[str]:
        """Extract images from Myntra product page"""
        try:
            logger.info(f"Extracting images from Myntra URL: {url}")
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            images = []
            
            # Method 1: Extract from image gallery
            img_selectors = [
                '.image-grid-image',
                '.pdp-product-image',
                '.product-image',
                'img[data-testid="product-image"]'
            ]
            
            for selector in img_selectors:
                img_elements = soup.select(selector)
                for img in img_elements:
                    src = img.get('src') or img.get('data-src')
                    if src and self._is_valid_image_url(src):
                        high_res_url = self._convert_to_high_res(src)
                        if high_res_url not in images:
                            images.append(high_res_url)
            
            # Method 2: Extract from JSON data
            script_tags = soup.find_all('script')
            for script in script_tags:
                if script.string and 'imageGallery' in script.string:
                    try:
                        img_pattern = r'https://[^"]*\.(?:jpg|jpeg|png|webp)[^"]*'
                        found_images = re.findall(img_pattern, script.string)
                        for img_url in found_images:
                            if self._is_valid_image_url(img_url):
                                high_res_url = self._convert_to_high_res(img_url)
                                if high_res_url not in images:
                                    images.append(high_res_url)
                    except Exception:
                        continue
            
            # Method 3: Generate from product ID
            product_id_match = re.search(r'/product/([^/]+)', url)
            if product_id_match:
                product_id = product_id_match.group(1)
                generated_url = f"https://assets.myntassets.com/images/{product_id}/1.jpg"
                if generated_url not in images:
                    images.append(generated_url)
            
            logger.info(f"Found {len(images)} images for Myntra product")
            return images[:5]
            
        except Exception as e:
            logger.error(f"Error extracting Myntra images: {e}")
            return []
    
    def _convert_to_high_res(self, url: str) -> str:
        """Convert Myntra image URL to high resolution"""
        # Replace size parameters with high resolution
        url = re.sub(r'/\d+x\d+\.', '/1080x1080.', url)
        return url
    
    def _is_valid_image_url(self, url: str) -> bool:
        """Check if URL is a valid Myntra image"""
        return (url and 
                'myntra' in url.lower() and 
                any(ext in url.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']))
    
    def get_product_info(self, url: str) -> ProductInfo:
        """Get comprehensive Myntra product information"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract title
            title_selectors = [
                '.pdp-product-name',
                '.pdp-name',
                'h1[class*="title"]'
            ]
            title = "Myntra Product"
            for selector in title_selectors:
                title_elem = soup.select_one(selector)
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    break
            
            # Extract price
            price_selectors = [
                '.pdp-price',
                '.price',
                '[class*="price"]'
            ]
            price = None
            for selector in price_selectors:
                price_elem = soup.select_one(selector)
                if price_elem:
                    price = price_elem.get_text(strip=True)
                    break
            
            images = self.extract_images(url)
            
            return ProductInfo(
                title=title,
                url=url,
                retailer='myntra',
                image_urls=images,
                price=price
            )
            
        except Exception as e:
            logger.error(f"Error getting Myntra product info: {e}")
            return ProductInfo(
                title="Myntra Product",
                url=url,
                retailer='myntra',
                image_urls=[]
            )

class ProductImageExtractor:
    """Main class to extract product images from various retailers"""
    
    def __init__(self):
        self.extractors = {
            'amazon': AmazonImageExtractor(),
            'flipkart': FlipkartImageExtractor(),
            'myntra': MyntraImageExtractor(),
        }
        
        # Import additional extractors
        try:
            from retailer_extractors import AJIOImageExtractor, NykaaImageExtractor, TataCliqImageExtractor
            self.extractors.update({
                'ajio': AJIOImageExtractor(),
                'nykaa': NykaaImageExtractor(),
                'tatacliq': TataCliqImageExtractor(),
            })
        except ImportError:
            logger.warning("Additional retailer extractors not available")
        
        # Import utilities
        try:
            from utils import ImageValidator, ImageProcessor, URLProcessor, RateLimiter, ErrorHandler, Config
            self.validator = ImageValidator()
            self.processor = ImageProcessor()
            self.url_processor = URLProcessor()
            self.rate_limiter = RateLimiter(Config.RATE_LIMIT_DELAY)
            self.error_handler = ErrorHandler()
        except ImportError:
            logger.warning("Utility modules not available, using basic functionality")
    
    def detect_retailer(self, url: str) -> str:
        """Detect retailer from URL"""
        url_lower = url.lower()
        if 'amazon' in url_lower:
            return 'amazon'
        elif 'flipkart' in url_lower:
            return 'flipkart'
        elif 'myntra' in url_lower:
            return 'myntra'
        elif 'ajio' in url_lower:
            return 'ajio'
        elif 'nykaa' in url_lower:
            return 'nykaa'
        elif 'tatacliq' in url_lower:
            return 'tatacliq'
        else:
            return 'unknown'
    
    def extract_images(self, url: str) -> List[str]:
        """Extract images from product URL"""
        try:
            # Validate URL
            if hasattr(self, 'validator') and not self.validator.is_valid_url(url):
                logger.error(f"Invalid URL: {url}")
                return []
            
            retailer = self.detect_retailer(url)
            logger.info(f"Detected retailer: {retailer} for URL: {url}")
            
            if retailer in self.extractors:
                # Apply rate limiting
                if hasattr(self, 'rate_limiter'):
                    self.rate_limiter.wait()
                
                images = self.extractors[retailer].extract_images(url)
                
                # Validate and process images
                if hasattr(self, 'validator') and hasattr(self, 'processor'):
                    validated_images = []
                    for img_url in images:
                        if self.validator.is_image_url(img_url) and self.validator.is_retailer_image(img_url, retailer):
                            processed_url = self.processor.convert_to_high_res(img_url, retailer)
                            validated_images.append(processed_url)
                    return validated_images
                
                return images
            else:
                logger.warning(f"No extractor available for retailer: {retailer}")
                return []
                
        except Exception as e:
            if hasattr(self, 'error_handler'):
                self.error_handler.handle_request_error(url, e)
            else:
                logger.error(f"Error extracting images from {url}: {e}")
            return []
    
    def get_product_info(self, url: str) -> ProductInfo:
        """Get comprehensive product information"""
        retailer = self.detect_retailer(url)
        logger.info(f"Getting product info for retailer: {retailer}")
        
        if retailer in self.extractors:
            return self.extractors[retailer].get_product_info(url)
        else:
            logger.warning(f"No extractor available for retailer: {retailer}")
            return ProductInfo(
                title="Unknown Product",
                url=url,
                retailer=retailer,
                image_urls=[]
            )
    
    def extract_multiple_products(self, urls: List[str]) -> List[ProductInfo]:
        """Extract images from multiple product URLs"""
        results = []
        for i, url in enumerate(urls, 1):
            logger.info(f"Processing product {i}/{len(urls)}: {url}")
            try:
                product_info = self.get_product_info(url)
                results.append(product_info)
                time.sleep(1)  # Rate limiting
            except Exception as e:
                logger.error(f"Error processing {url}: {e}")
                results.append(ProductInfo(
                    title="Error",
                    url=url,
                    retailer="unknown",
                    image_urls=[]
                ))
        return results

def main():
    """Main function to run the image extractor"""
    parser = argparse.ArgumentParser(description='Extract product images from Indian e-commerce websites')
    parser.add_argument('url', help='Product URL to extract images from')
    parser.add_argument('--output', '-o', help='Output file to save results (JSON format)')
    parser.add_argument('--verbose', '-v', action='store_true', help='Enable verbose logging')
    
    args = parser.parse_args()
    
    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)
    
    # Initialize extractor
    extractor = ProductImageExtractor()
    
    # Extract product information
    logger.info(f"Starting image extraction for: {args.url}")
    product_info = extractor.get_product_info(args.url)
    
    # Print results
    print(f"\n{'='*60}")
    print(f"PRODUCT INFORMATION")
    print(f"{'='*60}")
    print(f"Title: {product_info.title}")
    print(f"Retailer: {product_info.retailer}")
    print(f"URL: {product_info.url}")
    print(f"Price: {product_info.price or 'N/A'}")
    print(f"Description: {product_info.description or 'N/A'}")
    print(f"\nImages found: {len(product_info.image_urls)}")
    
    if product_info.image_urls:
        print(f"\n{'='*60}")
        print(f"IMAGE URLs")
        print(f"{'='*60}")
        for i, img_url in enumerate(product_info.image_urls, 1):
            print(f"{i}. {img_url}")
    else:
        print("\nNo images found!")
    
    # Save to file if requested
    if args.output:
        output_data = {
            'title': product_info.title,
            'url': product_info.url,
            'retailer': product_info.retailer,
            'price': product_info.price,
            'description': product_info.description,
            'image_urls': product_info.image_urls,
            'extraction_time': time.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Results saved to: {args.output}")

if __name__ == "__main__":
    main()

