import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TradingSignal {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  confidence: number;
  price: number;
  quantity?: number;
  strategy: string;
}

class TradingEngine {
  private supabase: any;
  private userId: string;

  constructor(supabase: any, userId: string) {
    this.supabase = supabase;
    this.userId = userId;
  }

  async analyzeMarket(symbol: string): Promise<TradingSignal> {
    // Get historical price data
    const { data: priceHistory } = await this.supabase
      .from('price_history')
      .select('*')
      .eq('symbol', symbol)
      .order('timestamp', { ascending: false })
      .limit(50);

    if (!priceHistory || priceHistory.length < 10) {
      return {
        symbol,
        action: 'hold',
        confidence: 0,
        price: 0,
        strategy: 'insufficient_data'
      };
    }

    // Simple moving average strategy
    const prices = priceHistory.map(p => parseFloat(p.price));
    const sma20 = this.calculateSMA(prices, 20);
    const sma50 = this.calculateSMA(prices, 50);
    const currentPrice = prices[0];

    // RSI calculation
    const rsi = this.calculateRSI(prices, 14);

    let action: 'buy' | 'sell' | 'hold' = 'hold';
    let confidence = 0;

    // Trading logic
    if (sma20 > sma50 && rsi < 30) {
      action = 'buy';
      confidence = Math.min(90, 30 + (30 - rsi) * 2);
    } else if (sma20 < sma50 && rsi > 70) {
      action = 'sell';
      confidence = Math.min(90, 30 + (rsi - 70) * 2);
    } else if (Math.abs(sma20 - currentPrice) / currentPrice < 0.02) {
      confidence = 20; // Low confidence for sideways movement
    }

    return {
      symbol,
      action,
      confidence,
      price: currentPrice,
      strategy: 'sma_rsi_crossover'
    };
  }

