import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShoppingCart, Zap, Star, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import SearchService, { SearchResult } from '@/lib/searchService';
import URLBuilder from '@/lib/urlBuilder';
import { optimizeImageUrl, isValidImageUrl, generatePlaceholderUrl } from '@/lib/imageUtils';
import { performanceMonitor } from '@/lib/performanceMonitor';

// No longer needed - API key is managed securely in Edge Functions

interface Retailer {
  id: string;
  name: string;
  domain: string;
  color: string;
}

const RETAILERS: Retailer[] = [
  { id: 'all', name: 'All Stores', domain: '', color: 'bg-primary' },
  { id: 'amazon', name: 'Amazon', domain: 'amazon.in', color: 'bg-orange-500' },
  { id: 'flipkart', name: 'Flipkart', domain: 'flipkart.com', color: 'bg-blue-500' },
  { id: 'myntra', name: 'Myntra', domain: 'myntra.com', color: 'bg-pink-500' },
  { id: 'ajio', name: 'AJIO', domain: 'ajio.com', color: 'bg-yellow-500' },
];

// Sample fallback results with proper image URLs
const SAMPLE_RESULTS: SearchResult[] = [
  {
    id: '1',
    title: 'Premium Cotton Double Bed Blanket - Soft & Warm Winter Collection',
    url: 'https://amazon.in/dp/B08X123',
    snippet: 'Ultra-soft cotton blend blanket perfect for winter. Machine washable and lightweight.',
    price: '₹399',
    image: 'https://images-na.ssl-images-amazon.com/images/P/B08X123.01.L.jpg',
    retailer: 'amazon',
    timestamp: Date.now(),
  },
  {
    id: '2',
    title: 'Cozy Fleece Blanket Single Bed Size - Multiple Colors Available',
    url: 'https://flipkart.com/product/xyz',
    snippet: 'Comfortable fleece material that retains warmth. Available in 8 different colors.',
    price: '₹299',
    image: 'https://rukminim1.flixcart.com/image/416/416/product/xyz.jpeg',
    retailer: 'flipkart',
    timestamp: Date.now(),
  },
  {
    id: '3',
    title: 'Luxe Microfiber Throw Blanket - Premium Quality Home Decor',
    url: 'https://myntra.com/item/abc',
    snippet: 'Decorative throw blanket made from premium microfiber. Perfect for living rooms.',
    price: '₹450',
    image: 'https://assets.myntassets.com/images/abc/1.jpg',
    retailer: 'myntra',
    timestamp: Date.now(),
  },
];

