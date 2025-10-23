import React, { useState, useEffect } from 'react';
import { analyzeSurveyData } from '../services/geminiService';
import type { SurveyData } from '../types';
import { SparklesIcon, AlertTriangleIcon } from './icons';

interface AiAnalysisProps {
  surveyData: SurveyData;
  onAnalysisComplete: (analysisText: string) => void;
}

const AiAnalysis: React.FC<AiAnalysisProps> = ({ surveyData, onAnalysisComplete }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const getAnalysis = async () => {
      setIsLoading(true);
      setError('');
      try {
        const result = await analyzeSurveyData(surveyData);
        setAnalysis(result);
        onAnalysisComplete(result);
      } catch (e: any) {
        console.error("Gemini API error:", e);
        setError("عذرًا، حدث خطأ أثناء توليد التحليل الذكي. يرجى المحاولة مرة أخرى لاحقًا.");
      } finally {
        setIsLoading(false);
      }
    };

    getAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [surveyData]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center space-y-3 p-8">
            <SparklesIcon className="h-8 w-8 text-teal-500 animate-pulse"/>
            <p className="text-gray-600">يقوم الذكاء الاصطناعي بتحليل البيانات... قد يستغرق هذا بضع لحظات.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center justify-center space-x-2 space-x-reverse">
          <AlertTriangleIcon className="h-5 w-5"/>
          <span>{error}</span>
        </div>
      );
    }
    
    // Simple markdown-like formatting for the response
    return (
        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
          {analysis.split('\n').map((line, index) => {
            if (line.startsWith('### ')) {
              return <h3 key={index} className="font-bold text-base mt-4 mb-2">{line.substring(4)}</h3>;
            }
            if (line.startsWith('## ')) {
              return <h2 key={index} className="font-bold text-lg mt-6 mb-3 border-b pb-1">{line.substring(3)}</h2>;
            }
            if (line.startsWith('* ')) {
              return <li key={index} className="mr-4">{line.substring(2)}</li>;
            }
            return <p key={index} className="my-1">{line}</p>;
          })}
        </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200 flex items-center space-x-3 space-x-reverse">
        <SparklesIcon className="h-6 w-6 text-teal-600"/>
        <h2 className="text-xl font-bold text-gray-900">التحليل الذكي بواسطة Gemini</h2>
      </div>
      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default AiAnalysis;