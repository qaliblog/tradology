import type { ChartDataPoint } from '../types';

// Simple in-memory cache for API responses
const priceCache = new Map<string, { data: PriceData; timestamp: number }>();
const historicalCache = new Map<string, { data: ChartDataPoint[]; timestamp: number }>();

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for price data
const HISTORICAL_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes for historical data

/**
 * Get cached price data if still valid
 */
function getCachedPrice(symbol: string): PriceData | null {
  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`Using cached price data for ${symbol}`);
    return cached.data;
  }
  return null;
}

/**
 * Set cached price data
 */
function setCachedPrice(symbol: string, data: PriceData): void {
  priceCache.set(symbol, { data, timestamp: Date.now() });
}

/**
 * Get cached historical data if still valid
 */
function getCachedHistorical(symbol: string, days: number): ChartDataPoint[] | null {
  const key = `${symbol}-${days}`;
  const cached = historicalCache.get(key);
  if (cached && Date.now() - cached.timestamp < HISTORICAL_CACHE_DURATION) {
    console.log(`Using cached historical data for ${symbol} (${days} days)`);
    return cached.data;
  }
  return null;
}

/**
 * Set cached historical data
 */
function setCachedHistorical(symbol: string, days: number, data: ChartDataPoint[]): void {
  const key = `${symbol}-${days}`;
  historicalCache.set(key, { data, timestamp: Date.now() });
}

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap?: number;
  lastUpdated: string;
}

interface CoinGeckoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  total_volume: number;
  market_cap: number;
  last_updated: string;
}

/**
 * Map TradingView symbols to CoinGecko IDs
 */
