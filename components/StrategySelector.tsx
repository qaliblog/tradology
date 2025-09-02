import React, { useState } from 'react';

interface StrategySelectorProps {
  onStrategyChange: (strategy: string, customInstructions?: string) => void;
  currentStrategy: string;
}

interface AnalysisStrategy {
  id: string;
  name: string;
  description: string;
  instructions: string;
  icon: string;
  color: string;
}

const strategies: AnalysisStrategy[] = [
  {
    id: 'technical',
    name: 'Technical Analysis',
    description: 'Focus on price patterns, support/resistance, and technical indicators',
    instructions: `You are a technical analysis expert. Focus on:
- Price action patterns and chart formations
- Support and resistance levels
- Technical indicators (RSI, MACD, Moving Averages)
- Volume analysis
- Trend identification and momentum
- Entry and exit signals based on technical patterns`,
    icon: '📈',
    color: 'blue'
  },
  {
    id: 'fundamental',
    name: 'Fundamental Analysis',
    description: 'Analyze underlying value, financials, and market conditions',
    instructions: `You are a fundamental analysis expert. Focus on:
- Market capitalization and valuation metrics
- Recent news and developments
- Market sentiment and adoption
- Competitive landscape
- Regulatory environment
- Long-term growth prospects and risks`,
    icon: '📊',
    color: 'green'
  },
  {
    id: 'sentiment',
    name: 'Sentiment Analysis',
    description: 'Analyze market sentiment, social media, and news impact',
    instructions: `You are a market sentiment expert. Focus on:
- Social media sentiment and community discussions
- News sentiment and media coverage
- Fear and greed indicators
- Market psychology and behavioral patterns
- Community engagement and adoption trends
- Sentiment-driven price movements`,
    icon: '💭',
    color: 'purple'
  },
  {
    id: 'momentum',
    name: 'Momentum Trading',
    description: 'Focus on short-term price movements and momentum indicators',
    instructions: `You are a momentum trading expert. Focus on:
- Short-term price movements and volatility
- Momentum indicators and oscillators
- Breakout patterns and volume surges
- Quick entry and exit opportunities
- Risk management for short-term trades
- Market timing and momentum shifts`,
    icon: '⚡',
    color: 'yellow'
  },
  {
    id: 'swing',
    name: 'Swing Trading',
    description: 'Medium-term analysis for swing trading opportunities',
    instructions: `You are a swing trading expert. Focus on:
- Medium-term price swings and trends
- Swing highs and lows identification
- Risk-reward ratios for swing trades
- Market cycles and seasonal patterns
- Position sizing for swing trades
- Entry and exit timing for 3-7 day holds`,
    icon: '🎯',
    color: 'orange'
  },
  {
    id: 'custom',
    name: 'Custom Strategy',
    description: 'Define your own analysis approach and instructions',
    instructions: '',
    icon: '⚙️',
    color: 'gray'
  }
];

const StrategySelector: React.FC<StrategySelectorProps> = ({ onStrategyChange, currentStrategy }) => {
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');

  const handleStrategySelect = (strategy: AnalysisStrategy) => {
    if (strategy.id === 'custom') {
      setShowCustomModal(true);
    } else {
      onStrategyChange(strategy.id, strategy.instructions);
    }
  };

  const handleCustomSubmit = () => {
    if (customInstructions.trim()) {
      onStrategyChange('custom', customInstructions);
      setShowCustomModal(false);
    }
  };

  const getCurrentStrategy = () => {
    return strategies.find(s => s.id === currentStrategy) || strategies[0];
  };

  return (
    <>
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4">Analysis Strategy</h3>
        
        {/* Current Strategy Display */}
        <div className="mb-4 p-3 bg-gray-700/50 rounded-lg border border-gray-600">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getCurrentStrategy().icon}</span>
            <div>
              <p className="text-white font-medium">{getCurrentStrategy().name}</p>
              <p className="text-gray-400 text-sm">{getCurrentStrategy().description}</p>
            </div>
          </div>
        </div>

        {/* Strategy Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {strategies.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => handleStrategySelect(strategy)}
              className={`p-3 rounded-lg border transition-all duration-200 text-left ${
                currentStrategy === strategy.id
                  ? `border-${strategy.color}-500 bg-${strategy.color}-900/20`
                  : 'border-gray-600 bg-gray-700/30 hover:bg-gray-700/50 hover:border-gray-500'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{strategy.icon}</span>
                <span className="text-white font-medium text-sm">{strategy.name}</span>
              </div>
              <p className="text-gray-400 text-xs">{strategy.description}</p>
            </button>
          ))}
        </div>

        {/* Strategy Instructions Preview */}
        {currentStrategy !== 'custom' && (
          <div className="mt-4 p-3 bg-gray-900/50 rounded-lg border border-gray-600">
            <h4 className="text-sm font-medium text-white mb-2">Analysis Instructions:</h4>
            <p className="text-gray-300 text-xs leading-relaxed">
              {getCurrentStrategy().instructions.substring(0, 200)}...
            </p>
          </div>
        )}
      </div>

      {/* Custom Strategy Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full border border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h2 className="text-xl font-semibold text-white">Custom Analysis Strategy</h2>
              <button
                onClick={() => setShowCustomModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label htmlFor="customInstructions" className="block text-sm font-medium text-gray-300 mb-2">
                  Custom Analysis Instructions
                </label>
                <textarea
                  id="customInstructions"
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="Enter your custom analysis instructions here. Be specific about what you want the AI to focus on, what indicators to use, what timeframes to consider, etc."
                  className="w-full h-40 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Provide detailed instructions for how you want the AI to analyze the market data.
                </p>
              </div>

              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-md">
                <h4 className="text-sm font-medium text-blue-300 mb-2">💡 Tips for effective instructions:</h4>
                <ul className="text-xs text-blue-200 space-y-1">
                  <li>• Specify which technical indicators to focus on</li>
                  <li>• Define your risk tolerance and time horizon</li>
                  <li>• Mention specific patterns or setups you're looking for</li>
                  <li>• Include any specific market conditions to consider</li>
                </ul>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleCustomSubmit}
                  disabled={!customInstructions.trim()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
                >
                  Apply Custom Strategy
                </button>
                <button
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StrategySelector;