import React from 'react';
import { DownloadIcon } from './icons';

interface ChartCardProps {
  id?: string;
  title: string;
  children: React.ReactNode;
  onExport: () => void;
  generalScore?: number;
  isLoadingScore?: boolean;
}

const ChartCard: React.FC<ChartCardProps> = ({ id, title, children, onExport, generalScore, isLoadingScore }) => {
  const getScoreColor = (score: number) => {
    if (score >= 75) return 'bg-green-100 text-green-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div id={id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
      <div className="p-4 border-b border-gray-200 flex justify-between items-start gap-4">
        <h3 className="text-lg font-semibold text-gray-800 pt-1">{title}</h3>
        <div className="flex-shrink-0 flex items-center space-x-2 space-x-reverse ml-auto">
           {isLoadingScore && (
             <div className="text-center p-2 rounded-lg bg-gray-100 animate-pulse" title="جارٍ حساب المؤشر العام">
                <span className="text-xs font-medium block text-gray-500 opacity-75">المؤشر العام</span>
                <span className="text-2xl font-bold text-gray-400">--%</span>
              </div>
           )}
           {!isLoadingScore && generalScore !== undefined && (
              <div className={`text-center p-2 rounded-lg ${getScoreColor(generalScore)}`}>
                <span className="text-xs font-medium block opacity-75">المؤشر العام</span>
                <span className="text-2xl font-bold">{generalScore.toFixed(0)}%</span>
              </div>
            )}
            <button
                onClick={onExport}
                className="no-print p-2 text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500 self-start"
                title="تصدير كصورة"
            >
                <DownloadIcon className="h-5 w-5" />
            </button>
        </div>
      </div>
      <div className="p-4 flex-grow">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;