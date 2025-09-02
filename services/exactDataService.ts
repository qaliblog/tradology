import type { ChartDataPoint } from '../types';

interface OHLCData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface BinanceKline {
  openTime: number;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  closeTime: number;
  quoteAssetVolume: string;
  numberOfTrades: number;
  takerBuyBaseAssetVolume: string;
  takerBuyQuoteAssetVolume: string;
  ignore: string;
}

/**
 * Map TradingView symbols to Binance symbols
 */
const BINANCE_SYMBOL_MAPPING: Record<string, string> = {
  'BITSTAMP:BTCUSD': 'BTCUSDT',
  'COINBASE:BTCUSD': 'BTCUSDT',
  'BINANCE:BTCUSDT': 'BTCUSDT',
  'BITSTAMP:ETHUSD': 'ETHUSDT',
  'COINBASE:ETHUSD': 'ETHUSDT',
  'BINANCE:ETHUSDT': 'ETHUSDT',
  'BINANCE:SOLUSDT': 'SOLUSDT',
  'COINBASE:SOLUSD': 'SOLUSDT',
  'BINANCE:ADAUSDT': 'ADAUSDT',
  'BINANCE:DOTUSDT': 'DOTUSDT',
  'BINANCE:LINKUSDT': 'LINKUSDT',
  'BINANCE:MATICUSDT': 'MATICUSDT',
  'BINANCE:AVAXUSDT': 'AVAXUSDT',
  'BINANCE:ATOMUSDT': 'ATOMUSDT',
  'BINANCE:ALGOUSDT': 'ALGOUSDT',
  'BINANCE:NEARUSDT': 'NEARUSDT',
  'BINANCE:FTMUSDT': 'FTMUSDT',
  'BINANCE:MANAUSDT': 'MANAUSDT',
  'BINANCE:SANDUSDT': 'SANDUSDT',
  'BINANCE:AXSUSDT': 'AXSUSDT',
  'BINANCE:CHZUSDT': 'CHZUSDT',
  'BINANCE:ENJUSDT': 'ENJUSDT',
  'BINANCE:FLOWUSDT': 'FLOWUSDT',
  'BINANCE:ICPUSDT': 'ICPUSDT',
  'BINANCE:VETUSDT': 'VETUSDT',
  'BINANCE:THETAUSDT': 'THETAUSDT',
  'BINANCE:EGLDUSDT': 'EGLDUSDT',
  'BINANCE:HBARUSDT': 'HBARUSDT',
  'BINANCE:XTZUSDT': 'XTZUSDT',
  'BINANCE:ZILUSDT': 'ZILUSDT',
  'BINANCE:ONEUSDT': 'ONEUSDT',
  'BINANCE:ICXUSDT': 'ICXUSDT',
  'BINANCE:ONTUSDT': 'ONTUSDT',
  'BINANCE:ZENUSDT': 'ZENUSDT',
  'BINANCE:SCUSDT': 'SCUSDT',
  'BINANCE:STORJUSDT': 'STORJUSDT',
  'BINANCE:SKLUSDT': 'SKLUSDT',
  'BINANCE:GRTUSDT': 'GRTUSDT',
  'BINANCE:COMPUSDT': 'COMPUSDT',
  'BINANCE:MKRUSDT': 'MKRUSDT',
  'BINANCE:SNXUSDT': 'SNXUSDT',
  'BINANCE:YFIUSDT': 'YFIUSDT',
  'BINANCE:UNIUSDT': 'UNIUSDT',
  'BINANCE:AAVEUSDT': 'AAVEUSDT',
  'BINANCE:SUSHIUSDT': 'SUSHIUSDT',
  'BINANCE:CRVUSDT': 'CRVUSDT',
  'BINANCE:1INCHUSDT': '1INCHUSDT',
  'BINANCE:BALUSDT': 'BALUSDT',
  'BINANCE:UMAUSDT': 'UMAUSDT',
  'BINANCE:BNBUSDT': 'BNBUSDT',
  'BINANCE:CAKEUSDT': 'CAKEUSDT',
  'BINANCE:BUSDUSDT': 'BUSDUSDT',
  'BINANCE:USDTUSDT': 'USDTUSDT',
  'BINANCE:USDCUSDT': 'USDCUSDT',
  'BINANCE:DAIUSDT': 'DAIUSDT',
  'BINANCE:TUSDUSDT': 'TUSDUSDT',
  'BINANCE:USDPUSDT': 'USDPUSDT',
  'BINANCE:GUSDUSDT': 'GUSDUSDT',
  'BINANCE:LTCUSDT': 'LTCUSDT',
  'BINANCE:BCHUSDT': 'BCHUSDT',
  'BINANCE:BSVUSDT': 'BSVUSDT',
  'BINANCE:XRPUSDT': 'XRPUSDT',
  'BINANCE:XLMUSDT': 'XLMUSDT',
  'BINANCE:EOSUSDT': 'EOSUSDT',
  'BINANCE:TRXUSDT': 'TRXUSDT',
  'BINANCE:DOGEUSDT': 'DOGEUSDT',
  'BINANCE:SHIBUSDT': 'SHIBUSDT',
  'BINANCE:BABYDOGEUSDT': 'BABYDOGEUSDT',
  'BINANCE:ELONUSDT': 'ELONUSDT',
  'BINANCE:FLOKIUSDT': 'FLOKIUSDT',
  'BINANCE:PEPEUSDT': 'PEPEUSDT',
  'BINANCE:WIFUSDT': 'WIFUSDT',
  'BINANCE:BONKUSDT': 'BONKUSDT',
  'BINANCE:MYROUSDT': 'MYROUSDT',
  'BINANCE:WENUSDT': 'WENUSDT',
  'BINANCE:MEWUSDT': 'MEWUSDT',
  'BINANCE:PNUTUSDT': 'PNUTUSDT',
  'BINANCE:GOATUSDT': 'GOATUSDT',
  'BINANCE:ACTUSDT': 'ACTUSDT',
  'BINANCE:AIUSDT': 'AIUSDT',
  'BINANCE:ARKMUSDT': 'ARKMUSDT',
  'BINANCE:ARUSDT': 'ARUSDT',
  'BINANCE:BEAMXUSDT': 'BEAMXUSDT',
  'BINANCE:BOMEUSDT': 'BOMEUSDT',
  'BINANCE:ENAUSDT': 'ENAUSDT',
  'BINANCE:ETCUSDT': 'ETCUSDT',
  'BINANCE:FETUSDT': 'FETUSDT',
  'BINANCE:FILUSDT': 'FILUSDT',
  'BINANCE:FTNUSDT': 'FTNUSDT',
  'BINANCE:GALAUSDT': 'GALAUSDT',
  'BINANCE:GLMUSDT': 'GLMUSDT',
  'BINANCE:GMXUSDT': 'GMXUSDT',
  'BINANCE:GPTUSDT': 'GPTUSDT',
  'BINANCE:HOOKUSDT': 'HOOKUSDT',
  'BINANCE:ILVUSDT': 'ILVUSDT',
  'BINANCE:IMXUSDT': 'IMXUSDT',
  'BINANCE:INJUSDT': 'INJUSDT',
  'BINANCE:JTOUSDT': 'JTOUSDT',
  'BINANCE:JUPUSDT': 'JUPUSDT',
  'BINANCE:KAVAUSDT': 'KAVAUSDT',
  'BINANCE:KEYUSDT': 'KEYUSDT',
  'BINANCE:LDOUSDT': 'LDOUSDT',
  'BINANCE:LPTUSDT': 'LPTUSDT',
  'BINANCE:LRCUSDT': 'LRCUSDT',
  'BINANCE:LUNAUSDT': 'LUNAUSDT',
  'BINANCE:MAGICUSDT': 'MAGICUSDT',
  'BINANCE:MANTAUSDT': 'MANTAUSDT',
  'BINANCE:MINAUSDT': 'MINAUSDT',
  'BINANCE:NEIROUSDT': 'NEIROUSDT',
  'BINANCE:NFPUSDT': 'NFPUSDT',
  'BINANCE:NTRNUSDT': 'NTRNUSDT',
  'BINANCE:OMNIUSDT': 'OMNIUSDT',
  'BINANCE:OPUSDT': 'OPUSDT',
  'BINANCE:ORDIUSDT': 'ORDIUSDT',
  'BINANCE:PENDLEUSDT': 'PENDLEUSDT',
  'BINANCE:PIXELUSDT': 'PIXELUSDT',
  'BINANCE:PORTALUSDT': 'PORTALUSDT',
  'BINANCE:POWRUSDT': 'POWRUSDT',
  'BINANCE:PROMUSDT': 'PROMUSDT',
  'BINANCE:PYTHUSDT': 'PYTHUSDT',
  'BINANCE:QNTUSDT': 'QNTUSDT',
  'BINANCE:RDNTUSDT': 'RDNTUSDT',
  'BINANCE:REIUSDT': 'REIUSDT',
  'BINANCE:RENDERUSDT': 'RENDERUSDT',
  'BINANCE:RNDRUSDT': 'RNDRUSDT',
  'BINANCE:RONINUSDT': 'RONINUSDT',
  'BINANCE:RUNEUSDT': 'RUNEUSDT',
  'BINANCE:SEIUSDT': 'SEIUSDT',
  'BINANCE:SLPUSDT': 'SLPUSDT',
  'BINANCE:SNTUSDT': 'SNTUSDT',
  'BINANCE:SSVUSDT': 'SSVUSDT',
  'BINANCE:STEEMUSDT': 'STEEMUSDT',
  'BINANCE:STGUSDT': 'STGUSDT',
  'BINANCE:STPTUSDT': 'STPTUSDT',
  'BINANCE:STRKUSDT': 'STRKUSDT',
  'BINANCE:SUIUSDT': 'SUIUSDT',
  'BINANCE:SUNUSDT': 'SUNUSDT',
  'BINANCE:SUPERUSDT': 'SUPERUSDT',
  'BINANCE:SXPUSDT': 'SXPUSDT',
  'BINANCE:TIAUSDT': 'TIAUSDT',
  'BINANCE:TNSRUSDT': 'TNSRUSDT',
  'BINANCE:TONUSDT': 'TONUSDT',
  'BINANCE:TRBUSDT': 'TRBUSDT',
  'BINANCE:TRUUSDT': 'TRUUSDT',
  'BINANCE:UNFIUSDT': 'UNFIUSDT',
  'BINANCE:VANRYUSDT': 'VANRYUSDT',
  'BINANCE:VICUSDT': 'VICUSDT',
  'BINANCE:VIDTUSDT': 'VIDTUSDT',
  'BINANCE:VITEUSDT': 'VITEUSDT',
  'BINANCE:VOXELUSDT': 'VOXELUSDT',
  'BINANCE:VTHOUSDT': 'VTHOUSDT',
  'BINANCE:WAXPUSDT': 'WAXPUSDT',
  'BINANCE:WLDUSDT': 'WLDUSDT',
  'BINANCE:XAIUSDT': 'XAIUSDT',
  'BINANCE:XECUSDT': 'XECUSDT',
  'BINANCE:XEMUSDT': 'XEMUSDT',
  'BINANCE:XMRUSDT': 'XMRUSDT',
  'BINANCE:XVGUSDT': 'XVGUSDT',
  'BINANCE:XVSUSDT': 'XVSUSDT',
  'BINANCE:YGGUSDT': 'YGGUSDT',
  'BINANCE:ZECUSDT': 'ZECUSDT',
  'BINANCE:ZRXUSDT': 'ZRXUSDT',
};

/**
 * Get Binance symbol from TradingView symbol
 */
function getBinanceSymbol(symbol: string): string | null {
  // Direct mapping
  if (BINANCE_SYMBOL_MAPPING[symbol]) {
    return BINANCE_SYMBOL_MAPPING[symbol];
  }
  
  // Try to extract base symbol and add USDT
  const baseSymbol = symbol.split(':')[1] || symbol.split('/')[0];
  if (baseSymbol && baseSymbol !== 'UNKNOWN') {
    // Remove USD and add USDT
    const cleanSymbol = baseSymbol.replace('USD', '').replace('USDT', '');
    return `${cleanSymbol}USDT`;
  }
  
  return null;
}

/**
 * Fetch exact OHLC data from Binance API
 */
export async function fetchExactOHLCData(
  symbol: string,
  days: number = 90
): Promise<ChartDataPoint[]> {
  try {
    const binanceSymbol = getBinanceSymbol(symbol);
    if (!binanceSymbol) {
      console.warn(`No Binance mapping found for symbol: ${symbol}`);
      return [];
    }

    console.log(`Fetching exact OHLC data for ${symbol} (${binanceSymbol}) from Binance...`);
    
    // Calculate the number of 1-day klines needed
    const limit = Math.min(days, 1000); // Binance max limit is 1000
    
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout
    
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1d&limit=${limit}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Binance API error: ${response.status} ${response.statusText}`);
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }

    const klines: BinanceKline[] = await response.json();
    
    if (!Array.isArray(klines) || klines.length === 0) {
      console.error('No kline data received from Binance');
      throw new Error('No kline data received from Binance');
    }

    console.log(`Received ${klines.length} klines from Binance`);

    const chartData: ChartDataPoint[] = klines.map((kline, index) => {
      const date = new Date(kline.openTime);
      const dateStr = date.toISOString().split('T')[0];
      
      // Parse and validate the numbers
      const open = parseFloat(kline.open);
      const high = parseFloat(kline.high);
      const low = parseFloat(kline.low);
      const close = parseFloat(kline.close);
      const volume = parseFloat(kline.volume);
      
      // Validate the data
      if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close) || isNaN(volume)) {
        console.warn(`Invalid data at index ${index}:`, { open, high, low, close, volume });
      }
      
      // Ensure high is the highest and low is the lowest
      const validHigh = Math.max(open, high, low, close);
      const validLow = Math.min(open, high, low, close);
      
      return {
        date: dateStr,
        open: Number(open.toFixed(8)),
        high: Number(validHigh.toFixed(8)),
        low: Number(validLow.toFixed(8)),
        close: Number(close.toFixed(8)),
        volume: formatVolume(volume)
      };
    });

    console.log(`Successfully processed ${chartData.length} days of exact OHLC data for ${symbol}`);
    console.log('Sample data:', chartData.slice(0, 3));
    return chartData;

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Request timeout for OHLC data: ${symbol}`);
    } else {
      console.error(`Error fetching OHLC data for ${symbol}:`, error);
    }
    
    return [];
  }
}