  private calculateSMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[0] || 0;
    const sum = prices.slice(0, period).reduce((a, b) => a + b, 0);
    return sum / period;
  }

  private calculateRSI(prices: number[], period: number): number {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[i - 1] - prices[i];
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  async executeStrategy(strategyId: string) {
    // Get strategy configuration
    const { data: strategy } = await this.supabase
      .from('trading_strategies')
      .select('*')
      .eq('id', strategyId)
      .eq('user_id', this.userId)
      .single();

    if (!strategy || !strategy.is_active) {
      throw new Error('Strategy not found or inactive');
    }

    const symbols = strategy.parameters.symbols || ['BTCUSDT', 'ETHUSDT'];
    const results = [];

    for (const symbol of symbols) {
      try {
        const signal = await this.analyzeMarket(symbol);
        
        // Log the signal
        await this.supabase.from('system_logs').insert({
          user_id: this.userId,
          level: 'info',
          message: `Trading signal generated for ${symbol}`,
          metadata: {
            signal,
            strategy_id: strategyId
          }
        });

        // Execute trade if confidence is high enough
        const minConfidence = strategy.parameters.min_confidence || 70;
        if (signal.confidence >= minConfidence && signal.action !== 'hold') {
          const tradeResult = await this.executeTrade(signal, strategy);
          results.push(tradeResult);
        }

      } catch (error) {
        await this.supabase.from('system_logs').insert({
          user_id: this.userId,
          level: 'error',
          message: `Error processing ${symbol}: ${error.message}`,
          metadata: { strategy_id: strategyId, symbol }
        });
      }
    }

    return results;
  }

  private async executeTrade(signal: TradingSignal, strategy: any) {
    const quantity = this.calculateQuantity(signal, strategy);
    
    // Call Binance service to place order
    const orderResult = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/binance-service`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'placeOrder',
        symbol: signal.symbol,
        side: signal.action.toUpperCase(),
        type: 'MARKET',
        quantity: quantity
      })
    });

    const result = await orderResult.json();
    
    await this.supabase.from('system_logs').insert({
      user_id: this.userId,
      level: result.error ? 'error' : 'info',
      message: `Trade ${result.error ? 'failed' : 'executed'} for ${signal.symbol}`,
      metadata: { signal, result, strategy_id: strategy.id }
    });

    return result;
  }

  private calculateQuantity(signal: TradingSignal, strategy: any): number {
    const maxRisk = strategy.parameters.max_risk_per_trade || 0.02; // 2% risk
    const accountValue = strategy.parameters.account_value || 1000; // Default $1000
    
    const riskAmount = accountValue * maxRisk;
    const quantity = riskAmount / signal.price;
    
    return Math.floor(quantity * 100000) / 100000; // Round to 5 decimal places
  }

  async rebalancePortfolio() {
    // Get current portfolio
    const { data: portfolio } = await this.supabase
      .from('portfolio')
      .select('*')
      .eq('user_id', this.userId);

    if (!portfolio || portfolio.length === 0) {
      return { message: 'No portfolio to rebalance' };
    }

    // Get target allocations from active strategies
    const { data: strategies } = await this.supabase
      .from('trading_strategies')
      .select('*')
      .eq('user_id', this.userId)
      .eq('is_active', true);

    if (!strategies || strategies.length === 0) {
      return { message: 'No active strategies for rebalancing' };
    }

    // Calculate total portfolio value
    const totalValue = portfolio.reduce((sum, item) => sum + parseFloat(item.total_value), 0);
    
    const rebalanceActions = [];
    for (const item of portfolio) {
      const currentWeight = parseFloat(item.total_value) / totalValue;
      const targetWeight = this.getTargetWeight(item.symbol, strategies);
      
      if (Math.abs(currentWeight - targetWeight) > 0.05) { // 5% threshold
        const targetValue = totalValue * targetWeight;
        const currentValue = parseFloat(item.total_value);
        const difference = targetValue - currentValue;
        
        if (Math.abs(difference) > 50) { // Minimum $50 trade
          rebalanceActions.push({
            symbol: item.symbol,
            action: difference > 0 ? 'buy' : 'sell',
            amount: Math.abs(difference),
            currentWeight,
            targetWeight
          });
        }
      }
    }

    // Execute rebalancing trades
    for (const action of rebalanceActions) {
      try {
        await this.executeTrade({
          symbol: action.symbol,
          action: action.action as 'buy' | 'sell',
          confidence: 80,
          price: 0, // Will be fetched by executeTrade
          strategy: 'portfolio_rebalance'
        }, { parameters: { account_value: totalValue, max_risk_per_trade: 0.01 } });
      } catch (error) {
        await this.supabase.from('system_logs').insert({
          user_id: this.userId,
          level: 'error',
          message: `Rebalancing failed for ${action.symbol}: ${error.message}`,
          metadata: action
        });
      }
    }

    return { rebalanceActions, totalValue };
  }

  private getTargetWeight(symbol: string, strategies: any[]): number {
    // Simple equal weight for all symbols in strategies
    const allSymbols = new Set();
    strategies.forEach(strategy => {
      const symbols = strategy.parameters.symbols || [];
      symbols.forEach((sym: string) => allSymbols.add(sym));
    });
    
    return allSymbols.has(symbol) ? 1 / allSymbols.size : 0;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { action, ...params } = await req.json();
    const engine = new TradingEngine(supabaseClient, user.id);

    let result;
    switch (action) {
      case 'analyzeMarket':
        result = await engine.analyzeMarket(params.symbol);
        break;
      case 'executeStrategy':
        result = await engine.executeStrategy(params.strategyId);
        break;
      case 'rebalancePortfolio':
        result = await engine.rebalancePortfolio();
        break;
      case 'startBot':
        result = await startBot(supabaseClient, user.id, params);
        break;
      case 'stopBot':
        result = await stopBot(supabaseClient, user.id, params);
        break;
      case 'getBotStatus':
        result = await getBotStatus(supabaseClient, user.id);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in trading-engine:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function startBot(supabaseClient: any, userId: string, params: any) {
  try {
    const { strategyId, interval = 300000 } = params; // Default 5 minutes
    
    // Verify strategy exists and is active
    const { data: strategy } = await supabaseClient
      .from('trading_strategies')
      .select('*')
      .eq('id', strategyId)
      .eq('user_id', userId)
      .single();

    if (!strategy) {
      throw new Error('Estratégia não encontrada');
    }

    // Update strategy to mark as bot-active
    await supabaseClient
      .from('trading_strategies')
      .update({ 
        is_active: true,
        parameters: {
          ...strategy.parameters,
          bot_active: true,
          bot_interval: interval,
          bot_started_at: new Date().toISOString()
        }
      })
      .eq('id', strategyId);

    // Log bot start
    await supabaseClient.from('system_logs').insert({
      user_id: userId,
      level: 'info',
      message: `Bot iniciado para estratégia: ${strategy.name}`,
      metadata: { 
        strategy_id: strategyId,
        interval,
        action: 'bot_start'
      }
    });

    return {
      success: true,
      message: `Bot iniciado com sucesso para ${strategy.name}`,
      strategyId,
      interval
    };

  } catch (error) {
    console.error('Error starting bot:', error);
    throw error;
  }
}

async function stopBot(supabaseClient: any, userId: string, params: any) {
  try {
    const { strategyId } = params;
    
    // Get strategy
    const { data: strategy } = await supabaseClient
      .from('trading_strategies')
      .select('*')
      .eq('id', strategyId)
      .eq('user_id', userId)
      .single();

    if (!strategy) {
      throw new Error('Estratégia não encontrada');
    }

    // Update strategy to stop bot
    await supabaseClient
      .from('trading_strategies')
      .update({ 
        parameters: {
          ...strategy.parameters,
          bot_active: false,
          bot_stopped_at: new Date().toISOString()
        }
      })
      .eq('id', strategyId);

    // Log bot stop
    await supabaseClient.from('system_logs').insert({
      user_id: userId,
      level: 'info',
      message: `Bot parado para estratégia: ${strategy.name}`,
      metadata: { 
        strategy_id: strategyId,
        action: 'bot_stop'
      }
    });

    return {
      success: true,
      message: `Bot parado com sucesso para ${strategy.name}`,
      strategyId
    };

  } catch (error) {
    console.error('Error stopping bot:', error);
    throw error;
  }
}

async function getBotStatus(supabaseClient: any, userId: string) {
  try {
    // Get all strategies with bot status
    const { data: strategies } = await supabaseClient
      .from('trading_strategies')
      .select('*')
      .eq('user_id', userId);

    const botStatus = strategies.map((strategy: any) => ({
      strategyId: strategy.id,
      name: strategy.name,
      isActive: strategy.is_active,
      botActive: strategy.parameters?.bot_active || false,
      botStartedAt: strategy.parameters?.bot_started_at,
      botStoppedAt: strategy.parameters?.bot_stopped_at,
      interval: strategy.parameters?.bot_interval || 300000
    }));

    return {
      botStatus,
      activeBots: botStatus.filter(bot => bot.botActive).length,
      totalStrategies: strategies.length
    };

  } catch (error) {
    console.error('Error getting bot status:', error);
    throw error;
  }
}