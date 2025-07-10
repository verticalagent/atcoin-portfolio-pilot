-- Criação das tabelas principais para o sistema BIA Trading
-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de configurações de API keys
CREATE TABLE public.api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exchange TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  api_secret_encrypted TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de estratégias de trading
CREATE TABLE public.trading_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  strategy_type TEXT NOT NULL,
  parameters JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT false,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de portfólio
CREATE TABLE public.portfolio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  quantity DECIMAL(20,8) NOT NULL DEFAULT 0,
  avg_price DECIMAL(20,8) NOT NULL DEFAULT 0,
  current_price DECIMAL(20,8) NOT NULL DEFAULT 0,
  total_value DECIMAL(20,2) NOT NULL DEFAULT 0,
  pnl_percentage DECIMAL(10,4) NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de ordens de trading
CREATE TABLE public.trading_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy_id UUID REFERENCES public.trading_strategies(id),
  exchange TEXT NOT NULL,
  symbol TEXT NOT NULL,
  side TEXT NOT NULL, -- 'buy' or 'sell'
  order_type TEXT NOT NULL, -- 'market', 'limit', 'stop'
  quantity DECIMAL(20,8) NOT NULL,
  price DECIMAL(20,8),
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'filled', 'cancelled'
  external_order_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  filled_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de logs do sistema
CREATE TABLE public.system_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  level TEXT NOT NULL, -- 'info', 'warning', 'error'
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de preços históricos
CREATE TABLE public.price_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  price DECIMAL(20,8) NOT NULL,
  volume DECIMAL(20,8),
  market_cap DECIMAL(20,2),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indices para performance
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX idx_trading_strategies_user_id ON public.trading_strategies(user_id);
CREATE INDEX idx_portfolio_user_id ON public.portfolio(user_id);
CREATE INDEX idx_trading_orders_user_id ON public.trading_orders(user_id);
CREATE INDEX idx_system_logs_user_id ON public.system_logs(user_id);
CREATE INDEX idx_price_history_symbol ON public.price_history(symbol);
CREATE INDEX idx_price_history_timestamp ON public.price_history(timestamp);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Políticas RLS para api_keys
CREATE POLICY "Users can view their own API keys" 
ON public.api_keys FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys" 
ON public.api_keys FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" 
ON public.api_keys FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" 
ON public.api_keys FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para trading_strategies
CREATE POLICY "Users can view their own strategies" 
ON public.trading_strategies FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own strategies" 
ON public.trading_strategies FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own strategies" 
ON public.trading_strategies FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own strategies" 
ON public.trading_strategies FOR DELETE 
USING (auth.uid() = user_id);

-- Políticas RLS para portfolio
CREATE POLICY "Users can view their own portfolio" 
ON public.portfolio FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own portfolio" 
ON public.portfolio FOR ALL 
USING (auth.uid() = user_id);

-- Políticas RLS para trading_orders
CREATE POLICY "Users can view their own orders" 
ON public.trading_orders FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own orders" 
ON public.trading_orders FOR ALL 
USING (auth.uid() = user_id);

-- Políticas RLS para system_logs
CREATE POLICY "Users can view their own logs" 
ON public.system_logs FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can create logs" 
ON public.system_logs FOR INSERT 
WITH CHECK (true);

-- Política RLS para price_history (público)
CREATE POLICY "Everyone can read price history" 
ON public.price_history FOR SELECT 
USING (true);

CREATE POLICY "System can insert price history" 
ON public.price_history FOR INSERT 
WITH CHECK (true);

-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar timestamps
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON public.api_keys
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trading_strategies_updated_at
  BEFORE UPDATE ON public.trading_strategies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar perfil automaticamente
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();