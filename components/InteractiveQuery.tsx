import React, { useState } from 'react';
import { querySurveyData } from '../services/geminiService';
import type { SurveyData } from '../types';
import { SparklesIcon, AlertTriangleIcon, SendIcon } from './icons';

interface InteractiveQueryProps {
  surveyData: SurveyData;
}

const InteractiveQuery: React.FC<InteractiveQueryProps> = ({ surveyData }) => {
  const [query, setQuery] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const exampleQueries = [
    "ما هو متوسط الرضا العام؟",
    "كم عدد المشاركين من كل مدينة؟",
    "لخص أبرز الشكاوى المذكورة.",
    "هل هناك علاقة بين الفئة العمرية وتفضيل المنتج أ؟"
  ];

  const handleQuerySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError('');
    setResult('');
    try {
      const response = await querySurveyData(surveyData, query);
      setResult(response);
    } catch (e: any) {
      setError("عذرًا، حدث خطأ أثناء معالجة سؤالك. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  const renderResult = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center space-x-3 space-x-reverse p-4 text-gray-600">
          <SparklesIcon className="h-6 w-6 animate-pulse" />
          <span>جارٍ البحث عن إجابة...</span>
        </div>
      );
    }
    if (error) {
      return (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center justify-center space-x-2 space-x-reverse">
          <AlertTriangleIcon className="h-5 w-5" />
          <span>{error}</span>
        </div>
      );
    }
    if (result) {
        // Simple markdown-like formatting for the response
        return (
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap p-4 bg-gray-50 rounded-md">
            {result.split('\n').map((line, index) => {
                if (line.startsWith('* ')) {
                return <li key={index} className="mr-4">{line.substring(2)}</li>;
                }
                return <p key={index} className="my-1">{line}</p>;
            })}
            </div>
        );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">اسأل بياناتك</h2>
        <p className="text-sm text-gray-500 mt-1">اطرح سؤالاً باللغة الطبيعية حول بيانات الاستطلاع الخاص بك.</p>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 mb-2">أمثلة على الأسئلة:</p>
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((ex, i) => (
              <button 
                key={i} 
                onClick={() => handleExampleClick(ex)} 
                className="px-3 py-1 text-xs bg-teal-50 text-teal-700 rounded-full hover:bg-teal-100 transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={handleQuerySubmit}>
          <div className="relative">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="اكتب سؤالك هنا..."
              className="w-full p-3 pr-12 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
              rows={3}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute top-1/2 -translate-y-1/2 left-3 p-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors"
              title="إرسال السؤال"
            >
              <SendIcon className="h-5 w-5" />
            </button>
          </div>
        </form>
        <div className="mt-4 min-h-[50px]">
          {renderResult()}
        </div>
      </div>
    </div>
  );
};

export default InteractiveQuery;
