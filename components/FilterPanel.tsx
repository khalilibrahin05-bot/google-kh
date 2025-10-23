import React, { useState, useMemo } from 'react';
import type { SurveyData, Filter } from '../types';
import { TrashIcon } from './icons';

interface FilterPanelProps {
  surveyData: SurveyData;
  activeFilters: Filter[];
  onApplyFilters: (filters: Filter[]) => void;
  onClearFilters: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ surveyData, activeFilters, onApplyFilters, onClearFilters }) => {
  const [filters, setFilters] = useState<Filter[]>(activeFilters);

  const filterableQuestions = useMemo(() => {
    return surveyData.headers.filter(header => {
      if (header.toLowerCase().includes('timestamp') || header.toLowerCase().includes('time')) return false;
      const uniqueValues = new Set(surveyData.rows.map(row => row[header]));
      return uniqueValues.size > 1 && uniqueValues.size < surveyData.rows.length * 0.8;
    });
  }, [surveyData]);

  const questionOptions = useMemo(() => {
    const options: Record<string, string[]> = {};
    filterableQuestions.forEach(question => {
      const values = new Set<string>();
      surveyData.rows.forEach(row => {
        const cellValue = row[question];
        if (cellValue) {
          cellValue.split(';').forEach(v => values.add(v.trim()));
        }
      });
      options[question] = Array.from(values).sort();
    });
    return options;
  }, [filterableQuestions, surveyData.rows]);

  const handleAddFilter = () => {
    setFilters([...filters, { id: Date.now().toString(), question: '', value: '' }]);
  };

  const handleRemoveFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
  };

  const handleFilterChange = (id: string, type: 'question' | 'value', newValue: string) => {
    setFilters(filters.map(f => {
      if (f.id === id) {
        if (type === 'question') {
          return { ...f, question: newValue, value: '' };
        }
        return { ...f, [type]: newValue };
      }
      return f;
    }));
  };

  const handleApply = () => {
    const validFilters = filters.filter(f => f.question && f.value);
    onApplyFilters(validFilters);
  };
  
  const handleClear = () => {
      setFilters([]);
      onClearFilters();
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4 mb-8 no-print">
      <div className="space-y-3">
        {filters.map((filter, index) => (
          <div key={filter.id} className="flex items-center gap-2 p-2 bg-white rounded border">
            <span className="text-sm text-gray-500">{index === 0 ? 'حيث' : 'و'}</span>
            <select
              value={filter.question}
              onChange={(e) => handleFilterChange(filter.id, 'question', e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">اختر سؤال...</option>
              {filterableQuestions.map(q => <option key={q} value={q}>{q}</option>)}
            </select>
            <span className="text-sm text-gray-500">يساوي</span>
            <select
              value={filter.value}
              onChange={(e) => handleFilterChange(filter.id, 'value', e.target.value)}
              className="flex-1 p-2 border border-gray-300 rounded-md text-sm focus:ring-teal-500 focus:border-teal-500"
              disabled={!filter.question}
            >
              <option value="">اختر إجابة...</option>
              {filter.question && questionOptions[filter.question]?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <button
              onClick={() => handleRemoveFilter(filter.id)}
              className="p-2 text-gray-500 hover:bg-red-100 hover:text-red-600 rounded-full"
              title="إزالة الفلتر"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <button
          onClick={handleAddFilter}
          className="px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          + إضافة شرط
        </button>
        <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              مسح الفلاتر
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm bg-teal-600 text-white rounded-md hover:bg-teal-700"
            >
              تطبيق الفلاتر
            </button>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