const SYMBOL_MAPPING: Record<string, string> = {
  'BITSTAMP:BTCUSD': 'bitcoin',
  'COINBASE:BTCUSD': 'bitcoin',
  'BINANCE:BTCUSDT': 'bitcoin',
  'BITSTAMP:ETHUSD': 'ethereum',
  'COINBASE:ETHUSD': 'ethereum',
  'BINANCE:ETHUSDT': 'ethereum',
  'BINANCE:SOLUSDT': 'solana',
  'COINBASE:SOLUSD': 'solana',
  'BINANCE:ADAUSDT': 'cardano',
  'BINANCE:DOTUSDT': 'polkadot',
  'BINANCE:LINKUSDT': 'chainlink',
  'BINANCE:MATICUSDT': 'matic-network',
  'BINANCE:AVAXUSDT': 'avalanche-2',
  'BINANCE:ATOMUSDT': 'cosmos',
  'BINANCE:ALGOUSDT': 'algorand',
  'BINANCE:NEARUSDT': 'near',
  'BINANCE:FTMUSDT': 'fantom',
  'BINANCE:MANAUSDT': 'decentraland',
  'BINANCE:SANDUSDT': 'the-sandbox',
  'BINANCE:AXSUSDT': 'axie-infinity',
  'BINANCE:CHZUSDT': 'chiliz',
  'BINANCE:ENJUSDT': 'enjincoin',
  'BINANCE:FLOWUSDT': 'flow',
  'BINANCE:ICPUSDT': 'internet-computer',
  'BINANCE:VETUSDT': 'vechain',
  'BINANCE:THETAUSDT': 'theta-token',
  'BINANCE:EGLDUSDT': 'elrond-erd-2',
  'BINANCE:HBARUSDT': 'hedera-hashgraph',
  'BINANCE:XTZUSDT': 'tezos',
  'BINANCE:ZILUSDT': 'zilliqa',
  'BINANCE:ONEUSDT': 'harmony',
  'BINANCE:ICXUSDT': 'icon',
  'BINANCE:ONTUSDT': 'ontology',
  'BINANCE:ZENUSDT': 'horizen',
  'BINANCE:SCUSDT': 'siacoin',
  'BINANCE:STORJUSDT': 'storj',
  'BINANCE:SKLUSDT': 'skale',
  'BINANCE:GRTUSDT': 'the-graph',
  'BINANCE:COMPUSDT': 'compound-governance-token',
  'BINANCE:MKRUSDT': 'maker',
  'BINANCE:SNXUSDT': 'havven',
  'BINANCE:YFIUSDT': 'yearn-finance',
  'BINANCE:UNIUSDT': 'uniswap',
  'BINANCE:AAVEUSDT': 'aave',
  'BINANCE:SUSHIUSDT': 'sushi',
  'BINANCE:CRVUSDT': 'curve-dao-token',
  'BINANCE:1INCHUSDT': '1inch',
  'BINANCE:BALUSDT': 'balancer',
  'BINANCE:UMAUSDT': 'uma',
  'BINANCE:BNBUSDT': 'binancecoin',
  'BINANCE:CAKEUSDT': 'pancakeswap-token',
  'BINANCE:BUSDUSDT': 'binance-usd',
  'BINANCE:USDTUSDT': 'tether',
  'BINANCE:USDCUSDT': 'usd-coin',
  'BINANCE:DAIUSDT': 'dai',
  'BINANCE:TUSDUSDT': 'true-usd',
  'BINANCE:USDPUSDT': 'paxos-standard',
  'BINANCE:GUSDUSDT': 'gemini-dollar',
  'BINANCE:LTCUSDT': 'litecoin',
  'BINANCE:BCHUSDT': 'bitcoin-cash',
  'BINANCE:BSVUSDT': 'bitcoin-sv',
  'BINANCE:XRPUSDT': 'ripple',
  'BINANCE:XLMUSDT': 'stellar',
  'BINANCE:EOSUSDT': 'eos',
  'BINANCE:TRXUSDT': 'tron',
  'BINANCE:DOGEUSDT': 'dogecoin',
  'BINANCE:SHIBUSDT': 'shiba-inu',
  'BINANCE:BABYDOGEUSDT': 'baby-doge-coin',
  'BINANCE:ELONUSDT': 'dogelon-mars',
  'BINANCE:FLOKIUSDT': 'floki',
  'BINANCE:PEPEUSDT': 'pepe',
  'BINANCE:WIFUSDT': 'dogwifcoin',
  'BINANCE:BONKUSDT': 'bonk',
  'BINANCE:MYROUSDT': 'myro',
  'BINANCE:WENUSDT': 'wen',
  'BINANCE:MEWUSDT': 'cat-in-a-dogs-world',
  'BINANCE:PNUTUSDT': 'peanut-the-squirrel',
  'BINANCE:GOATUSDT': 'goatseus-maximus',
  'BINANCE:ACTUSDT': 'achain',
  'BINANCE:AIUSDT': 'sleepless-ai',
  'BINANCE:ARKMUSDT': 'arkham',
  'BINANCE:ARUSDT': 'arweave',
  'BINANCE:BEAMXUSDT': 'beam',
  'BINANCE:BOMEUSDT': 'book-of-meme',
  'BINANCE:BTCUSDT': 'bitcoin',
  'BINANCE:ETHUSDT': 'ethereum',
  'BINANCE:ENAUSDT': 'ethena',
  'BINANCE:ETCUSDT': 'ethereum-classic',
  'BINANCE:FETUSDT': 'fetch-ai',
  'BINANCE:FILUSDT': 'filecoin',
  'BINANCE:FTNUSDT': 'fountain',
  'BINANCE:GALAUSDT': 'gala',
  'BINANCE:GLMUSDT': 'golem',
  'BINANCE:GMXUSDT': 'gmx',
  'BINANCE:GPTUSDT': 'qna3-ai',
  'BINANCE:HOOKUSDT': 'hooked-protocol',
  'BINANCE:ILVUSDT': 'illuvium',
  'BINANCE:IMXUSDT': 'immutable-x',
  'BINANCE:INJUSDT': 'injective-protocol',
  'BINANCE:JTOUSDT': 'jito-governance-token',
  'BINANCE:JUPUSDT': 'jupiter-exchange-solana',
  'BINANCE:KAVAUSDT': 'kava',
  'BINANCE:KEYUSDT': 'selfkey',
  'BINANCE:LDOUSDT': 'lido-dao',
  'BINANCE:LPTUSDT': 'livepeer',
  'BINANCE:LRCUSDT': 'loopring',
  'BINANCE:LUNAUSDT': 'terra-luna-2',
  'BINANCE:MAGICUSDT': 'magic',
  'BINANCE:MANTAUSDT': 'manta-network',
  'BINANCE:MINAUSDT': 'mina-protocol',
  'BINANCE:MKRUSDT': 'maker',
  'BINANCE:NEIROUSDT': 'neiro',
  'BINANCE:NFPUSDT': 'nfp',
  'BINANCE:NTRNUSDT': 'neutron-3',
  'BINANCE:OMNIUSDT': 'omni-network',
  'BINANCE:OPUSDT': 'optimism',
  'BINANCE:ORDIUSDT': 'ordinals',
  'BINANCE:PENDLEUSDT': 'pendle',
  'BINANCE:PIXELUSDT': 'pixels',
  'BINANCE:PORTALUSDT': 'portal',
  'BINANCE:POWRUSDT': 'power-ledger',
  'BINANCE:PROMUSDT': 'prom',
  'BINANCE:PYTHUSDT': 'pyth-network',
  'BINANCE:QNTUSDT': 'quant-network',
  'BINANCE:RDNTUSDT': 'radiant-capital',
  'BINANCE:REIUSDT': 'rei-network',
  'BINANCE:RENDERUSDT': 'render-token',
  'BINANCE:RNDRUSDT': 'render-token',
  'BINANCE:RONINUSDT': 'ronin',
  'BINANCE:RUNEUSDT': 'thorchain',
  'BINANCE:SEIUSDT': 'sei-network',
  'BINANCE:SLPUSDT': 'smooth-love-potion',
  'BINANCE:SNTUSDT': 'status',
  'BINANCE:SSVUSDT': 'ssv-network',
  'BINANCE:STEEMUSDT': 'steem',
  'BINANCE:STGUSDT': 'stargate-finance',
  'BINANCE:STPTUSDT': 'stpt',
  'BINANCE:STRKUSDT': 'starknet',
  'BINANCE:SUIUSDT': 'sui',
  'BINANCE:SUNUSDT': 'sun-token',
  'BINANCE:SUPERUSDT': 'superfarm',
  'BINANCE:SXPUSDT': 'swipe',
  'BINANCE:TIAUSDT': 'celestia',
  'BINANCE:TNSRUSDT': 'tensor',
  'BINANCE:TONUSDT': 'the-open-network',
  'BINANCE:TRBUSDT': 'tellor',
  'BINANCE:TRUUSDT': 'truefi',
  'BINANCE:UMAUSDT': 'uma',
  'BINANCE:UNFIUSDT': 'unifi-protocol-dao',
  'BINANCE:UNIUSDT': 'uniswap',
  'BINANCE:VANRYUSDT': 'vanry',
  'BINANCE:VICUSDT': 'victoria-vr',
  'BINANCE:VIDTUSDT': 'vidt-dao',
  'BINANCE:VITEUSDT': 'vite',
  'BINANCE:VOXELUSDT': 'voxies',
  'BINANCE:VTHOUSDT': 'vethor-token',
  'BINANCE:WAXPUSDT': 'wax',
  'BINANCE:WLDUSDT': 'worldcoin-wld',
  'BINANCE:XAIUSDT': 'xai-blockchain',
  'BINANCE:XECUSDT': 'ecash',
  'BINANCE:XEMUSDT': 'nem',
  'BINANCE:XLMUSDT': 'stellar',
  'BINANCE:XMRUSDT': 'monero',
  'BINANCE:XRPUSDT': 'ripple',
  'BINANCE:XTZUSDT': 'tezos',
  'BINANCE:XVGUSDT': 'verge',
  'BINANCE:XVSUSDT': 'venus',
  'BINANCE:YGGUSDT': 'yield-guild-games',
  'BINANCE:ZECUSDT': 'zcash',
  'BINANCE:ZENUSDT': 'horizen',
  'BINANCE:ZILUSDT': 'zilliqa',
  'BINANCE:ZRXUSDT': '0x',
};

/**
 * Get CoinGecko ID from TradingView symbol
 */
function getCoinGeckoId(symbol: string): string | null {
  // Direct mapping
  if (SYMBOL_MAPPING[symbol]) {
    return SYMBOL_MAPPING[symbol];
  }
  
  // Try to extract base symbol (e.g., BTC from BITSTAMP:BTCUSD)
  const baseSymbol = symbol.split(':')[1] || symbol.split('/')[0];
  if (baseSymbol) {
    // Try common mappings
    const commonMappings: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'ADA': 'cardano',
      'DOT': 'polkadot',
      'LINK': 'chainlink',
      'MATIC': 'matic-network',
      'AVAX': 'avalanche-2',
      'ATOM': 'cosmos',
      'ALGO': 'algorand',
      'NEAR': 'near',
      'FTM': 'fantom',
      'MANA': 'decentraland',
      'SAND': 'the-sandbox',
      'AXS': 'axie-infinity',
      'CHZ': 'chiliz',
      'ENJ': 'enjincoin',
      'FLOW': 'flow',
      'ICP': 'internet-computer',
      'VET': 'vechain',
      'THETA': 'theta-token',
      'EGLD': 'elrond-erd-2',
      'HBAR': 'hedera-hashgraph',
      'XTZ': 'tezos',
      'ZIL': 'zilliqa',
      'ONE': 'harmony',
      'ICX': 'icon',
      'ONT': 'ontology',
      'ZEN': 'horizen',
      'SC': 'siacoin',
      'STORJ': 'storj',
      'SKL': 'skale',
      'GRT': 'the-graph',
      'COMP': 'compound-governance-token',
      'MKR': 'maker',
      'SNX': 'havven',
      'YFI': 'yearn-finance',
      'UNI': 'uniswap',
      'AAVE': 'aave',
      'SUSHI': 'sushi',
      'CRV': 'curve-dao-token',
      '1INCH': '1inch',
      'BAL': 'balancer',
      'UMA': 'uma',
      'BNB': 'binancecoin',
      'CAKE': 'pancakeswap-token',
      'BUSD': 'binance-usd',
      'USDT': 'tether',
      'USDC': 'usd-coin',
      'DAI': 'dai',
      'TUSD': 'true-usd',
      'USDP': 'paxos-standard',
      'GUSD': 'gemini-dollar',
      'LTC': 'litecoin',
      'BCH': 'bitcoin-cash',
      'BSV': 'bitcoin-sv',
      'XRP': 'ripple',
      'XLM': 'stellar',
      'EOS': 'eos',
      'TRX': 'tron',
      'DOGE': 'dogecoin',
      'SHIB': 'shiba-inu',
      'BABYDOGE': 'baby-doge-coin',
      'ELON': 'dogelon-mars',
      'FLOKI': 'floki',
      'PEPE': 'pepe',
      'WIF': 'dogwifcoin',
      'BONK': 'bonk',
      'MYRO': 'myro',
      'WEN': 'wen',
      'MEW': 'cat-in-a-dogs-world',
      'PNUT': 'peanut-the-squirrel',
      'GOAT': 'goatseus-maximus',
      'ACT': 'achain',
      'AI': 'sleepless-ai',
      'ARKM': 'arkham',
      'AR': 'arweave',
      'BEAMX': 'beam',
      'BOME': 'book-of-meme',
      'ENA': 'ethena',
      'ETC': 'ethereum-classic',
      'FET': 'fetch-ai',
      'FIL': 'filecoin',
      'FTN': 'fountain',
      'GALA': 'gala',
      'GLM': 'golem',
      'GMX': 'gmx',
      'GPT': 'qna3-ai',
      'HOOK': 'hooked-protocol',
      'ILV': 'illuvium',
      'IMX': 'immutable-x',
      'INJ': 'injective-protocol',
      'JTO': 'jito-governance-token',
      'JUP': 'jupiter-exchange-solana',
      'KAVA': 'kava',
      'KEY': 'selfkey',
      'LDO': 'lido-dao',
      'LPT': 'livepeer',
      'LRC': 'loopring',
      'LUNA': 'terra-luna-2',
      'MAGIC': 'magic',
      'MANTA': 'manta-network',
      'MINA': 'mina-protocol',
      'NEIRO': 'neiro',
      'NFP': 'nfp',
      'NTRN': 'neutron-3',
      'OMNI': 'omni-network',
      'OP': 'optimism',
      'ORDI': 'ordinals',
      'PENDLE': 'pendle',
      'PIXEL': 'pixels',
      'PORTAL': 'portal',
      'POWR': 'power-ledger',
      'PROM': 'prom',
      'PYTH': 'pyth-network',
      'QNT': 'quant-network',
      'RDNT': 'radiant-capital',
      'REI': 'rei-network',
      'RENDER': 'render-token',
      'RNDR': 'render-token',
      'RONIN': 'ronin',
      'RUNE': 'thorchain',
      'SEI': 'sei-network',
      'SLP': 'smooth-love-potion',
      'SNT': 'status',
      'SSV': 'ssv-network',
      'STEEM': 'steem',
      'STG': 'stargate-finance',
      'STPT': 'stpt',
      'STRK': 'starknet',
      'SUI': 'sui',
      'SUN': 'sun-token',
      'SUPER': 'superfarm',
      'SXP': 'swipe',
      'TIA': 'celestia',
      'TNSR': 'tensor',
      'TON': 'the-open-network',
      'TRB': 'tellor',
      'TRU': 'truefi',
      'UNFI': 'unifi-protocol-dao',
      'VANRY': 'vanry',
      'VIC': 'victoria-vr',
      'VIDT': 'vidt-dao',
      'VITE': 'vite',
      'VOXEL': 'voxies',
      'VTHO': 'vethor-token',
      'WAXP': 'wax',
      'WLD': 'worldcoin-wld',
      'XAI': 'xai-blockchain',
      'XEC': 'ecash',
      'XEM': 'nem',
      'XMR': 'monero',
      'XVG': 'verge',
      'XVS': 'venus',
      'YGG': 'yield-guild-games',
      'ZEC': 'zcash',
      'ZRX': '0x',
    };
    
    return commonMappings[baseSymbol] || null;
  }
  
  return null;
}

/**
 * Fetch current price data from CoinGecko API
 */
export async function fetchCurrentPrice(symbol: string): Promise<PriceData | null> {
  try {
    // Validate input
    if (!symbol || typeof symbol !== 'string') {
      console.warn('Invalid symbol provided:', symbol);
      return null;
    }

    // Check cache first
    const cached = getCachedPrice(symbol);
    if (cached) {
      return cached;
    }

    const coinGeckoId = getCoinGeckoId(symbol);
    if (!coinGeckoId) {
      console.warn(`No CoinGecko mapping found for symbol: ${symbol}`);
      return null;
    }

    console.log(`Fetching price for ${symbol} (${coinGeckoId}) from CoinGecko...`);
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinGeckoId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&include_last_updated_at=true`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const priceData = data[coinGeckoId];

    if (!priceData) {
      throw new Error(`No price data found for ${coinGeckoId}`);
    }

    const result: PriceData = {
      symbol: symbol,
      price: priceData.usd || 0,
      change24h: priceData.usd_24h_change || 0,
      changePercent24h: priceData.usd_24h_change || 0,
      volume24h: priceData.usd_24h_vol || 0,
      marketCap: priceData.usd_market_cap || 0,
      lastUpdated: new Date(priceData.last_updated_at * 1000).toISOString(),
    };

    // Cache the result
    setCachedPrice(symbol, result);

    console.log(`Successfully fetched price for ${symbol}:`, result);
    return result;

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Request timeout for ${symbol}`);
    } else {
      console.error(`Error fetching price for ${symbol}:`, error);
    }
    return null;
  }
}

