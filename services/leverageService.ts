import type { ChartDataPoint, LeveragedScenario, LeverageAnalysis } from '../types';

/**
 * Calculate market volatility from historical data
 */
function calculateVolatility(data: ChartDataPoint[]): number {
  if (data.length < 2) return 0.05; // Default 5% volatility
  
  const returns: number[] = [];
  for (let i = 1; i < data.length; i++) {
    const returnRate = (data[i].close - data[i-1].close) / data[i-1].close;
    returns.push(returnRate);
  }
  
  // Calculate standard deviation of returns
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);
  
  return Math.max(0.01, Math.min(0.5, volatility)); // Clamp between 1% and 50%
}

/**
 * Calculate trend direction from recent price data
 */
function calculateTrend(data: ChartDataPoint[]): 'bullish' | 'bearish' | 'sideways' {
  if (data.length < 10) return 'sideways';
  
  const recent = data.slice(-10);
  const first = recent[0].close;
  const last = recent[recent.length - 1].close;
  const change = (last - first) / first;
  
  if (change > 0.05) return 'bullish';
  if (change < -0.05) return 'bearish';
  return 'sideways';
}

/**
 * Calculate support and resistance levels
 */
function calculateSupportResistance(data: ChartDataPoint[]): { support: number; resistance: number } {
  if (data.length < 20) {
    const current = data[data.length - 1]?.close || 100;
    return { support: current * 0.9, resistance: current * 1.1 };
  }
  
  const recent = data.slice(-20);
  const lows = recent.map(d => d.low);
  const highs = recent.map(d => d.high);
  
  const support = Math.min(...lows);
  const resistance = Math.max(...highs);
  
  return { support, resistance };
}

/**
 * Calculate success probability based on technical analysis
 */
function calculateSuccessProbability(
  leverage: number,
  direction: 'long' | 'short',
  entryPrice: number,
  stopLoss: number,
  takeProfit: number,
  volatility: number,
  trend: 'bullish' | 'bearish' | 'sideways',
  support: number,
  resistance: number
): number {
  // Base success rate starts at 50%
  let successRate = 0.5;
  
  // Adjust based on trend alignment
  if (direction === 'long' && trend === 'bullish') {
    successRate += 0.15;
  } else if (direction === 'short' && trend === 'bearish') {
    successRate += 0.15;
  } else if (trend === 'sideways') {
    successRate -= 0.05;
  } else {
    successRate -= 0.1; // Counter-trend
  }
  
  // Adjust based on leverage (higher leverage = higher risk)
  const leveragePenalty = Math.min(0.2, (leverage - 1) * 0.02);
  successRate -= leveragePenalty;
  
  // Adjust based on volatility (higher volatility = lower success rate)
  const volatilityPenalty = Math.min(0.15, volatility * 2);
  successRate -= volatilityPenalty;
  
  // Adjust based on risk-reward ratio
  const riskRewardRatio = Math.abs(takeProfit - entryPrice) / Math.abs(entryPrice - stopLoss);
  if (riskRewardRatio > 2) {
    successRate += 0.1;
  } else if (riskRewardRatio < 1) {
    successRate -= 0.1;
  }
  
  // Adjust based on support/resistance levels
  if (direction === 'long' && entryPrice > support * 1.02) {
    successRate += 0.05; // Above support
  }
  if (direction === 'short' && entryPrice < resistance * 0.98) {
    successRate += 0.05; // Below resistance
  }
  
  // Clamp between 10% and 90%
  return Math.max(0.1, Math.min(0.9, successRate));
}

/**
 * Calculate liquidation price for leveraged position
 */
function calculateLiquidationPrice(
  entryPrice: number,
  leverage: number,
  direction: 'long' | 'short',
  marginBuffer: number = 0.1
): number {
  const marginRatio = 1 / leverage;
  const liquidationMargin = marginRatio - marginBuffer;
  
  if (direction === 'long') {
    return entryPrice * (1 - liquidationMargin);
  } else {
    return entryPrice * (1 + liquidationMargin);
  }
}

/**
 * Calculate optimal stop loss based on volatility and leverage
 */
function calculateOptimalStopLoss(
  entryPrice: number,
  leverage: number,
  volatility: number,
  direction: 'long' | 'short'
): number {
  // Base stop loss at 2x daily volatility
  const baseStopDistance = entryPrice * volatility * 2;
  
  // Adjust for leverage (higher leverage = tighter stop)
  const leverageAdjustment = Math.min(0.5, leverage / 20);
  const stopDistance = baseStopDistance * (1 - leverageAdjustment);
  
  if (direction === 'long') {
    return entryPrice - stopDistance;
  } else {
    return entryPrice + stopDistance;
  }
}

/**
 * Calculate take profit based on risk-reward ratio
 */
function calculateTakeProfit(
  entryPrice: number,
  stopLoss: number,
  riskRewardRatio: number,
  direction: 'long' | 'short'
): number {
  const riskDistance = Math.abs(entryPrice - stopLoss);
  const rewardDistance = riskDistance * riskRewardRatio;
  
  if (direction === 'long') {
    return entryPrice + rewardDistance;
  } else {
    return entryPrice - rewardDistance;
  }
}

/**
 * Generate leveraged trading scenarios
 */
export function generateLeveragedScenarios(
  symbol: string,
  currentPrice: number,
  chartData: ChartDataPoint[],
  accountBalance: number = 10000
): LeverageAnalysis {
  const volatility = calculateVolatility(chartData);
  const trend = calculateTrend(chartData);
  const { support, resistance } = calculateSupportResistance(chartData);
  
  const leverageLevels = [1, 10, 20, 30, 40, 50, 60];
  const scenarios: LeveragedScenario[] = [];
  
  // Generate scenarios for both long and short positions
  (['long', 'short'] as const).forEach(direction => {
    leverageLevels.forEach(leverage => {
      const entryPrice = currentPrice;
      const stopLoss = calculateOptimalStopLoss(entryPrice, leverage, volatility, direction);
      const takeProfit = calculateTakeProfit(entryPrice, stopLoss, 2, direction);
      
      // Position sizing (risk 2% of account per trade)
      const riskAmount = accountBalance * 0.02;
      const positionSize = riskAmount / Math.abs(entryPrice - stopLoss);
      const marginRequired = (positionSize * entryPrice) / leverage;
      
      // Calculate max loss and gain
      const maxLoss = Math.abs(entryPrice - stopLoss) * positionSize;
      const maxGain = Math.abs(takeProfit - entryPrice) * positionSize;
      const riskRewardRatio = maxGain / maxLoss;
      
      // Calculate liquidation price
      const liquidationPrice = calculateLiquidationPrice(entryPrice, leverage, direction);
      
      // Calculate success probability
      const successChance = calculateSuccessProbability(
        leverage,
        direction,
        entryPrice,
        stopLoss,
        takeProfit,
        volatility,
        trend,
        support,
        resistance
      );
      
      // Determine time horizon based on leverage
      let timeHorizon = '1-3 days';
      if (leverage <= 5) timeHorizon = '1-2 weeks';
      else if (leverage <= 20) timeHorizon = '3-7 days';
      else if (leverage <= 40) timeHorizon = '1-3 days';
      else timeHorizon = 'Hours to 1 day';
      
      scenarios.push({
        leverage,
        entryPrice,
        stopLoss,
        takeProfit,
        positionSize,
        marginRequired,
        maxLoss,
        maxGain,
        successChance,
        riskRewardRatio,
        direction,
        liquidationPrice,
        volatility,
        timeHorizon
      });
    });
  });
  
  // Calculate risk metrics
  const riskMetrics = {
    maxDrawdown: Math.max(...scenarios.map(s => s.maxLoss / accountBalance)),
    sharpeRatio: scenarios.reduce((sum, s) => sum + (s.successChance * s.maxGain - (1 - s.successChance) * s.maxLoss), 0) / scenarios.length / (volatility * accountBalance),
    var95: accountBalance * 0.05, // 5% VaR
    expectedReturn: scenarios.reduce((sum, s) => sum + (s.successChance * s.maxGain - (1 - s.successChance) * s.maxLoss), 0) / scenarios.length
  };
  
  // Generate recommendations
  const bestScenario = scenarios.reduce((best, current) => 
    (current.successChance * current.riskRewardRatio) > (best.successChance * best.riskRewardRatio) ? current : best
  );
  
  const riskLevel = bestScenario.leverage <= 10 ? 'low' : 
                   bestScenario.leverage <= 30 ? 'medium' : 
                   bestScenario.leverage <= 50 ? 'high' : 'extreme';
  
  const warnings: string[] = [];
  if (bestScenario.leverage > 30) {
    warnings.push('High leverage increases liquidation risk significantly');
  }
  if (volatility > 0.1) {
    warnings.push('High market volatility detected - consider tighter stop losses');
  }
  if (bestScenario.successChance < 0.6) {
    warnings.push('Low success probability - consider waiting for better entry');
  }
  if (bestScenario.liquidationPrice > bestScenario.stopLoss * 0.8 && bestScenario.direction === 'long') {
    warnings.push('Liquidation price is close to stop loss - high risk of liquidation');
  }
  
  return {
    symbol,
    currentPrice,
    scenarios,
    marketConditions: {
      volatility,
      trend,
      support,
      resistance
    },
    riskMetrics,
    recommendations: {
      bestLeverage: bestScenario.leverage,
      recommendedStopLoss: bestScenario.stopLoss,
      riskLevel,
      warnings
    }
  };
}

/**
 * Calculate advanced risk metrics for a specific scenario
 */
export function calculateAdvancedRiskMetrics(scenario: LeveragedScenario, accountBalance: number) {
  const positionValue = scenario.positionSize * scenario.entryPrice;
  const marginRatio = scenario.marginRequired / accountBalance;
  const liquidationDistance = Math.abs(scenario.entryPrice - scenario.liquidationPrice) / scenario.entryPrice;
  
  // Calculate Kelly Criterion for optimal position sizing
  const winRate = scenario.successChance;
  const avgWin = scenario.maxGain;
  const avgLoss = scenario.maxLoss;
  const kellyPercentage = winRate > 0 && avgLoss > 0 ? 
    (winRate * avgWin - (1 - winRate) * avgLoss) / avgWin : 0;
  
  // Calculate Sharpe Ratio approximation
  const expectedReturn = (winRate * avgWin - (1 - winRate) * avgLoss) / accountBalance;
  const volatility = scenario.volatility * Math.sqrt(scenario.leverage);
  const sharpeRatio = volatility > 0 ? expectedReturn / volatility : 0;
  
  // Calculate Maximum Adverse Excursion (MAE) and Maximum Favorable Excursion (MFE)
  const mae = scenario.maxLoss / accountBalance; // Maximum loss as percentage
  const mfe = scenario.maxGain / accountBalance; // Maximum gain as percentage
  
  // Calculate Value at Risk (VaR) at 95% confidence
  const var95 = scenario.maxLoss * 1.96; // Simplified VaR calculation
  
  // Calculate Expected Shortfall (Conditional VaR)
  const expectedShortfall = scenario.maxLoss * 2.33; // Simplified ES calculation
  
  // Calculate position heat (risk per trade)
  const positionHeat = scenario.maxLoss / accountBalance;
  
  // Calculate margin efficiency
  const marginEfficiency = scenario.riskRewardRatio / scenario.leverage;
  
  // Determine risk grade
  let riskGrade = 'A';
  if (positionHeat > 0.05) riskGrade = 'B';
  if (positionHeat > 0.1) riskGrade = 'C';
  if (positionHeat > 0.15) riskGrade = 'D';
  if (positionHeat > 0.2) riskGrade = 'F';
  
  return {
    marginRatio,
    liquidationDistance,
    positionValue,
    riskPerTrade: scenario.maxLoss / accountBalance,
    potentialReturn: scenario.maxGain / accountBalance,
    leverageEfficiency: scenario.riskRewardRatio / scenario.leverage,
    timeDecay: scenario.leverage > 30 ? 'High' : scenario.leverage > 10 ? 'Medium' : 'Low',
    kellyPercentage: Math.max(0, Math.min(0.25, kellyPercentage)), // Cap at 25%
    sharpeRatio,
    mae,
    mfe,
    var95,
    expectedShortfall,
    positionHeat,
    marginEfficiency,
    riskGrade,
    // Additional metrics
    breakevenWinRate: avgLoss / (avgWin + avgLoss),
    profitFactor: avgWin * winRate / (avgLoss * (1 - winRate)),
    recoveryFactor: expectedReturn / mae,
    calmarRatio: expectedReturn / mae
  };
}

