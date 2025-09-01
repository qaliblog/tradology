
import React from 'react';
import type { ChartDataPoint } from '../types';

interface DataTableProps {
  data?: ChartDataPoint[];
  prompt: string;
}

const DataTable: React.FC<DataTableProps> = ({ data, prompt }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-lg text-center">
        <h2 className="text-xl font-semibold text-gray-200 mb-2">
          Data for: <span className="text-blue-400">{prompt}</span>
        </h2>
        <div className="text-gray-400 space-y-2">
          <p>
            The AI could not find structured historical data for this query.
          </p>
          <p className="text-sm">
            This is common for some assets or when real-time data sources are not accessible.
            Please see the comprehensive analysis below for valuable insights from web search results.
          </p>
          <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-md">
            <p className="text-blue-300 text-sm">
              💡 <strong>Tip:</strong> The analysis below contains current market information, 
              technical insights, and trend analysis even without structured price data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 sm:p-6 shadow-lg">
      <h2 className="text-xl font-semibold text-gray-200 mb-4">
        Recent Data for: <span className="text-blue-400">{prompt}</span>
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-max text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-700/50">
            <tr>
              <th scope="col" className="px-4 py-3">Date</th>
              <th scope="col" className="px-4 py-3 text-right">Open</th>
              <th scope="col" className="px-4 py-3 text-right">High</th>
              <th scope="col" className="px-4 py-3 text-right">Low</th>
              <th scope="col" className="px-4 py-3 text-right">Close</th>
              <th scope="col" className="px-4 py-3 text-right">Volume</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/40 transition-colors duration-200">
                <td className="px-4 py-3 font-medium text-gray-200 whitespace-nowrap">{row.date}</td>
                <td className="px-4 py-3 text-right">{row.open.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td className="px-4 py-3 text-right text-green-400">{row.high.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td className="px-4 py-3 text-right text-red-400">{row.low.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td className="px-4 py-3 text-right font-semibold">{row.close.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
                <td className="px-4 py-3 text-right">{row.volume}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-500 mt-2 text-center">
        Note: Data is sourced from the web via AI search and may not be real-time.
      </p>
    </div>
  );
};

export default DataTable;
