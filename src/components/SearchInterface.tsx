import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Zap, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet?: string;
  price?: string;
  image?: string;
  retailer: string;
  timestamp: number;
}

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

const SAMPLE_RESULTS: SearchResult[] = [
  {
    id: '1',
    title: 'Premium Cotton Double Bed Blanket - Soft & Warm Winter Collection',
    url: 'https://amazon.in/dp/B08X123',
    snippet: 'Ultra-soft cotton blend blanket perfect for winter. Machine washable and lightweight.',
    price: '₹399',
    retailer: 'amazon',
    timestamp: Date.now(),
  },
  {
    id: '2',
    title: 'Cozy Fleece Blanket Single Bed Size - Multiple Colors Available',
    url: 'https://flipkart.com/product/xyz',
    snippet: 'Comfortable fleece material that retains warmth. Available in 8 different colors.',
    price: '₹299',
    retailer: 'flipkart',
    timestamp: Date.now(),
  },
  {
    id: '3',
    title: 'Luxe Microfiber Throw Blanket - Premium Quality Home Decor',
    url: 'https://myntra.com/item/abc',
    snippet: 'Decorative throw blanket made from premium microfiber. Perfect for living rooms.',
    price: '₹450',
    retailer: 'myntra',
    timestamp: Date.now(),
  },
];

const SearchInterface: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRetailer, setSelectedRetailer] = useState('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const { toast } = useToast();

  // Simulated search function - replace with actual Perplexity API call
  const performSearch = async (query: string, retailer: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter sample results based on retailer
      let filteredResults = SAMPLE_RESULTS;
      if (retailer !== 'all') {
        filteredResults = SAMPLE_RESULTS.filter(result => result.retailer === retailer);
      }
      
      setResults(filteredResults);
      
      toast({
        title: "Search Complete",
        description: `Found ${filteredResults.length} products`,
      });
    } catch (error) {
      toast({
        title: "Search Failed",
        description: "Could not fetch results. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate CashKaro redirect
  const handleProductClick = async (result: SearchResult) => {
    toast({
      title: "Redirecting with CashKaro",
      description: `Opening ${result.title} with cashback tracking...`,
    });
    
    // Simulate the URL building process from your PRD
    const cashkaroParams = getCashkaroParams(result.retailer);
    const finalUrl = buildFinalUrl(result.url, cashkaroParams);
    
    // Open in new tab
    window.open(finalUrl, '_blank');
  };

  const getCashkaroParams = (retailer: string) => {
    const paramMap: Record<string, Record<string, string>> = {
      amazon: { tag: 'cashkacom-21', ascsubtag: 'CKXYZ123' },
      flipkart: { affid: 'cashkaro', affExtParam1: 'ck001' },
      myntra: { utm_source: 'cashkaro', utm_medium: 'affiliate', utm_campaign: 'ck2024' },
      ajio: { source: 'cashkaro', affid: 'ck_ajio', subid: 'ck123' },
    };
    
    return paramMap[retailer] || {};
  };

  const buildFinalUrl = (productUrl: string, ckParams: Record<string, string>) => {
    const url = new URL(productUrl);
    
    // Add CashKaro parameters
    Object.entries(ckParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    
    return url.toString();
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      performSearch(searchQuery, selectedRetailer);
    }
  };

  const getRetailerBadgeColor = (retailerId: string) => {
    const retailer = RETAILERS.find(r => r.id === retailerId);
    return retailer?.color || 'bg-gray-500';
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* API Key Input */}
      {showApiKeyInput && (
        <Card className="p-6 bg-accent/50 border-primary/20">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              <h3 className="font-semibold">Perplexity API Configuration</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Enter your Perplexity API key to enable live product search across retailers.
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
                Configure
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
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 h-12 text-base"
            />
            <Button 
              onClick={handleSearch}
              disabled={isLoading || !searchQuery.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
              size="sm"
            >
              Search
            </Button>
          </div>

          {/* Retailer Chips */}
          <div className="flex flex-wrap gap-2">
            {RETAILERS.map((retailer) => (
              <Button
                key={retailer.id}
                variant={selectedRetailer === retailer.id ? "default" : "retailer"}
                size="sm"
                onClick={() => setSelectedRetailer(retailer.id)}
                className="transition-smooth"
              >
                <ShoppingCart className="w-4 h-4" />
                {retailer.name}
              </Button>
            ))}
          </div>
        </div>
      </Card>

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

      {/* Info Section */}
      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">How It Works</h3>
          </div>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Search for products across major Indian retailers</li>
            <li>Click any result to automatically get CashKaro cashback tracking</li>
            <li>Shop normally and earn cashback without extra steps</li>
          </ol>
        </div>
      </Card>
    </div>
  );
};

export default SearchInterface;