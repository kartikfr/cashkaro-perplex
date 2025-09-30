// Performance monitoring utilities for image loading and search performance

interface PerformanceMetrics {
  searchTime: number;
  imageLoadTimes: Record<string, number>;
  totalImages: number;
  successfulImages: number;
  failedImages: number;
  cacheHitRate: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    searchTime: 0,
    imageLoadTimes: {},
    totalImages: 0,
    successfulImages: 0,
    failedImages: 0,
    cacheHitRate: 0
  };

  private searchStartTime: number = 0;
  private imageLoadStartTimes: Record<string, number> = {};

  /**
   * Start monitoring a search operation
   */
  startSearch(): void {
    this.searchStartTime = performance.now();
  }

  /**
   * End monitoring a search operation
   */
  endSearch(): void {
    if (this.searchStartTime > 0) {
      this.metrics.searchTime = performance.now() - this.searchStartTime;
      this.searchStartTime = 0;
    }
  }

  /**
   * Start monitoring an image load
   */
  startImageLoad(imageId: string): void {
    this.imageLoadStartTimes[imageId] = performance.now();
    this.metrics.totalImages++;
  }

  /**
   * End monitoring an image load (success)
   */
  endImageLoad(imageId: string): void {
    if (this.imageLoadStartTimes[imageId]) {
      this.metrics.imageLoadTimes[imageId] = performance.now() - this.imageLoadStartTimes[imageId];
      this.metrics.successfulImages++;
      delete this.imageLoadStartTimes[imageId];
    }
  }

  /**
   * Record failed image load
   */
  recordImageError(imageId: string): void {
    if (this.imageLoadStartTimes[imageId]) {
      this.metrics.failedImages++;
      delete this.imageLoadStartTimes[imageId];
    }
  }

  /**
   * Update cache hit rate
   */
  updateCacheHitRate(hits: number, total: number): void {
    this.metrics.cacheHitRate = total > 0 ? (hits / total) * 100 : 0;
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get average image load time
   */
  getAverageImageLoadTime(): number {
    const times = Object.values(this.metrics.imageLoadTimes);
    return times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
  }

  /**
   * Get image success rate
   */
  getImageSuccessRate(): number {
    return this.metrics.totalImages > 0 
      ? (this.metrics.successfulImages / this.metrics.totalImages) * 100 
      : 0;
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      searchTime: 0,
      imageLoadTimes: {},
      totalImages: 0,
      successfulImages: 0,
      failedImages: 0,
      cacheHitRate: 0
    };
    this.imageLoadStartTimes = {};
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    console.group('🚀 Performance Summary');
    console.log(`Search Time: ${this.metrics.searchTime.toFixed(2)}ms`);
    console.log(`Average Image Load Time: ${this.getAverageImageLoadTime().toFixed(2)}ms`);
    console.log(`Image Success Rate: ${this.getImageSuccessRate().toFixed(1)}%`);
    console.log(`Cache Hit Rate: ${this.metrics.cacheHitRate.toFixed(1)}%`);
    console.log(`Total Images: ${this.metrics.totalImages}`);
    console.log(`Successful: ${this.metrics.successfulImages}`);
    console.log(`Failed: ${this.metrics.failedImages}`);
    console.groupEnd();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Performance testing utilities
 */
export class PerformanceTester {
  /**
   * Test image loading performance
   */
  static async testImageLoading(urls: string[]): Promise<{
    averageTime: number;
    successRate: number;
    results: Array<{ url: string; time: number; success: boolean }>;
  }> {
    const results: Array<{ url: string; time: number; success: boolean }> = [];
    
    for (const url of urls) {
      const startTime = performance.now();
      try {
        await new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Image load failed'));
          img.src = url;
        });
        
        const endTime = performance.now();
        results.push({
          url,
          time: endTime - startTime,
          success: true
        });
      } catch (error) {
        const endTime = performance.now();
        results.push({
          url,
          time: endTime - startTime,
          success: false
        });
      }
    }
    
    const successfulResults = results.filter(r => r.success);
    const averageTime = successfulResults.length > 0 
      ? successfulResults.reduce((sum, r) => sum + r.time, 0) / successfulResults.length 
      : 0;
    
    const successRate = (successfulResults.length / results.length) * 100;
    
    return {
      averageTime,
      successRate,
      results
    };
  }

  /**
   * Test search performance
   */
  static async testSearchPerformance(
    searchService: any, 
    queries: string[]
  ): Promise<{
    averageTime: number;
    results: Array<{ query: string; time: number; resultCount: number }>;
  }> {
    const results: Array<{ query: string; time: number; resultCount: number }> = [];
    
    for (const query of queries) {
      const startTime = performance.now();
      try {
        const searchResults = await searchService.search(query, 'all', 5);
        const endTime = performance.now();
        
        results.push({
          query,
          time: endTime - startTime,
          resultCount: searchResults.length
        });
      } catch (error) {
        const endTime = performance.now();
        results.push({
          query,
          time: endTime - startTime,
          resultCount: 0
        });
      }
    }
    
    const averageTime = results.reduce((sum, r) => sum + r.time, 0) / results.length;
    
    return {
      averageTime,
      results
    };
  }
}

/**
 * Performance optimization suggestions
 */
export function getPerformanceSuggestions(metrics: PerformanceMetrics): string[] {
  const suggestions: string[] = [];
  
  if (metrics.searchTime > 3000) {
    suggestions.push('Search time is slow (>3s). Consider optimizing API calls or adding caching.');
  }
  
  if (metrics.cacheHitRate < 50) {
    suggestions.push('Low cache hit rate. Consider implementing better caching strategies.');
  }
  
  if (metrics.failedImages > metrics.successfulImages * 0.1) {
    suggestions.push('High image failure rate. Check image URLs and implement better fallbacks.');
  }
  
  const avgImageTime = Object.values(metrics.imageLoadTimes).reduce((a, b) => a + b, 0) / Object.keys(metrics.imageLoadTimes).length;
  if (avgImageTime > 2000) {
    suggestions.push('Slow image loading. Consider image optimization or CDN usage.');
  }
  
  return suggestions;
}


