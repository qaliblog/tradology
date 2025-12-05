
export type Timeframe = 'Daily' | 'Weekly' | 'Monthly';

export interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: string;
}

export interface TradingScenario {
  name: string;
  probability: string;
  description: string;
  keyLevels: string[];
  timeframe: Timeframe;
}

export interface AnalysisResult {
  analysis: string;
  prompt: string;
  sources?: { uri: string; title: string; }[];
  chartData?: ChartDataPoint[];
  scenarios?: TradingScenario[];
  timeframe?: Timeframe;
}
