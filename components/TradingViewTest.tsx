import React, { useState } from 'react';
import { processTradingViewHtml } from '../services/tradingViewScraper';
import { scrapeTradingViewDOM } from '../services/tradingViewDOMScraper';
import type { ChartDataPoint } from '../types';

interface TradingViewTestProps {
  onDataExtracted: (data: ChartDataPoint[]) => void;
}

const TradingViewTest: React.FC<TradingViewTestProps> = ({ onDataExtracted }) => {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<ChartDataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleProcessHtml = async () => {
    if (!htmlContent.trim()) {
      setError('Please paste the TradingView HTML content');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      console.log('Processing TradingView HTML content...');
      
      // Try DOM scraping first (faster and more accurate)
      const domData = scrapeTradingViewDOM(htmlContent);
      
      if (domData && domData.currentPrice > 0) {
        console.log('✅ Successfully extracted data from DOM:', domData);
        setExtractedData(domData.dataPoints);
        onDataExtracted(domData.dataPoints);
        return;
      }
      
      // Fallback to the old method if DOM scraping fails
      console.log('DOM scraping failed, trying fallback method...');
      const result = await processTradingViewHtml(htmlContent, '');
      
      console.log('Extracted data:', result);
      setExtractedData(result.dataPoints);
      onDataExtracted(result.dataPoints);
      
    } catch (err) {
      console.error('Error processing HTML:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      // Provide more user-friendly error messages
      if (errorMessage.includes('URL')) {
        setError('URL parsing error. Please ensure the HTML content is valid.');
      } else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setHtmlContent('');
    setExtractedData([]);
    setError(null);
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-lg">
      <h2 className="text-2xl font-bold text-gray-100 mb-4">
        TradingView Data Extractor Test
      </h2>
      
      <div className="space-y-4">
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
          <h3 className="text-blue-300 font-semibold mb-2">How to get exact TradingView data:</h3>
          <ol className="text-blue-200 text-sm space-y-1 list-decimal list-inside">
            <li>Go to TradingView.com and search for your symbol (e.g., BTCUSD)</li>
            <li>Right-click on the page and select "View Page Source"</li>
            <li>Copy the entire HTML content (Ctrl+A, Ctrl+C)</li>
            <li>Paste it in the textarea below</li>
            <li>Click "Extract Data" to get the exact numbers</li>
          </ol>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Paste TradingView HTML Content:
          </label>
          <textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            placeholder="Paste the complete HTML source from TradingView here..."
            className="w-full h-64 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={handleProcessHtml}
            disabled={isProcessing || !htmlContent.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : 'Extract Data'}
          </button>
          
          <button
            onClick={handleClear}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Clear
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">
            <p><strong>Error:</strong> {error}</p>
          </div>
        )}

        {extractedData.length > 0 && (
          <div className="p-4 bg-green-900/50 border border-green-700 text-green-300 rounded-lg">
            <p><strong>Success!</strong> Extracted {extractedData.length} data points</p>
            <div className="mt-2 text-sm">
              <p>Sample data points:</p>
              <ul className="list-disc list-inside mt-1">
                {extractedData.slice(0, 3).map((point, index) => (
                  <li key={index}>
                    {point.date}: ${point.close} (Vol: {point.volume})
                  </li>
                ))}
                {extractedData.length > 3 && (
                  <li>... and {extractedData.length - 3} more</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TradingViewTest;