import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  Bar,
  Cell
} from 'recharts';
import type { ChartDataPoint } from '../types';

interface TradingViewExactChartProps {
  data: ChartDataPoint[];
  symbol: string;
  onPriceUpdate?: (price: number, change: number, changePercent: number) => void;
}

type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const TradingViewExactChart: React.FC<TradingViewExactChartProps> = ({ data, symbol, onPriceUpdate }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [showVolume, setShowVolume] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Process data based on timeframe
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    let daysBack = 30; // Default to 1 month

    switch (timeframe) {
      case '1D':
        daysBack = 7; // Show 7 days for 1D view
        break;
      case '1W':
        daysBack = 14; // Show 2 weeks for 1W view
        break;
      case '1M':
        daysBack = 30;
        break;
      case '3M':
        daysBack = 90;
        break;
      case '6M':
        daysBack = 180;
        break;
      case '1Y':
        daysBack = 365;
        break;
      case 'ALL':
        return data; // Return all data
    }

    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const filteredData = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    });
    
    // Sort by date ascending for proper chart display
    return filteredData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, timeframe]);

  // Calculate Simple Moving Average
  const calculateSMA = (data: ChartDataPoint[], index: number, period: number): number | null => {
    if (index < period - 1) return null;
    
    const slice = data.slice(index - period + 1, index + 1);
    const sum = slice.reduce((acc, item) => acc + item.close, 0);
    return Number((sum / period).toFixed(8));
  };

  // Calculate RSI
  const calculateRSI = (data: ChartDataPoint[], index: number, period: number): number | null => {
    if (index < period) return null;
    
    const slice = data.slice(index - period, index + 1);
    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i < slice.length; i++) {
      const change = slice[i].close - slice[i - 1].close;
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return Number((100 - (100 / (1 + rs))).toFixed(2));
  };

  // Calculate technical indicators
  const dataWithIndicators = useMemo(() => {
    if (!processedData || processedData.length === 0) return [];

    return processedData.map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      
      const sma20 = calculateSMA(processedData, index, 20);
      const sma50 = calculateSMA(processedData, index, 50);
      const rsi = calculateRSI(processedData, index, 14);
      
      // Ensure all required properties exist with fallbacks
      const open = typeof item.open === 'number' ? item.open : 0;
      const high = typeof item.high === 'number' ? item.high : 0;
      const low = typeof item.low === 'number' ? item.low : 0;
      const close = typeof item.close === 'number' ? item.close : 0;
      const volume = typeof item.volume === 'string' ? item.volume : '0';
      const date = typeof item.date === 'string' ? item.date : '';
      
      return {
        ...item,
        date,
        sma20,
        sma50,
        rsi,
        open,
        high,
        low,
        close,
        volumeNum: parseFloat(volume.replace(/[KM]/g, (match) => 
          match === 'K' ? '000' : '000000'
        )) || 0,
        // TradingView-style candlestick data
        isGreen: close >= open,
        bodyTop: Math.max(open, close),
        bodyBottom: Math.min(open, close),
        wickTop: high,
        wickBottom: low,
      };
    }).filter(item => item !== null);
  }, [processedData]);

  // TradingView-style tooltip
  const TradingViewTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && payload[0] && payload[0].payload) {
      const data = payload[0].payload;
      if (!data || typeof data !== 'object') return null;
      
      const date = new Date(label).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      
      return (
        <div className="bg-[#1e222d] border border-[#2a2e39] rounded-lg p-3 shadow-xl min-w-[200px] font-mono">
          <div className="text-[#b2b5be] text-sm font-medium mb-2">{date}</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[#787b86]">O:</span>
              <span className="text-[#d1d4dc]">${typeof data.open === 'number' ? data.open.toFixed(8) : '0.00000000'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#787b86]">H:</span>
              <span className="text-[#26a69a]">${typeof data.high === 'number' ? data.high.toFixed(8) : '0.00000000'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#787b86]">L:</span>
              <span className="text-[#ef5350]">${typeof data.low === 'number' ? data.low.toFixed(8) : '0.00000000'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#787b86]">C:</span>
              <span className="text-[#d1d4dc] font-semibold">${typeof data.close === 'number' ? data.close.toFixed(8) : '0.00000000'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#787b86]">V:</span>
              <span className="text-[#b2b5be]">{typeof data.volume === 'string' ? data.volume : '0'}</span>
            </div>
            {typeof data.sma20 === 'number' && (
              <div className="flex justify-between">
                <span className="text-[#787b86]">SMA20:</span>
                <span className="text-[#2962ff]">${data.sma20.toFixed(8)}</span>
              </div>
            )}
            {typeof data.sma50 === 'number' && (
              <div className="flex justify-between">
                <span className="text-[#787b86]">SMA50:</span>
                <span className="text-[#ff6b35]">${data.sma50.toFixed(8)}</span>
              </div>
            )}
            {typeof data.rsi === 'number' && (
              <div className="flex justify-between">
                <span className="text-[#787b86]">RSI:</span>
                <span className={data.rsi > 70 ? 'text-[#ef5350]' : data.rsi < 30 ? 'text-[#26a69a]' : 'text-[#ffc107]'}>
                  {data.rsi.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom candlestick component
  const CustomCandlestick = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;

    const { open, high, low, close, isGreen } = payload;
    const bodyHeight = Math.abs(close - open);
    const bodyY = y + (height - Math.max(open, close) * height / (high - low));
    const wickTop = y;
    const wickBottom = y + height;

    return (
      <g>
        {/* Wick */}
        <line
          x1={x + width / 2}
          y1={wickTop}
          x2={x + width / 2}
          y2={wickBottom}
          stroke={isGreen ? '#26a69a' : '#ef5350'}
          strokeWidth={1}
        />
        {/* Body */}
        <rect
          x={x + width * 0.2}
          y={bodyY}
          width={width * 0.6}
          height={Math.max(bodyHeight * height / (high - low), 1)}
          fill={isGreen ? '#26a69a' : '#ef5350'}
          stroke={isGreen ? '#26a69a' : '#ef5350'}
          strokeWidth={1}
        />
      </g>
    );
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-[#1e222d] border border-[#2a2e39] rounded-lg p-8 shadow-lg text-center">
        <h2 className="text-xl font-semibold text-[#d1d4dc] mb-2">
          {symbol} Price Chart
        </h2>
        <p className="text-[#787b86]">No chart data available</p>
      </div>
    );
  }

  // Get current price and change
  const sortedData = [...processedData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const currentPrice = sortedData[0]?.close;
  const previousPrice = sortedData[1]?.close;
  const priceChange = currentPrice && previousPrice ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;

  return (
    <div className="bg-[#1e222d] border border-[#2a2e39] rounded-lg shadow-lg font-mono">
      {/* TradingView-style header */}
      <div className="p-4 border-b border-[#2a2e39] bg-[#131722]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#d1d4dc]">
              {symbol}
            </h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-2xl font-bold text-[#d1d4dc]">
                ${currentPrice?.toFixed(8) || '0.00000000'}
              </span>
              <span className={`text-sm font-medium ${priceChange >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
          
          {/* TradingView-style controls */}
          <div className="flex flex-wrap gap-2">
            {/* Timeframe Selector */}
            <div className="flex bg-[#2a2e39] rounded-md p-1">
              {(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    timeframe === tf
                      ? 'bg-[#2962ff] text-[#d1d4dc]'
                      : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#363a45]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            
            {/* Volume Toggle */}
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                showVolume
                  ? 'bg-[#26a69a] text-[#d1d4dc]'
                  : 'bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]'
              }`}
            >
              Volume
            </button>
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="p-4">
        <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
          <ComposedChart data={dataWithIndicators} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="1 1" stroke="#2a2e39" />
            <XAxis 
              dataKey="date" 
              stroke="#787b86"
              fontSize={11}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              stroke="#787b86"
              fontSize={11}
              domain={['dataMin - 2', 'dataMax + 2']}
              tickFormatter={(value) => `$${value.toFixed(8)}`}
            />
            <Tooltip content={<TradingViewTooltip />} />
            
            {/* Volume bars */}
            {showVolume && (
              <Bar 
                dataKey="volumeNum" 
                fill="#363a45" 
                opacity={0.3}
                yAxisId="volume"
              />
            )}
            
            {/* Price line */}
            <Line 
              type="monotone" 
              dataKey="close" 
              stroke="#2962ff" 
              strokeWidth={2}
              dot={false}
            />
            
            {/* Moving averages */}
            <Line 
              type="monotone" 
              dataKey="sma20" 
              stroke="#ff6b35" 
              strokeWidth={1}
              dot={false}
              strokeDasharray="2 2"
            />
            <Line 
              type="monotone" 
              dataKey="sma50" 
              stroke="#26a69a" 
              strokeWidth={1}
              dot={false}
              strokeDasharray="2 2"
            />
            
            {showVolume && (
              <YAxis yAxisId="volume" orientation="right" stroke="#787b86" fontSize={10} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* TradingView-style footer */}
      <div className="p-3 border-t border-[#2a2e39] bg-[#131722]">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-[#787b86] text-xs">SMA 20</p>
            <p className="text-[#d1d4dc] font-semibold">
              ${sortedData[0]?.sma20?.toFixed(8) || '0.00000000'}
            </p>
          </div>
          <div>
            <p className="text-[#787b86] text-xs">SMA 50</p>
            <p className="text-[#d1d4dc] font-semibold">
              ${sortedData[0]?.sma50?.toFixed(8) || '0.00000000'}
            </p>
          </div>
          <div>
            <p className="text-[#787b86] text-xs">RSI</p>
            <p className="text-[#d1d4dc] font-semibold">
              {sortedData[0]?.rsi?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div>
            <p className="text-[#787b86] text-xs">Volume</p>
            <p className="text-[#d1d4dc] font-semibold">
              {sortedData[0]?.volume || '0'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingViewExactChart;