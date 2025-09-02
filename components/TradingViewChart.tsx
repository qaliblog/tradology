import React, { useState, useMemo } from 'react';
import {
  ComposedChart,
  LineChart,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  Bar,
  Area,
  AreaChart
} from 'recharts';
import type { ChartDataPoint } from '../types';
import PriceRefreshButton from './PriceRefreshButton';

interface TradingViewChartProps {
  data: ChartDataPoint[];
  symbol: string;
  onPriceUpdate?: (price: number, change: number, changePercent: number) => void;
}

type ChartType = 'candlestick' | 'line' | 'area' | 'bar';
type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const TradingViewChart: React.FC<TradingViewChartProps> = ({ data, symbol, onPriceUpdate }) => {
  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [showVolume, setShowVolume] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  React.useEffect(() => {
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
    return Math.round((sum / period) * 100) / 100;
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
    return Math.round((100 - (100 / (1 + rs))) * 100) / 100;
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
        <div className="bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl min-w-[200px]">
          <div className="text-gray-300 text-sm font-medium mb-2">{date}</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-400">O:</span>
              <span className="text-white">${typeof data.open === 'number' ? data.open.toFixed(2) : '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">H:</span>
              <span className="text-green-400">${typeof data.high === 'number' ? data.high.toFixed(2) : '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">L:</span>
              <span className="text-red-400">${typeof data.low === 'number' ? data.low.toFixed(2) : '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">C:</span>
              <span className="text-white font-semibold">${typeof data.close === 'number' ? data.close.toFixed(2) : '0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">V:</span>
              <span className="text-gray-300">{typeof data.volume === 'string' ? data.volume : '0'}</span>
            </div>
            {typeof data.sma20 === 'number' && (
              <div className="flex justify-between">
                <span className="text-gray-400">SMA20:</span>
                <span className="text-blue-400">${data.sma20.toFixed(2)}</span>
              </div>
            )}
            {typeof data.sma50 === 'number' && (
              <div className="flex justify-between">
                <span className="text-gray-400">SMA50:</span>
                <span className="text-orange-400">${data.sma50.toFixed(2)}</span>
              </div>
            )}
            {typeof data.rsi === 'number' && (
              <div className="flex justify-between">
                <span className="text-gray-400">RSI:</span>
                <span className={data.rsi > 70 ? 'text-red-400' : data.rsi < 30 ? 'text-green-400' : 'text-yellow-400'}>
                  {data.rsi.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Candlestick component with TradingView styling
  const CandlestickChart = () => (
    <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
      <ComposedChart data={dataWithIndicators} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="1 1" stroke="#2A2E39" />
        <XAxis 
          dataKey="date" 
          stroke="#B2B5BE"
          fontSize={11}
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis 
          stroke="#B2B5BE"
          fontSize={11}
          domain={['dataMin - 2', 'dataMax + 2']}
          tickFormatter={(value) => `$${value.toFixed(2)}`}
        />
        <Tooltip content={<TradingViewTooltip />} />
        
        {/* Volume bars */}
        {showVolume && (
          <Bar 
            dataKey="volumeNum" 
            fill="#4A5568" 
            opacity={0.3}
            yAxisId="volume"
          />
        )}
        
        {/* Price line */}
        <Line 
          type="monotone" 
          dataKey="close" 
          stroke="#2962FF" 
          strokeWidth={2}
          dot={false}
        />
        
        {/* Moving averages */}
        <Line 
          type="monotone" 
          dataKey="sma20" 
          stroke="#FF6B35" 
          strokeWidth={1}
          dot={false}
          strokeDasharray="2 2"
        />
        <Line 
          type="monotone" 
          dataKey="sma50" 
          stroke="#4CAF50" 
          strokeWidth={1}
          dot={false}
          strokeDasharray="2 2"
        />
        
        {showVolume && (
          <YAxis yAxisId="volume" orientation="right" stroke="#B2B5BE" fontSize={10} />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );

  // Line chart component
  const LineChartComponent = () => (
    <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
      <LineChart data={dataWithIndicators} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="1 1" stroke="#2A2E39" />
        <XAxis 
          dataKey="date" 
          stroke="#B2B5BE"
          fontSize={11}
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis 
          stroke="#B2B5BE"
          fontSize={11}
          domain={['dataMin - 2', 'dataMax + 2']}
          tickFormatter={(value) => `$${value.toFixed(2)}`}
        />
        <Tooltip content={<TradingViewTooltip />} />
        <Line 
          type="monotone" 
          dataKey="close" 
          stroke="#2962FF" 
          strokeWidth={2}
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="sma20" 
          stroke="#FF6B35" 
          strokeWidth={1}
          dot={false}
          strokeDasharray="2 2"
        />
        <Line 
          type="monotone" 
          dataKey="sma50" 
          stroke="#4CAF50" 
          strokeWidth={1}
          dot={false}
          strokeDasharray="2 2"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  // Area chart component
  const AreaChartComponent = () => (
    <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
      <AreaChart data={dataWithIndicators} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="tradingViewGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2962FF" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#2962FF" stopOpacity={0.05}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="1 1" stroke="#2A2E39" />
        <XAxis 
          dataKey="date" 
          stroke="#B2B5BE"
          fontSize={11}
          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis 
          stroke="#B2B5BE"
          fontSize={11}
          domain={['dataMin - 2', 'dataMax + 2']}
          tickFormatter={(value) => `$${value.toFixed(2)}`}
        />
        <Tooltip content={<TradingViewTooltip />} />
        <Area
          type="monotone"
          dataKey="close"
          stroke="#2962FF"
          fillOpacity={1}
          fill="url(#tradingViewGradient)"
        />
        <Line 
          type="monotone" 
          dataKey="sma20" 
          stroke="#FF6B35" 
          strokeWidth={1}
          dot={false}
          strokeDasharray="2 2"
        />
        <Line 
          type="monotone" 
          dataKey="sma50" 
          stroke="#4CAF50" 
          strokeWidth={1}
          dot={false}
          strokeDasharray="2 2"
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderChart = () => {
    try {
      switch (chartType) {
        case 'candlestick':
          return <CandlestickChart />;
        case 'line':
          return <LineChartComponent />;
        case 'area':
          return <AreaChartComponent />;
        default:
          return <CandlestickChart />;
      }
    } catch (error) {
      console.error('Chart rendering error:', error);
      return (
        <div className="flex items-center justify-center h-96 text-gray-400">
          <div className="text-center">
            <p>Chart rendering failed</p>
            <p className="text-sm mt-2">Please try refreshing the page.</p>
          </div>
        </div>
      );
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 shadow-lg text-center">
        <h2 className="text-xl font-semibold text-gray-200 mb-2">
          {symbol} Price Chart
        </h2>
        <p className="text-gray-400">No chart data available</p>
      </div>
    );
  }

  // Get current price and change
  const sortedData = [...processedData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const currentPrice = sortedData[0]?.close;
  const previousPrice = sortedData[1]?.close;
  const priceChange = currentPrice && previousPrice ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;
  
  // Debug logging
  console.log('TradingView Chart - Current Price Debug:', {
    currentPrice,
    sortedDataLength: sortedData.length,
    mostRecentDate: sortedData[0]?.date,
    mostRecentClose: sortedData[0]?.close,
    allPrices: sortedData.slice(0, 3).map(d => ({ date: d.date, close: d.close }))
  });

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-lg">
      {/* TradingView-style header */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {symbol}
            </h2>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-2xl font-bold text-white">
                ${currentPrice?.toFixed(2) || 'N/A'}
              </span>
              <span className={`text-sm font-medium ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
          
          {/* TradingView-style controls */}
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
            <div className="flex bg-gray-700 rounded-md p-1">
              {(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    timeframe === tf
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
            
            {/* Chart Type Selector */}
            <div className="flex bg-gray-700 rounded-md p-1">
              {(['candlestick', 'line', 'area'] as ChartType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-3 py-1 text-sm rounded transition-colors capitalize ${
                    chartType === type
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
            
            {/* Volume Toggle */}
            <button
              onClick={() => setShowVolume(!showVolume)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                showVolume
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:text-white'
              }`}
            >
              Volume
            </button>
          </div>
        </div>
      </div>
      
      {/* Chart */}
      <div className="p-4">
        {renderChart()}
      </div>
      
      {/* TradingView-style footer */}
      <div className="p-3 border-t border-gray-700 bg-gray-800">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400 text-xs">SMA 20</p>
            <p className="text-white font-semibold">
              ${sortedData[0]?.sma20?.toFixed(2) || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">SMA 50</p>
            <p className="text-white font-semibold">
              ${sortedData[0]?.sma50?.toFixed(2) || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">RSI</p>
            <p className="text-white font-semibold">
              {sortedData[0]?.rsi?.toFixed(1) || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs">Volume</p>
            <p className="text-white font-semibold">
              {sortedData[0]?.volume || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradingViewChart;