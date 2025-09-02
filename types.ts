
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
