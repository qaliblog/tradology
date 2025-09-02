import React, { useState } from 'react';
import { fetchCurrentPriceFromBinance } from '../services/exactDataService';

interface PriceRefreshButtonProps {
  symbol: string;
  onPriceUpdate: (price: number, change: number, changePercent: number) => void;
  className?: string;
}

const PriceRefreshButton: React.FC<PriceRefreshButtonProps> = ({ 
  symbol, 
  onPriceUpdate, 
  className = '' 
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    try {
      console.log(`Refreshing price for ${symbol}...`);
      const priceData = await fetchCurrentPriceFromBinance(symbol);
      
      if (priceData) {
        onPriceUpdate(priceData.price, priceData.change24h, priceData.changePercent24h);
        setLastRefresh(new Date());
        console.log(`Price refreshed for ${symbol}: $${priceData.price}`);
      } else {
        console.warn(`Failed to fetch price for ${symbol}`);
      }
    } catch (error) {
      console.error(`Error refreshing price for ${symbol}:`, error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={handleRefresh}
        disabled={isRefreshing}
        className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 flex items-center gap-2 ${
          isRefreshing
            ? 'bg-[#2a2e39] text-[#787b86] cursor-not-allowed'
            : 'bg-[#2962ff] text-[#d1d4dc] hover:bg-[#1e40af] shadow-lg hover:shadow-xl'
        }`}
        title={isRefreshing ? 'Refreshing...' : 'Refresh current price'}
      >
        {isRefreshing ? (
          <>
            <div className="w-4 h-4 border-2 border-[#787b86] border-t-transparent rounded-full animate-spin"></div>
            <span>Refreshing...</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </>
        )}
      </button>
      
      {lastRefresh && (
        <span className="text-xs text-[#787b86] hidden sm:block">
          Last updated: {lastRefresh.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default PriceRefreshButton;