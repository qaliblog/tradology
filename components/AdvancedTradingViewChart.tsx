import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  Bar,
  Cell,
  ReferenceLine
} from 'recharts';
import type { ChartDataPoint } from '../types';
import PriceRefreshButton from './PriceRefreshButton';

interface AdvancedTradingViewChartProps {
  data: ChartDataPoint[];
  symbol: string;
  onPriceUpdate?: (price: number, change: number, changePercent: number) => void;
}

type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
type ChartType = 'candlestick' | 'line' | 'area' | 'bar';

const AdvancedTradingViewChart: React.FC<AdvancedTradingViewChartProps> = ({ 
  data, 
  symbol, 
  onPriceUpdate 
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [showVolume, setShowVolume] = useState(true);
  const [showIndicators, setShowIndicators] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredData, setHoveredData] = useState<any>(null);
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
        daysBack = 7;
        break;
      case '1W':
        daysBack = 14;
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
        return data;
    }

    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
    const filteredData = data.filter(item => {
      const itemDate = new Date(item.date);
      return itemDate >= cutoffDate;
    });
    
    return filteredData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [data, timeframe]);

  // Calculate technical indicators
  const calculateSMA = useCallback((data: ChartDataPoint[], index: number, period: number): number | null => {
    if (index < period - 1) return null;
    
    const slice = data.slice(index - period + 1, index + 1);
    const sum = slice.reduce((acc, item) => acc + item.close, 0);
    return Number((sum / period).toFixed(8));
  }, []);

  const calculateEMA = useCallback((data: ChartDataPoint[], index: number, period: number): number | null => {
    if (index < period - 1) return null;
    
    const multiplier = 2 / (period + 1);
    let ema = data[index - period + 1].close;
    
    for (let i = index - period + 2; i <= index; i++) {
      ema = (data[i].close * multiplier) + (ema * (1 - multiplier));
    }
    
    return Number(ema.toFixed(8));
  }, []);

  const calculateRSI = useCallback((data: ChartDataPoint[], index: number, period: number): number | null => {
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
  }, []);

  const dataWithIndicators = useMemo(() => {
    if (!processedData || processedData.length === 0) return [];

    return processedData.map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      
      const sma20 = calculateSMA(processedData, index, 20);
      const sma50 = calculateSMA(processedData, index, 50);
      const ema12 = calculateEMA(processedData, index, 12);
      const ema26 = calculateEMA(processedData, index, 26);
      const rsi = calculateRSI(processedData, index, 14);
      
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
        ema12,
        ema26,
        rsi,
        open,
        high,
        low,
        close,
        volumeNum: parseFloat(volume.replace(/[KM]/g, (match) => 
          match === 'K' ? '000' : '000000'
        )) || 0,
        isGreen: close >= open,
        bodyTop: Math.max(open, close),
        bodyBottom: Math.min(open, close),
        wickTop: high,
        wickBottom: low,
      };
    }).filter(item => item !== null);
  }, [processedData, calculateSMA, calculateEMA, calculateRSI]);

  // Enhanced tooltip
  const EnhancedTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && payload[0] && payload[0].payload) {
      const data = payload[0].payload;
      if (!data || typeof data !== 'object') return null;
      
      const date = new Date(label).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      return (
        <div className="bg-[#1e222d] border border-[#2a2e39] rounded-xl p-4 shadow-2xl min-w-[280px] font-mono backdrop-blur-sm">
          <div className="text-[#b2b5be] text-sm font-medium mb-3 border-b border-[#2a2e39] pb-2">
            {date}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[#787b86]">Open:</span>
                <span className="text-[#d1d4dc] font-semibold">${data.open?.toFixed(8) || '0.00000000'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#787b86]">High:</span>
                <span className="text-[#26a69a] font-semibold">${data.high?.toFixed(8) || '0.00000000'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#787b86]">Low:</span>
                <span className="text-[#ef5350] font-semibold">${data.low?.toFixed(8) || '0.00000000'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#787b86]">Close:</span>
                <span className="text-[#d1d4dc] font-bold text-base">${data.close?.toFixed(8) || '0.00000000'}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[#787b86]">Volume:</span>
                <span className="text-[#b2b5be]">{data.volume || '0'}</span>
              </div>
              {showIndicators && (
                <>
                  {data.sma20 && (
                    <div className="flex justify-between">
                      <span className="text-[#787b86]">SMA20:</span>
                      <span className="text-[#2962ff]">${data.sma20.toFixed(8)}</span>
                    </div>
                  )}
                  {data.sma50 && (
                    <div className="flex justify-between">
                      <span className="text-[#787b86]">SMA50:</span>
                      <span className="text-[#ff6b35]">${data.sma50.toFixed(8)}</span>
                    </div>
                  )}
                  {data.rsi && (
                    <div className="flex justify-between">
                      <span className="text-[#787b86]">RSI:</span>
                      <span className={`font-semibold ${
                        data.rsi > 70 ? 'text-[#ef5350]' : 
                        data.rsi < 30 ? 'text-[#26a69a]' : 
                        'text-[#ffc107]'
                      }`}>
                        {data.rsi.toFixed(2)}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-[#1e222d] to-[#131722] border border-[#2a2e39] rounded-2xl p-8 shadow-2xl text-center">
        <div className="animate-pulse">
          <div className="w-16 h-16 bg-[#2a2e39] rounded-full mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-[#d1d4dc] mb-2">
            {symbol} Price Chart
          </h2>
          <p className="text-[#787b86]">Loading chart data...</p>
        </div>
      </div>
    );
  }

  // Get current price and change
  const sortedData = [...processedData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const currentPrice = sortedData[0]?.close;
  const previousPrice = sortedData[1]?.close;
  const priceChange = currentPrice && previousPrice ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-[#1e222d] to-[#131722] border border-[#2a2e39] rounded-2xl shadow-2xl overflow-hidden">
      {/* Enhanced Header */}
      <div className="p-4 sm:p-6 border-b border-[#2a2e39] bg-gradient-to-r from-[#131722] to-[#1e222d]">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#d1d4dc]">
                {symbol}
              </h2>
              <div className={`px-2 py-1 rounded-full text-xs font-semibold ${
                priceChange >= 0 
                  ? 'bg-[#26a69a]/20 text-[#26a69a] border border-[#26a69a]/30' 
                  : 'bg-[#ef5350]/20 text-[#ef5350] border border-[#ef5350]/30'
              }`}>
                {priceChange >= 0 ? '↗' : '↘'} {Math.abs(priceChange).toFixed(2)}%
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-[#d1d4dc]">
                ${currentPrice?.toFixed(8) || '0.00000000'}
              </span>
              <span className={`text-sm font-medium ${
                priceChange >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'
              }`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
          
          {/* Enhanced Controls */}
          <div className="flex flex-wrap gap-2">
            {/* Price Refresh Button */}
            {onPriceUpdate && (
              <PriceRefreshButton
                symbol={symbol}
                onPriceUpdate={onPriceUpdate}
                className="mr-2"
              />
            )}
            
            {/* Timeframe Selector */}
            <div className="flex bg-[#2a2e39] rounded-lg p-1">
              {(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-all duration-200 ${
                    timeframe === tf
                      ? 'bg-[#2962ff] text-[#d1d4dc] shadow-lg'
                      : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#363a45]'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            
            {/* Chart Type Selector */}
            <div className="flex bg-[#2a2e39] rounded-lg p-1">
              {(['candlestick', 'line', 'area', 'bar'] as ChartType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-all duration-200 capitalize ${
                    chartType === type
                      ? 'bg-[#26a69a] text-[#d1d4dc] shadow-lg'
                      : 'text-[#787b86] hover:text-[#d1d4dc] hover:bg-[#363a45]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            
            {/* Toggle Buttons */}
            <div className="flex gap-1">
              <button
                onClick={() => setShowVolume(!showVolume)}
                className={`px-3 py-1 text-xs sm:text-sm rounded-lg transition-all duration-200 ${
                  showVolume
                    ? 'bg-[#ff6b35] text-[#d1d4dc] shadow-lg'
                    : 'bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]'
                }`}
              >
                Volume
              </button>
              <button
                onClick={() => setShowIndicators(!showIndicators)}
                className={`px-3 py-1 text-xs sm:text-sm rounded-lg transition-all duration-200 ${
                  showIndicators
                    ? 'bg-[#9c27b0] text-[#d1d4dc] shadow-lg'
                    : 'bg-[#2a2e39] text-[#787b86] hover:text-[#d1d4dc]'
                }`}
              >
                Indicators
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chart Container */}
      <div className="p-2 sm:p-4">
        <ResponsiveContainer width="100%" height={isMobile ? 350 : 450}>
          <ComposedChart 
            data={dataWithIndicators} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            onMouseMove={(data) => setHoveredData(data)}
          >
            <CartesianGrid strokeDasharray="1 1" stroke="#2a2e39" opacity={0.5} />
            <XAxis 
              dataKey="date" 
              stroke="#787b86"
              fontSize={isMobile ? 10 : 11}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            />
            <YAxis 
              stroke="#787b86"
              fontSize={isMobile ? 10 : 11}
              domain={['dataMin - 2', 'dataMax + 2']}
              tickFormatter={(value) => `$${value.toFixed(8)}`}
            />
            <Tooltip content={<EnhancedTooltip />} />
            
            {/* Volume bars */}
            {showVolume && (
              <Bar 
                dataKey="volumeNum" 
                fill="#363a45" 
                opacity={0.4}
                yAxisId="volume"
                radius={[1, 1, 0, 0]}
              />
            )}
            
            {/* Price line */}
            <Line 
              type="monotone" 
              dataKey="close" 
              stroke="#2962ff" 
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#2962ff', stroke: '#d1d4dc', strokeWidth: 2 }}
            />
            
            {/* Technical indicators */}
            {showIndicators && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="sma20" 
                  stroke="#ff6b35" 
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="3 3"
                />
                <Line 
                  type="monotone" 
                  dataKey="sma50" 
                  stroke="#26a69a" 
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="3 3"
                />
                <Line 
                  type="monotone" 
                  dataKey="ema12" 
                  stroke="#9c27b0" 
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="1 1"
                />
                <Line 
                  type="monotone" 
                  dataKey="ema26" 
                  stroke="#ffc107" 
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="1 1"
                />
              </>
            )}
            
            {showVolume && (
              <YAxis yAxisId="volume" orientation="right" stroke="#787b86" fontSize={10} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Enhanced Footer */}
      <div className="p-3 sm:p-4 border-t border-[#2a2e39] bg-gradient-to-r from-[#131722] to-[#1e222d]">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-sm">
          <div className="text-center">
            <p className="text-[#787b86] text-xs mb-1">SMA 20</p>
            <p className="text-[#d1d4dc] font-semibold">
              ${sortedData[0]?.sma20?.toFixed(8) || '0.00000000'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[#787b86] text-xs mb-1">SMA 50</p>
            <p className="text-[#d1d4dc] font-semibold">
              ${sortedData[0]?.sma50?.toFixed(8) || '0.00000000'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[#787b86] text-xs mb-1">RSI</p>
            <p className={`font-semibold ${
              sortedData[0]?.rsi > 70 ? 'text-[#ef5350]' : 
              sortedData[0]?.rsi < 30 ? 'text-[#26a69a]' : 
              'text-[#ffc107]'
            }`}>
              {sortedData[0]?.rsi?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[#787b86] text-xs mb-1">Volume</p>
            <p className="text-[#d1d4dc] font-semibold">
              {sortedData[0]?.volume || '0'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedTradingViewChart;