import React, { useState, useEffect } from 'react';
import type { ChartDataPoint } from '../types';
import { analyzeMarketData } from '../services/aiGuidanceService';

interface EnhancedAnalysisDisplayProps {
  data: ChartDataPoint[];
  symbol: string;
  userPrompt: string;
  sources?: string[];
}

const EnhancedAnalysisDisplay: React.FC<EnhancedAnalysisDisplayProps> = ({
  data,
  symbol,
  userPrompt,
  sources = []
}) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (data && data.length > 0) {
      setIsAnalyzing(true);
      try {
        const marketAnalysis = analyzeMarketData(data, symbol, userPrompt);
        setAnalysis(marketAnalysis);
      } catch (error) {
        console.error('Error analyzing market data:', error);
      } finally {
        setIsAnalyzing(false);
      }
    }
  }, [data, symbol, userPrompt]);

  if (isAnalyzing) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          <span className="ml-4 text-white text-lg">AI is analyzing your data...</span>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl text-center">
        <h2 className="text-2xl font-bold text-white mb-4">AI Market Analysis</h2>
        <p className="text-white/60">No analysis available. Please provide market data.</p>
      </div>
    );
  }

  const { analysis: marketAnalysis, actionableInsights, nextSteps, warnings, opportunities, tradingScenarios } = analysis;

  return (
    <div className="space-y-6">
      {/* Main Analysis Card */}
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold text-white">AI Market Analysis</h2>
          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
            marketAnalysis.trend === 'bullish' 
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : marketAnalysis.trend === 'bearish'
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
          }`}>
            {marketAnalysis.trend.toUpperCase()} {marketAnalysis.strength.toUpperCase()}
          </div>
        </div>

        {/* Market Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-white/80 text-sm font-medium mb-2">Trend Confidence</h3>
            <div className="text-3xl font-bold text-white mb-2">{marketAnalysis.confidence}%</div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${marketAnalysis.confidence}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-white/80 text-sm font-medium mb-2">Risk Level</h3>
            <div className={`text-3xl font-bold ${
              marketAnalysis.riskLevel === 'low' ? 'text-green-400' :
              marketAnalysis.riskLevel === 'medium' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {marketAnalysis.riskLevel.toUpperCase()}
            </div>
            <div className="text-white/60 text-sm mt-2">
              {marketAnalysis.riskLevel === 'low' ? 'Conservative approach recommended' :
               marketAnalysis.riskLevel === 'medium' ? 'Moderate position sizing' :
               'High caution advised'}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <h3 className="text-white/80 text-sm font-medium mb-2">Time Horizon</h3>
            <div className="text-3xl font-bold text-white">{marketAnalysis.timeHorizon.toUpperCase()}</div>
            <div className="text-white/60 text-sm mt-2">
              {marketAnalysis.timeHorizon === 'short' ? 'Intraday to few days' :
               marketAnalysis.timeHorizon === 'medium' ? 'Weeks to months' :
               'Months to years'}
            </div>
          </div>
        </div>

        {/* Technical Indicators */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
          <h3 className="text-white font-semibold text-lg mb-4">Technical Indicators</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {marketAnalysis.indicators.rsi && (
              <div className="text-center">
                <div className="text-white/60 text-sm">RSI</div>
                <div className={`text-2xl font-bold ${
                  marketAnalysis.indicators.rsi > 70 ? 'text-red-400' :
                  marketAnalysis.indicators.rsi < 30 ? 'text-green-400' :
                  'text-white'
                }`}>
                  {marketAnalysis.indicators.rsi.toFixed(1)}
                </div>
              </div>
            )}
            {marketAnalysis.indicators.sma20 && (
              <div className="text-center">
                <div className="text-white/60 text-sm">SMA 20</div>
                <div className="text-2xl font-bold text-white">
                  ${marketAnalysis.indicators.sma20.toFixed(2)}
                </div>
              </div>
            )}
            {marketAnalysis.indicators.sma50 && (
              <div className="text-center">
                <div className="text-white/60 text-sm">SMA 50</div>
                <div className="text-2xl font-bold text-white">
                  ${marketAnalysis.indicators.sma50.toFixed(2)}
                </div>
              </div>
            )}
            <div className="text-center">
              <div className="text-white/60 text-sm">Volume</div>
              <div className="text-2xl font-bold text-white">
                {marketAnalysis.indicators.volume}
              </div>
            </div>
          </div>
        </div>

        {/* Key Levels */}
        {(marketAnalysis.keyLevels.support.length > 0 || marketAnalysis.keyLevels.resistance.length > 0) && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 mb-6">
            <h3 className="text-white font-semibold text-lg mb-4">Key Levels</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-green-400 font-medium mb-2">Support Levels</h4>
                <div className="space-y-1">
                  {marketAnalysis.keyLevels.support.map((level, index) => (
                    <div key={index} className="text-white text-sm">
                      ${level.toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-red-400 font-medium mb-2">Resistance Levels</h4>
                <div className="space-y-1">
                  {marketAnalysis.keyLevels.resistance.map((level, index) => (
                    <div key={index} className="text-white text-sm">
                      ${level.toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {marketAnalysis.recommendations.length > 0 && (
        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-2xl p-6 shadow-xl">
          <h3 className="text-blue-300 font-semibold text-xl mb-4 flex items-center">
            <span className="mr-2">💡</span>
            AI Recommendations
          </h3>
          <div className="space-y-3">
            {marketAnalysis.recommendations.map((rec, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-white">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Insights */}
      {actionableInsights.length > 0 && (
        <div className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border border-green-500/30 rounded-2xl p-6 shadow-xl">
          <h3 className="text-green-300 font-semibold text-xl mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            Actionable Insights
          </h3>
          <div className="space-y-3">
            {actionableInsights.map((insight, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-white">{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <div className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-2xl p-6 shadow-xl">
          <h3 className="text-purple-300 font-semibold text-xl mb-4 flex items-center">
            <span className="mr-2">📋</span>
            Next Steps
          </h3>
          <div className="space-y-3">
            {nextSteps.map((step, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-white">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-2xl p-6 shadow-xl">
          <h3 className="text-red-300 font-semibold text-xl mb-4 flex items-center">
            <span className="mr-2">⚠️</span>
            Important Warnings
          </h3>
          <div className="space-y-3">
            {warnings.map((warning, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-white">{warning}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trading Scenarios */}
      {tradingScenarios.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/30 rounded-2xl p-6 shadow-xl">
          <h3 className="text-indigo-300 font-semibold text-xl mb-4 flex items-center">
            <span className="mr-2">📊</span>
            Trading Scenarios
          </h3>
          <div className="space-y-4">
            {tradingScenarios.map((scenario, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                    scenario.action === 'BUY' 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : scenario.action === 'SELL'
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  }`}>
                    {scenario.action}
                  </div>
                  <div className="text-right">
                    <div className="text-white/60 text-sm">Confidence</div>
                    <div className="text-white font-bold text-lg">{scenario.confidence}%</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-white/60 text-xs mb-1">Entry</div>
                    <div className="text-white font-semibold">${scenario.entryPrice.toFixed(8)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-red-400 text-xs mb-1">Stop Loss</div>
                    <div className="text-red-400 font-semibold">${scenario.stopLoss.toFixed(8)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 text-xs mb-1">Take Profit 1</div>
                    <div className="text-green-400 font-semibold">${scenario.takeProfit1.toFixed(8)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-green-400 text-xs mb-1">Take Profit 2</div>
                    <div className="text-green-400 font-semibold">${scenario.takeProfit2.toFixed(8)}</div>
                  </div>
                </div>
                
                {/* Leveraged Trading Information */}
                {scenario.leverage && (
                  <div className="bg-gradient-to-r from-orange-900/20 to-red-900/20 rounded-lg p-4 mb-4 border border-orange-500/30">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-orange-400 text-xs mb-1">Leverage</div>
                        <div className="text-orange-400 font-bold text-lg">{scenario.leverage}x</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-400 text-xs mb-1">Liquidation</div>
                        <div className="text-red-400 font-semibold">${scenario.liquidationPrice?.toFixed(8)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-blue-400 text-xs mb-1">Success Rate</div>
                        <div className="text-blue-400 font-semibold">{scenario.successRate}%</div>
                      </div>
                      <div className="text-center">
                        <div className="text-purple-400 text-xs mb-1">Position Size</div>
                        <div className="text-purple-400 font-semibold">{scenario.positionSize}%</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div className="text-center">
                        <div className="text-red-400 text-xs mb-1">Max Loss</div>
                        <div className="text-red-400 font-semibold">${scenario.maxLoss}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-400 text-xs mb-1">Max Gain</div>
                        <div className="text-green-400 font-semibold">${scenario.maxGain}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-3">
                  <div className="text-white/60 text-sm">Risk-Reward Ratio</div>
                  <div className={`font-bold ${
                    scenario.riskReward >= 2 ? 'text-green-400' :
                    scenario.riskReward >= 1.5 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {scenario.riskReward}:1
                  </div>
                </div>
                
                <div className="bg-white/5 rounded-lg p-3">
                  <p className="text-white/80 text-sm">{scenario.reasoning}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Opportunities */}
      {opportunities.length > 0 && (
        <div className="bg-gradient-to-br from-yellow-900/20 to-green-900/20 border border-yellow-500/30 rounded-2xl p-6 shadow-xl">
          <h3 className="text-yellow-300 font-semibold text-xl mb-4 flex items-center">
            <span className="mr-2">🚀</span>
            Trading Opportunities
          </h3>
          <div className="space-y-3">
            {opportunities.map((opportunity, index) => (
              <div key={index} className="bg-white/5 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <p className="text-white">{opportunity}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-white font-semibold text-lg mb-4">Data Sources</h3>
          <div className="space-y-2">
            {sources.map((source, index) => (
              <div key={index} className="text-white/60 text-sm">
                {index + 1}. {source}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAnalysisDisplay;