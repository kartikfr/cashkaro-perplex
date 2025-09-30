import React, { useState } from 'react';
import { Zap, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CashKaroStatus } from './CashKaroStatus';

interface HeaderProps {
  searchService: any;
  onApiKeyUpdate: (apiKey: string) => void;
}

const Header: React.FC<HeaderProps> = ({ searchService, onApiKeyUpdate }) => {
  const [refreshTick, setRefreshTick] = useState(0);
  const [apiStatus, setApiStatus] = useState<'connected' | 'checking' | 'error'>('connected');
  const { toast } = useToast();

  const checkApiStatus = async () => {
    setApiStatus('checking');
    try {
      const { error } = await supabase.functions.invoke('search-products', {
        body: { query: 'health-check', retailer: 'all', limit: 1 }
      });
      if (error) throw error;
      setApiStatus('connected');
    } catch (e) {
      setApiStatus('error');
    }
  };

  const handleRefresh = async () => {
    await checkApiStatus();
    setRefreshTick((t) => t + 1);
    if (apiStatus === 'error') {
      toast({ title: 'API Check Failed', description: 'Could not reach the API.', variant: 'destructive' });
    } else {
      toast({ title: 'Statuses Updated', description: 'API and CashKaro statuses refreshed.' });
    }
  };

  const getConnectionStatus = () => {
    return apiStatus;
  };

  const getStatusIcon = () => {
    const status = getConnectionStatus();
    if (status === 'checking') {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    if (status === 'connected') {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (apiStatus === 'checking') return 'Checking API…';
    if (apiStatus === 'connected') return 'API Connected';
    return 'API Error';
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
              <CashKaroStatus refreshSignal={refreshTick} />
              
              <Button variant="secondary" size="sm" onClick={handleRefresh} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>
      {/* Settings panel removed per request */}
    </>
  );
};

export default Header;