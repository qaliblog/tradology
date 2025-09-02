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
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';
import type { ChartDataPoint } from '../types';

interface UltimateTradingChartProps {
  data: ChartDataPoint[];
  symbol: string;
  onPriceUpdate?: (price: number, change: number, changePercent: number) => void;
}

type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
type ChartType = 'candlestick' | 'line' | 'area' | 'bar';

const UltimateTradingChart: React.FC<UltimateTradingChartProps> = ({ 
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
  const [isFullscreen, setIsFullscreen] = useState(false);
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
    let daysBack = 30;

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

  // Calculate technical indicators with higher precision
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

  // Ultimate tooltip with glassmorphism effect
  const UltimateTooltip = ({ active, payload, label }: any) => {
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
        <div className="bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl min-w-[320px] font-mono">
          <div className="text-white/90 text-sm font-medium mb-4 border-b border-white/20 pb-3">
            {date}
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/60">Open:</span>
                <span className="text-white font-semibold text-sm">${data.open?.toFixed(8) || '0.00000000'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">High:</span>
                <span className="text-green-400 font-semibold text-sm">${data.high?.toFixed(8) || '0.00000000'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Low:</span>
                <span className="text-red-400 font-semibold text-sm">${data.low?.toFixed(8) || '0.00000000'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white/60">Close:</span>
                <span className="text-white font-bold text-base">${data.close?.toFixed(8) || '0.00000000'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white/60">Volume:</span>
                <span className="text-white/80">{data.volume || '0'}</span>
              </div>
              {showIndicators && (
                <>
                  {data.sma20 && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">SMA20:</span>
                      <span className="text-blue-400 text-sm">${data.sma20.toFixed(8)}</span>
                    </div>
                  )}
                  {data.sma50 && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">SMA50:</span>
                      <span className="text-orange-400 text-sm">${data.sma50.toFixed(8)}</span>
                    </div>
                  )}
                  {data.rsi && (
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">RSI:</span>
                      <span className={`font-semibold text-sm ${
                        data.rsi > 70 ? 'text-red-400' : 
                        data.rsi < 30 ? 'text-green-400' : 
                        'text-yellow-400'
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
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-white/10 rounded-3xl p-12 shadow-2xl text-center backdrop-blur-sm">
        <div className="animate-pulse">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-6 animate-spin"></div>
          <h2 className="text-2xl font-bold text-white mb-3">
            {symbol} Price Chart
          </h2>
          <p className="text-white/60">Loading precise market data...</p>
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
    <div className={`bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-sm ${
      isFullscreen ? 'fixed inset-4 z-50' : ''
    }`}>
      {/* Ultimate Header */}
      <div className="p-6 border-b border-white/10 bg-gradient-to-r from-slate-800/50 to-purple-800/50 backdrop-blur-sm">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-3">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                {symbol}
              </h2>
              <div className={`px-3 py-1.5 rounded-full text-sm font-semibold backdrop-blur-sm ${
                priceChange >= 0 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {priceChange >= 0 ? '↗' : '↘'} {Math.abs(priceChange).toFixed(2)}%
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-bold text-white">
                ${currentPrice?.toFixed(8) || '0.00000000'}
              </span>
              <span className={`text-lg font-medium ${
                priceChange >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
          
          {/* Ultimate Controls */}
          <div className="flex flex-wrap gap-3">
            {/* Timeframe Selector */}
            <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1">
              {(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 ${
                    timeframe === tf
                      ? 'bg-blue-500 text-white shadow-lg transform scale-105'
                      : 'text-white/70 hover:text-white hover:bg-white/20'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            
            {/* Chart Type Selector */}
            <div className="flex bg-white/10 backdrop-blur-sm rounded-xl p-1">
              {(['candlestick', 'line', 'area', 'bar'] as ChartType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-3 py-2 text-sm rounded-lg transition-all duration-300 capitalize ${
                    chartType === type
                      ? 'bg-green-500 text-white shadow-lg transform scale-105'
                      : 'text-white/70 hover:text-white hover:bg-white/20'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            
            {/* Toggle Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowVolume(!showVolume)}
                className={`px-4 py-2 text-sm rounded-xl transition-all duration-300 ${
                  showVolume
                    ? 'bg-orange-500 text-white shadow-lg transform scale-105'
                    : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20 backdrop-blur-sm'
                }`}
              >
                Volume
              </button>
              <button
                onClick={() => setShowIndicators(!showIndicators)}
                className={`px-4 py-2 text-sm rounded-xl transition-all duration-300 ${
                  showIndicators
                    ? 'bg-purple-500 text-white shadow-lg transform scale-105'
                    : 'bg-white/10 text-white/70 hover:text-white hover:bg-white/20 backdrop-blur-sm'
                }`}
              >
                Indicators
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="px-4 py-2 text-sm rounded-xl bg-white/10 text-white/70 hover:text-white hover:bg-white/20 backdrop-blur-sm transition-all duration-300"
              >
                {isFullscreen ? 'Exit' : 'Fullscreen'}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Chart Container */}
      <div className="p-4">
        <ResponsiveContainer width="100%" height={isMobile ? 400 : isFullscreen ? 600 : 500}>
          <ComposedChart 
            data={dataWithIndicators} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            onMouseMove={(data) => setHoveredData(data)}
          >
            <CartesianGrid strokeDasharray="1 1" stroke="rgba(255,255,255,0.1)" opacity={0.3} />
            <XAxis 
              dataKey="date" 
              stroke="rgba(255,255,255,0.6)"
              fontSize={isMobile ? 10 : 11}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.6)"
              fontSize={isMobile ? 10 : 11}
              domain={['dataMin - 2', 'dataMax + 2']}
              tickFormatter={(value) => `$${value.toFixed(8)}`}
            />
            <Tooltip content={<UltimateTooltip />} />
            
            {/* Volume bars */}
            {showVolume && (
              <Bar 
                dataKey="volumeNum" 
                fill="rgba(255,255,255,0.1)" 
                opacity={0.4}
                yAxisId="volume"
                radius={[2, 2, 0, 0]}
              />
            )}
            
            {/* Price line */}
            <Line 
              type="monotone" 
              dataKey="close" 
              stroke="#3b82f6" 
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6, fill: '#3b82f6', stroke: '#ffffff', strokeWidth: 2 }}
            />
            
            {/* Technical indicators */}
            {showIndicators && (
              <>
                <Line 
                  type="monotone" 
                  dataKey="sma20" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 4"
                />
                <Line 
                  type="monotone" 
                  dataKey="sma50" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={false}
                  strokeDasharray="4 4"
                />
                <Line 
                  type="monotone" 
                  dataKey="ema12" 
                  stroke="#8b5cf6" 
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="2 2"
                />
                <Line 
                  type="monotone" 
                  dataKey="ema26" 
                  stroke="#eab308" 
                  strokeWidth={1.5}
                  dot={false}
                  strokeDasharray="2 2"
                />
              </>
            )}
            
            {showVolume && (
              <YAxis yAxisId="volume" orientation="right" stroke="rgba(255,255,255,0.6)" fontSize={10} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      
      {/* Ultimate Footer */}
      <div className="p-4 border-t border-white/10 bg-gradient-to-r from-slate-800/50 to-purple-800/50 backdrop-blur-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <p className="text-white/60 text-xs mb-2">SMA 20</p>
            <p className="text-white font-semibold text-lg">
              ${sortedData[0]?.sma20?.toFixed(8) || '0.00000000'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-xs mb-2">SMA 50</p>
            <p className="text-white font-semibold text-lg">
              ${sortedData[0]?.sma50?.toFixed(8) || '0.00000000'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-xs mb-2">RSI</p>
            <p className={`font-semibold text-lg ${
              sortedData[0]?.rsi > 70 ? 'text-red-400' : 
              sortedData[0]?.rsi < 30 ? 'text-green-400' : 
              'text-yellow-400'
            }`}>
              {sortedData[0]?.rsi?.toFixed(2) || '0.00'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-xs mb-2">Volume</p>
            <p className="text-white font-semibold text-lg">
              {sortedData[0]?.volume || '0'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UltimateTradingChart;