/**
 * Format volume for display
 */
function formatVolume(volume: number): string {
  if (volume >= 1000000000) {
    return `${(volume / 1000000000).toFixed(1)}B`;
  } else if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(1)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(0)}K`;
  } else {
    return volume.toFixed(0);
  }
}

/**
 * Fetch current price from Binance
 */
export async function fetchCurrentPriceFromBinance(symbol: string): Promise<{
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
} | null> {
  try {
    const binanceSymbol = getBinanceSymbol(symbol);
    if (!binanceSymbol) {
      console.warn(`No Binance mapping found for symbol: ${symbol}`);
      return null;
    }

    console.log(`Fetching current price for ${symbol} (${binanceSymbol}) from Binance...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    const response = await fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Binance API error: ${response.status} ${response.statusText}`);
      throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    console.log('Binance 24hr ticker data:', data);
    
    // Validate and parse the data
    const price = parseFloat(data.lastPrice);
    const change24h = parseFloat(data.priceChange);
    const changePercent24h = parseFloat(data.priceChangePercent);
    const volume24h = parseFloat(data.volume);
    
    if (isNaN(price) || isNaN(change24h) || isNaN(changePercent24h) || isNaN(volume24h)) {
      console.error('Invalid price data received:', { price, change24h, changePercent24h, volume24h });
      throw new Error('Invalid price data received from Binance');
    }
    
    const result = {
      price: Number(price.toFixed(8)),
      change24h: Number(change24h.toFixed(8)),
      changePercent24h: Number(changePercent24h.toFixed(2)),
      volume24h: Number(volume24h.toFixed(0))
    };
    
    console.log('Parsed price data:', result);
    return result;

  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error(`Request timeout for current price: ${symbol}`);
    } else {
      console.error(`Error fetching current price for ${symbol}:`, error);
    }
    
    return null;
  }
}

/**
 * Get exact data (current price + historical OHLC)
 */
export async function getExactTradingData(symbol: string, days: number = 90): Promise<{
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  chartData: ChartDataPoint[];
}> {
  try {
    // Fetch both current price and historical data in parallel
    const [priceData, historicalData] = await Promise.all([
      fetchCurrentPriceFromBinance(symbol),
      fetchExactOHLCData(symbol, days)
    ]);
    
    if (priceData && historicalData.length > 0) {
      // Update the most recent data point with current price
      const lastIndex = historicalData.length - 1;
      historicalData[lastIndex] = {
        ...historicalData[lastIndex],
        close: priceData.price,
        high: Math.max(historicalData[lastIndex].high, priceData.price),
        low: Math.min(historicalData[lastIndex].low, priceData.price),
      };
      
      console.log(`Updated most recent data point with current price: $${priceData.price}`);
      
      return {
        currentPrice: priceData.price,
        change24h: priceData.change24h,
        changePercent24h: priceData.changePercent24h,
        volume24h: priceData.volume24h,
        chartData: historicalData
      };
    } else {
      throw new Error('Failed to fetch price or historical data');
    }
    
  } catch (error) {
    console.error('Error fetching exact trading data:', error);
    throw error;
  }
}