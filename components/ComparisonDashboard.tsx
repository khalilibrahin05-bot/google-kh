import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
import type { SurveyData, ComparisonChartData } from '../types';
import AiComparisonAnalysis from './AiComparisonAnalysis';
import { XIcon } from './icons';

interface ComparisonDashboardProps {
  surveyDataA: SurveyData;
  fileNameA: string;
  surveyDataB: SurveyData;
  fileNameB: string;
  onExit: () => void;
}

const processDataForComparison = (dataA: SurveyData, dataB: SurveyData): Record<string, ComparisonChartData[]> => {
  const comparisonData: Record<string, ComparisonChartData[]> = {};
  const allHeaders = new Set([...dataA.headers, ...dataB.headers]);

  allHeaders.forEach(header => {
    if (header.toLowerCase().includes('timestamp') || header.toLowerCase().includes('time')) {
      return;
    }

    const valueCountsA: Record<string, number> = {};
    dataA.rows.forEach(row => {
      const value = row[header] || 'N/A';
      value.split(';').map(v => v.trim()).forEach(singleValue => {
        if (singleValue) valueCountsA[singleValue] = (valueCountsA[singleValue] || 0) + 1;
      });
    });

    const valueCountsB: Record<string, number> = {};
    dataB.rows.forEach(row => {
      const value = row[header] || 'N/A';
      value.split(';').map(v => v.trim()).forEach(singleValue => {
        if (singleValue) valueCountsB[singleValue] = (valueCountsB[singleValue] || 0) + 1;
      });
    });
    
    const allKeys = new Set([...Object.keys(valueCountsA), ...Object.keys(valueCountsB)]);
    if (allKeys.size === 0 || allKeys.size > 50) return; // Skip if too many unique values

    const chartData: ComparisonChartData[] = [];
    allKeys.forEach(key => {
      chartData.push({
        name: key,
        valueA: valueCountsA[key] || 0,
        valueB: valueCountsB[key] || 0,
      });
    });

    if (chartData.length > 0) {
        comparisonData[header] = chartData.sort((a,b) => (b.valueA + b.valueB) - (a.valueA + a.valueB));
    }
  });

  return comparisonData;
};


const ComparisonDashboard: React.FC<ComparisonDashboardProps> = ({ surveyDataA, fileNameA, surveyDataB, fileNameB, onExit }) => {
  const chartData = useMemo(() => processDataForComparison(surveyDataA, surveyDataB), [surveyDataA, surveyDataB]);
  const [showCounts, setShowCounts] = useState<boolean>(false);

  const renderChart = (title: string, data: ComparisonChartData[]) => {
    const shortNameA = fileNameA.length > 20 ? `${fileNameA.substring(0, 18)}...` : fileNameA;
    const shortNameB = fileNameB.length > 20 ? `${fileNameB.substring(0, 18)}...` : fileNameB;
    const chartHeight = Math.max(300, data.length * 40);

    return (
      <div key={title} className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        <div className="p-4">
             <ResponsiveContainer width="100%" height={chartHeight}>
                <BarChart data={data} layout="vertical" margin={{ top: 20, right: 40, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="valueA" name={shortNameA} fill="#0088FE">
                      {showCounts && <LabelList dataKey="valueA" position="right" style={{ fill: '#333', fontSize: 12 }} />}
                    </Bar>
                    <Bar dataKey="valueB" name={shortNameB} fill="#00C49F">
                      {showCounts && <LabelList dataKey="valueB" position="right" style={{ fill: '#333', fontSize: 12 }} />}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-md flex flex-wrap justify-between items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">لوحة التحكم المقارنة</h2>
          <p className="text-sm text-gray-500 mt-1">{`مقارنة بين: ${fileNameA} و ${fileNameB}`}</p>
        </div>
        <div className="flex items-center gap-4">
            <label className="flex items-center space-x-2 space-x-reverse cursor-pointer text-sm text-gray-600 select-none">
              <input
                type="checkbox"
                checked={showCounts}
                onChange={() => setShowCounts(!showCounts)}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span>إظهار الأعداد</span>
            </label>
            <button
                onClick={onExit}
                className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors"
              >
                <XIcon className="h-5 w-5"/>
                <span>الخروج من المقارنة</span>
            </button>
        </div>
      </div>
      
      <AiComparisonAnalysis 
        surveyDataA={surveyDataA} 
        fileNameA={fileNameA} 
        surveyDataB={surveyDataB} 
        fileNameB={fileNameB} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FIX: Add type assertion to 'data' as Object.entries may infer its value type as 'unknown'. */}
        {Object.entries(chartData).map(([title, data]) => renderChart(title, data as ComparisonChartData[]))}
      </div>
    </div>
  );
};

export default ComparisonDashboard;