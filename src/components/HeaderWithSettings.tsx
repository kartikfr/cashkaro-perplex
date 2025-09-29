import React, { useState } from 'react';
import { Settings, User, Zap, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { API_CONFIG } from '@/lib/config';

interface HeaderProps {
  searchService: any;
  onApiKeyUpdate: (apiKey: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchService, onApiKeyUpdate }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(API_CONFIG.PERPLEXITY_API_KEY as string);
  const { toast } = useToast();

  const handleApiKeyUpdate = () => {
    if (tempApiKey.trim()) {
      onApiKeyUpdate(tempApiKey);
      setShowSettings(false);
      toast({
        title: "API Key Updated",
        description: "Perplexity API key has been updated successfully.",
      });
    }
  };

  const getConnectionStatus = () => {
    return searchService ? 'connected' : 'disconnected';
  };

  const getStatusIcon = () => {
    const status = getConnectionStatus();
    if (status === 'connected') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusText = () => {
    const status = getConnectionStatus();
    return status === 'connected' ? 'API Connected' : 'API Disconnected';
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
              <Badge variant="outline" className="text-xs flex items-center gap-2">
                {getStatusIcon()}
                {getStatusText()}
              </Badge>
              
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
                <h3 className="font-semibold">API Configuration</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Configure your Perplexity API key for enhanced search capabilities.
              </p>
              <div className="flex gap-3">
                <Input
                  type="password"
                  placeholder="Enter your Perplexity API key"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleApiKeyUpdate}
                  disabled={!tempApiKey.trim()}
                >
                  Update Key
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setShowSettings(false)}
                >
                  Cancel
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Current model: <span className="font-mono">sonar</span> (Perplexity Search)</p>
                <p>• Domain filtering: Enabled for Indian e-commerce sites</p>
                <p>• Get your API key from{' '}
                  <a href="https://perplexity.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Perplexity AI
                  </a>
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default Header;