import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTradingStrategies, TradingStrategy } from '@/hooks/useTradingData';
import { Plus, Play, Pause, Settings, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TradingStrategies() {
  const { strategies, loading, createStrategy, updateStrategy, deleteStrategy } = useTradingStrategies();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<TradingStrategy | null>(null);
  const { toast } = useToast();

  const [newStrategy, setNewStrategy] = useState({
    name: '',
    description: '',
    strategy_type: 'sma_crossover',
    risk_level: 'medium',
    is_active: false,
    parameters: {
      symbols: ['BTCUSDT', 'ETHUSDT'],
      min_confidence: 70,
      max_risk_per_trade: 0.02,
      account_value: 1000
    }
  });

  const handleCreateStrategy = async () => {
    try {
      await createStrategy(newStrategy);
      setIsCreateOpen(false);
      setNewStrategy({
        name: '',
        description: '',
        strategy_type: 'sma_crossover',
        risk_level: 'medium',
        parameters: {
          symbols: ['BTCUSDT', 'ETHUSDT'],
          min_confidence: 70,
          max_risk_per_trade: 0.02,
          account_value: 1000
        }
      });
      toast({
        title: 'Estratégia criada',
        description: 'Nova estratégia de trading foi criada com sucesso.',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao criar estratégia.',
        variant: 'destructive',
      });
    }
  };

  const toggleStrategy = async (strategy: TradingStrategy) => {
    try {
      await updateStrategy(strategy.id, { is_active: !strategy.is_active });
      toast({
        title: strategy.is_active ? 'Estratégia pausada' : 'Estratégia ativada',
        description: `${strategy.name} foi ${strategy.is_active ? 'pausada' : 'ativada'}.`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar estratégia.',
        variant: 'destructive',
      });
    }
  };

  const executeStrategy = async (strategyId: string) => {
    try {
      const response = await fetch('/functions/v1/trading-engine', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
        },
        body: JSON.stringify({
          action: 'executeStrategy',
          strategyId
        }),
      });

      const result = await response.json();
      
      toast({
        title: 'Estratégia executada',
        description: `Estratégia executada com ${result.length} ações.`,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao executar estratégia.',
        variant: 'destructive',
      });
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-success';
      case 'medium': return 'bg-warning';
      case 'high': return 'bg-destructive';
      default: return 'bg-muted';
    }
  };

  if (loading) {
    return <div className="p-6">Carregando estratégias...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Estratégias de Trading</h2>
          <p className="text-muted-foreground">Gerencie suas estratégias automatizadas</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Estratégia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Criar Nova Estratégia</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={newStrategy.name}
                    onChange={(e) => setNewStrategy({ ...newStrategy, name: e.target.value })}
                    placeholder="Nome da estratégia"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="strategy_type">Tipo</Label>
                  <Select
                    value={newStrategy.strategy_type}
                    onValueChange={(value) => setNewStrategy({ ...newStrategy, strategy_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sma_crossover">SMA Crossover</SelectItem>
                      <SelectItem value="rsi_strategy">RSI Strategy</SelectItem>
                      <SelectItem value="bollinger_bands">Bollinger Bands</SelectItem>
                      <SelectItem value="momentum">Momentum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newStrategy.description}
                  onChange={(e) => setNewStrategy({ ...newStrategy, description: e.target.value })}
                  placeholder="Descreva sua estratégia..."
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="risk_level">Nível de Risco</Label>
                  <Select
                    value={newStrategy.risk_level}
                    onValueChange={(value) => setNewStrategy({ ...newStrategy, risk_level: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixo</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="min_confidence">Confiança Mín. (%)</Label>
                  <Input
                    id="min_confidence"
                    type="number"
                    value={newStrategy.parameters.min_confidence}
                    onChange={(e) => setNewStrategy({
                      ...newStrategy,
                      parameters: { ...newStrategy.parameters, min_confidence: Number(e.target.value) }
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="max_risk">Risco Máx. (%)</Label>
                  <Input
                    id="max_risk"
                    type="number"
                    step="0.01"
                    value={newStrategy.parameters.max_risk_per_trade * 100}
                    onChange={(e) => setNewStrategy({
                      ...newStrategy,
                      parameters: { ...newStrategy.parameters, max_risk_per_trade: Number(e.target.value) / 100 }
                    })}
                  />
                </div>
              </div>

              <Button onClick={handleCreateStrategy} className="w-full">
                Criar Estratégia
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {strategies.map((strategy) => (
          <Card key={strategy.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h3 className="text-lg font-semibold">{strategy.name}</h3>
                  <p className="text-sm text-muted-foreground">{strategy.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="outline">{strategy.strategy_type}</Badge>
                    <Badge className={getRiskLevelColor(strategy.risk_level)}>
                      {strategy.risk_level}
                    </Badge>
                    <Badge variant={strategy.is_active ? "default" : "secondary"}>
                      {strategy.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={strategy.is_active}
                  onCheckedChange={() => toggleStrategy(strategy)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => executeStrategy(strategy.id)}
                  disabled={!strategy.is_active}
                >
                  <Play className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingStrategy(strategy)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteStrategy(strategy.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-muted/50 rounded-lg">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Símbolos:</span>
                  <p className="font-medium">
                    {strategy.parameters.symbols?.join(', ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Confiança Mín.:</span>
                  <p className="font-medium">{strategy.parameters.min_confidence || 70}%</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Risco Máx.:</span>
                  <p className="font-medium">{((strategy.parameters.max_risk_per_trade || 0.02) * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
        
        {strategies.length === 0 && (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <Settings className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Nenhuma estratégia criada</h3>
                <p className="text-muted-foreground">
                  Crie sua primeira estratégia de trading automatizada
                </p>
              </div>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Estratégia
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}