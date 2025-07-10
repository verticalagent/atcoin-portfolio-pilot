import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface TradingStrategy {
  id: string;
  name: string;
  description?: string;
  strategy_type: string;
  parameters: Record<string, any>;
  is_active: boolean;
  risk_level: string;
  created_at: string;
  updated_at: string;
}

export interface PortfolioItem {
  id: string;
  symbol: string;
  quantity: number;
  avg_price: number;
  current_price: number;
  total_value: number;
  pnl_percentage: number;
  last_updated: string;
}

export interface TradingOrder {
  id: string;
  strategy_id?: string;
  exchange: string;
  symbol: string;
  side: 'buy' | 'sell';
  order_type: 'market' | 'limit' | 'stop';
  quantity: number;
  price?: number;
  status: 'pending' | 'filled' | 'cancelled';
  external_order_id?: string;
  created_at: string;
  filled_at?: string;
  cancelled_at?: string;
}

export const useTradingStrategies = () => {
  const [strategies, setStrategies] = useState<TradingStrategy[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStrategies();
    }
  }, [user]);

  const fetchStrategies = async () => {
    try {
      const { data, error } = await supabase
        .from('trading_strategies')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStrategies(data || []);
    } catch (error) {
      console.error('Error fetching strategies:', error);
    } finally {
      setLoading(false);
    }
  };

  const createStrategy = async (strategy: Omit<TradingStrategy, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('trading_strategies')
        .insert([strategy])
        .select()
        .single();

      if (error) throw error;
      setStrategies(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating strategy:', error);
      throw error;
    }
  };

  const updateStrategy = async (id: string, updates: Partial<TradingStrategy>) => {
    try {
      const { data, error } = await supabase
        .from('trading_strategies')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      setStrategies(prev => prev.map(s => s.id === id ? data : s));
      return data;
    } catch (error) {
      console.error('Error updating strategy:', error);
      throw error;
    }
  };

  const deleteStrategy = async (id: string) => {
    try {
      const { error } = await supabase
        .from('trading_strategies')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setStrategies(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      console.error('Error deleting strategy:', error);
      throw error;
    }
  };

  return {
    strategies,
    loading,
    createStrategy,
    updateStrategy,
    deleteStrategy,
    refetch: fetchStrategies
  };
};

export const usePortfolio = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchPortfolio();
    }
  }, [user]);

  const fetchPortfolio = async () => {
    try {
      const { data, error } = await supabase
        .from('portfolio')
        .select('*')
        .order('total_value', { ascending: false });

      if (error) throw error;
      setPortfolio(data || []);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    portfolio,
    loading,
    refetch: fetchPortfolio
  };
};

export const useTradingOrders = () => {
  const [orders, setOrders] = useState<TradingOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('trading_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (order: Omit<TradingOrder, 'id' | 'created_at' | 'filled_at' | 'cancelled_at'>) => {
    try {
      const { data, error } = await supabase
        .from('trading_orders')
        .insert([order])
        .select()
        .single();

      if (error) throw error;
      setOrders(prev => [data, ...prev]);
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  return {
    orders,
    loading,
    createOrder,
    refetch: fetchOrders
  };
};