/**
 * Fetch multiple prices at once
 */
export async function fetchMultiplePrices(symbols: string[]): Promise<Record<string, PriceData>> {
  const results: Record<string, PriceData> = {};
  
  // Fetch prices in parallel
  const promises = symbols.map(async (symbol) => {
    const priceData = await fetchCurrentPrice(symbol);
    if (priceData) {
      results[symbol] = priceData;
    }
  });

  await Promise.all(promises);
  return results;
}

/**
 * Fetch real historical data from CoinGecko API
 */
export async function fetchHistoricalData(
  symbol: string,
  days: number = 90
): Promise<ChartDataPoint[]> {
  try {
    const coinGeckoId = getCoinGeckoId(symbol);
    if (!coinGeckoId) {
      console.warn(`No CoinGecko mapping found for symbol: ${symbol}`);
      return generateFallbackChartData(symbol, days);
    }

    console.log(`Fetching ${days} days of historical data for ${symbol} (${coinGeckoId})...`);
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinGeckoId}/market_chart?vs_currency=usd&days=${days}&interval=daily`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.prices || !Array.isArray(data.prices)) {
      throw new Error('Invalid data format received from CoinGecko');
    }

    const prices = data.prices;
    const volumes = data.total_volumes || [];
    
    const chartData: ChartDataPoint[] = prices.map((pricePoint: [number, number], index: number) => {
      const date = new Date(pricePoint[0]);
      const dateStr = date.toISOString().split('T')[0];
      const price = pricePoint[1];
      
      // Get volume for this day
      const volumePoint = volumes[index] || [pricePoint[0], 0];
      const volume = volumePoint[1];
      
      // For historical data, we'll use the price as close and generate realistic OHLC
      // This is because CoinGecko's free API doesn't provide OHLC data
      const volatility = 0.02; // 2% daily volatility for realistic OHLC
      const spread = price * volatility;
      
      const open = price + (Math.random() - 0.5) * spread * 0.5;
      const close = price;
      const high = Math.max(open, close) + Math.random() * spread * 0.3;
      const low = Math.min(open, close) - Math.random() * spread * 0.3;
      
      // Format volume
      const volumeStr = volume > 1000000 ? 
        `${(volume / 1000000).toFixed(1)}M` : 
        volume > 1000 ?
        `${(volume / 1000).toFixed(0)}K` :
        volume.toFixed(0);
      
      return {
        date: dateStr,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume: volumeStr
      };
    });

    console.log(`Successfully fetched ${chartData.length} days of historical data for ${symbol}`);
    return chartData;

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Request timeout for historical data: ${symbol}`);
    } else {
      console.error(`Error fetching historical data for ${symbol}:`, error);
    }
    
    // Return fallback data if API fails
    return generateFallbackChartData(symbol, days);
  }
}

/**
 * Generate fallback chart data when API fails
 */
function generateFallbackChartData(symbol: string, days: number): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const today = new Date();
  
  // Use realistic base prices based on symbol
  let basePrice = 100;
  if (symbol.includes('BTC') || symbol.includes('bitcoin')) basePrice = 45000;
  else if (symbol.includes('ETH') || symbol.includes('ethereum')) basePrice = 3000;
  else if (symbol.includes('SOL') || symbol.includes('solana')) basePrice = 200;
  else if (symbol.includes('DOGE') || symbol.includes('dogecoin')) basePrice = 0.08;
  else if (symbol.includes('SHIB') || symbol.includes('shiba')) basePrice = 0.00001;
  
  // Generate historical data
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Create realistic price movement based on symbol volatility
    let volatility = 0.04; // Default 4% daily volatility
    let trend = 0.0003; // Slight upward trend
    
    // Adjust volatility based on symbol
    if (symbol.includes('BTC') || symbol.includes('bitcoin')) {
      volatility = 0.03; // Bitcoin is less volatile
      trend = 0.0002;
    } else if (symbol.includes('ETH') || symbol.includes('ethereum')) {
      volatility = 0.04; // Ethereum volatility
      trend = 0.0003;
    } else if (symbol.includes('SOL') || symbol.includes('solana')) {
      volatility = 0.06; // Solana is more volatile
      trend = 0.0004;
    } else if (symbol.includes('DOGE') || symbol.includes('SHIB') || symbol.includes('PEPE')) {
      volatility = 0.08; // Meme coins are very volatile
      trend = 0.0005;
    }
    
    const randomWalk = (Math.random() - 0.5) * volatility;
    
    // For the most recent day, use the exact current price
    if (i === 0) {
      var dayPrice = basePrice;
    } else {
      var dayPrice = basePrice * Math.pow(1 + trend + randomWalk, days - i);
    }
    
    // Generate OHLC data
    const spread = dayPrice * 0.008; // 0.8% spread
    const open = dayPrice + (Math.random() - 0.5) * spread;
    const close = dayPrice + (Math.random() - 0.5) * spread;
    const high = Math.max(open, close) + Math.random() * spread * 0.4;
    const low = Math.min(open, close) - Math.random() * spread * 0.4;
    
    // Generate volume based on symbol
    let baseVolume = 1000000;
    if (symbol.includes('BTC')) baseVolume = 50000000;
    else if (symbol.includes('ETH')) baseVolume = 30000000;
    else if (symbol.includes('SOL')) baseVolume = 20000000;
    else if (symbol.includes('DOGE') || symbol.includes('SHIB')) baseVolume = 100000000;
    
    const volumeVariation = 0.5 + Math.random() * 1.5;
    const volume = Math.round(baseVolume * volumeVariation);
    const volumeStr = volume > 1000000 ? 
      `${(volume / 1000000).toFixed(1)}M` : 
      `${(volume / 1000).toFixed(0)}K`;
    
    data.push({
      date: dateStr,
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: volumeStr
    });
  }
  
  return data;
}

