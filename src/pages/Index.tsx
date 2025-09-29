import React, { useState, useEffect } from 'react';
import HeaderWithSettings from '@/components/HeaderWithSettings';
import HeroSection from '@/components/HeroSection';
import SearchInterface from '@/components/SearchInterface';
import SearchService from '@/lib/searchService';
import { API_CONFIG } from '@/lib/config';

const Index = () => {
  const [searchService, setSearchService] = useState<SearchService | null>(null);

  // Initialize search service with default API key
  useEffect(() => {
    if (API_CONFIG.PERPLEXITY_API_KEY) {
      setSearchService(new SearchService(API_CONFIG.PERPLEXITY_API_KEY));
    }
  }, []);

  const handleApiKeyUpdate = (apiKey: string) => {
    if (apiKey.trim()) {
      setSearchService(new SearchService(apiKey));
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <HeaderWithSettings 
        searchService={searchService} 
        onApiKeyUpdate={handleApiKeyUpdate}
      />
      <HeroSection />
      
      {/* Search Section */}
      <main id="search-section" className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Search Products & Earn Cashback
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Find the best deals across top Indian retailers with automatic CashKaro tracking
          </p>
        </div>
        
        <SearchInterface />
      </main>
      
      {/* Footer */}
      <footer className="bg-muted/30 border-t border-border/50 py-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-muted-foreground">
            Built for CashKaro users • Automatic cashback tracking • Smart product discovery
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
