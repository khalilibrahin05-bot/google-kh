
import React, { useState, useCallback } from 'react';
import Papa from 'papaparse';
import type { SurveyData } from '../types';
import { UploadCloudIcon, AlertTriangleIcon } from './icons';

interface FileUploadProps {
  onDataLoaded: (data: SurveyData, file: File) => void;
  onError: (error: string) => void;
  error: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, onError, error }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileParse = (file: File) => {
    if (!file) {
      onError("لم يتم تحديد أي ملف.");
      return;
    }
    if (file.type !== 'text/csv') {
      onError("صيغة الملف غير مدعومة. يرجى رفع ملف بصيغة CSV.");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const rows = results.data as Record<string, string>[];
        onDataLoaded({ headers, rows }, file);
      },
      error: (err) => {
        onError(`حدث خطأ أثناء معالجة الملف: ${err.message}`);
      }
    });
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileParse(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileParse(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative block w-full border-2 border-dashed rounded-lg p-12 text-center transition-colors duration-200 ${isDragging ? 'border-teal-500 bg-teal-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input
          type="file"
          id="file-upload"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          accept=".csv"
          onChange={handleFileChange}
        />
        <UploadCloudIcon className="mx-auto h-12 w-12 text-gray-400" />
        <span className="mt-2 block text-sm font-medium text-gray-900">
          اسحب وأفلت ملف CSV هنا
        </span>
        <span className="block text-xs text-gray-500">أو</span>
        <label
          htmlFor="file-upload"
          className="mt-2 inline-block px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 cursor-pointer transition-colors"
        >
          اختر ملفًا
        </label>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        قم بتصدير نتائج استطلاع جوجل فورم كملف CSV وارفعه هنا للتحليل.
      </p>
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md flex items-center justify-center space-x-2 space-x-reverse">
          <AlertTriangleIcon className="h-5 w-5"/>
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
