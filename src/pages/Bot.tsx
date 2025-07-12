import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTradingStrategies, usePortfolio } from '@/hooks/useTradingData';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Bot as BotIcon, 
  DollarSign,
  AlertTriangle,
  Activity
} from 'lucide-react';

export default function Bot() {
  const { user } = useAuth();
  const { strategies, loading: strategiesLoading } = useTradingStrategies();
  const { portfolio, loading: portfolioLoading, refetch: refetchPortfolio } = usePortfolio();
  const [botStatus, setBotStatus] = useState<any[]>([]);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchBotStatus();
    }
  }, [user]);

  const fetchBotStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('trading-engine', {
        body: { action: 'getBotStatus' }
      });
      if (error) throw error;
      setBotStatus(data.botStatus || []);
    } catch (error) {
      console.error('Error fetching bot status:', error);
    }
  };

  const loadPortfolio = async () => {
    setIsLoadingPortfolio(true);
    try {
      const { data, error } = await supabase.functions.invoke('binance-service', {
        body: { action: 'getPortfolio' }
      });
      if (error) throw error;
      await refetchPortfolio();
      toast({
        title: 'Portfólio Atualizado',
        description: `Sincronizado com sucesso da Binance`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Falha ao carregar portfólio da Binance.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingPortfolio(false);
    }
  };

  const startBot = async (strategyId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('trading-engine', {
        body: { action: 'startBot', strategyId, interval: 300000 }
      });
      if (error) throw error;
      toast({ title: 'Bot Iniciado', description: data.message });
      fetchBotStatus();
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao iniciar bot.', variant: 'destructive' });
    }
  };

  const stopBot = async (strategyId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('trading-engine', {
        body: { action: 'stopBot', strategyId }
      });
      if (error) throw error;
      toast({ title: 'Bot Parado', description: data.message });
      fetchBotStatus();
    } catch (error) {
      toast({ title: 'Erro', description: 'Falha ao parar bot.', variant: 'destructive' });
    }
  };

  const activeBots = botStatus.filter(bot => bot.botActive).length;
  const totalPortfolioValue = portfolio.reduce((sum, item) => sum + item.total_value, 0);

  if (strategiesLoading || portfolioLoading) {
    return <div className="p-6">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BotIcon className="h-8 w-8" />
            Trading Bot
          </h1>
          <p className="text-muted-foreground">
            Controle e monitore seus bots de trading automatizados
          </p>
        </div>
        
        <Button onClick={loadPortfolio} disabled={isLoadingPortfolio}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingPortfolio ? 'animate-spin' : ''}`} />
          Sincronizar Binance
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bots Ativos</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeBots}</div>
            <p className="text-xs text-muted-foreground">de {strategies.length} estratégias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPortfolioValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Portfólio atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{portfolio.length}</div>
            <p className="text-xs text-muted-foreground">Diferentes moedas</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="bots" className="space-y-4">
        <TabsList>
          <TabsTrigger value="bots">Controle de Bots</TabsTrigger>
          <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
        </TabsList>

        <TabsContent value="bots" className="space-y-4">
          {strategies.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Nenhuma estratégia encontrada. Crie uma estratégia primeiro para usar o bot.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {strategies.map((strategy) => {
                const status = botStatus.find(s => s.strategyId === strategy.id);
                const isRunning = status?.botActive || false;
                
                return (
                  <Card key={strategy.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            {strategy.name}
                            <Badge variant={strategy.is_active ? "default" : "secondary"}>
                              {strategy.is_active ? 'Ativo' : 'Inativo'}
                            </Badge>
                            {isRunning && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <Activity className="w-3 h-3 mr-1" />
                                Bot Rodando
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription>{strategy.description}</CardDescription>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {isRunning ? (
                            <Button variant="destructive" size="sm" onClick={() => stopBot(strategy.id)}>
                              <Pause className="h-4 w-4 mr-2" />
                              Parar Bot
                            </Button>
                          ) : (
                            <Button onClick={() => startBot(strategy.id)} disabled={!strategy.is_active} size="sm">
                              <Play className="h-4 w-4 mr-2" />
                              Iniciar Bot
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4">
          <div className="grid gap-4">
            {portfolio.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{item.symbol}</h3>
                      <p className="text-sm text-muted-foreground">
                        Quantidade: {item.quantity.toFixed(6)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">${item.total_value.toFixed(2)}</div>
                      <div className="text-sm text-muted-foreground">
                        @${item.current_price.toFixed(6)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}