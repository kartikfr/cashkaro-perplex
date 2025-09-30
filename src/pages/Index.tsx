import React, { useState } from 'react';
import HeaderWithSettings from '@/components/HeaderWithSettings';
import HeroSection from '@/components/HeroSection';
import CashKaroBenefits from '@/components/CashKaroBenefits';
import SearchInterface from '@/components/SearchInterface';
import SearchService from '@/lib/searchService';

const Index = () => {
  // Initialize with a default search service instance
  const [searchService] = useState<SearchService>(new SearchService());

  // This function is no longer needed since we use Edge Functions
  const handleApiKeyUpdate = (apiKey: string) => {
    // Legacy function - API key is now handled securely in Edge Functions
    console.log('API key management is now handled securely via Supabase Edge Functions');
  };

  return (
    <div className="min-h-screen bg-background">
      <HeaderWithSettings 
        searchService={searchService} 
        onApiKeyUpdate={handleApiKeyUpdate}
      />
      <HeroSection />
      
      {/* CashKaro Benefits Section */}
      <CashKaroBenefits />
      
      {/* Search Section */}
      <main id="search-section" className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Start Your CashKaro Shopping Journey
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Search across Amazon, Flipkart, Myntra & AJIO - get instant cashback links without the usual 5-step process
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
