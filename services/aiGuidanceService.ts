import type { ChartDataPoint } from '../types';

interface MarketAnalysis {
  trend: 'bullish' | 'bearish' | 'sideways';
  strength: 'strong' | 'moderate' | 'weak';
  confidence: number; // 0-100
  keyLevels: {
    support: number[];
    resistance: number[];
  };
  indicators: {
    rsi: number | null;
    sma20: number | null;
    sma50: number | null;
    volume: string;
  };
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  timeHorizon: 'short' | 'medium' | 'long';
}

interface TradingScenario {
  action: 'BUY' | 'SELL' | 'HOLD';
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskReward: number;
  confidence: number;
  reasoning: string;
}

interface TradingGuidance {
  analysis: MarketAnalysis;
  actionableInsights: string[];
  nextSteps: string[];
  warnings: string[];
  opportunities: string[];
  tradingScenarios: TradingScenario[];
}

/**
 * Analyze market data and provide intelligent guidance
 */
export function analyzeMarketData(
  data: ChartDataPoint[],
  symbol: string,
  userPrompt: string
): TradingGuidance {
  try {
    console.log(`Analyzing market data for ${symbol} with ${data.length} data points`);
    
    // Calculate technical indicators
    const indicators = calculateTechnicalIndicators(data);
    
    // Determine market trend
    const trend = determineTrend(data, indicators);
    
    // Identify key levels
    const keyLevels = identifyKeyLevels(data);
    
    // Assess risk level
    const riskLevel = assessRiskLevel(data, indicators);
    
    // Generate recommendations based on user prompt and data
    const recommendations = generateRecommendations(data, indicators, trend, userPrompt, symbol);
    
    // Create actionable insights
    const actionableInsights = generateActionableInsights(data, indicators, trend, userPrompt);
    
    // Generate next steps
    const nextSteps = generateNextSteps(data, indicators, trend, userPrompt);
    
    // Identify warnings
    const warnings = generateWarnings(data, indicators, trend);
    
    // Identify opportunities
    const opportunities = generateOpportunities(data, indicators, trend, userPrompt);
    
    // Generate trading scenarios with stop-loss and take-profit levels
    const tradingScenarios = generateTradingScenarios(data, indicators, trend, keyLevels, userPrompt);
    
    const analysis: MarketAnalysis = {
      trend: trend.direction,
      strength: trend.strength,
      confidence: trend.confidence,
      keyLevels,
      indicators,
      recommendations,
      riskLevel,
      timeHorizon: determineTimeHorizon(userPrompt)
    };
    
    return {
      analysis,
      actionableInsights,
      nextSteps,
      warnings,
      opportunities,
      tradingScenarios
    };
    
  } catch (error) {
    console.error('Error analyzing market data:', error);
    return createFallbackGuidance(symbol, userPrompt);
  }
}

/**
 * Calculate technical indicators from chart data
 */
function calculateTechnicalIndicators(data: ChartDataPoint[]): {
  rsi: number | null;
  sma20: number | null;
  sma50: number | null;
  volume: string;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
} {
  if (data.length === 0) {
    return {
      rsi: null,
      sma20: null,
      sma50: null,
      volume: '0',
      currentPrice: 0,
      priceChange: 0,
      priceChangePercent: 0
    };
  }
  
  const currentPrice = data[data.length - 1].close;
  const previousPrice = data[data.length - 2]?.close || currentPrice;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = (priceChange / previousPrice) * 100;
  
  // Calculate RSI
  const rsi = calculateRSI(data, 14);
  
  // Calculate SMAs
  const sma20 = calculateSMA(data, 20);
  const sma50 = calculateSMA(data, 50);
  
  return {
    rsi,
    sma20,
    sma50,
    volume: data[data.length - 1].volume,
    currentPrice,
    priceChange,
    priceChangePercent
  };
}

/**
 * Calculate RSI (Relative Strength Index)
 */
function calculateRSI(data: ChartDataPoint[], period: number): number | null {
  if (data.length < period + 1) return null;
  
  const prices = data.map(d => d.close);
  let gains = 0;
  let losses = 0;
  
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }
  
  const avgGain = gains / period;
  const avgLoss = losses / period;
  
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate Simple Moving Average
 */
function calculateSMA(data: ChartDataPoint[], period: number): number | null {
  if (data.length < period) return null;
  
  const recentData = data.slice(-period);
  const sum = recentData.reduce((acc, d) => acc + d.close, 0);
  return sum / period;
}

/**
 * Determine market trend
 */
function determineTrend(data: ChartDataPoint[], indicators: any): {
  direction: 'bullish' | 'bearish' | 'sideways';
  strength: 'strong' | 'moderate' | 'weak';
  confidence: number;
} {
  const currentPrice = indicators.currentPrice;
  const sma20 = indicators.sma20;
  const sma50 = indicators.sma50;
  const rsi = indicators.rsi;
  const priceChangePercent = indicators.priceChangePercent;
  
  let bullishSignals = 0;
  let bearishSignals = 0;
  let totalSignals = 0;
  
  // Price vs SMAs
  if (sma20 && sma50) {
    totalSignals += 2;
    if (currentPrice > sma20 && sma20 > sma50) {
      bullishSignals += 2;
    } else if (currentPrice < sma20 && sma20 < sma50) {
      bearishSignals += 2;
    }
  }
  
  // RSI analysis
  if (rsi) {
    totalSignals += 1;
    if (rsi > 50 && rsi < 70) {
      bullishSignals += 1;
    } else if (rsi < 50 && rsi > 30) {
      bearishSignals += 1;
    }
  }
  
  // Price momentum
  totalSignals += 1;
  if (priceChangePercent > 2) {
    bullishSignals += 1;
  } else if (priceChangePercent < -2) {
    bearishSignals += 1;
  }
  
  // Recent price action
  if (data.length >= 5) {
    const recentPrices = data.slice(-5).map(d => d.close);
    const recentTrend = recentPrices[recentPrices.length - 1] - recentPrices[0];
    totalSignals += 1;
    
    if (recentTrend > 0) {
      bullishSignals += 1;
    } else {
      bearishSignals += 1;
    }
  }
  
  const bullishRatio = bullishSignals / totalSignals;
  const bearishRatio = bearishSignals / totalSignals;
  
  let direction: 'bullish' | 'bearish' | 'sideways';
  let strength: 'strong' | 'moderate' | 'weak';
  let confidence: number;
  
  if (bullishRatio > 0.6) {
    direction = 'bullish';
    confidence = Math.round(bullishRatio * 100);
  } else if (bearishRatio > 0.6) {
    direction = 'bearish';
    confidence = Math.round(bearishRatio * 100);
  } else {
    direction = 'sideways';
    confidence = Math.round(Math.max(bullishRatio, bearishRatio) * 100);
  }
  
  if (confidence > 80) {
    strength = 'strong';
  } else if (confidence > 60) {
    strength = 'moderate';
  } else {
    strength = 'weak';
  }
  
  return { direction, strength, confidence };
}

/**
 * Identify key support and resistance levels
 */
function identifyKeyLevels(data: ChartDataPoint[]): {
  support: number[];
  resistance: number[];
} {
  if (data.length < 20) {
    return { support: [], resistance: [] };
  }
  
  const prices = data.map(d => d.close);
  const highs = data.map(d => d.high);
  const lows = data.map(d => d.low);
  
  // Find recent highs and lows
  const recentHighs = highs.slice(-20);
  const recentLows = lows.slice(-20);
  
  const maxHigh = Math.max(...recentHighs);
  const minLow = Math.min(...recentLows);
  const currentPrice = prices[prices.length - 1];
  
  // Calculate support and resistance levels
  const support = [
    minLow,
    currentPrice * 0.95, // 5% below current price
    currentPrice * 0.90  // 10% below current price
  ].filter(level => level < currentPrice);
  
  const resistance = [
    maxHigh,
    currentPrice * 1.05, // 5% above current price
    currentPrice * 1.10  // 10% above current price
  ].filter(level => level > currentPrice);
  
  return { support, resistance };
}

/**
 * Assess risk level
 */
function assessRiskLevel(data: ChartDataPoint[], indicators: any): 'low' | 'medium' | 'high' {
  const rsi = indicators.rsi;
  const priceChangePercent = Math.abs(indicators.priceChangePercent);
  const volume = indicators.volume;
  
  let riskScore = 0;
  
  // RSI extremes indicate high risk
  if (rsi && (rsi > 80 || rsi < 20)) {
    riskScore += 3;
  }
  
  // High volatility indicates high risk
  if (priceChangePercent > 10) {
    riskScore += 3;
  } else if (priceChangePercent > 5) {
    riskScore += 2;
  } else if (priceChangePercent > 2) {
    riskScore += 1;
  }
  
  // Low volume indicates higher risk
  if (volume.includes('K') && parseFloat(volume) < 100) {
    riskScore += 2;
  }
  
  if (riskScore >= 5) return 'high';
  if (riskScore >= 3) return 'medium';
  return 'low';
}

