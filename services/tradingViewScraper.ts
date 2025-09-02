import type { ChartDataPoint } from '../types';
import { getCurrentPriceAndChartData, fetchHistoricalData } from './priceService';
import { getExactTradingData } from './exactDataService';
import { getPreciseTradingData } from './preciseDataService';

interface TradingViewData {
  symbol: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  volume: string;
  marketCap?: string;
  dataPoints: ChartDataPoint[];
}

/**
 * Extract symbol information from TradingView URL
 */
export function extractSymbolFromUrl(url: string): string {
  try {
    // Validate URL format first
    if (!url || typeof url !== 'string') {
      console.warn('Invalid URL provided:', url);
      return 'UNKNOWN';
    }

    // Check if it's a valid URL format
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch (urlError) {
      console.warn('Invalid URL format, trying to extract symbol from string:', url);
      
      // Try to extract symbol from string patterns even if not a valid URL
      const symbolMatch = url.match(/symbol=([^&]+)/);
      if (symbolMatch) {
        const decodedSymbol = decodeURIComponent(symbolMatch[1]);
        console.log('Extracted symbol from string pattern:', decodedSymbol);
        return decodedSymbol;
      }
      
      // Check if it's just a symbol string (e.g., "BITSTAMP:BTCUSD")
      if (url.includes(':') && url.includes('USD')) {
        console.log('Detected direct symbol format:', url);
        return url;
      }
      
      return 'UNKNOWN';
    }

    const pathParts = urlObj.pathname.split('/');
    
    // Handle different TradingView URL patterns
    if (pathParts.includes('symbols')) {
      const symbolIndex = pathParts.indexOf('symbols');
      if (symbolIndex + 1 < pathParts.length) {
        return pathParts[symbolIndex + 1].replace(/\//g, '');
      }
    }
    
    // Handle chart URLs with symbol parameter (e.g., ?symbol=BITSTAMP%3ABTCUSD)
    const symbolParam = urlObj.searchParams.get('symbol');
    if (symbolParam) {
      // Decode URL encoding and clean up the symbol
      const decodedSymbol = decodeURIComponent(symbolParam);
      console.log('Extracted symbol from URL:', decodedSymbol);
      return decodedSymbol;
    }
    
    // Handle direct symbol in path (e.g., /chart/?symbol=BITSTAMP:BTCUSD)
    const symbolMatch = url.match(/symbol=([^&]+)/);
    if (symbolMatch) {
      const decodedSymbol = decodeURIComponent(symbolMatch[1]);
      console.log('Extracted symbol from path:', decodedSymbol);
      return decodedSymbol;
    }
    
    return 'UNKNOWN';
  } catch (error) {
    console.error('Error extracting symbol from URL:', error);
    return 'UNKNOWN';
  }
}

/**
 * Parse TradingView HTML content to extract available data
 */
export function parseTradingViewHtml(htmlContent: string): Partial<TradingViewData> {
  const result: Partial<TradingViewData> = {
    dataPoints: []
  };

  try {
    // Extract symbol from initData
    const symbolMatch = htmlContent.match(/initData\.defSymbol\s*=\s*["']([^"']+)["']/);
    if (symbolMatch) {
      result.symbol = symbolMatch[1];
    }

    // Look for any price information in the HTML
    const pricePatterns = [
      // Look for price in meta tags
      /<meta[^>]*content=["']([^"']*\$[0-9,]+\.?[0-9]*[^"']*)["'][^>]*>/gi,
      // Look for price in script variables
      /(?:price|currentPrice|lastPrice)\s*[:=]\s*["']?([0-9,]+\.?[0-9]*)["']?/gi,
      // Look for any dollar amounts
      /\$([0-9,]+\.?[0-9]*)/g
    ];

    const foundPrices: number[] = [];
    
    for (const pattern of pricePatterns) {
      const matches = htmlContent.matchAll(pattern);
      for (const match of matches) {
        const priceStr = match[1]?.replace(/,/g, '') || match[1];
        const price = parseFloat(priceStr);
        if (!isNaN(price) && price > 0 && price < 100000) {
          foundPrices.push(price);
        }
      }
    }

    // Use the most reasonable price found
    if (foundPrices.length > 0) {
      // Sort and use median price
      foundPrices.sort((a, b) => a - b);
      result.currentPrice = foundPrices[Math.floor(foundPrices.length / 2)];
    }

    // Look for volume information
    const volumePatterns = [
      /volume\s*[:=]\s*["']?([0-9,]+\.?[0-9]*[KMB]?)["']?/gi,
      /([0-9,]+\.?[0-9]*[KMB]?)\s*volume/gi
    ];

    for (const pattern of volumePatterns) {
      const match = htmlContent.match(pattern);
      if (match) {
        result.volume = match[1];
        break;
      }
    }

    console.log('Parsed TradingView data:', {
      symbol: result.symbol,
      currentPrice: result.currentPrice,
      volume: result.volume
    });

  } catch (error) {
    console.error('Error parsing TradingView HTML:', error);
  }

  return result;
}

/**
 * Generate realistic chart data based on current price
 */
export function generateTradingViewChartData(
  currentPrice: number, 
  symbol: string = 'SOL/USD',
  days: number = 90
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  const today = new Date();
  
  // Generate historical data
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Create realistic price movement
    const volatility = 0.04; // 4% daily volatility for crypto
    const trend = 0.0003; // Slight upward trend
    const randomWalk = (Math.random() - 0.5) * volatility;
    
    // For the most recent day, use the exact current price
    if (i === 0) {
      var dayPrice = currentPrice;
    } else {
      var dayPrice = currentPrice * Math.pow(1 + trend + randomWalk, days - i);
    }
    
    // Generate OHLC data
    const spread = dayPrice * 0.008; // 0.8% spread
    const open = dayPrice + (Math.random() - 0.5) * spread;
    const close = dayPrice + (Math.random() - 0.5) * spread;
    const high = Math.max(open, close) + Math.random() * spread * 0.4;
    const low = Math.min(open, close) - Math.random() * spread * 0.4;
    
    // Generate volume
    const baseVolume = 1000000;
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
 * Main function to extract data from TradingView page
 */
export async function extractTradingViewData(url: string): Promise<TradingViewData> {
  try {
    console.log('Extracting data from TradingView URL:', url);
    
    // Validate input
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }
    
    // Extract symbol from URL
    const symbol = extractSymbolFromUrl(url);
    console.log('Extracted symbol:', symbol);
    
    // If symbol extraction failed, try to use the URL as a symbol directly
    const finalSymbol = symbol === 'UNKNOWN' ? url : symbol;
    
    // Try to fetch precise data first, fallback to exact data, then regular data
    try {
      const preciseData = await getPreciseTradingData(finalSymbol, 90);
      
      const result: TradingViewData = {
        symbol: finalSymbol,
        currentPrice: preciseData.currentPrice,
        priceChange: preciseData.change24h,
        priceChangePercent: preciseData.changePercent24h,
        volume: preciseData.volume24h > 1000000000 ? 
          `${(preciseData.volume24h / 1000000000).toFixed(1)}B` :
          preciseData.volume24h > 1000000 ?
          `${(preciseData.volume24h / 1000000).toFixed(1)}M` :
          `${(preciseData.volume24h / 1000).toFixed(0)}K`,
        marketCap: preciseData.marketCap ? 
          preciseData.marketCap > 1000000000 ?
          `${(preciseData.marketCap / 1000000000).toFixed(1)}B` :
          `${(preciseData.marketCap / 1000000).toFixed(1)}M` : undefined,
        dataPoints: preciseData.chartData
      };
      
      console.log('Extracted TradingView data with precise OHLC:', result);
      return result;
    } catch (preciseError) {
      console.warn('Precise data fetch failed, trying exact data:', preciseError);
      
      try {
        const exactData = await getExactTradingData(finalSymbol, 90);
        
        const result: TradingViewData = {
          symbol: finalSymbol,
          currentPrice: exactData.currentPrice,
          priceChange: exactData.change24h,
          priceChangePercent: exactData.changePercent24h,
          volume: exactData.volume24h > 1000000000 ? 
            `${(exactData.volume24h / 1000000000).toFixed(1)}B` :
            exactData.volume24h > 1000000 ?
            `${(exactData.volume24h / 1000000).toFixed(1)}M` :
            `${(exactData.volume24h / 1000).toFixed(0)}K`,
          marketCap: undefined, // Binance doesn't provide market cap in 24hr ticker
          dataPoints: exactData.chartData
        };
        
        console.log('Extracted TradingView data with exact OHLC:', result);
        return result;
      } catch (exactError) {
        console.warn('Exact data fetch failed, trying fallback:', exactError);
      
      // Fallback to regular data service
      const { priceData, chartData } = await getCurrentPriceAndChartData(finalSymbol, 90);
      
      if (priceData) {
        const result: TradingViewData = {
          symbol: finalSymbol,
          currentPrice: priceData.price,
          priceChange: priceData.change24h,
          priceChangePercent: priceData.changePercent24h,
          volume: priceData.volume24h > 1000000000 ? 
            `${(priceData.volume24h / 1000000000).toFixed(1)}B` :
            priceData.volume24h > 1000000 ?
            `${(priceData.volume24h / 1000000).toFixed(1)}M` :
            `${(priceData.volume24h / 1000).toFixed(0)}K`,
          marketCap: priceData.marketCap ? 
            priceData.marketCap > 1000000000 ?
            `${(priceData.marketCap / 1000000000).toFixed(1)}B` :
            `${(priceData.marketCap / 1000000).toFixed(1)}M` : undefined,
          dataPoints: chartData
        };
        
        console.log('Extracted TradingView data with fallback prices:', result);
        return result;
      } else {
        // Final fallback to mock data
        const fallbackPrice = finalSymbol.includes('BTC') ? 45000 : 
                             finalSymbol.includes('ETH') ? 3000 : 
                             finalSymbol.includes('SOL') ? 200 : 100;
        
        const mockData: TradingViewData = {
          symbol: finalSymbol,
          currentPrice: fallbackPrice,
          priceChange: fallbackPrice * 0.027,
          priceChangePercent: 2.7,
          volume: '1.2B',
          marketCap: '95.2B',
          dataPoints: chartData
        };
        
        console.log('Using final fallback TradingView data:', mockData);
        return mockData;
      }
      }
    }
    
  } catch (error) {
    console.error('Error extracting TradingView data:', error);
    throw new Error(`Failed to extract data from TradingView: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Enhanced function that can work with HTML content directly
 */
export async function processTradingViewHtml(htmlContent: string, url: string): Promise<TradingViewData> {
  try {
    console.log('Processing TradingView HTML content');
    
    // Parse the HTML content
    const parsedData = parseTradingViewHtml(htmlContent);
    
    // Extract symbol from URL as fallback
    const symbol = parsedData.symbol || extractSymbolFromUrl(url);
    console.log('Extracted symbol from HTML processing:', symbol);
    
    // Try to fetch real-time price data and historical data
    const { priceData, chartData } = await getCurrentPriceAndChartData(symbol, 90);
    
    if (priceData) {
      const result: TradingViewData = {
        symbol: symbol,
        currentPrice: priceData.price,
        priceChange: priceData.change24h,
        priceChangePercent: priceData.changePercent24h,
        volume: priceData.volume24h > 1000000000 ? 
          `${(priceData.volume24h / 1000000000).toFixed(1)}B` :
          priceData.volume24h > 1000000 ?
          `${(priceData.volume24h / 1000000).toFixed(1)}M` :
          `${(priceData.volume24h / 1000).toFixed(0)}K`,
        marketCap: priceData.marketCap ? 
          priceData.marketCap > 1000000000 ?
          `${(priceData.marketCap / 1000000000).toFixed(1)}B` :
          `${(priceData.marketCap / 1000000).toFixed(1)}M` : undefined,
        dataPoints: chartData
      };
      
      console.log('Processed TradingView data with real prices:', result);
      return result;
    } else {
      // Use current price from HTML or fallback to reasonable default
      const currentPrice = parsedData.currentPrice || 
        (symbol.includes('BTC') ? 45000 : 
         symbol.includes('ETH') ? 3000 : 
         symbol.includes('SOL') ? 200 : 100);
      
      // Try to get real historical data, fallback to generated data if it fails
      let dataPoints: ChartDataPoint[];
      try {
        dataPoints = await fetchHistoricalData(symbol, 90);
        console.log(`Fetched real historical data for ${symbol}: ${dataPoints.length} points`);
      } catch (error) {
        console.warn(`Failed to fetch historical data for ${symbol}, using generated data:`, error);
        dataPoints = generateTradingViewChartData(currentPrice, symbol);
      }
      
      const result: TradingViewData = {
        symbol: symbol,
        currentPrice: currentPrice,
        priceChange: currentPrice * 0.027, // 2.7% change
        priceChangePercent: 2.7,
        volume: parsedData.volume || '1.2B',
        marketCap: '95.2B',
        dataPoints: dataPoints
      };
      
      console.log('Processed TradingView data with fallback prices:', result);
      return result;
    }
    
  } catch (error) {
    console.error('Error processing TradingView HTML:', error);
    throw new Error(`Failed to process TradingView HTML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}