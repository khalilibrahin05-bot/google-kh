export interface SurveyData {
  headers: string[];
  rows: Record<string, string>[];
}

export interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

export interface ComparisonChartData {
  name: string;
  valueA: number;
  valueB: number;
  [key: string]: any;
}

export interface Filter {
  id: string;
  question: string;
  value: string;
}

export type OptionClassification = 'Positive' | 'Neutral' | 'Negative';