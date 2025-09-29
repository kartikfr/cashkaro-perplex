import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, RefreshCw, User, LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

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
  const [isLoading, setIsLoading] = useState(false);
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

  const getStatusBadge = () => {
    if (isLoading) {
      return (
        <Badge variant="outline" className="animate-pulse">
          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
          Checking...
        </Badge>
      );
    }

    if (!authStatus) {
      return (
        <Badge variant="destructive">
          <LogOut className="w-3 h-3 mr-1" />
          Unknown
        </Badge>
      );
    }

    if (authStatus.isSignedIn) {
      return (
        <Badge variant="default" className="bg-green-600 hover:bg-green-700">
          <User className="w-3 h-3 mr-1" />
          Connected
        </Badge>
      );
    }

    return (
      <Badge variant="destructive">
        <LogOut className="w-3 h-3 mr-1" />
        Not Connected
      </Badge>
    );
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusBadge()}
      
      {authStatus?.userInfo?.name && (
        <span className="text-sm text-muted-foreground">
          {authStatus.userInfo.name}
        </span>
      )}
      
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={checkAuthStatus}
          disabled={isLoading}
          className="h-8 px-2"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={openCashKaro}
          className="h-8 px-2"
        >
          <ExternalLink className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};