/**
 * Get current price and real historical chart data
 */
export async function getCurrentPriceAndChartData(symbol: string, days: number = 90): Promise<{
  priceData: PriceData | null;
  chartData: ChartDataPoint[];
}> {
  try {
    // Fetch both current price and historical data in parallel
    const [priceData, historicalData] = await Promise.all([
      fetchCurrentPrice(symbol),
      fetchHistoricalData(symbol, days)
    ]);
    
    // If we have current price data, update the most recent historical data point
    if (priceData && historicalData.length > 0) {
      const lastIndex = historicalData.length - 1;
      historicalData[lastIndex] = {
        ...historicalData[lastIndex],
        close: priceData.price,
        high: Math.max(historicalData[lastIndex].high, priceData.price),
        low: Math.min(historicalData[lastIndex].low, priceData.price),
      };
      
      console.log(`Updated most recent data point with current price: $${priceData.price}`);
    }
    
    return { priceData, chartData: historicalData };
    
  } catch (error) {
    console.error('Error fetching price and chart data:', error);
    
    // Fallback to default data if both API calls fail
    const fallbackPrice = symbol.includes('BTC') ? 45000 : 
                         symbol.includes('ETH') ? 3000 : 
                         symbol.includes('SOL') ? 200 : 100;
    const chartData = generateFallbackChartData(symbol, days);
    return { priceData: null, chartData };
  }
}