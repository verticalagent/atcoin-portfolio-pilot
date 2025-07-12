import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BinanceConfig {
  apiKey: string;
  apiSecret: string;
  testnet?: boolean;
}

class BinanceService {
  private config: BinanceConfig;
  public baseUrl: string;

  constructor(config: BinanceConfig) {
    this.config = config;
    this.baseUrl = config.testnet ? 'https://testnet.binance.vision' : 'https://api.binance.com';
  }

  private async generateSignature(queryString: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = encoder.encode(this.config.apiSecret);
    const data = encoder.encode(queryString);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      key,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async getAccountInfo() {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = await this.generateSignature(queryString);
    
    const response = await fetch(`${this.baseUrl}/api/v3/account?${queryString}&signature=${signature}`, {
      headers: {
        'X-MBX-APIKEY': this.config.apiKey,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    return response.json();
  }

  async getSymbolPrice(symbol: string) {
    const response = await fetch(`${this.baseUrl}/api/v3/ticker/price?symbol=${symbol}`);
    return response.json();
  }

  async get24hrStats(symbol?: string) {
    const url = symbol 
      ? `${this.baseUrl}/api/v3/ticker/24hr?symbol=${symbol}`
      : `${this.baseUrl}/api/v3/ticker/24hr`;
    
    const response = await fetch(url);
    return response.json();
  }

  async placeOrder(orderData: {
    symbol: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    quantity: number;
    price?: number;
  }) {
    const timestamp = Date.now();
    let queryString = `symbol=${orderData.symbol}&side=${orderData.side}&type=${orderData.type}&quantity=${orderData.quantity}&timestamp=${timestamp}`;
    
    if (orderData.price && orderData.type === 'LIMIT') {
      queryString += `&price=${orderData.price}&timeInForce=GTC`;
    }
    
    const signature = await this.generateSignature(queryString);
    
    const response = await fetch(`${this.baseUrl}/api/v3/order`, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': this.config.apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `${queryString}&signature=${signature}`,
    });
    
    return response.json();
  }
}

async function syncPortfolio(binanceService: BinanceService, supabaseClient: any, userId: string) {
  try {
    // Get account info from Binance
    const accountInfo = await binanceService.getAccountInfo();
    
    // Get current prices for all symbols
    const pricesResponse = await fetch(`${binanceService.baseUrl}/api/v3/ticker/price`);
    const pricesData = await pricesResponse.json();
    const pricesMap = Object.fromEntries(pricesData.map((p: any) => [p.symbol, parseFloat(p.price)]));
    
    // Process balances
    const portfolio = accountInfo.balances
      .filter((balance: any) => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
      .map((balance: any) => {
        const totalQuantity = parseFloat(balance.free) + parseFloat(balance.locked);
        const symbol = balance.asset === 'USDT' ? 'USDT' : `${balance.asset}USDT`;
        const currentPrice = pricesMap[symbol] || (balance.asset === 'USDT' ? 1 : 0);
        const totalValue = totalQuantity * currentPrice;
        
        return {
          user_id: userId,
          symbol: balance.asset,
          quantity: totalQuantity,
          avg_price: currentPrice,
          current_price: currentPrice,
          total_value: totalValue,
          pnl_percentage: 0, // Would need historical data for real PnL
          last_updated: new Date().toISOString(),
        };
      })
      .filter((item: any) => item.total_value > 1); // Filter dust

    // Update database
    for (const item of portfolio) {
      await supabaseClient
        .from('portfolio')
        .upsert(item, { onConflict: 'user_id,symbol' });
    }

    // Update price history for major symbols
    const majorSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT'];
    for (const symbol of majorSymbols) {
      if (pricesMap[symbol]) {
        await supabaseClient
          .from('price_history')
          .insert({
            symbol: symbol.replace('USDT', ''),
            price: pricesMap[symbol],
            timestamp: new Date().toISOString(),
          });
      }
    }

    return {
      portfolio,
      totalValue: portfolio.reduce((sum: number, item: any) => sum + item.total_value, 0),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error syncing portfolio:', error);
    throw error;
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

    // Get user from JWT
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Unauthorized');
    }

    const { action, ...params } = await req.json();

    // Get user's Binance API keys
    const { data: apiKeys } = await supabaseClient
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .eq('exchange', 'binance')
      .eq('is_active', true)
      .single();

    if (!apiKeys) {
      throw new Error('Chaves API da Binance não configuradas. Por favor, configure suas chaves primeiro.');
    }

    const binanceService = new BinanceService({
      apiKey: apiKeys.api_key_encrypted, // In production, decrypt these
      apiSecret: apiKeys.api_secret_encrypted,
      testnet: true, // Use testnet for safety
    });

    let result;
    switch (action) {
      case 'getAccountInfo':
        result = await binanceService.getAccountInfo();
        break;
      case 'getPortfolio':
        result = await syncPortfolio(binanceService, supabaseClient, user.id);
        break;
      case 'getPrice':
        result = await binanceService.getSymbolPrice(params.symbol);
        break;
      case 'get24hrStats':
        result = await binanceService.get24hrStats(params.symbol);
        break;
      case 'placeOrder':
        result = await binanceService.placeOrder(params);
        // Log the order in our database
        await supabaseClient.from('trading_orders').insert({
          user_id: user.id,
          exchange: 'binance',
          symbol: params.symbol,
          side: params.side.toLowerCase(),
          order_type: params.type.toLowerCase(),
          quantity: params.quantity,
          price: params.price,
          status: 'pending',
          external_order_id: result.orderId?.toString(),
        });
        break;
      default:
        throw new Error(`Ação desconhecida: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in binance-service:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});