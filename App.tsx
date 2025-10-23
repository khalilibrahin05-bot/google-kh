import React, { useState, useEffect } from 'react';
import type { SurveyData } from './types';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import ComparisonDashboard from './components/ComparisonDashboard';
import { LogoIcon } from './components/icons';

const App: React.FC = () => {
  const [surveyData, setSurveyData] = useState<SurveyData | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [comparisonData, setComparisonData] = useState<SurveyData | null>(null);
  const [comparisonFileName, setComparisonFileName] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    try {
      const savedData = localStorage.getItem('surveyData');
      const savedFileName = localStorage.getItem('surveyFileName');
      if (savedData && savedFileName) {
        setSurveyData(JSON.parse(savedData));
        setFileName(savedFileName);
      }
    } catch (e) {
      console.error("Failed to load data from localStorage", e);
      localStorage.removeItem('surveyData');
      localStorage.removeItem('surveyFileName');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDataLoaded = (data: SurveyData, file: File) => {
    if (data.headers.length < 1 || data.rows.length < 1) {
      setError('الملف فارغ أو غير صحيح. يرجى التحقق من محتوى ملف CSV.');
      setSurveyData(null);
      setFileName('');
      return;
    }
    setError('');
    setSurveyData(data);
    setFileName(file.name);
    try {
      localStorage.setItem('surveyData', JSON.stringify(data));
      localStorage.setItem('surveyFileName', file.name);
    } catch (e) {
      console.error("Failed to save data to localStorage", e);
      setError("حدث خطأ أثناء حفظ البيانات. قد لا يتم تذكر هذا الاستطلاع.");
    }
  };

  const handleComparisonFileLoad = (data: SurveyData, file: File) => {
    if (data.headers.length < 1 || data.rows.length < 1) {
      setError('ملف المقارنة فارغ أو غير صحيح. يرجى التحقق من محتوى ملف CSV.');
      return;
    }
    setError('');
    setComparisonData(data);
    setComparisonFileName(file.name);
  };
  
  const handleFileError = (errorMessage: string) => {
    setError(errorMessage);
    setSurveyData(null);
    setFileName('');
  };

  const handleReset = () => {
    setSurveyData(null);
    setFileName('');
    setComparisonData(null);
    setComparisonFileName('');
    setError('');
    try {
      localStorage.removeItem('surveyData');
      localStorage.removeItem('surveyFileName');
    } catch (e) {
      console.error("Failed to clear data from localStorage", e);
    }
  };
  
  const handleExitComparison = () => {
      setComparisonData(null);
      setComparisonFileName('');
  };

  const renderContent = () => {
    if (surveyData && comparisonData) {
      return <ComparisonDashboard 
                surveyDataA={surveyData}
                fileNameA={fileName}
                surveyDataB={comparisonData}
                fileNameB={comparisonFileName}
                onExit={handleExitComparison}
             />;
    }
    if (surveyData) {
      return <Dashboard 
                surveyData={surveyData} 
                fileName={fileName} 
                onCompareFileLoad={handleComparisonFileLoad} 
             />;
    }
    return <FileUpload onDataLoaded={handleDataLoaded} onError={handleFileError} error={error} />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 text-gray-700">
        <div className="text-center">
          <LogoIcon className="h-16 w-16 mx-auto text-teal-600 animate-pulse" />
          <p className="mt-4 text-lg">جارٍ تحميل التطبيق...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="bg-white shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3 space-x-reverse">
            <LogoIcon className="h-10 w-10 text-teal-600"/>
            <h1 className="text-2xl font-bold text-gray-900">محلل استطلاعات جوجل</h1>
          </div>
          {surveyData && (
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              تحميل ملف جديد
            </button>
          )}
        </div>
      </header>
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;