
export interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: string;
  sma20?: number;
  sma50?: number;
  rsi?: number;
  volumeNum?: number;
}

export interface AnalysisResult {
  analysis: string;
  prompt: string;
  sources?: { uri: string; title: string; }[];
  chartData?: ChartDataPoint[];
  strategy?: string;
  timeframe?: string;
}

export type ChartType = 'line' | 'candlestick' | 'area' | 'bar';
export type Timeframe = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';
export type AnalysisStrategy = 'technical' | 'fundamental' | 'sentiment' | 'momentum' | 'swing' | 'custom';

// Leveraged Trading Types
export interface LeveragedScenario {
  leverage: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  marginRequired: number;
  maxLoss: number;
  maxGain: number;
  successChance: number;
  riskRewardRatio: number;
  direction: 'long' | 'short';
  liquidationPrice: number;
  volatility: number;
  timeHorizon: string;
}

export interface LeverageAnalysis {
  symbol: string;
  currentPrice: number;
  scenarios: LeveragedScenario[];
  marketConditions: {
    volatility: number;
    trend: 'bullish' | 'bearish' | 'sideways';
    support: number;
    resistance: number;
  };
  riskMetrics: {
    maxDrawdown: number;
    sharpeRatio: number;
    var95: number; // Value at Risk 95%
    expectedReturn: number;
  };
  recommendations: {
    bestLeverage: number;
    recommendedStopLoss: number;
    riskLevel: 'low' | 'medium' | 'high' | 'extreme';
    warnings: string[];
  };
}
