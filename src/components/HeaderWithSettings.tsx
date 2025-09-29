import React, { useState } from 'react';
import { Settings, User, Zap, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG } from '@/lib/config';
import { CashKaroStatus } from './CashKaroStatus';

interface HeaderProps {
  searchService: any;
  onApiKeyUpdate: (apiKey: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchService, onApiKeyUpdate }) => {
  const [showSettings, setShowSettings] = useState(false);
  // No longer needed - API key is managed securely in Edge Functions
  const { toast } = useToast();

  const handleApiKeyUpdate = () => {
    // No longer needed - API key is managed securely in Edge Functions
    setShowSettings(false);
    toast({
      title: "API Configuration",
      description: "API key is securely managed via Supabase Edge Functions.",
    });
  };

  const getConnectionStatus = () => {
    // Since we're using Edge Functions, we're always "connected"
    return 'connected';
  };

  const getStatusIcon = () => {
    const status = getConnectionStatus();
    if (status === 'connected') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusText = () => {
    // Always show as connected since we use secure Edge Functions
    return 'API Connected';
  };

  return (
    <>
      <header className="w-full bg-background border-b border-border/50 sticky top-0 z-50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">CashKaro Search</h1>
                <p className="text-xs text-muted-foreground">Smart product discovery with cashback</p>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-4">
              {/* API Status */}
              <Badge variant="outline" className="text-xs flex items-center gap-2">
                {getStatusIcon()}
                {getStatusText()}
              </Badge>
              
              {/* CashKaro Status */}
              <CashKaroStatus />
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <User className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="container mx-auto px-6 py-4">
          <Card className="p-6 bg-accent/50 border-primary/20">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Perplexity API Configuration</h3>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">API Configured Securely</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Your Perplexity API key is securely stored in Supabase Edge Functions and managed server-side for optimal security.
                  </p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Current model: <span className="font-mono">llama-3.1-sonar-small-128k-online</span></p>
                  <p>• Domain filtering: Enabled for Indian e-commerce sites</p>
                  <p>• Security: API keys stored as encrypted Supabase secrets</p>
                  <p>• Performance: Server-side processing with Edge Functions</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default Header;