/**
 * Calculate dynamic stop loss based on market conditions
 */
export function calculateDynamicStopLoss(
  entryPrice: number,
  leverage: number,
  volatility: number,
  direction: 'long' | 'short',
  marketTrend: 'bullish' | 'bearish' | 'sideways',
  atr: number, // Average True Range
  support?: number,
  resistance?: number
): number {
  // Base stop loss calculation
  let stopLoss = calculateOptimalStopLoss(entryPrice, leverage, volatility, direction);
  
  // Adjust based on market trend
  if (direction === 'long' && marketTrend === 'bullish') {
    // Tighter stop for bullish trend
    stopLoss = direction === 'long' ? 
      entryPrice - (atr * 1.5) : 
      entryPrice + (atr * 1.5);
  } else if (direction === 'short' && marketTrend === 'bearish') {
    // Tighter stop for bearish trend
    stopLoss = direction === 'long' ? 
      entryPrice - (atr * 1.5) : 
      entryPrice + (atr * 1.5);
  } else if (marketTrend === 'sideways') {
    // Wider stop for sideways market
    stopLoss = direction === 'long' ? 
      entryPrice - (atr * 3) : 
      entryPrice + (atr * 3);
  }
  
  // Adjust based on support/resistance levels
  if (direction === 'long' && support) {
    const supportDistance = Math.abs(entryPrice - support);
    const currentStopDistance = Math.abs(entryPrice - stopLoss);
    if (supportDistance < currentStopDistance && support < entryPrice) {
      stopLoss = support * 0.98; // 2% below support
    }
  }
  
  if (direction === 'short' && resistance) {
    const resistanceDistance = Math.abs(entryPrice - resistance);
    const currentStopDistance = Math.abs(entryPrice - stopLoss);
    if (resistanceDistance < currentStopDistance && resistance > entryPrice) {
      stopLoss = resistance * 1.02; // 2% above resistance
    }
  }
  
  // Ensure stop loss is not too close to entry (minimum 0.5% distance)
  const minDistance = entryPrice * 0.005;
  if (direction === 'long' && (entryPrice - stopLoss) < minDistance) {
    stopLoss = entryPrice - minDistance;
  } else if (direction === 'short' && (stopLoss - entryPrice) < minDistance) {
    stopLoss = entryPrice + minDistance;
  }
  
  return stopLoss;
}

/**
 * Calculate position sizing based on risk management rules
 */
export function calculateOptimalPositionSize(
  accountBalance: number,
  riskPerTrade: number, // Percentage of account to risk
  entryPrice: number,
  stopLoss: number,
  leverage: number
): number {
  const riskAmount = accountBalance * riskPerTrade;
  const priceRisk = Math.abs(entryPrice - stopLoss);
  const positionSize = riskAmount / priceRisk;
  
  // Check if position size exceeds available margin
  const requiredMargin = (positionSize * entryPrice) / leverage;
  const maxPositionSize = (accountBalance * 0.95) / (entryPrice / leverage); // Use 95% of balance
  
  return Math.min(positionSize, maxPositionSize);
}

/**
 * Calculate trailing stop loss levels
 */
export function calculateTrailingStopLevels(
  entryPrice: number,
  currentPrice: number,
  direction: 'long' | 'short',
  atr: number,
  trailMultiplier: number = 2
): number {
  const trailDistance = atr * trailMultiplier;
  
  if (direction === 'long') {
    return currentPrice - trailDistance;
  } else {
    return currentPrice + trailDistance;
  }
}

/**
 * Calculate portfolio heat (total risk across all positions)
 */
export function calculatePortfolioHeat(scenarios: LeveragedScenario[], accountBalance: number): number {
  const totalRisk = scenarios.reduce((sum, scenario) => sum + scenario.maxLoss, 0);
  return totalRisk / accountBalance;
}