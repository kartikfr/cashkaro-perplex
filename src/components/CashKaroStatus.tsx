import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CashKaroAuthStatus {
  isSignedIn: boolean;
  userInfo?: {
    email?: string;
    name?: string;
  };
  timestamp?: string;
}

export const CashKaroStatus: React.FC = () => {
  const [authStatus, setAuthStatus] = useState<CashKaroAuthStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const { toast } = useToast();

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      console.log('Checking CashKaro authentication status');
      
      const { data, error } = await supabase.functions.invoke('check-cashkaro-auth');
      
      if (error) {
        console.error('Error checking CashKaro auth:', error);
        toast({
          title: "Check Failed",
          description: "Could not verify CashKaro login status",
          variant: "destructive",
        });
        return;
      }

      setAuthStatus(data);
      
      if (data.isSignedIn) {
        toast({
          title: "Signed In",
          description: "Connected to CashKaro account",
        });
      } else {
        toast({
          title: "Not Signed In",
          description: "Please sign in to CashKaro for cashback",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      console.error('Failed to check CashKaro auth:', error);
      toast({
        title: "Error",
        description: "Failed to check CashKaro status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openCashKaro = () => {
    window.open('https://cashkaro.com/', '_blank');
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const getStatusIcon = () => {
    if (isLoading) {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    
    if (authStatus?.isSignedIn) {
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    }
    
    return <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusText = () => {
    if (isLoading) {
      return 'Checking...';
    }
    
    if (authStatus?.isSignedIn) {
      return 'CashKaro Connected';
    }
    
    return 'CashKaro Disconnected';
  };

  const handleStatusClick = () => {
    if (!authStatus?.isSignedIn) {
      openCashKaro();
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`text-xs flex items-center gap-2 ${!authStatus?.isSignedIn ? 'cursor-pointer hover:bg-accent' : ''}`}
      onClick={handleStatusClick}
      title={!authStatus?.isSignedIn ? 'Click to connect CashKaro' : 'CashKaro is connected'}
    >
      {getStatusIcon()}
      {getStatusText()}
    </Badge>
  );
};