import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity,
  Target,
  RefreshCw
} from "lucide-react";
import { usePortfolio, useTradingOrders } from "@/hooks/useTradingData";
import { supabase } from "@/integrations/supabase/client";

interface PriceHistory {
  id: string;
  symbol: string;
  price: number;
  timestamp: string;
  volume?: number;
  market_cap?: number;
}

export default function Analytics() {
  const { portfolio, loading: portfolioLoading, refetch: refetchPortfolio } = usePortfolio();
  const { orders, loading: ordersLoading } = useTradingOrders();
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    fetchPriceHistory();
  }, []);

  const fetchPriceHistory = async () => {
    try {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('price_history')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (error) throw error;
      setPriceHistory(data || []);
    } catch (error) {
      console.error('Error fetching price history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const calculatePortfolioStats = () => {
    if (!portfolio || portfolio.length === 0) {
      return {
        totalValue: 0,
        totalPnL: 0,
        totalPnLPercentage: 0,
        bestPerformer: null,
        worstPerformer: null
      };
    }

    const totalValue = portfolio.reduce((sum, item) => sum + Number(item.total_value), 0);
    const totalPnL = portfolio.reduce((sum, item) => {
      const pnl = (Number(item.current_price) - Number(item.avg_price)) * Number(item.quantity);
      return sum + pnl;
    }, 0);
    const totalPnLPercentage = portfolio.reduce((sum, item) => sum + Number(item.pnl_percentage), 0) / portfolio.length;

    const sortedByPnL = [...portfolio].sort((a, b) => Number(b.pnl_percentage) - Number(a.pnl_percentage));
    const bestPerformer = sortedByPnL[0];
    const worstPerformer = sortedByPnL[sortedByPnL.length - 1];

    return {
      totalValue,
      totalPnL,
      totalPnLPercentage,
      bestPerformer,
      worstPerformer
    };
  };

  const calculateTradingStats = () => {
    if (!orders || orders.length === 0) {
      return {
        totalTrades: 0,
        successfulTrades: 0,
        successRate: 0,
        totalVolume: 0
      };
    }

    const totalTrades = orders.length;
    const successfulTrades = orders.filter(order => order.status === 'filled').length;
    const successRate = totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0;
    const totalVolume = orders.reduce((sum, order) => {
      if (order.status === 'filled' && order.price) {
        return sum + (Number(order.price) * Number(order.quantity));
      }
      return sum;
    }, 0);

    return {
      totalTrades,
      successfulTrades,
      successRate,
      totalVolume
    };
  };

  const stats = calculatePortfolioStats();
  const tradingStats = calculateTradingStats();

  const refresh = () => {
    refetchPortfolio();
    fetchPriceHistory();
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-2">
              Análise detalhada do seu portfólio e performance de trading
            </p>
          </div>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-border bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className={`text-xs mt-1 ${stats.totalPnL >= 0 ? 'text-success' : 'text-destructive'}`}>
                {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Performance
              </CardTitle>
              {stats.totalPnLPercentage >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <TrendingDown className="h-4 w-4 text-destructive" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.totalPnLPercentage >= 0 ? 'text-success' : 'text-destructive'}`}>
                {stats.totalPnLPercentage >= 0 ? '+' : ''}{stats.totalPnLPercentage.toFixed(2)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Performance média</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Trades
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tradingStats.totalTrades}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {tradingStats.successfulTrades} executadas
              </p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Sucesso
              </CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tradingStats.successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Volume: ${tradingStats.totalVolume.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="portfolio" className="space-y-4">
          <TabsList>
            <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="history">Histórico de Preços</TabsTrigger>
          </TabsList>

          <TabsContent value="portfolio" className="space-y-4">
            <Card className="border-border bg-card/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Análise do Portfólio
                </CardTitle>
              </CardHeader>
              <CardContent>
                {portfolioLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                ) : portfolio && portfolio.length > 0 ? (
                  <div className="space-y-4">
                    {portfolio.map((item) => (
                      <div key={item.id} className="p-4 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">{item.symbol}</span>
                            </div>
                            <div>
                              <p className="font-medium">{item.symbol}</p>
                              <p className="text-sm text-muted-foreground">
                                {Number(item.quantity).toLocaleString('pt-BR', { maximumFractionDigits: 8 })} tokens
                              </p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="font-bold">
                              ${Number(item.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <div className="flex items-center gap-1">
                              {Number(item.pnl_percentage) >= 0 ? (
                                <TrendingUp className="w-3 h-3 text-success" />
                              ) : (
                                <TrendingDown className="w-3 h-3 text-destructive" />
                              )}
                              <span className={`text-xs ${Number(item.pnl_percentage) >= 0 ? 'text-success' : 'text-destructive'}`}>
                                {Number(item.pnl_percentage) >= 0 ? '+' : ''}{Number(item.pnl_percentage).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Preço Médio:</span>
                            <p className="font-medium">${Number(item.avg_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Preço Atual:</span>
                            <p className="font-medium">${Number(item.current_price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Última Atualização:</span>
                            <p className="font-medium">{new Date(item.last_updated).toLocaleDateString('pt-BR')}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum ativo encontrado no portfólio
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-border bg-card/50">
                <CardHeader>
                  <CardTitle>Melhor Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.bestPerformer ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{stats.bestPerformer.symbol}</p>
                        <p className="text-sm text-muted-foreground">
                          ${Number(stats.bestPerformer.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <Badge className="bg-success/20 text-success">
                        +{Number(stats.bestPerformer.pnl_percentage).toFixed(2)}%
                      </Badge>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Sem dados</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border bg-card/50">
                <CardHeader>
                  <CardTitle>Pior Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.worstPerformer ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{stats.worstPerformer.symbol}</p>
                        <p className="text-sm text-muted-foreground">
                          ${Number(stats.worstPerformer.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <Badge variant="destructive" className="bg-destructive/20 text-destructive">
                        {Number(stats.worstPerformer.pnl_percentage).toFixed(2)}%
                      </Badge>
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Sem dados</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="border-border bg-card/50">
              <CardHeader>
                <CardTitle>Histórico de Preços</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  </div>
                ) : priceHistory.length > 0 ? (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {priceHistory.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/20">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-xs font-bold text-primary">{entry.symbol}</span>
                          </div>
                          <div>
                            <p className="font-medium">{entry.symbol}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.timestamp).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className="font-medium">
                            ${Number(entry.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                          {entry.volume && (
                            <p className="text-xs text-muted-foreground">
                              Vol: {Number(entry.volume).toLocaleString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhum histórico de preços encontrado
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}