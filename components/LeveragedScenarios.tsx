import React, { useState, useMemo } from 'react';
import type { ChartDataPoint, LeverageAnalysis, LeveragedScenario } from '../types';
import { generateLeveragedScenarios, calculateAdvancedRiskMetrics } from '../services/leverageService';

interface LeveragedScenariosProps {
  symbol: string;
  currentPrice: number;
  chartData: ChartDataPoint[];
  accountBalance?: number;
}

const LeveragedScenarios: React.FC<LeveragedScenariosProps> = ({
  symbol,
  currentPrice,
  chartData,
  accountBalance = 10000
}) => {
  const [selectedDirection, setSelectedDirection] = useState<'all' | 'long' | 'short'>('all');
  const [selectedLeverage, setSelectedLeverage] = useState<number | 'all'>('all');
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState<boolean>(false);

  const leverageAnalysis = useMemo(() => {
    return generateLeveragedScenarios(symbol, currentPrice, chartData, accountBalance);
  }, [symbol, currentPrice, chartData, accountBalance]);

  const filteredScenarios = useMemo(() => {
    let filtered = leverageAnalysis.scenarios;
    
    if (selectedDirection !== 'all') {
      filtered = filtered.filter(s => s.direction === selectedDirection);
    }
    
    if (selectedLeverage !== 'all') {
      filtered = filtered.filter(s => s.leverage === selectedLeverage);
    }
    
    // Sort by success chance * risk reward ratio
    return filtered.sort((a, b) => 
      (b.successChance * b.riskRewardRatio) - (a.successChance * a.riskRewardRatio)
    );
  }, [leverageAnalysis.scenarios, selectedDirection, selectedLeverage]);

  const getRiskColor = (leverage: number): string => {
    if (leverage <= 10) return 'text-green-400';
    if (leverage <= 30) return 'text-yellow-400';
    if (leverage <= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSuccessColor = (chance: number): string => {
    if (chance >= 0.7) return 'text-green-400';
    if (chance >= 0.6) return 'text-yellow-400';
    if (chance >= 0.5) return 'text-orange-400';
    return 'text-red-400';
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 shadow-lg">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Leveraged Trading Scenarios - {symbol}
          </h2>
          <p className="text-gray-400">
            Current Price: {formatCurrency(currentPrice)} | 
            Volatility: {formatPercentage(leverageAnalysis.marketConditions.volatility)} | 
            Trend: <span className={`font-semibold ${
              leverageAnalysis.marketConditions.trend === 'bullish' ? 'text-green-400' :
              leverageAnalysis.marketConditions.trend === 'bearish' ? 'text-red-400' : 'text-yellow-400'
            }`}>
              {leverageAnalysis.marketConditions.trend.toUpperCase()}
            </span>
          </p>
        </div>
        
        <div className="flex flex-wrap gap-4 mt-4 lg:mt-0">
          <div className="flex items-center gap-2">
            <label className="text-gray-300 text-sm">Direction:</label>
            <select
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value as any)}
              className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
            >
              <option value="all">All</option>
              <option value="long">Long</option>
              <option value="short">Short</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-gray-300 text-sm">Leverage:</label>
            <select
              value={selectedLeverage}
              onChange={(e) => setSelectedLeverage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-gray-700 text-white px-3 py-1 rounded border border-gray-600"
            >
              <option value="all">All</option>
              <option value="1">1x</option>
              <option value="10">10x</option>
              <option value="20">20x</option>
              <option value="30">30x</option>
              <option value="40">40x</option>
              <option value="50">50x</option>
              <option value="60">60x</option>
            </select>
          </div>
          
          <button
            onClick={() => setShowAdvancedMetrics(!showAdvancedMetrics)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {showAdvancedMetrics ? 'Hide' : 'Show'} Advanced Metrics
          </button>
        </div>
      </div>

      {/* Market Conditions Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Support & Resistance</h3>
          <p className="text-gray-300">
            Support: <span className="text-green-400 font-semibold">
              {formatCurrency(leverageAnalysis.marketConditions.support)}
            </span>
          </p>
          <p className="text-gray-300">
            Resistance: <span className="text-red-400 font-semibold">
              {formatCurrency(leverageAnalysis.marketConditions.resistance)}
            </span>
          </p>
        </div>
        
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Risk Metrics</h3>
          <p className="text-gray-300">
            Max Drawdown: <span className="text-red-400 font-semibold">
              {formatPercentage(leverageAnalysis.riskMetrics.maxDrawdown)}
            </span>
          </p>
          <p className="text-gray-300">
            Expected Return: <span className="text-green-400 font-semibold">
              {formatCurrency(leverageAnalysis.riskMetrics.expectedReturn)}
            </span>
          </p>
        </div>
        
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-2">Recommendations</h3>
          <p className="text-gray-300">
            Best Leverage: <span className={`font-semibold ${getRiskColor(leverageAnalysis.recommendations.bestLeverage)}`}>
              {leverageAnalysis.recommendations.bestLeverage}x
            </span>
          </p>
          <p className="text-gray-300">
            Risk Level: <span className={`font-semibold ${
              leverageAnalysis.recommendations.riskLevel === 'low' ? 'text-green-400' :
              leverageAnalysis.recommendations.riskLevel === 'medium' ? 'text-yellow-400' :
              leverageAnalysis.recommendations.riskLevel === 'high' ? 'text-orange-400' : 'text-red-400'
            }`}>
              {leverageAnalysis.recommendations.riskLevel.toUpperCase()}
            </span>
          </p>
        </div>
      </div>

      {/* Warnings */}
      {leverageAnalysis.recommendations.warnings.length > 0 && (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-yellow-400 mb-2">⚠️ Important Warnings</h3>
          <ul className="list-disc list-inside text-yellow-300 space-y-1">
            {leverageAnalysis.recommendations.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Scenarios Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left py-3 px-2 text-gray-300">Leverage</th>
              <th className="text-left py-3 px-2 text-gray-300">Direction</th>
              <th className="text-left py-3 px-2 text-gray-300">Entry</th>
              <th className="text-left py-3 px-2 text-gray-300">Stop Loss</th>
              <th className="text-left py-3 px-2 text-gray-300">Take Profit</th>
              <th className="text-left py-3 px-2 text-gray-300">Success Chance</th>
              <th className="text-left py-3 px-2 text-gray-300">Risk/Reward</th>
              <th className="text-left py-3 px-2 text-gray-300">Max Loss</th>
              <th className="text-left py-3 px-2 text-gray-300">Max Gain</th>
              <th className="text-left py-3 px-2 text-gray-300">Liquidation</th>
              <th className="text-left py-3 px-2 text-gray-300">Time Horizon</th>
                                {showAdvancedMetrics && (
                <>
                  <th className="text-left py-3 px-2 text-gray-300">Margin Req.</th>
                  <th className="text-left py-3 px-2 text-gray-300">Position Size</th>
                  <th className="text-left py-3 px-2 text-gray-300">Risk/Trade</th>
                  <th className="text-left py-3 px-2 text-gray-300">Kelly %</th>
                  <th className="text-left py-3 px-2 text-gray-300">Sharpe</th>
                  <th className="text-left py-3 px-2 text-gray-300">Risk Grade</th>
                  <th className="text-left py-3 px-2 text-gray-300">Profit Factor</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredScenarios.map((scenario, index) => {
              const advancedMetrics = calculateAdvancedRiskMetrics(scenario, accountBalance);
              
              return (
                <tr key={index} className="border-b border-gray-700 hover:bg-gray-700/30">
                  <td className={`py-3 px-2 font-semibold ${getRiskColor(scenario.leverage)}`}>
                    {scenario.leverage}x
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      scenario.direction === 'long' 
                        ? 'bg-green-900/50 text-green-400' 
                        : 'bg-red-900/50 text-red-400'
                    }`}>
                      {scenario.direction.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-white">
                    {formatCurrency(scenario.entryPrice)}
                  </td>
                  <td className="py-3 px-2 text-red-400">
                    {formatCurrency(scenario.stopLoss)}
                  </td>
                  <td className="py-3 px-2 text-green-400">
                    {formatCurrency(scenario.takeProfit)}
                  </td>
                  <td className={`py-3 px-2 font-semibold ${getSuccessColor(scenario.successChance)}`}>
                    {formatPercentage(scenario.successChance)}
                  </td>
                  <td className="py-3 px-2 text-white">
                    {scenario.riskRewardRatio.toFixed(2)}
                  </td>
                  <td className="py-3 px-2 text-red-400">
                    {formatCurrency(scenario.maxLoss)}
                  </td>
                  <td className="py-3 px-2 text-green-400">
                    {formatCurrency(scenario.maxGain)}
                  </td>
                  <td className="py-3 px-2 text-orange-400">
                    {formatCurrency(scenario.liquidationPrice)}
                  </td>
                  <td className="py-3 px-2 text-gray-300">
                    {scenario.timeHorizon}
                  </td>
                  {showAdvancedMetrics && (
                    <>
                      <td className="py-3 px-2 text-blue-400">
                        {formatCurrency(scenario.marginRequired)}
                      </td>
                      <td className="py-3 px-2 text-purple-400">
                        {scenario.positionSize.toFixed(4)}
                      </td>
                      <td className="py-3 px-2 text-yellow-400">
                        {formatPercentage(advancedMetrics.riskPerTrade)}
                      </td>
                      <td className="py-3 px-2 text-cyan-400">
                        {formatPercentage(advancedMetrics.kellyPercentage)}
                      </td>
                      <td className="py-3 px-2 text-indigo-400">
                        {advancedMetrics.sharpeRatio.toFixed(2)}
                      </td>
                      <td className={`py-3 px-2 font-bold ${
                        advancedMetrics.riskGrade === 'A' ? 'text-green-400' :
                        advancedMetrics.riskGrade === 'B' ? 'text-yellow-400' :
                        advancedMetrics.riskGrade === 'C' ? 'text-orange-400' :
                        advancedMetrics.riskGrade === 'D' ? 'text-red-400' : 'text-red-600'
                      }`}>
                        {advancedMetrics.riskGrade}
                      </td>
                      <td className="py-3 px-2 text-pink-400">
                        {advancedMetrics.profitFactor.toFixed(2)}
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-700/30 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-3">Legend & Risk Levels</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-gray-300 mb-2">Leverage Risk:</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-green-400">●</span>
                <span className="text-gray-300">1x-10x: Low Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">●</span>
                <span className="text-gray-300">11x-30x: Medium Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-400">●</span>
                <span className="text-gray-300">31x-50x: High Risk</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-400">●</span>
                <span className="text-gray-300">51x+: Extreme Risk</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-gray-300 mb-2">Success Probability:</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-green-400">●</span>
                <span className="text-gray-300">70%+: High Success</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">●</span>
                <span className="text-gray-300">60-69%: Good Success</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-400">●</span>
                <span className="text-gray-300">50-59%: Moderate Success</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-400">●</span>
                <span className="text-gray-300">Below 50%: Low Success</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Metrics Explanation */}
      {showAdvancedMetrics && (
        <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">📊 Advanced Metrics Explained</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-blue-300 mb-2">Risk Metrics:</h4>
              <div className="space-y-1 text-gray-300">
                <div><strong className="text-cyan-400">Kelly %:</strong> Optimal position size based on win rate and risk/reward</div>
                <div><strong className="text-indigo-400">Sharpe:</strong> Risk-adjusted return ratio (higher is better)</div>
                <div><strong className="text-pink-400">Profit Factor:</strong> Gross profit / Gross loss ratio</div>
                <div><strong className="text-yellow-400">Risk/Trade:</strong> Percentage of account risked per trade</div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-blue-300 mb-2">Risk Grades:</h4>
              <div className="space-y-1 text-gray-300">
                <div><span className="text-green-400 font-bold">A:</span> Excellent risk management (&le;5% risk)</div>
                <div><span className="text-yellow-400 font-bold">B:</span> Good risk management (5-10% risk)</div>
                <div><span className="text-orange-400 font-bold">C:</span> Moderate risk (10-15% risk)</div>
                <div><span className="text-red-400 font-bold">D:</span> High risk (15-20% risk)</div>
                <div><span className="text-red-600 font-bold">F:</span> Extreme risk (&gt;20% risk)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-red-900/20 border border-red-700 rounded-lg">
        <h3 className="text-lg font-semibold text-red-400 mb-2">⚠️ Important Disclaimer</h3>
        <p className="text-red-300 text-sm">
          Leveraged trading involves significant risk and may not be suitable for all investors. 
          The scenarios shown are for educational purposes only and do not constitute financial advice. 
          Past performance does not guarantee future results. Always do your own research and consider 
          your risk tolerance before trading with leverage. You can lose more than your initial investment.
        </p>
      </div>
    </div>
  );
};

export default LeveragedScenarios;