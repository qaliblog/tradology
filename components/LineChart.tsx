import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale,
  ChartOptions,
} from 'chart.js';
import type { ChartDataPoint } from '../types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  TimeScale
);

export type Timeframe = 'Daily' | 'Weekly' | 'Monthly';

// Helper to get the start of the week (Sunday) for a given date
const getWeekStartDate = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
};

const aggregateData = (data: ChartDataPoint[], timeframe: Timeframe): ChartDataPoint[] => {
  if (timeframe === 'Daily') {
    return data;
  }

  const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const groups: { [key: string]: ChartDataPoint[] } = {};

  sortedData.forEach(point => {
    const date = new Date(point.date);
    let key: string;
    if (timeframe === 'Weekly') {
      key = getWeekStartDate(date).toISOString().split('T')[0];
    } else { // Monthly
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(point);
  });

  return Object.values(groups).map(group => {
    if (group.length === 0) return null;
    const first = group[0];
    const last = group[group.length - 1];

    const aggregatedPoint: ChartDataPoint = {
      date: timeframe === 'Weekly' ? first.date : `${first.date.substring(0, 7)}-01`,
      open: first.open,
      high: Math.max(...group.map(p => p.high)),
      low: Math.min(...group.map(p => p.low)),
      close: last.close,
      volume: group.reduce((acc, p) => {
        const vol = parseFloat(String(p.volume).replace(/[MKB]/gi, ''));
        return acc + (isNaN(vol) ? 0 : vol);
      }, 0).toFixed(2) + 'M', // Note: Volume aggregation is simplified
    };
    return aggregatedPoint;
  }).filter((p): p is ChartDataPoint => p !== null);
};


interface LineChartProps {
  data: ChartDataPoint[];
  onTimeframeChange?: (timeframe: Timeframe) => void;
}

const LineChart: React.FC<LineChartProps> = ({ data, onTimeframeChange }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('Daily');

  const processedData = useMemo(() => {
      // Ensure data is sorted by date ascending for correct aggregation
      const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return aggregateData(sorted, timeframe);
  }, [data, timeframe]);

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#1F2937',
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 4,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(107, 114, 128, 0.2)' },
        ticks: { color: '#9CA3AF', maxRotation: 0, autoSkip: true, maxTicksLimit: 7 },
      },
      y: {
        grid: { color: 'rgba(107, 114, 128, 0.2)' },
        ticks: { color: '#9CA3AF', callback: (value) => `$${Number(value).toLocaleString()}` },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  const chartData = {
    labels: processedData.map(d => d.date),
    datasets: [
      {
        label: 'Close Price',
        data: processedData.map(d => d.close),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          if (!chart) {
            return 'rgba(0,0,0,0)'; // Return transparent if chart not ready
          }
          const { ctx, chartArea } = chart;

          if (!chartArea) {
            // This case happens on initial chart load before chartArea is defined
            return null;
          }
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');
          return gradient;
        },
        borderWidth: 2,
        pointRadius: 0,
        pointHitRadius: 10,
        fill: true,
        tension: 0.1,
      },
    ],
  };

  const timeframes: Timeframe[] = ['Daily', 'Weekly', 'Monthly'];

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 sm:p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-200 mb-2 sm:mb-0">Price Chart</h2>
        <div className="flex items-center bg-gray-700/50 rounded-lg p-1 space-x-1">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => {
                setTimeframe(tf);
                onTimeframeChange?.(tf);
              }}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors duration-200 ${
                timeframe === tf
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-gray-600/50'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      <div className="relative h-72 sm:h-96">
        <Line options={chartOptions} data={chartData} />
      </div>
    </div>
  );
};

export default LineChart;
