import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShoppingCart, Zap, Star, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import SearchService, { SearchResult } from '@/lib/searchService';
import URLBuilder from '@/lib/urlBuilder';

// Default API key (in production, this should be from environment or user input)
const DEFAULT_API_KEY = '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';

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

const SearchInterface: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRetailer, setSelectedRetailer] = useState('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(DEFAULT_API_KEY);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [searchService, setSearchService] = useState<SearchService | null>(null);
  const [urlBuilder] = useState(new URLBuilder());
  const { toast } = useToast();

  // Initialize search service when API key changes
  useEffect(() => {
    if (apiKey.trim()) {
      setSearchService(new SearchService(apiKey));
      setShowApiKeyInput(false);
    }
  }, [apiKey]);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string, retailer: string) => {
      if (query.trim() && searchService) {
        performSearch(query, retailer);
      }
    }, 300),
    [searchService]
  );

  // Real search function using Perplexity API
  const performSearch = async (query: string, retailer: string) => {
    if (!searchService) {
      setError('Search service not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const searchResults = await searchService.search(query, retailer, 5);
      setResults(searchResults);
      
      toast({
        title: "Search Complete",
        description: `Found ${searchResults.length} products`,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      setError(errorMessage);
      
      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle product click with CashKaro URL building
  const handleProductClick = async (result: SearchResult) => {
    try {
      // Build final URL with CashKaro parameters
      const finalUrl = urlBuilder.buildFinalUrl(result.url, result.retailer);
      
      // Validate CashKaro parameters were added
      const isValid = urlBuilder.validateCKParams(finalUrl, result.retailer);
      
      if (isValid) {
        toast({
          title: "Redirecting with CashKaro",
          description: `Opening ${result.title} with cashback tracking...`,
        });
      } else {
        toast({
          title: "Redirecting",
          description: `Opening ${result.title} (cashback params may not be available)...`,
          variant: "destructive",
        });
      }
      
      // Open in new tab
      window.open(finalUrl, '_blank');
      
    } catch (error) {
      console.error('Error building URL:', error);
      // Fallback to original URL
      window.open(result.url, '_blank');
      
      toast({
        title: "Redirecting",
        description: "Opened product page (fallback mode)",
        variant: "destructive",
      });
    }
  };

  // Handle search with debouncing
  const handleSearch = () => {
    if (searchQuery.trim() && searchService) {
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
    if (searchQuery.trim() && searchService) {
      debouncedSearch(searchQuery, retailer);
    }
  };

  const getRetailerBadgeColor = (retailerId: string) => {
    const retailer = RETAILERS.find(r => r.id === retailerId);
    return retailer?.color || 'bg-gray-500';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* API Key Input - Only show if needed */}
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
              disabled={isLoading || !searchQuery.trim() || !searchService}
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
            {results.length > 0 && (
              <Badge variant="outline" className="font-medium">
                {results.length} products found
              </Badge>
            )}
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
                  <div className="flex items-start justify-between gap-4">
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
                      
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {result.title}
                      </h3>
                      
                      {result.snippet && (
                        <p className="text-muted-foreground text-sm">
                          {result.snippet}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        CashKaro Cashback Eligible
                      </div>
                    </div>
                    
                    <Button variant="hero" size="sm" className="shrink-0">
                      Shop Now
                    </Button>
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
            <h3 className="font-medium">API Configuration</h3>
            <p className="text-sm text-muted-foreground">
              {searchService ? 'Perplexity API configured' : 'API not configured'}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowApiKeyInput(!showApiKeyInput)}
          >
            <Zap className="w-4 h-4" />
            {showApiKeyInput ? 'Hide' : 'Configure'}
          </Button>
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
            <li>Search for products across major Indian retailers using Perplexity AI</li>
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