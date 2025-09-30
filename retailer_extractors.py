#!/usr/bin/env python3
"""
Additional Retailer-Specific Extractors
======================================

This module contains extractors for AJIO, Nykaa, and TataCliq
"""

import requests
from bs4 import BeautifulSoup
import re
import json
import logging
from typing import List, Optional
from product_image_extractor import ImageExtractor, ProductInfo

logger = logging.getLogger(__name__)

class AJIOImageExtractor(ImageExtractor):
    """AJIO.com image extractor"""
    
    def extract_images(self, url: str) -> List[str]:
        """Extract images from AJIO product page"""
        try:
            logger.info(f"Extracting images from AJIO URL: {url}")
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            images = []
            
            # Method 1: Extract from image gallery
            img_selectors = [
                '.prod-img',
                '.product-image',
                '.pdp-image',
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
            product_id_match = re.search(r'/p/([^/]+)', url)
            if product_id_match:
                product_id = product_id_match.group(1)
                generated_url = f"https://assets.ajio.com/images/{product_id}/1.jpg"
                if generated_url not in images:
                    images.append(generated_url)
            
            logger.info(f"Found {len(images)} images for AJIO product")
            return images[:5]
            
        except Exception as e:
            logger.error(f"Error extracting AJIO images: {e}")
            return []
    
    def _convert_to_high_res(self, url: str) -> str:
        """Convert AJIO image URL to high resolution"""
        url = re.sub(r'/\d+x\d+\.', '/1080x1080.', url)
        return url
    
    def _is_valid_image_url(self, url: str) -> bool:
        """Check if URL is a valid AJIO image"""
        return (url and 
                'ajio' in url.lower() and 
                any(ext in url.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']))
    
    def get_product_info(self, url: str) -> ProductInfo:
        """Get comprehensive AJIO product information"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract title
            title_selectors = [
                '.prod-name',
                '.pdp-name',
                'h1[class*="title"]'
            ]
            title = "AJIO Product"
            for selector in title_selectors:
                title_elem = soup.select_one(selector)
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    break
            
            # Extract price
            price_selectors = [
                '.prod-price',
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
                retailer='ajio',
                image_urls=images,
                price=price
            )
            
        except Exception as e:
            logger.error(f"Error getting AJIO product info: {e}")
            return ProductInfo(
                title="AJIO Product",
                url=url,
                retailer='ajio',
                image_urls=[]
            )

class NykaaImageExtractor(ImageExtractor):
    """Nykaa.com image extractor"""
    
    def extract_images(self, url: str) -> List[str]:
        """Extract images from Nykaa product page"""
        try:
            logger.info(f"Extracting images from Nykaa URL: {url}")
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            images = []
            
            # Method 1: Extract from image gallery
            img_selectors = [
                '.product-image',
                '.pdp-image',
                '.prod-img',
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
            product_id_match = re.search(r'/p/([^/]+)', url)
            if product_id_match:
                product_id = product_id_match.group(1)
                generated_url = f"https://images-static.nykaa.com/images/{product_id}/1.jpg"
                if generated_url not in images:
                    images.append(generated_url)
            
            logger.info(f"Found {len(images)} images for Nykaa product")
            return images[:5]
            
        except Exception as e:
            logger.error(f"Error extracting Nykaa images: {e}")
            return []
    
    def _convert_to_high_res(self, url: str) -> str:
        """Convert Nykaa image URL to high resolution"""
        url = re.sub(r'/\d+x\d+\.', '/1080x1080.', url)
        return url
    
    def _is_valid_image_url(self, url: str) -> bool:
        """Check if URL is a valid Nykaa image"""
        return (url and 
                'nykaa' in url.lower() and 
                any(ext in url.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']))
    
    def get_product_info(self, url: str) -> ProductInfo:
        """Get comprehensive Nykaa product information"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract title
            title_selectors = [
                '.pdp-name',
                '.product-title',
                'h1[class*="title"]'
            ]
            title = "Nykaa Product"
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
                retailer='nykaa',
                image_urls=images,
                price=price
            )
            
        except Exception as e:
            logger.error(f"Error getting Nykaa product info: {e}")
            return ProductInfo(
                title="Nykaa Product",
                url=url,
                retailer='nykaa',
                image_urls=[]
            )

class TataCliqImageExtractor(ImageExtractor):
    """TataCliq.com image extractor"""
    
    def extract_images(self, url: str) -> List[str]:
        """Extract images from TataCliq product page"""
        try:
            logger.info(f"Extracting images from TataCliq URL: {url}")
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            images = []
            
            # Method 1: Extract from image gallery
            img_selectors = [
                '.product-image',
                '.pdp-image',
                '.prod-img',
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
            product_id_match = re.search(r'/p/([^/]+)', url)
            if product_id_match:
                product_id = product_id_match.group(1)
                generated_url = f"https://img.tatacliq.com/images/{product_id}/1.jpg"
                if generated_url not in images:
                    images.append(generated_url)
            
            logger.info(f"Found {len(images)} images for TataCliq product")
            return images[:5]
            
        except Exception as e:
            logger.error(f"Error extracting TataCliq images: {e}")
            return []
    
    def _convert_to_high_res(self, url: str) -> str:
        """Convert TataCliq image URL to high resolution"""
        url = re.sub(r'/\d+x\d+\.', '/1080x1080.', url)
        return url
    
    def _is_valid_image_url(self, url: str) -> bool:
        """Check if URL is a valid TataCliq image"""
        return (url and 
                'tatacliq' in url.lower() and 
                any(ext in url.lower() for ext in ['.jpg', '.jpeg', '.png', '.webp']))
    
    def get_product_info(self, url: str) -> ProductInfo:
        """Get comprehensive TataCliq product information"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Extract title
            title_selectors = [
                '.pdp-name',
                '.product-title',
                'h1[class*="title"]'
            ]
            title = "TataCliq Product"
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
                retailer='tatacliq',
                image_urls=images,
                price=price
            )
            
        except Exception as e:
            logger.error(f"Error getting TataCliq product info: {e}")
            return ProductInfo(
                title="TataCliq Product",
                url=url,
                retailer='tatacliq',
                image_urls=[]
            )