const SearchInterface: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRetailer, setSelectedRetailer] = useState('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  // Initialize search service - no API key needed since we use Edge Functions
  const [searchService] = useState(new SearchService());
  const [urlBuilder] = useState(new URLBuilder());
  const [useFallback, setUseFallback] = useState(false);
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  // API key is no longer needed since we use secure Edge Functions
  useEffect(() => {
    // Remove API key input UI since we use Edge Functions
    setShowApiKeyInput(false);
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string, retailer: string) => {
      if (query.trim() && searchService) {
        performSearch(query, retailer);
      }
    }, 300),
    [searchService]
  );

  // Real search function using Perplexity API with fallback
  const performSearch = async (query: string, retailer: string) => {
    setIsLoading(true);
    setError(null);
    
    // Start performance monitoring
    performanceMonitor.startSearch();
    
    try {
      if (useFallback) {
        // Use sample results as fallback
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
        
        let filteredResults = SAMPLE_RESULTS;
        if (retailer !== 'all') {
          filteredResults = SAMPLE_RESULTS.filter(result => result.retailer === retailer);
        }
        
        setResults(filteredResults);
        toast({
          title: "Search Complete (Demo Mode)",
          description: `Found ${filteredResults.length} sample products`,
        });
      } else {
        const searchResults = await searchService.search(query, retailer, 5);
        setResults(searchResults);
        
        toast({
          title: "Search Complete",
          description: `Found ${searchResults.length} products`,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setError(errorMessage);
      
      // Auto-switch to fallback mode on API errors
      if (!useFallback) {
        setUseFallback(true);
        toast({
          title: "API Error - Switching to Demo Mode",
          description: "Using sample results. Check your API configuration.",
          variant: "destructive",
        });
        
        // Retry with fallback
        setTimeout(() => performSearch(query, retailer), 500);
        return;
      }
      
      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      // End performance monitoring
      performanceMonitor.endSearch();
      
      // Log performance summary in development
      if (process.env.NODE_ENV === 'development') {
        performanceMonitor.logSummary();
      }
    }
  };

  // Handle product click - open the exact product URL (no extra params)
  const handleProductClick = async (result: SearchResult) => {
    try {
      console.log('Handling product click for:', result.title);

      // Normalize but do not append any tracking params
      const finalUrl = urlBuilder.normalizeRetailerUrl(result.url);

      console.log('Opening product URL:', finalUrl);

      toast({
        title: "Opening product",
        description: `Redirecting to ${result.title}`,
      });

      window.open(finalUrl, '_blank');

    } catch (error) {
      console.error('Error opening product URL:', error);
      // Fallback to original URL
      window.open(result.url, '_blank');
      toast({
        title: "Redirecting",
        description: "Opened original product link",
        variant: "destructive",
      });
    }
  };

  // Handle search with debouncing
  const handleSearch = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery, selectedRetailer);
    }
  };

  // Handle search input change with debouncing
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim().length > 2) {
      debouncedSearch(value, selectedRetailer);
    }
  };

  // Handle retailer change
  const handleRetailerChange = (retailer: string) => {
    setSelectedRetailer(retailer);
    if (searchQuery.trim()) {
      debouncedSearch(searchQuery, retailer);
    }
  };

  const getRetailerBadgeColor = (retailerId: string) => {
    const retailer = RETAILERS.find(r => r.id === retailerId);
    return retailer?.color || 'bg-gray-500';
  };

  const toggleMode = () => {
    setUseFallback(!useFallback);
    setError(null);
    toast({
      title: useFallback ? "Switching to API Mode" : "Switching to Demo Mode",
      description: useFallback ? "Will use Perplexity API for searches" : "Will use sample results",
    });
  };

  // Image loading handlers
  const handleImageLoad = (productId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [productId]: false }));
    setImageErrors(prev => ({ ...prev, [productId]: false }));
    performanceMonitor.endImageLoad(productId);
  };

  const handleImageError = (productId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [productId]: false }));
    setImageErrors(prev => ({ ...prev, [productId]: true }));
    performanceMonitor.recordImageError(productId);
  };

  const handleImageStart = (productId: string) => {
    setImageLoadingStates(prev => ({ ...prev, [productId]: true }));
    performanceMonitor.startImageLoad(productId);
  };

  // Get optimized image URL with fallback
  const getOptimizedImageUrl = (result: SearchResult): string | null => {
    console.log('Getting optimized image URL for product:', result.id, 'image:', result.image, 'quality:', result.image_quality);
    
    // Try multiple image sources
    const imageSources = [
      result.image,
      ...(result.images || [])
    ].filter(Boolean);
    
    if (imageSources.length === 0) {
      console.log('No image URL provided for product:', result.id);
      return null;
    }
    
    // Select best image based on quality
    let selectedImage = imageSources[0];
    
    // If we have multiple images, prefer higher quality ones
    if (imageSources.length > 1) {
      // Look for high-quality images first
      const highQualityImages = imageSources.filter(img => 
        img && (img.includes('amazon') || img.includes('myntra') || img.includes('flipkart'))
      );
      if (highQualityImages.length > 0) {
        selectedImage = highQualityImages[0];
      }
    }
    
    // Validate the selected image URL
    if (!isValidImageUrl(selectedImage)) {
      console.warn(`Invalid image URL for product ${result.id}:`, selectedImage);
      return null;
    }
    
    // Optimize the image URL based on retailer
    const optimizedUrl = optimizeImageUrl(selectedImage, 144, 144);
    console.log('Optimized image URL:', optimizedUrl, 'Quality:', result.image_quality);
    return optimizedUrl;
  };

  // Get retailer-specific placeholder
  const getRetailerPlaceholder = (retailer: string): string => {
    const retailerColors: Record<string, string> = {
      amazon: 'FF9900',
      flipkart: '2874F0',
      myntra: 'FF3F6C',
      ajio: 'FF6B35',
      nykaa: 'FF1493',
      tatacliq: '000000'
    };
    
    const color = retailerColors[retailer] || '6B7280';
    return `https://via.placeholder.com/144x144/${color}/FFFFFF?text=${retailer.toUpperCase()}`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Mode Toggle & API Key Input */}
      {showApiKeyInput && (
        <Card className="p-6 bg-accent/50 border-primary/20">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Configure Perplexity API</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Update your Perplexity API key for enhanced search capabilities.
            </p>
            <div className="flex gap-3">
              <Input
                type="password"
                placeholder="Enter your Perplexity API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={() => setShowApiKeyInput(false)}
                disabled={!apiKey.trim()}
              >
                Update
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Don't have an API key? Get one from{' '}
              <a href="https://perplexity.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Perplexity AI
              </a>
            </p>
          </div>
        </Card>
      )}

      {/* Search Interface */}
      <Card className="p-6 bg-gradient-card shadow-card">
        <div className="space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Try: Blanket under 500, iPhone 15, Nike shoes..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 h-12 text-base"
            />
            <Button 
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              size="sm"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </Button>
          </div>

          {/* Retailer Chips */}
          <div className="flex flex-wrap gap-2">
            {RETAILERS.map((retailer) => (
              <Button
                key={retailer.id}
                variant={selectedRetailer === retailer.id ? "default" : "retailer"}
                size="sm"
                onClick={() => handleRetailerChange(retailer.id)}
                className="transition-smooth"
                disabled={isLoading}
              >
                <ShoppingCart className="w-4 h-4" />
                {retailer.name}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 bg-destructive/10 border-destructive/20">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        </Card>
      )}

      {/* Results Section */}
      {(results.length > 0 || isLoading) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Search Results</h2>
            <div className="flex items-center gap-2">
              {results.length > 0 && (
                <Badge variant="outline" className="font-medium">
                  {results.length} products found
                </Badge>
              )}
              {useFallback && (
                <Badge variant="secondary" className="text-xs">
                  Demo Mode
                </Badge>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="space-y-3">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {results.map((result) => (
                <Card 
                  key={result.id} 
                  className="p-6 hover:shadow-card transition-smooth cursor-pointer group"
                  onClick={() => handleProductClick(result)}
                >
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {(() => {
                        const optimizedImageUrl = getOptimizedImageUrl(result);
                        const hasImage = optimizedImageUrl && !imageErrors[result.id];
                        const isPlaceholder = result.image_quality === 'placeholder';
                        
                        return hasImage ? (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-lg overflow-hidden bg-gray-100 relative group/image">
                            {imageLoadingStates[result.id] && (
                              <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
                                <Loader2 className="w-4 h-4 sm:w-6 sm:h-6 text-gray-400 animate-spin" />
                              </div>
                            )}
                            <img
                              src={optimizedImageUrl}
                              alt={result.title}
                              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${
                                isPlaceholder ? 'opacity-75' : ''
                              }`}
                              onLoad={() => handleImageLoad(result.id)}
                              onError={() => handleImageError(result.id)}
                              onLoadStart={() => handleImageStart(result.id)}
                              loading="lazy"
                              decoding="async"
                              sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, (max-width: 1024px) 128px, 144px"
                            />
                            {/* Image quality indicator */}
                            {result.image_quality && (
                              <div className="absolute top-1 right-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  result.image_quality === 'high' ? 'bg-green-500' :
                                  result.image_quality === 'medium' ? 'bg-yellow-500' :
                                  result.image_quality === 'low' ? 'bg-orange-500' :
                                  'bg-gray-500'
                                }`} title={`Image quality: ${result.image_quality}`} />
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <img
                              src={getRetailerPlaceholder(result.retailer)}
                              alt={`${result.retailer} placeholder`}
                              className="w-full h-full object-cover opacity-50"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge 
                          className={`${getRetailerBadgeColor(result.retailer)} text-white`}
                        >
                          {RETAILERS.find(r => r.id === result.retailer)?.name}
                        </Badge>
                        {result.price && (
                          <Badge variant="outline" className="font-bold text-primary">
                            {result.price}
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
                        {result.title}
                      </h3>
                      
                      {result.snippet && (
                        <p className="text-muted-foreground text-sm line-clamp-2">
                          {result.snippet}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        CashKaro Cashback Eligible
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <div className="flex-shrink-0">
                      <Button variant="hero" size="sm">
                      Shop Now
                    </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Settings Toggle */}
      <Card className="p-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-medium">Search Configuration</h3>
            <p className="text-sm text-muted-foreground">
              {useFallback ? 'Demo mode with sample results' : (searchService ? 'Perplexity API configured' : 'API not configured')}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleMode}
            >
              <RefreshCw className="w-4 h-4" />
              {useFallback ? 'Use API' : 'Use Demo'}
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
            >
              <Zap className="w-4 h-4" />
              Configure
            </Button>
          </div>
        </div>
      </Card>

      {/* Info Section */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">How It Works</h3>
          </div>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Search for products across major Indian retailers using {useFallback ? 'demo data' : 'Perplexity AI'}</li>
            <li>Click any result to automatically get CashKaro cashback tracking</li>
            <li>Shop normally and earn cashback without extra steps</li>
          </ol>
        </div>
      </Card>
    </div>
  );
};

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default SearchInterface;