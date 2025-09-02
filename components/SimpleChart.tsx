import React from 'react';
import type { ChartDataPoint } from '../types';

interface SimpleChartProps {
  data: ChartDataPoint[];
  symbol: string;
}

const SimpleChart: React.FC<SimpleChartProps> = ({ data, symbol }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-8 shadow-lg text-center">
        <h2 className="text-xl font-semibold text-gray-200 mb-2">
          {symbol} Price Chart
        </h2>
        <p className="text-gray-400">No chart data available</p>
      </div>
    );
  }

  // Calculate chart dimensions and scaling
  const width = 800;
  const height = 400;
  const padding = 40;
  const chartWidth = width - (padding * 2);
  const chartHeight = height - (padding * 2);

  // Find min/max values for scaling
  const prices = data.map(d => [d.high || 0, d.low || 0, d.open || 0, d.close || 0]).flat();
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1; // Prevent division by zero

  // Scale function
  const scaleY = (price: number) => {
    return padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  const scaleX = (index: number) => {
    return padding + (index / (data.length - 1)) * chartWidth;
  };

  // Generate path for the line chart
  const linePath = data
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${scaleX(index)} ${scaleY(point.close)}`)
    .join(' ');

  // Generate bars for volume
  const volumes = data.map(d => {
    const volumeStr = d.volume || '0';
    return parseFloat(volumeStr.replace(/[KM]/g, (match) => 
      match === 'K' ? '000' : '000000'
    )) || 0;
  });
  const maxVolume = Math.max(...volumes) || 1; // Prevent division by zero
  
  const volumeBars = data.map((point, index) => {
    const volumeStr = point.volume || '0';
    const volume = parseFloat(volumeStr.replace(/[KM]/g, (match) => 
      match === 'K' ? '000' : '000000'
    )) || 0;
    const barHeight = (volume / maxVolume) * 50; // Max 50px height for volume bars
    const x = scaleX(index) - 2; // Center the bar
    const y = height - padding - barHeight;
    
    return (
      <rect
        key={index}
        x={x}
        y={y}
        width="4"
        height={barHeight}
        fill="#374151"
        opacity="0.6"
      />
    );
  });

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg shadow-lg">
      {/* Chart Header */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white">
          {symbol} Price Chart (Simple)
        </h2>
        <p className="text-sm text-gray-400">
          {data.length} data points • Simple SVG Chart
        </p>
      </div>
      
      {/* Chart */}
      <div className="p-4">
        <div className="overflow-x-auto">
          <svg width={width} height={height} className="bg-gray-900 rounded">
            {/* Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
              <line
                key={ratio}
                x1={padding}
                y1={padding + ratio * chartHeight}
                x2={width - padding}
                y2={padding + ratio * chartHeight}
                stroke="#374151"
                strokeWidth="1"
              />
            ))}
            
            {/* Volume bars */}
            {volumeBars}
            
            {/* Price line */}
            <path
              d={linePath}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2"
            />
            
            {/* Data points */}
            {data.map((point, index) => (
              <circle
                key={index}
                cx={scaleX(index)}
                cy={scaleY(point.close)}
                r="3"
                fill="#3B82F6"
              />
            ))}
            
            {/* Y-axis labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const price = minPrice + (1 - ratio) * priceRange;
              return (
                <text
                  key={ratio}
                  x={padding - 10}
                  y={padding + ratio * chartHeight + 4}
                  textAnchor="end"
                  fill="#9CA3AF"
                  fontSize="12"
                >
                  ${price.toFixed(2)}
                </text>
              );
            })}
            
            {/* X-axis labels (show every 5th point) */}
            {data.map((point, index) => {
              if (index % Math.ceil(data.length / 8) === 0) {
                return (
                  <text
                    key={index}
                    x={scaleX(index)}
                    y={height - padding + 20}
                    textAnchor="middle"
                    fill="#9CA3AF"
                    fontSize="10"
                  >
                    {new Date(point.date).toLocaleDateString()}
                  </text>
                );
              }
              return null;
            })}
          </svg>
        </div>
      </div>
      
      {/* Chart Info */}
      <div className="p-4 border-t border-gray-700 bg-gray-900/50">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-400">Current Price</p>
            <p className="text-white font-semibold">
              ${data && data.length > 0 ? (data[data.length - 1]?.close || 'N/A') : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-400">24h Change</p>
            <p className="text-white font-semibold">
              {data && data.length > 1 ? (
                <span className={data[data.length - 1]?.close >= data[data.length - 2]?.close ? 'text-green-400' : 'text-red-400'}>
                  {((data[data.length - 1]?.close - data[data.length - 2]?.close) / (data[data.length - 2]?.close || 1) * 100).toFixed(2)}%
                </span>
              ) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-gray-400">High</p>
            <p className="text-white font-semibold">
              ${maxPrice.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-gray-400">Low</p>
            <p className="text-white font-semibold">
              ${minPrice.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleChart;