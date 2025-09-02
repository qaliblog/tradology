import React, { useState, useMemo, useEffect } from 'react';
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
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';
import type { ChartDataPoint } from '../types';

interface AdvancedChartProps {
  data: ChartDataPoint[];
  symbol: string;
}

type ChartType = 'line' | 'candlestick' | 'area' | 'bar';
type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

const AdvancedChart: React.FC<AdvancedChartProps> = ({ data, symbol }) => {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [showVolume, setShowVolume] = useState(true);
  const [chartError, setChartError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  // Process data based on timeframe
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    let daysBack = 30; // Default to 1 month

    switch (timeframe) {
      case '1D':
        daysBack = 7; // Show 7 days for 1D view to have enough data points
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
    
    console.log(`Timeframe ${timeframe}: Filtered ${filteredData.length} items from ${data.length} total items`);
    console.log(`Cutoff date: ${cutoffDate.toISOString()}`);
    console.log(`Sample dates: ${data.slice(0, 3).map(d => d.date).join(', ')}`);
    console.log(`Sample filtered dates: ${filteredData.slice(0, 3).map(d => d.date).join(', ')}`);
    return filteredData;
  }, [data, timeframe]);

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
        // For candlestick chart
        open,
        high,
        low,
        close,
        // Volume data
        volumeNum: parseFloat(volume.replace(/[KM]/g, (match) => 
          match === 'K' ? '000' : '000000'
        )) || 0,
      };
    }).filter(item => item !== null);
  }, [processedData]);

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && payload[0] && payload[0].payload) {
      const data = payload[0].payload;
      if (!data || typeof data !== 'object') return null;
      
      return (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-3 shadow-lg">
          <p className="text-gray-300 text-sm mb-2">{label || 'N/A'}</p>
          <div className="space-y-1">
            <p className="text-white">
              <span className="text-gray-400">Open:</span> ${typeof data.open === 'number' ? data.open.toFixed(2) : '0.00'}
            </p>
            <p className="text-white">
              <span className="text-gray-400">High:</span> <span className="text-green-400">${typeof data.high === 'number' ? data.high.toFixed(2) : '0.00'}</span>
            </p>
            <p className="text-white">
              <span className="text-gray-400">Low:</span> <span className="text-red-400">${typeof data.low === 'number' ? data.low.toFixed(2) : '0.00'}</span>
            </p>
            <p className="text-white">
              <span className="text-gray-400">Close:</span> <span className="font-semibold">${typeof data.close === 'number' ? data.close.toFixed(2) : '0.00'}</span>
            </p>
            <p className="text-white">
              <span className="text-gray-400">Volume:</span> {typeof data.volume === 'string' ? data.volume : '0'}
            </p>
            {typeof data.sma20 === 'number' && (
              <p className="text-white">
                <span className="text-gray-400">SMA 20:</span> <span className="text-blue-400">${data.sma20.toFixed(2)}</span>
              </p>
            )}
            {typeof data.sma50 === 'number' && (
              <p className="text-white">
                <span className="text-gray-400">SMA 50:</span> <span className="text-orange-400">${data.sma50.toFixed(2)}</span>
              </p>
            )}
            {typeof data.rsi === 'number' && (
              <p className="text-white">
                <span className="text-gray-400">RSI:</span> <span className={data.rsi > 70 ? 'text-red-400' : data.rsi < 30 ? 'text-green-400' : 'text-yellow-400'}>{data.rsi.toFixed(1)}</span>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Candlestick component
  const CandlestickChart = () => (
    <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
      <ComposedChart data={dataWithIndicators} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="date" 
          stroke="#9CA3AF"
          fontSize={12}
          tickFormatter={(value) => new Date(value).toLocaleDateString()}
        />
        <YAxis 
          stroke="#9CA3AF"
          fontSize={12}
          domain={['dataMin - 2', 'dataMax + 2']}
          tickFormatter={(value) => `$${value.toFixed(2)}`}
        />
        <Tooltip content={<CustomTooltip />} />
        
        {/* Volume bars */}
        {showVolume && (
          <Bar 
            dataKey="volumeNum" 
            fill="#374151" 
            opacity={0.3}
            yAxisId="volume"
          />
        )}
        
        {/* Price line for reference */}
        <Line 
          type="monotone" 
          dataKey="close" 
          stroke="#3B82F6" 
          strokeWidth={1}
          dot={false}
          opacity={0.3}
        />
        
        {/* Moving averages */}
        <Line 
          type="monotone" 
          dataKey="sma20" 
          stroke="#10B981" 
          strokeWidth={1}
          dot={false}
          strokeDasharray="5 5"
        />
        <Line 
          type="monotone" 
          dataKey="sma50" 
          stroke="#F59E0B" 
          strokeWidth={1}
          dot={false}
          strokeDasharray="5 5"
        />
        
        {showVolume && (
          <YAxis yAxisId="volume" orientation="right" stroke="#9CA3AF" fontSize={10} />
        )}
      </ComposedChart>
    </ResponsiveContainer>
  );

  // Area chart component
  const AreaChartComponent = () => (
    <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
      <AreaChart data={dataWithIndicators} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="date" 
          stroke="#9CA3AF"
          fontSize={12}
          tickFormatter={(value) => new Date(value).toLocaleDateString()}
        />
        <YAxis 
          stroke="#9CA3AF"
          fontSize={12}
          domain={['dataMin - 2', 'dataMax + 2']}
          tickFormatter={(value) => `$${value.toFixed(2)}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="close"
          stroke="#3B82F6"
          fillOpacity={1}
          fill="url(#colorPrice)"
        />
        <Line 
          type="monotone" 
          dataKey="sma20" 
          stroke="#10B981" 
          strokeWidth={1}
          dot={false}
          strokeDasharray="5 5"
        />
        <Line 
          type="monotone" 
          dataKey="sma50" 
          stroke="#F59E0B" 
          strokeWidth={1}
          dot={false}
          strokeDasharray="5 5"
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  // Line chart component
  const LineChartComponent = () => (
    <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
      <LineChart data={dataWithIndicators} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="date" 
          stroke="#9CA3AF"
          fontSize={12}
          tickFormatter={(value) => new Date(value).toLocaleDateString()}
        />
        <YAxis 
          stroke="#9CA3AF"
          fontSize={12}
          domain={['dataMin - 2', 'dataMax + 2']}
          tickFormatter={(value) => `$${value.toFixed(2)}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="close" 
          stroke="#3B82F6" 
          strokeWidth={2}
          dot={false}
        />
        <Line 
          type="monotone" 
          dataKey="sma20" 
          stroke="#10B981" 
          strokeWidth={1}
          dot={false}
          strokeDasharray="5 5"
        />
        <Line 
          type="monotone" 
          dataKey="sma50" 
          stroke="#F59E0B" 
          strokeWidth={1}
          dot={false}
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  // Bar chart component
  const BarChartComponent = () => (
    <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
      <BarChart data={dataWithIndicators} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="date" 
          stroke="#9CA3AF"
          fontSize={12}
          tickFormatter={(value) => new Date(value).toLocaleDateString()}
        />
        <YAxis 
          stroke="#9CA3AF"
          fontSize={12}
          domain={['dataMin - 2', 'dataMax + 2']}
          tickFormatter={(value) => `$${value.toFixed(2)}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="close" 
          fill={(entry) => {
            if (!entry || !entry.date) return "#3B82F6";
            const index = dataWithIndicators.findIndex(item => item.date === entry.date);
            if (index === 0) return "#3B82F6";
            const prevClose = dataWithIndicators[index - 1]?.close || entry.close;
            return entry.close >= prevClose ? "#10B981" : "#EF4444";
          }}
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderChart = () => {
    try {
      console.log(`Rendering ${chartType} chart with ${dataWithIndicators.length} data points`);
      console.log('Sample data:', dataWithIndicators.slice(0, 3));
      
      switch (chartType) {
        case 'candlestick':
          return <CandlestickChart />;
        case 'area':
          return <AreaChartComponent />;
        case 'bar':
          return <BarChartComponent />;
        default:
          return <LineChartComponent />;
      }
    } catch (error) {
      console.error('Chart rendering error:', error);
      setChartError('Failed to render chart. Please try a different chart type.');
      return (
        <div className="flex items-center justify-center h-96 text-gray-400">
          <div className="text-center">
            <p>Chart rendering failed</p>
            <p className="text-sm mt-2">Please try refreshing the page or selecting a different chart type.</p>
          </div>
        </div>
      );
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 shadow-lg text-center">
        <h2 className="text-xl font-semibold text-gray-200 mb-2">
          {symbol} Price Chart
        </h2>
        <p className="text-gray-400">No chart data available</p>
        <p className="text-gray-500 text-sm mt-2">
          Chart data will appear here when available from the analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg">
      {/* Chart Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {symbol} Price Chart
            </h2>
            <p className="text-sm text-gray-400">
              {processedData.length} data points • {timeframe} timeframe
            </p>
          </div>
          
          {/* Chart Controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Timeframe Selector */}
            <div className="flex bg-gray-700 rounded-lg p-1 overflow-x-auto">
              {(['1D', '1W', '1M', '3M', '6M', '1Y', 'ALL'] as Timeframe[]).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setTimeframe(tf)}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors whitespace-nowrap ${
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
            <div className="flex bg-gray-700 rounded-lg p-1 overflow-x-auto">
              {(['line', 'candlestick', 'area', 'bar'] as ChartType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setChartType(type)}
                  className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors capitalize whitespace-nowrap ${
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
              className={`px-2 sm:px-3 py-1 text-xs sm:text-sm rounded-md transition-colors whitespace-nowrap ${
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
        {chartError && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 text-red-300 rounded-lg text-center">
            <p>{chartError}</p>
          </div>
        )}
        {renderChart()}
      </div>
      
      {/* Chart Info */}
      <div className="p-3 sm:p-4 border-t border-gray-700 bg-gray-900/50">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div>
            <p className="text-gray-400 text-xs sm:text-sm">Current Price</p>
            <p className="text-white font-semibold text-sm sm:text-base">
              ${processedData && processedData.length > 0 ? (() => {
                // Sort by date to get the most recent price
                const sortedData = [...processedData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const currentPrice = sortedData[0]?.close?.toFixed(2) || 'N/A';
                
                // Debug logging
                console.log('Advanced Chart - Current Price Debug:', {
                  currentPrice,
                  sortedDataLength: sortedData.length,
                  mostRecentDate: sortedData[0]?.date,
                  mostRecentClose: sortedData[0]?.close,
                  allPrices: sortedData.slice(0, 3).map(d => ({ date: d.date, close: d.close }))
                });
                
                return currentPrice;
              })() : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs sm:text-sm">24h Change</p>
            <p className="text-white font-semibold text-sm sm:text-base">
              {processedData && processedData.length > 1 ? (() => {
                // Sort by date to get the most recent prices
                const sortedData = [...processedData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                const currentPrice = sortedData[0]?.close;
                const previousPrice = sortedData[1]?.close;
                if (currentPrice && previousPrice) {
                  const change = ((currentPrice - previousPrice) / previousPrice) * 100;
                  return (
                    <span className={change >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {change.toFixed(2)}%
                    </span>
                  );
                }
                return 'N/A';
              })() : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs sm:text-sm">SMA 20</p>
            <p className="text-white font-semibold text-sm sm:text-base">
              ${processedData && processedData.length > 0 ? (processedData[processedData.length - 1]?.sma20?.toFixed(2) || 'N/A') : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-xs sm:text-sm">RSI</p>
            <p className="text-white font-semibold text-sm sm:text-base">
              {processedData && processedData.length > 0 ? (processedData[processedData.length - 1]?.rsi?.toFixed(1) || 'N/A') : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedChart;