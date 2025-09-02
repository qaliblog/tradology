import type { ChartDataPoint } from '../types';

interface PriceData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap?: number;
  lastUpdated: string;
}

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

// Enhanced symbol mapping with more exchanges
const SYMBOL_MAPPING: Record<string, { binance: string; coingecko: string }> = {
  'BITSTAMP:BTCUSD': { binance: 'BTCUSDT', coingecko: 'bitcoin' },
  'COINBASE:BTCUSD': { binance: 'BTCUSDT', coingecko: 'bitcoin' },
  'BINANCE:BTCUSDT': { binance: 'BTCUSDT', coingecko: 'bitcoin' },
  'BITSTAMP:ETHUSD': { binance: 'ETHUSDT', coingecko: 'ethereum' },
  'COINBASE:ETHUSD': { binance: 'ETHUSDT', coingecko: 'ethereum' },
  'BINANCE:ETHUSDT': { binance: 'ETHUSDT', coingecko: 'ethereum' },
  'BINANCE:SOLUSDT': { binance: 'SOLUSDT', coingecko: 'solana' },
  'COINBASE:SOLUSD': { binance: 'SOLUSDT', coingecko: 'solana' },
  'BINANCE:ADAUSDT': { binance: 'ADAUSDT', coingecko: 'cardano' },
  'BINANCE:DOTUSDT': { binance: 'DOTUSDT', coingecko: 'polkadot' },
  'BINANCE:LINKUSDT': { binance: 'LINKUSDT', coingecko: 'chainlink' },
  'BINANCE:MATICUSDT': { binance: 'MATICUSDT', coingecko: 'matic-network' },
  'BINANCE:AVAXUSDT': { binance: 'AVAXUSDT', coingecko: 'avalanche-2' },
  'BINANCE:ATOMUSDT': { binance: 'ATOMUSDT', coingecko: 'cosmos' },
  'BINANCE:ALGOUSDT': { binance: 'ALGOUSDT', coingecko: 'algorand' },
  'BINANCE:NEARUSDT': { binance: 'NEARUSDT', coingecko: 'near' },
  'BINANCE:FTMUSDT': { binance: 'FTMUSDT', coingecko: 'fantom' },
  'BINANCE:MANAUSDT': { binance: 'MANAUSDT', coingecko: 'decentraland' },
  'BINANCE:SANDUSDT': { binance: 'SANDUSDT', coingecko: 'the-sandbox' },
  'BINANCE:AXSUSDT': { binance: 'AXSUSDT', coingecko: 'axie-infinity' },
  'BINANCE:CHZUSDT': { binance: 'CHZUSDT', coingecko: 'chiliz' },
  'BINANCE:ENJUSDT': { binance: 'ENJUSDT', coingecko: 'enjincoin' },
  'BINANCE:FLOWUSDT': { binance: 'FLOWUSDT', coingecko: 'flow' },
  'BINANCE:ICPUSDT': { binance: 'ICPUSDT', coingecko: 'internet-computer' },
  'BINANCE:VETUSDT': { binance: 'VETUSDT', coingecko: 'vechain' },
  'BINANCE:THETAUSDT': { binance: 'THETAUSDT', coingecko: 'theta-token' },
  'BINANCE:EGLDUSDT': { binance: 'EGLDUSDT', coingecko: 'elrond-erd-2' },
  'BINANCE:HBARUSDT': { binance: 'HBARUSDT', coingecko: 'hedera-hashgraph' },
  'BINANCE:XTZUSDT': { binance: 'XTZUSDT', coingecko: 'tezos' },
  'BINANCE:ZILUSDT': { binance: 'ZILUSDT', coingecko: 'zilliqa' },
  'BINANCE:ONEUSDT': { binance: 'ONEUSDT', coingecko: 'harmony' },
  'BINANCE:ICXUSDT': { binance: 'ICXUSDT', coingecko: 'icon' },
  'BINANCE:ONTUSDT': { binance: 'ONTUSDT', coingecko: 'ontology' },
  'BINANCE:ZENUSDT': { binance: 'ZENUSDT', coingecko: 'horizen' },
  'BINANCE:SCUSDT': { binance: 'SCUSDT', coingecko: 'siacoin' },
  'BINANCE:STORJUSDT': { binance: 'STORJUSDT', coingecko: 'storj' },
  'BINANCE:SKLUSDT': { binance: 'SKLUSDT', coingecko: 'skale' },
  'BINANCE:GRTUSDT': { binance: 'GRTUSDT', coingecko: 'the-graph' },
  'BINANCE:COMPUSDT': { binance: 'COMPUSDT', coingecko: 'compound-governance-token' },
  'BINANCE:MKRUSDT': { binance: 'MKRUSDT', coingecko: 'maker' },
  'BINANCE:SNXUSDT': { binance: 'SNXUSDT', coingecko: 'havven' },
  'BINANCE:YFIUSDT': { binance: 'YFIUSDT', coingecko: 'yearn-finance' },
  'BINANCE:UNIUSDT': { binance: 'UNIUSDT', coingecko: 'uniswap' },
  'BINANCE:AAVEUSDT': { binance: 'AAVEUSDT', coingecko: 'aave' },
  'BINANCE:SUSHIUSDT': { binance: 'SUSHIUSDT', coingecko: 'sushi' },
  'BINANCE:CRVUSDT': { binance: 'CRVUSDT', coingecko: 'curve-dao-token' },
  'BINANCE:1INCHUSDT': { binance: '1INCHUSDT', coingecko: '1inch' },
  'BINANCE:BALUSDT': { binance: 'BALUSDT', coingecko: 'balancer' },
  'BINANCE:UMAUSDT': { binance: 'UMAUSDT', coingecko: 'uma' },
  'BINANCE:BNBUSDT': { binance: 'BNBUSDT', coingecko: 'binancecoin' },
  'BINANCE:CAKEUSDT': { binance: 'CAKEUSDT', coingecko: 'pancakeswap-token' },
  'BINANCE:BUSDUSDT': { binance: 'BUSDUSDT', coingecko: 'binance-usd' },
  'BINANCE:USDTUSDT': { binance: 'USDTUSDT', coingecko: 'tether' },
  'BINANCE:USDCUSDT': { binance: 'USDCUSDT', coingecko: 'usd-coin' },
  'BINANCE:DAIUSDT': { binance: 'DAIUSDT', coingecko: 'dai' },
  'BINANCE:TUSDUSDT': { binance: 'TUSDUSDT', coingecko: 'true-usd' },
  'BINANCE:USDPUSDT': { binance: 'USDPUSDT', coingecko: 'paxos-standard' },
  'BINANCE:GUSDUSDT': { binance: 'GUSDUSDT', coingecko: 'gemini-dollar' },
  'BINANCE:LTCUSDT': { binance: 'LTCUSDT', coingecko: 'litecoin' },
  'BINANCE:BCHUSDT': { binance: 'BCHUSDT', coingecko: 'bitcoin-cash' },
  'BINANCE:BSVUSDT': { binance: 'BSVUSDT', coingecko: 'bitcoin-sv' },
  'BINANCE:XRPUSDT': { binance: 'XRPUSDT', coingecko: 'ripple' },
  'BINANCE:XLMUSDT': { binance: 'XLMUSDT', coingecko: 'stellar' },
  'BINANCE:EOSUSDT': { binance: 'EOSUSDT', coingecko: 'eos' },
  'BINANCE:TRXUSDT': { binance: 'TRXUSDT', coingecko: 'tron' },
  'BINANCE:DOGEUSDT': { binance: 'DOGEUSDT', coingecko: 'dogecoin' },
  'BINANCE:SHIBUSDT': { binance: 'SHIBUSDT', coingecko: 'shiba-inu' },
  'BINANCE:BABYDOGEUSDT': { binance: 'BABYDOGEUSDT', coingecko: 'baby-doge-coin' },
  'BINANCE:ELONUSDT': { binance: 'ELONUSDT', coingecko: 'dogelon-mars' },
  'BINANCE:FLOKIUSDT': { binance: 'FLOKIUSDT', coingecko: 'floki' },
  'BINANCE:PEPEUSDT': { binance: 'PEPEUSDT', coingecko: 'pepe' },
  'BINANCE:WIFUSDT': { binance: 'WIFUSDT', coingecko: 'dogwifcoin' },
  'BINANCE:BONKUSDT': { binance: 'BONKUSDT', coingecko: 'bonk' },
  'BINANCE:MYROUSDT': { binance: 'MYROUSDT', coingecko: 'myro' },
  'BINANCE:WENUSDT': { binance: 'WENUSDT', coingecko: 'wen' },
  'BINANCE:MEWUSDT': { binance: 'MEWUSDT', coingecko: 'cat-in-a-dogs-world' },
  'BINANCE:PNUTUSDT': { binance: 'PNUTUSDT', coingecko: 'peanut-the-squirrel' },
  'BINANCE:GOATUSDT': { binance: 'GOATUSDT', coingecko: 'goatseus-maximus' },
  'BINANCE:ACTUSDT': { binance: 'ACTUSDT', coingecko: 'achain' },
  'BINANCE:AIUSDT': { binance: 'AIUSDT', coingecko: 'sleepless-ai' },
  'BINANCE:ARKMUSDT': { binance: 'ARKMUSDT', coingecko: 'arkham' },
  'BINANCE:ARUSDT': { binance: 'ARUSDT', coingecko: 'arweave' },
  'BINANCE:BEAMXUSDT': { binance: 'BEAMXUSDT', coingecko: 'beam' },
  'BINANCE:BOMEUSDT': { binance: 'BOMEUSDT', coingecko: 'book-of-meme' },
  'BINANCE:ENAUSDT': { binance: 'ENAUSDT', coingecko: 'ethena' },
  'BINANCE:ETCUSDT': { binance: 'ETCUSDT', coingecko: 'ethereum-classic' },
  'BINANCE:FETUSDT': { binance: 'FETUSDT', coingecko: 'fetch-ai' },
  'BINANCE:FILUSDT': { binance: 'FILUSDT', coingecko: 'filecoin' },
  'BINANCE:FTNUSDT': { binance: 'FTNUSDT', coingecko: 'fountain' },
  'BINANCE:GALAUSDT': { binance: 'GALAUSDT', coingecko: 'gala' },
  'BINANCE:GLMUSDT': { binance: 'GLMUSDT', coingecko: 'golem' },
  'BINANCE:GMXUSDT': { binance: 'GMXUSDT', coingecko: 'gmx' },
  'BINANCE:GPTUSDT': { binance: 'GPTUSDT', coingecko: 'qna3-ai' },
  'BINANCE:HOOKUSDT': { binance: 'HOOKUSDT', coingecko: 'hooked-protocol' },
  'BINANCE:ILVUSDT': { binance: 'ILVUSDT', coingecko: 'illuvium' },
  'BINANCE:IMXUSDT': { binance: 'IMXUSDT', coingecko: 'immutable-x' },
  'BINANCE:INJUSDT': { binance: 'INJUSDT', coingecko: 'injective-protocol' },
  'BINANCE:JTOUSDT': { binance: 'JTOUSDT', coingecko: 'jito-governance-token' },
  'BINANCE:JUPUSDT': { binance: 'JUPUSDT', coingecko: 'jupiter-exchange-solana' },
  'BINANCE:KAVAUSDT': { binance: 'KAVAUSDT', coingecko: 'kava' },
  'BINANCE:KEYUSDT': { binance: 'KEYUSDT', coingecko: 'selfkey' },
  'BINANCE:LDOUSDT': { binance: 'LDOUSDT', coingecko: 'lido-dao' },
  'BINANCE:LPTUSDT': { binance: 'LPTUSDT', coingecko: 'livepeer' },
  'BINANCE:LRCUSDT': { binance: 'LRCUSDT', coingecko: 'loopring' },
  'BINANCE:LUNAUSDT': { binance: 'LUNAUSDT', coingecko: 'terra-luna-2' },
  'BINANCE:MAGICUSDT': { binance: 'MAGICUSDT', coingecko: 'magic' },
  'BINANCE:MANTAUSDT': { binance: 'MANTAUSDT', coingecko: 'manta-network' },
  'BINANCE:MINAUSDT': { binance: 'MINAUSDT', coingecko: 'mina-protocol' },
  'BINANCE:NEIROUSDT': { binance: 'NEIROUSDT', coingecko: 'neiro' },
  'BINANCE:NFPUSDT': { binance: 'NFPUSDT', coingecko: 'nfp' },
  'BINANCE:NTRNUSDT': { binance: 'NTRNUSDT', coingecko: 'neutron-3' },
  'BINANCE:OMNIUSDT': { binance: 'OMNIUSDT', coingecko: 'omni-network' },
  'BINANCE:OPUSDT': { binance: 'OPUSDT', coingecko: 'optimism' },
  'BINANCE:ORDIUSDT': { binance: 'ORDIUSDT', coingecko: 'ordinals' },
  'BINANCE:PENDLEUSDT': { binance: 'PENDLEUSDT', coingecko: 'pendle' },
  'BINANCE:PIXELUSDT': { binance: 'PIXELUSDT', coingecko: 'pixels' },
  'BINANCE:PORTALUSDT': { binance: 'PORTALUSDT', coingecko: 'portal' },
  'BINANCE:POWRUSDT': { binance: 'POWRUSDT', coingecko: 'power-ledger' },
  'BINANCE:PROMUSDT': { binance: 'PROMUSDT', coingecko: 'prom' },
  'BINANCE:PYTHUSDT': { binance: 'PYTHUSDT', coingecko: 'pyth-network' },
  'BINANCE:QNTUSDT': { binance: 'QNTUSDT', coingecko: 'quant-network' },
  'BINANCE:RDNTUSDT': { binance: 'RDNTUSDT', coingecko: 'radiant-capital' },
  'BINANCE:REIUSDT': { binance: 'REIUSDT', coingecko: 'rei-network' },
  'BINANCE:RENDERUSDT': { binance: 'RENDERUSDT', coingecko: 'render-token' },
  'BINANCE:RNDRUSDT': { binance: 'RNDRUSDT', coingecko: 'render-token' },
  'BINANCE:RONINUSDT': { binance: 'RONINUSDT', coingecko: 'ronin' },
  'BINANCE:RUNEUSDT': { binance: 'RUNEUSDT', coingecko: 'thorchain' },
  'BINANCE:SEIUSDT': { binance: 'SEIUSDT', coingecko: 'sei-network' },
  'BINANCE:SLPUSDT': { binance: 'SLPUSDT', coingecko: 'smooth-love-potion' },
  'BINANCE:SNTUSDT': { binance: 'SNTUSDT', coingecko: 'status' },
  'BINANCE:SSVUSDT': { binance: 'SSVUSDT', coingecko: 'ssv-network' },
  'BINANCE:STEEMUSDT': { binance: 'STEEMUSDT', coingecko: 'steem' },
  'BINANCE:STGUSDT': { binance: 'STGUSDT', coingecko: 'stargate-finance' },
  'BINANCE:STPTUSDT': { binance: 'STPTUSDT', coingecko: 'stpt' },
  'BINANCE:STRKUSDT': { binance: 'STRKUSDT', coingecko: 'starknet' },
  'BINANCE:SUIUSDT': { binance: 'SUIUSDT', coingecko: 'sui' },
  'BINANCE:SUNUSDT': { binance: 'SUNUSDT', coingecko: 'sun-token' },
  'BINANCE:SUPERUSDT': { binance: 'SUPERUSDT', coingecko: 'superfarm' },
  'BINANCE:SXPUSDT': { binance: 'SXPUSDT', coingecko: 'swipe' },
  'BINANCE:TIAUSDT': { binance: 'TIAUSDT', coingecko: 'celestia' },
  'BINANCE:TNSRUSDT': { binance: 'TNSRUSDT', coingecko: 'tensor' },
  'BINANCE:TONUSDT': { binance: 'TONUSDT', coingecko: 'the-open-network' },
  'BINANCE:TRBUSDT': { binance: 'TRBUSDT', coingecko: 'tellor' },
  'BINANCE:TRUUSDT': { binance: 'TRUUSDT', coingecko: 'truefi' },
  'BINANCE:UNFIUSDT': { binance: 'UNFIUSDT', coingecko: 'unifi-protocol-dao' },
  'BINANCE:VANRYUSDT': { binance: 'VANRYUSDT', coingecko: 'vanry' },
  'BINANCE:VICUSDT': { binance: 'VICUSDT', coingecko: 'victoria-vr' },
  'BINANCE:VIDTUSDT': { binance: 'VIDTUSDT', coingecko: 'vidt-dao' },
  'BINANCE:VITEUSDT': { binance: 'VITEUSDT', coingecko: 'vite' },
  'BINANCE:VOXELUSDT': { binance: 'VOXELUSDT', coingecko: 'voxies' },
  'BINANCE:VTHOUSDT': { binance: 'VTHOUSDT', coingecko: 'vethor-token' },
  'BINANCE:WAXPUSDT': { binance: 'WAXPUSDT', coingecko: 'wax' },
  'BINANCE:WLDUSDT': { binance: 'WLDUSDT', coingecko: 'worldcoin-wld' },
  'BINANCE:XAIUSDT': { binance: 'XAIUSDT', coingecko: 'xai-blockchain' },
  'BINANCE:XECUSDT': { binance: 'XECUSDT', coingecko: 'ecash' },
  'BINANCE:XEMUSDT': { binance: 'XEMUSDT', coingecko: 'nem' },
  'BINANCE:XMRUSDT': { binance: 'XMRUSDT', coingecko: 'monero' },
  'BINANCE:XVGUSDT': { binance: 'XVGUSDT', coingecko: 'verge' },
  'BINANCE:XVSUSDT': { binance: 'XVSUSDT', coingecko: 'venus' },
  'BINANCE:YGGUSDT': { binance: 'YGGUSDT', coingecko: 'yield-guild-games' },
  'BINANCE:ZECUSDT': { binance: 'ZECUSDT', coingecko: 'zcash' },
  'BINANCE:ZRXUSDT': { binance: 'ZRXUSDT', coingecko: '0x' },
};

/**
 * Get symbol mappings
 */
function getSymbolMappings(symbol: string): { binance: string; coingecko: string } | null {
  // Direct mapping
  if (SYMBOL_MAPPING[symbol]) {
    return SYMBOL_MAPPING[symbol];
  }
  
  // Try to extract base symbol and add USDT
  const baseSymbol = symbol.split(':')[1] || symbol.split('/')[0];
  if (baseSymbol && baseSymbol !== 'UNKNOWN') {
    const cleanSymbol = baseSymbol.replace('USD', '').replace('USDT', '');
    return { binance: `${cleanSymbol}USDT`, coingecko: cleanSymbol.toLowerCase() };
  }
  
  return null;
}

/**
 * Fetch precise OHLC data from Binance with validation
 */
export async function fetchPreciseOHLCData(
  symbol: string,
  days: number = 90
): Promise<ChartDataPoint[]> {
  try {
    const mappings = getSymbolMappings(symbol);
    if (!mappings) {
      console.warn(`No symbol mapping found for: ${symbol}`);
      return [];
    }

    console.log(`Fetching precise OHLC data for ${symbol} (${mappings.binance}) from Binance...`);
    console.log(`API URL: https://api.binance.com/api/v3/klines?symbol=${mappings.binance}&interval=1d&limit=${Math.min(days, 1000)}`);
    
    const limit = Math.min(days, 1000);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${mappings.binance}&interval=1d&limit=${limit}`,
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
      
      // Parse with high precision
      const open = parseFloat(kline.open);
      const high = parseFloat(kline.high);
      const low = parseFloat(kline.low);
      const close = parseFloat(kline.close);
      const volume = parseFloat(kline.volume);
      
      // Validate data integrity
      if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close) || isNaN(volume)) {
        console.warn(`Invalid data at index ${index}:`, { open, high, low, close, volume });
        return null;
      }
      
      // Ensure data consistency
      const validHigh = Math.max(open, high, low, close);
      const validLow = Math.min(open, high, low, close);
      
      // Use maximum precision for crypto prices
      const precision = 8;
      
      return {
        date: dateStr,
        open: Number(open.toFixed(precision)),
        high: Number(validHigh.toFixed(precision)),
        low: Number(validLow.toFixed(precision)),
        close: Number(close.toFixed(precision)),
        volume: formatVolume(volume)
      };
    }).filter(item => item !== null) as ChartDataPoint[];

    console.log(`Successfully processed ${chartData.length} days of precise OHLC data for ${symbol}`);
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
 * Fetch precise current price from multiple sources
 */
export async function fetchPreciseCurrentPrice(symbol: string): Promise<{
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap?: number;
} | null> {
  try {
    const mappings = getSymbolMappings(symbol);
    if (!mappings) {
      console.warn(`No symbol mapping found for: ${symbol}`);
      return null;
    }

    console.log(`Fetching precise current price for ${symbol} from multiple sources...`);
    console.log(`Binance symbol: ${mappings.binance}, CoinGecko ID: ${mappings.coingecko}`);
    
    // Try Binance first (most accurate for crypto)
    try {
      console.log(`Attempting to fetch from Binance: ${mappings.binance}`);
      const binanceData = await fetchBinancePrice(mappings.binance);
      if (binanceData) {
        console.log('✅ Using Binance price data:', binanceData);
        return binanceData;
      }
    } catch (error) {
      console.warn('❌ Binance price fetch failed:', error);
    }
    
    // Fallback to CoinGecko
    try {
      const coingeckoData = await fetchCoinGeckoPrice(mappings.coingecko);
      if (coingeckoData) {
        console.log('Using CoinGecko price data:', coingeckoData);
        return coingeckoData;
      }
    } catch (error) {
      console.warn('CoinGecko price fetch failed:', error);
    }
    
    return null;
    
  } catch (error) {
    console.error(`Error fetching precise current price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch price from Binance
 */
async function fetchBinancePrice(binanceSymbol: string): Promise<{
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
} | null> {
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
    throw new Error(`Binance API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  const price = parseFloat(data.lastPrice);
  const change24h = parseFloat(data.priceChange);
  const changePercent24h = parseFloat(data.priceChangePercent);
  const volume24h = parseFloat(data.volume);
  
  if (isNaN(price) || isNaN(change24h) || isNaN(changePercent24h) || isNaN(volume24h)) {
    throw new Error('Invalid price data received from Binance');
  }
  
  return {
    price: Number(price.toFixed(8)),
    change24h: Number(change24h.toFixed(8)),
    changePercent24h: Number(changePercent24h.toFixed(2)),
    volume24h: Number(volume24h.toFixed(0))
  };
}

/**
 * Fetch price from CoinGecko
 */
async function fetchCoinGeckoPrice(coingeckoId: string): Promise<{
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap?: number;
} | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);
  
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coingeckoId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true&include_market_cap=true&include_last_updated_at=true`,
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
    throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const priceData = data[coingeckoId];

  if (!priceData) {
    throw new Error(`No price data found for ${coingeckoId}`);
  }

  return {
    price: Number((priceData.usd || 0).toFixed(8)),
    change24h: Number((priceData.usd_24h_change || 0).toFixed(8)),
    changePercent24h: Number((priceData.usd_24h_change || 0).toFixed(2)),
    volume24h: Number((priceData.usd_24h_vol || 0).toFixed(0)),
    marketCap: priceData.usd_market_cap ? Number(priceData.usd_market_cap.toFixed(0)) : undefined
  };
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
 * Get precise trading data (current price + historical OHLC)
 */
export async function getPreciseTradingData(symbol: string, days: number = 90): Promise<{
  currentPrice: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap?: number;
  chartData: ChartDataPoint[];
}> {
  try {
    // Fetch both current price and historical data in parallel
    const [priceData, historicalData] = await Promise.all([
      fetchPreciseCurrentPrice(symbol),
      fetchPreciseOHLCData(symbol, days)
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
      
      console.log(`Updated most recent data point with precise current price: $${priceData.price}`);
      
      return {
        currentPrice: priceData.price,
        change24h: priceData.change24h,
        changePercent24h: priceData.changePercent24h,
        volume24h: priceData.volume24h,
        marketCap: priceData.marketCap,
        chartData: historicalData
      };
    } else {
      throw new Error('Failed to fetch price or historical data');
    }
    
  } catch (error) {
    console.error('Error fetching precise trading data:', error);
    throw error;
  }
}