/**
 * Generate recommendations based on analysis
 */
function generateRecommendations(
  data: ChartDataPoint[],
  indicators: any,
  trend: any,
  userPrompt: string,
  symbol: string
): string[] {
  const recommendations: string[] = [];
  const currentPrice = indicators.currentPrice;
  const rsi = indicators.rsi;
  const sma20 = indicators.sma20;
  const sma50 = indicators.sma50;
  
  // Analyze user intent from prompt
  const isAskingAboutBuying = /buy|purchase|long|bullish/i.test(userPrompt);
  const isAskingAboutSelling = /sell|short|bearish/i.test(userPrompt);
  const isAskingAboutHolding = /hold|keep|maintain/i.test(userPrompt);
  const isAskingAboutEntry = /enter|entry|when to/i.test(userPrompt);
  const isAskingAboutExit = /exit|stop|take profit/i.test(userPrompt);
  
  // Trend-based recommendations
  if (trend.direction === 'bullish' && trend.strength === 'strong') {
    if (isAskingAboutBuying || isAskingAboutEntry) {
      recommendations.push(`🟢 Strong bullish trend detected. Consider entering long position on ${symbol}`);
    }
    if (isAskingAboutSelling) {
      recommendations.push(`⚠️ Current bullish momentum suggests holding or waiting for better entry`);
    }
  } else if (trend.direction === 'bearish' && trend.strength === 'strong') {
    if (isAskingAboutSelling || isAskingAboutEntry) {
      recommendations.push(`🔴 Strong bearish trend detected. Consider short position or wait for reversal`);
    }
    if (isAskingAboutBuying) {
      recommendations.push(`⚠️ Current bearish momentum suggests waiting for better entry point`);
    }
  }
  
  // RSI-based recommendations
  if (rsi) {
    if (rsi > 70) {
      recommendations.push(`📊 RSI at ${rsi.toFixed(1)} indicates overbought conditions - consider taking profits`);
    } else if (rsi < 30) {
      recommendations.push(`📊 RSI at ${rsi.toFixed(1)} indicates oversold conditions - potential buying opportunity`);
    }
  }
  
  // Moving average recommendations
  if (sma20 && sma50) {
    if (currentPrice > sma20 && sma20 > sma50) {
      recommendations.push(`📈 Price above both SMAs (20 & 50) - bullish alignment confirmed`);
    } else if (currentPrice < sma20 && sma20 < sma50) {
      recommendations.push(`📉 Price below both SMAs (20 & 50) - bearish alignment confirmed`);
    }
  }
  
  // Risk-based recommendations
  if (trend.confidence < 60) {
    recommendations.push(`⚠️ Low confidence in trend direction - consider smaller position size`);
  }
  
  return recommendations;
}

/**
 * Generate actionable insights
 */
function generateActionableInsights(
  data: ChartDataPoint[],
  indicators: any,
  trend: any,
  userPrompt: string
): string[] {
  const insights: string[] = [];
  const currentPrice = indicators.currentPrice;
  const priceChangePercent = indicators.priceChangePercent;
  
  // Price action insights
  if (Math.abs(priceChangePercent) > 5) {
    insights.push(`💰 Significant price movement: ${priceChangePercent > 0 ? '+' : ''}${priceChangePercent.toFixed(2)}% in recent session`);
  }
  
  // Volume insights
  const volume = indicators.volume;
  if (volume.includes('M') || volume.includes('B')) {
    insights.push(`📊 High volume activity detected: ${volume} - indicates strong market interest`);
  }
  
  // Trend insights
  if (trend.strength === 'strong') {
    insights.push(`🎯 Strong ${trend.direction} trend with ${trend.confidence}% confidence`);
  }
  
  // Technical level insights
  if (data.length > 0) {
    const recentHigh = Math.max(...data.slice(-10).map(d => d.high));
    const recentLow = Math.min(...data.slice(-10).map(d => d.low));
    
    if (currentPrice > recentHigh * 0.98) {
      insights.push(`🚀 Price approaching recent high of $${recentHigh.toFixed(2)}`);
    } else if (currentPrice < recentLow * 1.02) {
      insights.push(`📉 Price near recent low of $${recentLow.toFixed(2)}`);
    }
  }
  
  return insights;
}

/**
 * Generate next steps
 */
function generateNextSteps(
  data: ChartDataPoint[],
  indicators: any,
  trend: any,
  userPrompt: string
): string[] {
  const steps: string[] = [];
  
  // Always include basic next steps
  steps.push(`📊 Monitor price action around current level: $${indicators.currentPrice.toFixed(2)}`);
  
  if (trend.direction === 'bullish') {
    steps.push(`📈 Watch for continuation above key resistance levels`);
    steps.push(`🛡️ Set stop-loss below recent support levels`);
  } else if (trend.direction === 'bearish') {
    steps.push(`📉 Watch for breakdown below key support levels`);
    steps.push(`🛡️ Set stop-loss above recent resistance levels`);
  } else {
    steps.push(`↔️ Monitor for breakout from current range`);
    steps.push(`🎯 Wait for clear directional signal`);
  }
  
  // RSI-based next steps
  if (indicators.rsi) {
    if (indicators.rsi > 70) {
      steps.push(`⚠️ Watch for RSI divergence or reversal signals`);
    } else if (indicators.rsi < 30) {
      steps.push(`🔄 Look for RSI bounce or reversal confirmation`);
    }
  }
  
  return steps;
}

/**
 * Generate warnings
 */
function generateWarnings(
  data: ChartDataPoint[],
  indicators: any,
  trend: any
): string[] {
  const warnings: string[] = [];
  
  // High volatility warning
  if (Math.abs(indicators.priceChangePercent) > 10) {
    warnings.push(`⚠️ High volatility detected - consider smaller position sizes`);
  }
  
  // RSI extreme warnings
  if (indicators.rsi && (indicators.rsi > 80 || indicators.rsi < 20)) {
    warnings.push(`🚨 RSI at extreme levels (${indicators.rsi.toFixed(1)}) - reversal risk high`);
  }
  
  // Low confidence warning
  if (trend.confidence < 50) {
    warnings.push(`⚠️ Low trend confidence (${trend.confidence}%) - market direction unclear`);
  }
  
  // Volume warning
  const volume = indicators.volume;
  if (volume.includes('K') && parseFloat(volume) < 50) {
    warnings.push(`📉 Low volume activity - price movements may be less reliable`);
  }
  
  return warnings;
}

/**
 * Generate opportunities
 */
function generateOpportunities(
  data: ChartDataPoint[],
  indicators: any,
  trend: any,
  userPrompt: string
): string[] {
  const opportunities: string[] = [];
  
  // RSI opportunities
  if (indicators.rsi) {
    if (indicators.rsi < 35 && trend.direction === 'bullish') {
      opportunities.push(`🟢 Oversold bounce opportunity in bullish trend`);
    } else if (indicators.rsi > 65 && trend.direction === 'bearish') {
      opportunities.push(`🔴 Overbought rejection opportunity in bearish trend`);
    }
  }
  
  // Moving average opportunities
  if (indicators.sma20 && indicators.sma50) {
    const currentPrice = indicators.currentPrice;
    if (currentPrice < indicators.sma20 && indicators.sma20 > indicators.sma50) {
      opportunities.push(`📈 Potential bounce from SMA20 support`);
    } else if (currentPrice > indicators.sma20 && indicators.sma20 < indicators.sma50) {
      opportunities.push(`📉 Potential rejection from SMA20 resistance`);
    }
  }
  
  // Trend continuation opportunities
  if (trend.strength === 'strong' && trend.confidence > 70) {
    opportunities.push(`🎯 Strong trend continuation opportunity`);
  }
  
  return opportunities;
}

/**
 * Determine time horizon from user prompt
 */
function determineTimeHorizon(userPrompt: string): 'short' | 'medium' | 'long' {
  if (/day|hour|intraday|scalp/i.test(userPrompt)) return 'short';
  if (/week|month|swing/i.test(userPrompt)) return 'medium';
  if (/year|long term|hold/i.test(userPrompt)) return 'long';
  return 'medium'; // default
}

/**
 * Generate trading scenarios with specific entry, stop-loss, and take-profit levels
 */
function generateTradingScenarios(
  data: ChartDataPoint[],
  indicators: any,
  trend: any,
  keyLevels: any,
  userPrompt: string
): TradingScenario[] {
  const scenarios: TradingScenario[] = [];
  const currentPrice = indicators.currentPrice;
  const rsi = indicators.rsi;
  const sma20 = indicators.sma20;
  const sma50 = indicators.sma50;
  
  if (!currentPrice || currentPrice <= 0) {
    return scenarios;
  }
  
  // Analyze user intent
  const isAskingAboutBuying = /buy|purchase|long|bullish|enter/i.test(userPrompt);
  const isAskingAboutSelling = /sell|short|bearish|exit/i.test(userPrompt);
  const isAskingAboutHolding = /hold|keep|maintain/i.test(userPrompt);
  
  // Scenario 1: Bullish Setup
  if (trend.direction === 'bullish' || isAskingAboutBuying) {
    const bullishScenario = createBullishScenario(currentPrice, indicators, trend, keyLevels, rsi, sma20, sma50);
    if (bullishScenario) {
      scenarios.push(bullishScenario);
    }
  }
  
  // Scenario 2: Bearish Setup
  if (trend.direction === 'bearish' || isAskingAboutSelling) {
    const bearishScenario = createBearishScenario(currentPrice, indicators, trend, keyLevels, rsi, sma20, sma50);
    if (bearishScenario) {
      scenarios.push(bearishScenario);
    }
  }
  
  // Scenario 3: RSI-based Reversal Setup
  if (rsi) {
    if (rsi < 30 && trend.direction !== 'bearish') {
      const oversoldScenario = createOversoldBounceScenario(currentPrice, indicators, keyLevels, rsi);
      if (oversoldScenario) {
        scenarios.push(oversoldScenario);
      }
    } else if (rsi > 70 && trend.direction !== 'bullish') {
      const overboughtScenario = createOverboughtRejectionScenario(currentPrice, indicators, keyLevels, rsi);
      if (overboughtScenario) {
        scenarios.push(overboughtScenario);
      }
    }
  }
  
  // Scenario 4: Moving Average Bounce Setup
  if (sma20 && sma50) {
    if (currentPrice < sma20 && sma20 > sma50) {
      const maBounceScenario = createMovingAverageBounceScenario(currentPrice, indicators, sma20, sma50);
      if (maBounceScenario) {
        scenarios.push(maBounceScenario);
      }
    }
  }
  
  // If no specific scenarios, provide a neutral hold scenario
  if (scenarios.length === 0 && (isAskingAboutHolding || trend.direction === 'sideways')) {
    scenarios.push(createHoldScenario(currentPrice, indicators, trend));
  }
  
  return scenarios;
}

/**
 * Create bullish trading scenario
 */
function createBullishScenario(
  currentPrice: number,
  indicators: any,
  trend: any,
  keyLevels: any,
  rsi: number | null,
  sma20: number | null,
  sma50: number | null
): TradingScenario | null {
  const entryPrice = currentPrice;
  
  // Calculate stop loss (2-3% below current price or below key support)
  let stopLoss = currentPrice * 0.97; // 3% stop loss
  if (keyLevels.support.length > 0) {
    const nearestSupport = Math.max(...keyLevels.support.filter((s: number) => s < currentPrice));
    stopLoss = Math.max(stopLoss, nearestSupport * 0.98); // 2% below support
  }
  
  // Calculate take profit levels
  const takeProfit1 = currentPrice * 1.05; // 5% profit
  const takeProfit2 = currentPrice * 1.10; // 10% profit
  
  // Calculate risk-reward ratio
  const risk = entryPrice - stopLoss;
  const reward = takeProfit1 - entryPrice;
  const riskReward = reward / risk;
  
  // Determine confidence based on trend strength and indicators
  let confidence = trend.confidence;
  if (rsi && rsi < 70) confidence += 10; // Not overbought
  if (sma20 && sma50 && currentPrice > sma20 && sma20 > sma50) confidence += 15; // MA alignment
  
  confidence = Math.min(confidence, 95);
  
  // Generate reasoning
  let reasoning = `Bullish trend detected with ${trend.confidence}% confidence. `;
  if (rsi && rsi < 70) reasoning += `RSI at ${rsi.toFixed(1)} shows room for upside. `;
  if (sma20 && sma50 && currentPrice > sma20 && sma20 > sma50) {
    reasoning += `Price above both SMAs confirms bullish alignment. `;
  }
  reasoning += `Risk-reward ratio of ${riskReward.toFixed(1)}:1 is favorable.`;
  
  return {
    action: 'BUY',
    entryPrice: Number(entryPrice.toFixed(8)),
    stopLoss: Number(stopLoss.toFixed(8)),
    takeProfit1: Number(takeProfit1.toFixed(8)),
    takeProfit2: Number(takeProfit2.toFixed(8)),
    riskReward: Number(riskReward.toFixed(2)),
    confidence: Math.round(confidence),
    reasoning
  };
}

/**
 * Create bearish trading scenario
 */
function createBearishScenario(
  currentPrice: number,
  indicators: any,
  trend: any,
  keyLevels: any,
  rsi: number | null,
  sma20: number | null,
  sma50: number | null
): TradingScenario | null {
  const entryPrice = currentPrice;
  
  // Calculate stop loss (2-3% above current price or above key resistance)
  let stopLoss = currentPrice * 1.03; // 3% stop loss
  if (keyLevels.resistance.length > 0) {
    const nearestResistance = Math.min(...keyLevels.resistance.filter((r: number) => r > currentPrice));
    stopLoss = Math.min(stopLoss, nearestResistance * 1.02); // 2% above resistance
  }
  
  // Calculate take profit levels
  const takeProfit1 = currentPrice * 0.95; // 5% profit
  const takeProfit2 = currentPrice * 0.90; // 10% profit
  
  // Calculate risk-reward ratio
  const risk = stopLoss - entryPrice;
  const reward = entryPrice - takeProfit1;
  const riskReward = reward / risk;
  
  // Determine confidence based on trend strength and indicators
  let confidence = trend.confidence;
  if (rsi && rsi > 30) confidence += 10; // Not oversold
  if (sma20 && sma50 && currentPrice < sma20 && sma20 < sma50) confidence += 15; // MA alignment
  
  confidence = Math.min(confidence, 95);
  
  // Generate reasoning
  let reasoning = `Bearish trend detected with ${trend.confidence}% confidence. `;
  if (rsi && rsi > 30) reasoning += `RSI at ${rsi.toFixed(1)} shows room for downside. `;
  if (sma20 && sma50 && currentPrice < sma20 && sma20 < sma50) {
    reasoning += `Price below both SMAs confirms bearish alignment. `;
  }
  reasoning += `Risk-reward ratio of ${riskReward.toFixed(1)}:1 is favorable.`;
  
  return {
    action: 'SELL',
    entryPrice: Number(entryPrice.toFixed(8)),
    stopLoss: Number(stopLoss.toFixed(8)),
    takeProfit1: Number(takeProfit1.toFixed(8)),
    takeProfit2: Number(takeProfit2.toFixed(8)),
    riskReward: Number(riskReward.toFixed(2)),
    confidence: Math.round(confidence),
    reasoning
  };
}

/**
 * Create oversold bounce scenario
 */
function createOversoldBounceScenario(
  currentPrice: number,
  indicators: any,
  keyLevels: any,
  rsi: number
): TradingScenario | null {
  const entryPrice = currentPrice;
  const stopLoss = currentPrice * 0.95; // 5% stop loss
  const takeProfit1 = currentPrice * 1.08; // 8% profit
  const takeProfit2 = currentPrice * 1.15; // 15% profit
  
  const risk = entryPrice - stopLoss;
  const reward = takeProfit1 - entryPrice;
  const riskReward = reward / risk;
  
  const confidence = Math.min(75 + (30 - rsi), 90); // Higher confidence for more oversold
  
  const reasoning = `RSI at ${rsi.toFixed(1)} indicates oversold conditions. ` +
    `Historical data shows bounces from these levels. ` +
    `Risk-reward ratio of ${riskReward.toFixed(1)}:1 is excellent for a reversal play.`;
  
  return {
    action: 'BUY',
    entryPrice: Number(entryPrice.toFixed(8)),
    stopLoss: Number(stopLoss.toFixed(8)),
    takeProfit1: Number(takeProfit1.toFixed(8)),
    takeProfit2: Number(takeProfit2.toFixed(8)),
    riskReward: Number(riskReward.toFixed(2)),
    confidence: Math.round(confidence),
    reasoning
  };
}

/**
 * Create overbought rejection scenario
 */
