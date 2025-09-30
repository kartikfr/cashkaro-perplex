// Image utility functions for caching and optimization

interface ImageCache {
  [url: string]: {
    data: string;
    timestamp: number;
    expires: number;
  };
}

class ImageCacheManager {
  private cache: ImageCache = {};
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_CACHE_SIZE = 50; // Maximum number of cached images

  /**
   * Get cached image data
   */
  getCachedImage(url: string): string | null {
    const cached = this.cache[url];
    if (!cached) return null;

    // Check if cache has expired
    if (Date.now() > cached.expires) {
      delete this.cache[url];
      return null;
    }

    return cached.data;
  }

  /**
   * Cache image data
   */
  setCachedImage(url: string, data: string): void {
    // Clean up old cache entries if we're at the limit
    if (Object.keys(this.cache).length >= this.MAX_CACHE_SIZE) {
      this.cleanupCache();
    }

    this.cache[url] = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + this.CACHE_DURATION
    };
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = Date.now();
    const entries = Object.entries(this.cache);
    
    // Sort by timestamp (oldest first)
    entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    // Remove oldest 25% of entries
    const toRemove = Math.ceil(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      delete this.cache[entries[i][0]];
    }
  }

  /**
   * Clear all cached images
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: Object.keys(this.cache).length,
      entries: Object.keys(this.cache)
    };
  }
}

// Global cache instance
export const imageCache = new ImageCacheManager();

/**
 * Optimize image URL for better performance
 */
export function optimizeImageUrl(url: string, width?: number, height?: number): string {
  try {
    const urlObj = new URL(url);
    
    // Amazon image optimization
    if (urlObj.hostname.includes('amazon')) {
      // Amazon images support size parameters
      if (width && height) {
        return url.replace(/\.jpg$/, `._AC_SL${width}_${height}_.jpg`);
      }
      return url;
    }
    
    // Flipkart image optimization
    if (urlObj.hostname.includes('flipkart')) {
      // Flipkart images support size parameters in the path
      if (width && height) {
        return url.replace(/\/image\/\d+\/\d+\//, `/image/${width}/${height}/`);
      }
      return url;
    }
    
    // Myntra image optimization
    if (urlObj.hostname.includes('myntra')) {
      // Myntra images support size parameters
      if (width && height) {
        return url.replace(/\/\d+\.jpg$/, `/${width}x${height}.jpg`);
      }
      return url;
    }
    
    return url;
  } catch {
    return url;
  }
}

/**
 * Validate image URL
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const validHosts = [
      'amazon.in',
      'flipkart.com',
      'myntra.com',
      'ajio.com',
      'nykaa.com',
      'tatacliq.com',
      'images-na.ssl-images-amazon.com',
      'rukminim1.flixcart.com',
      'assets.myntassets.com',
      'assets.ajio.com',
      'via.placeholder.com' // Allow placeholder images
    ];
    
    const isValid = validHosts.some(host => urlObj.hostname.includes(host));
    console.log('Image URL validation:', url, 'is valid:', isValid);
    return isValid;
  } catch (error) {
    console.error('Error validating image URL:', url, error);
    return false;
  }
}

/**
 * Get responsive image sizes for different breakpoints
 */
export function getResponsiveImageSizes(): string {
  return '(max-width: 640px) 80px, (max-width: 768px) 96px, (max-width: 1024px) 128px, 144px';
}

/**
 * Generate placeholder image URL
 */
export function generatePlaceholderUrl(width: number, height: number, text?: string): string {
  const encodedText = text ? encodeURIComponent(text) : 'No+Image';
  return `https://via.placeholder.com/${width}x${height}/f3f4f6/9ca3af?text=${encodedText}`;
}

/**
 * Preload image for better performance
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/**
 * Batch preload images
 */
export async function preloadImages(urls: string[]): Promise<void[]> {
  const promises = urls.map(url => preloadImage(url).catch(() => {
    console.warn(`Failed to preload image: ${url}`);
  }));
  return Promise.all(promises);
}
