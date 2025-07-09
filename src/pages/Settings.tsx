import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { Eye, EyeOff, Key, Bot, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [formData, setFormData] = useState({
    atcoinApiUrl: "https://your-atcoin-api.herokuapp.com",
    atcoinApiKey: "",
    binanceApiKey: "",
    binanceApiSecret: "",
    rebalanceInterval: "6",
    minTradeAmount: "10",
    autoRebalance: true,
    notifications: true
  });
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const handleSave = () => {
    // Simular salvamento das configurações
    toast({
      title: "Configurações salvas",
      description: "Suas configurações foram salvas com sucesso.",
    });
    setIsConnected(true);
  };

  const testConnection = () => {
    // Simular teste de conexão
    toast({
      title: "Testando conexões...",
      description: "Verificando conectividade com APIs.",
    });
    
    setTimeout(() => {
      toast({
        title: "Conexões testadas",
        description: "Todas as APIs estão respondendo corretamente.",
      });
      setIsConnected(true);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-2">
          Configure suas credenciais de API e parâmetros de trading
        </p>
      </div>

      {/* Status de Conexão */}
      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Status das Conexões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">API ATCoin</p>
                <p className="text-sm text-muted-foreground">Inteligência de trading</p>
              </div>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">Binance API</p>
                <p className="text-sm text-muted-foreground">Exchange de criptomoedas</p>
              </div>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações da API ATCoin */}
      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Configurações ATCoin API
          </CardTitle>
          <CardDescription>
            Configure o acesso à API de inteligência artificial para trading
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="atcoin-url">URL da API ATCoin</Label>
            <Input
              id="atcoin-url"
              value={formData.atcoinApiUrl}
              onChange={(e) => setFormData({...formData, atcoinApiUrl: e.target.value})}
              placeholder="https://your-atcoin-api.herokuapp.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="atcoin-key">Chave da API ATCoin</Label>
            <div className="relative">
              <Input
                id="atcoin-key"
                type={showApiKeys ? "text" : "password"}
                value={formData.atcoinApiKey}
                onChange={(e) => setFormData({...formData, atcoinApiKey: e.target.value})}
                placeholder="Insira sua chave da API ATCoin"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowApiKeys(!showApiKeys)}
              >
                {showApiKeys ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configurações da Binance */}
      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Configurações Binance API
          </CardTitle>
          <CardDescription>
            Configure suas credenciais da Binance para execução de trades
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-warning/10 rounded-lg border border-warning/20">
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="w-4 h-4 text-warning" />
              <span className="text-warning font-medium">
                Importante: Use apenas chaves com permissões de Spot Trading. Nunca compartilhe suas chaves.
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="binance-key">Chave da API Binance</Label>
            <Input
              id="binance-key"
              type={showApiKeys ? "text" : "password"}
              value={formData.binanceApiKey}
              onChange={(e) => setFormData({...formData, binanceApiKey: e.target.value})}
              placeholder="Insira sua chave da API Binance"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="binance-secret">Segredo da API Binance</Label>
            <Input
              id="binance-secret"
              type={showApiKeys ? "text" : "password"}
              value={formData.binanceApiSecret}
              onChange={(e) => setFormData({...formData, binanceApiSecret: e.target.value})}
              placeholder="Insira seu segredo da API Binance"
            />
          </div>
        </CardContent>
      </Card>

      {/* Configurações do Bot */}
      <Card className="border-border bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Configurações do Trading Bot
          </CardTitle>
          <CardDescription>
            Defina os parâmetros de funcionamento do bot de trading
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="rebalance-interval">Intervalo de Rebalanceamento (horas)</Label>
              <Input
                id="rebalance-interval"
                type="number"
                value={formData.rebalanceInterval}
                onChange={(e) => setFormData({...formData, rebalanceInterval: e.target.value})}
                placeholder="6"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="min-trade">Valor Mínimo de Trade (USDT)</Label>
              <Input
                id="min-trade"
                type="number"
                value={formData.minTradeAmount}
                onChange={(e) => setFormData({...formData, minTradeAmount: e.target.value})}
                placeholder="10"
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-rebalance">Rebalanceamento Automático</Label>
                <p className="text-sm text-muted-foreground">
                  Executar rebalanceamento automaticamente baseado na IA
                </p>
              </div>
              <Switch
                id="auto-rebalance"
                checked={formData.autoRebalance}
                onCheckedChange={(checked) => setFormData({...formData, autoRebalance: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notifications">Notificações</Label>
                <p className="text-sm text-muted-foreground">
                  Receber notificações sobre trades e rebalanceamentos
                </p>
              </div>
              <Switch
                id="notifications"
                checked={formData.notifications}
                onCheckedChange={(checked) => setFormData({...formData, notifications: checked})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Botões de Ação */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={testConnection}>
          Testar Conexões
        </Button>
        <Button onClick={handleSave}>
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}