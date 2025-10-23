import React from 'react';
import { SparklesIcon } from './icons';

interface AiChartSummaryProps {
  summary?: string;
  isLoading: boolean;
}

const AiChartSummary: React.FC<AiChartSummaryProps> = ({ summary, isLoading }) => {

  if (isLoading) {
    return (
        <div className="mt-2 flex items-center space-x-2 space-x-reverse text-sm text-gray-500 p-3">
            <SparklesIcon className="h-4 w-4 animate-pulse" />
            <span>جارٍ تلخيص المؤشر...</span>
        </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="mt-2 p-3 bg-gray-50 rounded-md border border-gray-200">
        <p className="text-sm text-gray-700">{summary}</p>
    </div>
  );
};

export default AiChartSummary;