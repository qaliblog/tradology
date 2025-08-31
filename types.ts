
export interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: string;
}

export interface AnalysisResult {
  analysis: string;
  prompt: string;
  sources?: { uri: string; title: string; }[];
  chartData?: ChartDataPoint[];
}