function createOverboughtRejectionScenario(
  currentPrice: number,
  indicators: any,
  keyLevels: any,
  rsi: number
): TradingScenario | null {
  const entryPrice = currentPrice;
  const stopLoss = currentPrice * 1.05; // 5% stop loss
  const takeProfit1 = currentPrice * 0.92; // 8% profit
  const takeProfit2 = currentPrice * 0.85; // 15% profit
  
  const risk = stopLoss - entryPrice;
  const reward = entryPrice - takeProfit1;
  const riskReward = reward / risk;
  
  const confidence = Math.min(75 + (rsi - 70), 90); // Higher confidence for more overbought
  
  const reasoning = `RSI at ${rsi.toFixed(1)} indicates overbought conditions. ` +
    `Historical data shows rejections from these levels. ` +
    `Risk-reward ratio of ${riskReward.toFixed(1)}:1 is excellent for a reversal play.`;
  
  return {
    action: 'SELL',
    entryPrice: Number(entryPrice.toFixed(8)),
    stopLoss: Number(stopLoss.toFixed(8)),
    takeProfit1: Number(takeProfit1.toFixed(8)),
    takeProfit2: Number(takeProfit2.toFixed(8)),
    riskReward: Number(riskReward.toFixed(2)),
    confidence: Math.round(confidence),
    reasoning
  };
}

/**
 * Create moving average bounce scenario
 */
function createMovingAverageBounceScenario(
  currentPrice: number,
  indicators: any,
  sma20: number,
  sma50: number
): TradingScenario | null {
  const entryPrice = currentPrice;
  const stopLoss = sma50 * 0.98; // 2% below SMA50
  const takeProfit1 = sma20 * 1.02; // 2% above SMA20
  const takeProfit2 = sma20 * 1.05; // 5% above SMA20
  
  const risk = entryPrice - stopLoss;
  const reward = takeProfit1 - entryPrice;
  const riskReward = reward / risk;
  
  const confidence = 70; // Moderate confidence for MA bounce
  
  const reasoning = `Price near SMA50 support with SMA20 above, creating potential bounce setup. ` +
    `Target SMA20 resistance. Risk-reward ratio of ${riskReward.toFixed(1)}:1 is good.`;
  
  return {
    action: 'BUY',
    entryPrice: Number(entryPrice.toFixed(8)),
    stopLoss: Number(stopLoss.toFixed(8)),
    takeProfit1: Number(takeProfit1.toFixed(8)),
    takeProfit2: Number(takeProfit2.toFixed(8)),
    riskReward: Number(riskReward.toFixed(2)),
    confidence: Math.round(confidence),
    reasoning
  };
}

/**
 * Create hold scenario
 */
function createHoldScenario(
  currentPrice: number,
  indicators: any,
  trend: any
): TradingScenario {
  const entryPrice = currentPrice;
  const stopLoss = currentPrice * 0.90; // 10% stop loss
  const takeProfit1 = currentPrice * 1.10; // 10% take profit
  const takeProfit2 = currentPrice * 1.20; // 20% take profit
  
  const risk = entryPrice - stopLoss;
  const reward = takeProfit1 - entryPrice;
  const riskReward = reward / risk;
  
  const reasoning = `Market showing sideways movement with ${trend.confidence}% confidence. ` +
    `Hold current position and wait for clearer directional signal. ` +
    `Risk-reward ratio of ${riskReward.toFixed(1)}:1 is balanced.`;
  
  return {
    action: 'HOLD',
    entryPrice: Number(entryPrice.toFixed(8)),
    stopLoss: Number(stopLoss.toFixed(8)),
    takeProfit1: Number(takeProfit1.toFixed(8)),
    takeProfit2: Number(takeProfit2.toFixed(8)),
    riskReward: Number(riskReward.toFixed(2)),
    confidence: Math.round(trend.confidence),
    reasoning
  };
}

/**
 * Create fallback guidance when analysis fails
 */
function createFallbackGuidance(symbol: string, userPrompt: string): TradingGuidance {
  return {
    analysis: {
      trend: 'sideways',
      strength: 'weak',
      confidence: 0,
      keyLevels: { support: [], resistance: [] },
      indicators: { rsi: null, sma20: null, sma50: null, volume: '0' },
      recommendations: ['Unable to analyze data - please check your input'],
      riskLevel: 'medium',
      timeHorizon: 'medium'
    },
    actionableInsights: ['Data analysis failed - please verify your TradingView data'],
    nextSteps: ['Check your data input and try again'],
    warnings: ['Unable to provide analysis due to data issues'],
    opportunities: [],
    tradingScenarios: []
  };
}