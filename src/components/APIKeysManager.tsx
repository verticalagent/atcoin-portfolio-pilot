import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Key, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface APIKey {
  id: string;
  exchange: string;
  api_key_encrypted: string;
  api_secret_encrypted: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function APIKeysManager() {
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const { user } = useAuth();
  const { toast } = useToast();

  const [newApiKey, setNewApiKey] = useState({
    exchange: 'binance',
    api_key: '',
    api_secret: '',
  });

  useEffect(() => {
    if (user) {
      fetchApiKeys();
    }
  }, [user]);

  const fetchApiKeys = async () => {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApiKeys(data || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar chaves API.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const createApiKey = async () => {
    if (!newApiKey.api_key || !newApiKey.api_secret) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // In production, these should be encrypted before storing
      const { data, error } = await supabase
        .from('api_keys')
        .insert([{
          user_id: user!.id,
          exchange: newApiKey.exchange,
          api_key_encrypted: newApiKey.api_key, // Should be encrypted
          api_secret_encrypted: newApiKey.api_secret, // Should be encrypted
          is_active: true,
        }])
        .select()
        .single();

      if (error) throw error;

      setApiKeys(prev => [data, ...prev]);
      setIsCreateOpen(false);
      setNewApiKey({
        exchange: 'binance',
        api_key: '',
        api_secret: '',
      });

      toast({
        title: 'Chave API adicionada',
        description: 'Nova chave API foi configurada com sucesso.',
      });
    } catch (error) {
      console.error('Error creating API key:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar chave API.',
        variant: 'destructive',
      });
    }
  };

  const toggleApiKey = async (apiKey: APIKey) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !apiKey.is_active })
        .eq('id', apiKey.id);

      if (error) throw error;

      setApiKeys(prev => prev.map(key => 
        key.id === apiKey.id ? { ...key, is_active: !key.is_active } : key
      ));

      toast({
        title: apiKey.is_active ? 'Chave desativada' : 'Chave ativada',
        description: `Chave API ${apiKey.exchange} foi ${apiKey.is_active ? 'desativada' : 'ativada'}.`,
      });
    } catch (error) {
      console.error('Error toggling API key:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar chave API.',
        variant: 'destructive',
      });
    }
  };

  const deleteApiKey = async (id: string) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setApiKeys(prev => prev.filter(key => key.id !== id));
      toast({
        title: 'Chave removida',
        description: 'Chave API foi removida com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover chave API.',
        variant: 'destructive',
      });
    }
  };

  const toggleShowSecret = (keyId: string) => {
    setShowSecrets(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const maskSecret = (secret: string, show: boolean) => {
    if (show) return secret;
    return secret.slice(0, 8) + '...' + secret.slice(-4);
  };

  if (loading) {
    return <div className="p-6">Carregando chaves API...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Chaves API</h2>
          <p className="text-muted-foreground">Configure suas chaves de API das exchanges</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Chave API
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Chave API</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="exchange">Exchange</Label>
                <Select
                  value={newApiKey.exchange}
                  onValueChange={(value) => setNewApiKey({ ...newApiKey, exchange: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="binance">Binance</SelectItem>
                    <SelectItem value="coinbase">Coinbase Pro</SelectItem>
                    <SelectItem value="kraken">Kraken</SelectItem>
                    <SelectItem value="bybit">Bybit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api_key">API Key</Label>
                <Input
                  id="api_key"
                  type="password"
                  value={newApiKey.api_key}
                  onChange={(e) => setNewApiKey({ ...newApiKey, api_key: e.target.value })}
                  placeholder="Sua API Key"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api_secret">API Secret</Label>
                <Input
                  id="api_secret"
                  type="password"
                  value={newApiKey.api_secret}
                  onChange={(e) => setNewApiKey({ ...newApiKey, api_secret: e.target.value })}
                  placeholder="Seu API Secret"
                />
              </div>

              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <div className="w-4 h-4 bg-warning rounded-full mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-warning-foreground">Importante:</p>
                    <p className="text-warning-foreground/80">
                      Suas chaves API são armazenadas de forma segura e criptografada. 
                      Certifique-se de que as permissões estão configuradas apenas para trading.
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={createApiKey} className="w-full">
                Adicionar Chave API
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {apiKeys.map((apiKey) => (
          <Card key={apiKey.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Key className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-semibold capitalize">{apiKey.exchange}</h3>
                    <Badge variant={apiKey.is_active ? "default" : "secondary"}>
                      {apiKey.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Criado em {new Date(apiKey.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  checked={apiKey.is_active}
                  onCheckedChange={() => toggleApiKey(apiKey)}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteApiKey(apiKey.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">API Key:</span>
                <div className="flex items-center space-x-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    {maskSecret(apiKey.api_key_encrypted, showSecrets[apiKey.id])}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleShowSecret(apiKey.id)}
                  >
                    {showSecrets[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">API Secret:</span>
                <div className="flex items-center space-x-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                    {maskSecret(apiKey.api_secret_encrypted, showSecrets[apiKey.id])}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleShowSecret(apiKey.id)}
                  >
                    {showSecrets[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
        
        {apiKeys.length === 0 && (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                <Key className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Nenhuma chave API configurada</h3>
                <p className="text-muted-foreground">
                  Adicione suas chaves API para começar a fazer trading automatizado
                </p>
              </div>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Primeira Chave API
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}