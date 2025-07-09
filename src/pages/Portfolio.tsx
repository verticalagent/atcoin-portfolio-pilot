import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Wallet, TrendingUp, TrendingDown, DollarSign, Target, BarChart3 } from "lucide-react";

export default function Portfolio() {
  const assets = [
    {
      symbol: "BTC",
      name: "Bitcoin",
      balance: "0.285",
      value: "$12,150.00",
      percentage: 35.2,
      change24h: 5.24,
      allocation: { current: 35, target: 40 }
    },
    {
      symbol: "ETH",
      name: "Ethereum",
      balance: "4.82",
      value: "$9,640.00",
      percentage: 27.9,
      change24h: -2.18,
      allocation: { current: 28, target: 25 }
    },
    {
      symbol: "ADA",
      name: "Cardano",
      balance: "12,450",
      value: "$5,980.00",
      percentage: 17.3,
      change24h: 8.43,
      allocation: { current: 17, target: 20 }
    },
    {
      symbol: "SOL",
      name: "Solana",
      balance: "48.5",
      value: "$4,365.00",
      percentage: 12.6,
      change24h: 12.65,
      allocation: { current: 13, target: 10 }
    },
    {
      symbol: "USDT",
      name: "Tether",
      balance: "2,450.32",
      value: "$2,450.32",
      percentage: 7.0,
      change24h: 0.0,
      allocation: { current: 7, target: 5 }
    }
  ];

  const totalValue = assets.reduce((sum, asset) => sum + parseFloat(asset.value.replace('$', '').replace(',', '')), 0);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Portfólio</h1>
          <p className="text-muted-foreground mt-2">
            Visão geral dos seus investimentos em criptomoedas
          </p>
        </div>

        {/* Resumo do Portfólio */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-border bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Valor Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
              <p className="text-xs text-success mt-1">+$1,247 (3.8%) últimas 24h</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Performance
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">+18.7%</div>
              <p className="text-xs text-muted-foreground mt-1">Retorno mensal</p>
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Diversificação
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assets.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Ativos diferentes</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Ativos */}
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Seus Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assets.map((asset) => (
                <div key={asset.symbol} className="p-4 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">{asset.symbol}</span>
                      </div>
                      <div>
                        <p className="font-medium">{asset.name}</p>
                        <p className="text-sm text-muted-foreground">{asset.balance} {asset.symbol}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold">{asset.value}</p>
                      <div className="flex items-center gap-1">
                        {asset.change24h > 0 ? (
                          <TrendingUp className="w-3 h-3 text-success" />
                        ) : asset.change24h < 0 ? (
                          <TrendingDown className="w-3 h-3 text-destructive" />
                        ) : null}
                        <span className={`text-xs ${
                          asset.change24h > 0 ? 'text-success' : 
                          asset.change24h < 0 ? 'text-destructive' : 
                          'text-muted-foreground'
                        }`}>
                          {asset.change24h > 0 ? '+' : ''}{asset.change24h}%
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Porcentagem do Portfólio</span>
                      <span>{asset.percentage}%</span>
                    </div>
                    <Progress value={asset.percentage} className="h-2" />
                  </div>

                  <div className="mt-3 p-3 bg-background/50 rounded border">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Alocação</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          Atual: {asset.allocation.current}%
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Alvo: {asset.allocation.target}%
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <Progress value={asset.allocation.current} className="h-2" />
                      <div 
                        className="absolute top-0 w-0.5 h-2 bg-primary"
                        style={{ left: `${asset.allocation.target}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>

                    {asset.allocation.current !== asset.allocation.target && (
                      <div className="mt-2 flex items-center gap-2">
                        <Target className="w-3 h-3 text-warning" />
                        <span className="text-xs text-warning">
                          {asset.allocation.current > asset.allocation.target 
                            ? `Reduzir em ${asset.allocation.current - asset.allocation.target}%`
                            : `Aumentar em ${asset.allocation.target - asset.allocation.current}%`
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}