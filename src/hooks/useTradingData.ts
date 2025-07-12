import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables } from '@/integrations/supabase/types';

export type TradingStrategy = Tables<'trading_strategies'>;
export type PortfolioItem = Tables<'portfolio'>;
export type TradingOrder = Tables<'trading_orders'>;

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
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('trading_strategies')
        .insert([{
          ...strategy,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      setStrategies(prev => [data as TradingStrategy, ...prev]);
      return data as TradingStrategy;
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
      setStrategies(prev => prev.map(s => s.id === id ? data as TradingStrategy : s));
      return data as TradingStrategy;
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
      if (!user?.id) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('trading_orders')
        .insert([{
          ...order,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      setOrders(prev => [data as TradingOrder, ...prev]);
      return data as TradingOrder;
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