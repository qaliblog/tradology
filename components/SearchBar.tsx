
import React, { useState } from 'react';
import FeatherIcon from './icons/FeatherIcon';

interface SearchBarProps {
  onSearch: (prompt: string) => void;
  isLoading: boolean;
}

// FIX: isApiKeySet prop removed as API key is now handled by environment variables.
const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(prompt);
  };

  // FIX: isDisabled logic simplified.
  const isDisabled = isLoading;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center gap-3">
      <div className="relative w-full">
        <FeatherIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            "Ask: 'Should I buy BTC?', 'Is ETH oversold?', 'TradingView URL', or paste HTML..."
          }
          disabled={isDisabled}
          className="w-full pl-12 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Trading analysis request"
        />
      </div>
      
      <button
        type="submit"
        // FIX: isDisabled logic simplified.
        disabled={isDisabled || !prompt}
        className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing...
          </>
        ) : (
          'Analyze'
        )}
      </button>
    </form>
  );
};

export default SearchBar;
