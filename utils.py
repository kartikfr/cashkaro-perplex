#!/usr/bin/env python3
"""
Utility Functions for Product Image Extractor
============================================

This module contains utility functions for image processing,
validation, and helper functions.
"""

import re
import requests
import logging
from typing import List, Optional, Dict, Tuple
from urllib.parse import urljoin, urlparse
import time
import json
from pathlib import Path

logger = logging.getLogger(__name__)

class ImageValidator:
    """Class to validate and process image URLs"""
    
    @staticmethod
    def is_valid_url(url: str) -> bool:
        """Check if URL is valid"""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except Exception:
            return False
    
    @staticmethod
    def is_image_url(url: str) -> bool:
        """Check if URL points to an image"""
        if not url:
            return False
        
        # Check file extension
        image_extensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp']
        url_lower = url.lower()
        
        # Check if URL has image extension
        has_extension = any(ext in url_lower for ext in image_extensions)
        
        # Check if URL contains image-related keywords
        image_keywords = ['image', 'img', 'photo', 'picture', 'pic']
        has_keyword = any(keyword in url_lower for keyword in image_keywords)
        
        return has_extension or has_keyword
    
    @staticmethod
    def is_retailer_image(url: str, retailer: str) -> bool:
        """Check if image URL belongs to specific retailer"""
        if not url or not retailer:
            return False
        
        retailer_domains = {
            'amazon': ['amazon', 'ssl-images-amazon'],
            'flipkart': ['flipkart', 'rukminim1.flixcart'],
            'myntra': ['myntra', 'assets.myntassets'],
            'ajio': ['ajio', 'assets.ajio'],
            'nykaa': ['nykaa', 'images-static.nykaa'],
            'tatacliq': ['tatacliq', 'img.tatacliq']
        }
        
        url_lower = url.lower()
        domains = retailer_domains.get(retailer.lower(), [])
        
        return any(domain in url_lower for domain in domains)
    
    @staticmethod
    def clean_image_url(url: str) -> str:
        """Clean and normalize image URL"""
        if not url:
            return ""
        
        # Remove query parameters that might affect image quality
        url = re.sub(r'[?&](?:w|h|q|quality|format)=[^&]*', '', url)
        
        # Remove size parameters from URL
        url = re.sub(r'_\d+x\d+_', '_', url)
        url = re.sub(r'/\d+x\d+/', '/', url)
        
        # Remove trailing parameters
        url = re.sub(r'[?&].*$', '', url)
        
        return url.strip()

class ImageProcessor:
    """Class to process and optimize image URLs"""
    
    @staticmethod
    def convert_to_high_res(url: str, retailer: str) -> str:
        """Convert image URL to high resolution"""
        if not url:
            return url
        
        try:
            if retailer.lower() == 'amazon':
                # Amazon high-res conversion
                url = re.sub(r'\._[A-Z0-9_]+\.', '.', url)
                if not url.endswith('.jpg'):
                    url += '.jpg'
                return url
            
            elif retailer.lower() == 'flipkart':
                # Flipkart high-res conversion
                url = re.sub(r'/image/\d+/\d+/', '/image/832/832/', url)
                return url
            
            elif retailer.lower() == 'myntra':
                # Myntra high-res conversion
                url = re.sub(r'/\d+x\d+\.', '/1080x1080.', url)
                return url
            
            elif retailer.lower() == 'ajio':
                # AJIO high-res conversion
                url = re.sub(r'/\d+x\d+\.', '/1080x1080.', url)
                return url
            
            elif retailer.lower() == 'nykaa':
                # Nykaa high-res conversion
                url = re.sub(r'/\d+x\d+\.', '/1080x1080.', url)
                return url
            
            elif retailer.lower() == 'tatacliq':
                # TataCliq high-res conversion
                url = re.sub(r'/\d+x\d+\.', '/1080x1080.', url)
                return url
            
            else:
                return url
                
        except Exception as e:
            logger.error(f"Error converting to high-res: {e}")
            return url
    
    @staticmethod
    def generate_placeholder_url(retailer: str, size: Tuple[int, int] = (300, 300)) -> str:
        """Generate placeholder image URL"""
        retailer_colors = {
            'amazon': 'FF9900',
            'flipkart': '2874F0',
            'myntra': 'FF3F6C',
            'ajio': 'FF6B35',
            'nykaa': 'FF1493',
            'tatacliq': '000000',
            'unknown': '6B7280'
        }
        
        color = retailer_colors.get(retailer.lower(), '6B7280')
        width, height = size
        
        return f"https://via.placeholder.com/{width}x{height}/{color}/FFFFFF?text={retailer.upper()}"

class URLProcessor:
    """Class to process and validate URLs"""
    
    @staticmethod
    def extract_product_id(url: str, retailer: str) -> Optional[str]:
        """Extract product ID from URL"""
        if not url or not retailer:
            return None
        
        try:
            if retailer.lower() == 'amazon':
                # Extract ASIN from Amazon URL
                match = re.search(r'/dp/([A-Z0-9]{10})', url)
                return match.group(1) if match else None
            
            elif retailer.lower() == 'flipkart':
                # Extract PID from Flipkart URL
                match = re.search(r'pid=([^&]+)', url)
                return match.group(1) if match else None
            
            elif retailer.lower() == 'myntra':
                # Extract product ID from Myntra URL
                patterns = [
                    r'/product/([^/]+)',
                    r'/p/([^/]+)',
                    r'/item/([^/]+)',
                    r'pid=([^&]+)'
                ]
                for pattern in patterns:
                    match = re.search(pattern, url)
                    if match:
                        return match.group(1)
                return None
            
            elif retailer.lower() == 'ajio':
                # Extract product ID from AJIO URL
                match = re.search(r'/p/([^/]+)', url)
                return match.group(1) if match else None
            
            elif retailer.lower() == 'nykaa':
                # Extract product ID from Nykaa URL
                match = re.search(r'/p/([^/]+)', url)
                return match.group(1) if match else None
            
            elif retailer.lower() == 'tatacliq':
                # Extract product ID from TataCliq URL
                match = re.search(r'/p/([^/]+)', url)
                return match.group(1) if match else None
            
            else:
                return None
                
        except Exception as e:
            logger.error(f"Error extracting product ID: {e}")
            return None
    
    @staticmethod
    def generate_image_url(product_id: str, retailer: str) -> Optional[str]:
        """Generate image URL from product ID"""
        if not product_id or not retailer:
            return None
        
        try:
            if retailer.lower() == 'amazon':
                return f"https://images-na.ssl-images-amazon.com/images/P/{product_id}.01.L.jpg"
            
            elif retailer.lower() == 'flipkart':
                return f"https://rukminim1.flixcart.com/image/416/416/product/{product_id}.jpeg"
            
            elif retailer.lower() == 'myntra':
                return f"https://assets.myntassets.com/images/{product_id}/1.jpg"
            
            elif retailer.lower() == 'ajio':
                return f"https://assets.ajio.com/images/{product_id}/1.jpg"
            
            elif retailer.lower() == 'nykaa':
                return f"https://images-static.nykaa.com/images/{product_id}/1.jpg"
            
            elif retailer.lower() == 'tatacliq':
                return f"https://img.tatacliq.com/images/{product_id}/1.jpg"
            
            else:
                return None
                
        except Exception as e:
            logger.error(f"Error generating image URL: {e}")
            return None

class FileManager:
    """Class to manage file operations"""
    
    @staticmethod
    def save_results(data: Dict, filename: str) -> bool:
        """Save results to JSON file"""
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"Results saved to: {filename}")
            return True
        except Exception as e:
            logger.error(f"Error saving results: {e}")
            return False
    
    @staticmethod
    def load_results(filename: str) -> Optional[Dict]:
        """Load results from JSON file"""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error loading results: {e}")
            return None
    
    @staticmethod
    def create_output_dir(dirname: str = "output") -> Path:
        """Create output directory"""
        try:
            output_dir = Path(dirname)
            output_dir.mkdir(exist_ok=True)
            return output_dir
        except Exception as e:
            logger.error(f"Error creating output directory: {e}")
            return Path(".")

class RateLimiter:
    """Class to handle rate limiting"""
    
    def __init__(self, delay: float = 1.0):
        self.delay = delay
        self.last_request = 0
    
    def wait(self):
        """Wait if necessary to respect rate limit"""
        current_time = time.time()
        time_since_last = current_time - self.last_request
        
        if time_since_last < self.delay:
            sleep_time = self.delay - time_since_last
            time.sleep(sleep_time)
        
        self.last_request = time.time()

class ErrorHandler:
    """Class to handle errors gracefully"""
    
    @staticmethod
    def handle_request_error(url: str, error: Exception) -> str:
        """Handle request errors"""
        error_msg = f"Request failed for {url}: {str(error)}"
        logger.error(error_msg)
        return error_msg
    
    @staticmethod
    def handle_parsing_error(url: str, error: Exception) -> str:
        """Handle parsing errors"""
        error_msg = f"Parsing failed for {url}: {str(error)}"
        logger.error(error_msg)
        return error_msg
    
    @staticmethod
    def handle_validation_error(url: str, error: Exception) -> str:
        """Handle validation errors"""
        error_msg = f"Validation failed for {url}: {str(error)}"
        logger.error(error_msg)
        return error_msg

class Config:
    """Configuration class"""
    
    # Request settings
    REQUEST_TIMEOUT = 10
    MAX_RETRIES = 3
    RATE_LIMIT_DELAY = 1.0
    
    # Image settings
    MAX_IMAGES_PER_PRODUCT = 5
    MIN_IMAGE_SIZE = (100, 100)
    MAX_IMAGE_SIZE = (2000, 2000)
    
    # Output settings
    OUTPUT_DIR = "output"
    LOG_FILE = "image_extractor.log"
    
    # Retailer settings
    SUPPORTED_RETAILERS = [
        'amazon', 'flipkart', 'myntra', 
        'ajio', 'nykaa', 'tatacliq'
    ]
    
    # User agents
    USER_AGENTS = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ]

