
import React from 'react';
import type { TradingScenario, Timeframe } from '../types';

interface AnalysisDisplayProps {
  analysis: string;
  sources?: { uri: string; title: string; }[];
  scenarios?: TradingScenario[];
  timeframe?: Timeframe;
}

// A simple utility to convert markdown-like text to HTML
const formatAnalysis = (text: string) => {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="text-blue-300">$1</strong>') // Bold
        .replace(/\n/g, '<br />'); // Newlines
};

const getProbabilityColor = (probability: string) => {
  const prob = probability.toLowerCase();
  if (prob.includes('high')) return 'text-green-400 bg-green-400/20';
  if (prob.includes('medium')) return 'text-yellow-400 bg-yellow-400/20';
  if (prob.includes('low')) return 'text-red-400 bg-red-400/20';
  return 'text-gray-400 bg-gray-400/20';
};

const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis, sources, scenarios, timeframe }) => {
  return (
    <div className="space-y-6">
      <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-lg">
        <h2 className="text-2xl font-bold text-gray-100 mb-4">AI Technical Analysis</h2>
        {timeframe && (
          <div className="mb-4 inline-block px-3 py-1 bg-blue-600/20 text-blue-300 rounded-md text-sm font-medium">
            {timeframe} Timeframe Analysis
          </div>
        )}
        <div
          className="prose prose-invert prose-p:text-gray-300 prose-li:text-gray-300 text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatAnalysis(analysis) }}
        />
        
        {sources && sources.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-700">
              <h3 className="text-lg font-semibold text-gray-200 mb-3">Sources</h3>
              <ul className="space-y-2">
                  {sources.map((source, index) => (
                      <li key={index} className="flex items-center">
                          <span className="text-gray-500 mr-2">{index + 1}.</span>
                          <a 
                              href={source.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 hover:underline truncate"
                              title={source.title}
                          >
                              {source.title || new URL(source.uri).hostname}
                          </a>
                      </li>
                  ))}
              </ul>
          </div>
        )}
      </div>

      {scenarios && scenarios.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-lg">
          <h2 className="text-2xl font-bold text-gray-100 mb-4">Trading Scenarios</h2>
          <p className="text-gray-400 mb-6 text-sm">
            Multiple scenarios based on {timeframe || 'selected'} timeframe analysis:
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {scenarios.map((scenario, index) => (
              <div 
                key={index}
                className="bg-gray-700/30 border border-gray-600 rounded-lg p-5 hover:border-gray-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-200">{scenario.name}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getProbabilityColor(scenario.probability)}`}>
                    {scenario.probability}
                  </span>
                </div>
                <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                  {scenario.description}
                </p>
                {scenario.keyLevels && scenario.keyLevels.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Key Levels:</h4>
                    <ul className="space-y-1">
                      {scenario.keyLevels.map((level, levelIndex) => (
                        <li key={levelIndex} className="text-xs text-gray-400">
                          • {level}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <span className="text-xs text-gray-500">Timeframe: {scenario.timeframe}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisDisplay;
