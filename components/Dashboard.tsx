import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, Legend as PieLegend } from 'recharts';
import type { SurveyData, ChartData, Filter, OptionClassification } from '../types';
import ChartCard from './ChartCard';
import AiAnalysis from './AiAnalysis';
import AiChartSummary from './AiChartSummary';
import InteractiveQuery from './InteractiveQuery';
import ExportModal from './ExportModal';
import FilterPanel from './FilterPanel';
import { PrinterIcon, WhatsAppIcon, CompareIcon, FilterIcon } from './icons';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { summarizeChartData, classifyChartOptions } from '../services/geminiService';


interface DashboardProps {
  surveyData: SurveyData;
  fileName: string;
  onCompareFileLoad: (data: SurveyData, file: File) => void;
}

const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

const processDataForCharts = (data: SurveyData): Record<string, ChartData[]> => {
  const chartData: Record<string, ChartData[]> = {};

  data.headers.forEach(header => {
    if (header.toLowerCase().includes('timestamp') || header.toLowerCase().includes('time')) {
        return;
    }

    const valueCounts: Record<string, number> = {};
    data.rows.forEach(row => {
      const value = row[header] || 'N/A';
      const multiValues = value.split(';').map(v => v.trim());
      multiValues.forEach(singleValue => {
        if (singleValue) {
            valueCounts[singleValue] = (valueCounts[singleValue] || 0) + 1;
        }
      });
    });

    if (Object.keys(valueCounts).length > 0 && Object.keys(valueCounts).length < data.rows.length * 0.8) {
       chartData[header] = Object.entries(valueCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
    }
  });

  return chartData;
};

const Dashboard: React.FC<DashboardProps> = ({ surveyData, fileName, onCompareFileLoad }) => {
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  const filteredSurveyData = useMemo(() => {
    if (activeFilters.length === 0) {
      return surveyData;
    }

    const filteredRows = surveyData.rows.filter(row => {
      return activeFilters.every(filter => {
        const rowValue = row[filter.question] || '';
        return rowValue.split(';').map(v => v.trim()).includes(filter.value);
      });
    });

    return { ...surveyData, rows: filteredRows };
  }, [surveyData, activeFilters]);
  
  const chartData = useMemo(() => processDataForCharts(filteredSurveyData), [filteredSurveyData]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [aiAnalysisText, setAiAnalysisText] = useState('');
  const comparisonFileRef = useRef<HTMLInputElement>(null);
  const [chartSummaries, setChartSummaries] = useState<Record<string, string>>({});
  const [summariesLoading, setSummariesLoading] = useState<Record<string, boolean>>({});
  const [optionClassifications, setOptionClassifications] = useState<Record<string, Record<string, OptionClassification>>>({});
  const [classificationsLoading, setClassificationsLoading] = useState<Record<string, boolean>>({});

  const exportableItems = useMemo(() => ['التحليل الذكي', 'اسأل بياناتك', ...Object.keys(chartData)], [chartData]);
  const [selectedItems, setSelectedItems] = useState<Record<string, boolean>>(() =>
    exportableItems.reduce((acc, item) => ({ ...acc, [item]: true }), {})
  );

  useEffect(() => {
    setActiveFilters([]);
    setIsFilterPanelOpen(false);
    setOptionClassifications({});
  }, [surveyData]);

  useEffect(() => {
    const afterPrint = () => {
        const printContainer = document.getElementById('print-container');
        if (printContainer) {
            document.body.removeChild(printContainer);
        }
    };
    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, []);
  
  useEffect(() => {
    if (filteredSurveyData.rows.length === 0) {
        setChartSummaries({});
        setSummariesLoading({});
        return;
    }

    const fetchAllSummaries = async () => {
        setChartSummaries({});
        setSummariesLoading({});
        const chartEntries = Object.entries(chartData);

        for (const [title, data] of chartEntries) {
            try {
                setSummariesLoading(prev => ({ ...prev, [title]: true }));
                const result = await summarizeChartData(title, data as ChartData[]);
                setChartSummaries(prev => ({ ...prev, [title]: result }));
                await new Promise(resolve => setTimeout(resolve, 500)); 
            } catch (error) {
                console.error(`Failed to get summary for chart "${title}":`, error);
                setChartSummaries(prev => ({ ...prev, [title]: "عذرًا، حدث خطأ أثناء تلخيص هذا المؤشر." }));
            } finally {
                setSummariesLoading(prev => ({ ...prev, [title]: false }));
            }
        }
    };
    
    if (Object.keys(chartData).length > 0) {
        fetchAllSummaries();
    }
  }, [chartData, filteredSurveyData.rows.length]);

  useEffect(() => {
    if (filteredSurveyData.rows.length === 0) {
        setOptionClassifications({});
        setClassificationsLoading({});
        return;
    }

    const fetchAllClassifications = async () => {
        const chartEntries = Object.entries(chartData);
        for (const [title, data] of chartEntries) {
            if (!optionClassifications[title] && !classificationsLoading[title]) {
                // FIX: Add type assertion to 'data' as Object.entries may infer its value type as 'unknown'.
                const options = (data as ChartData[]).map(d => d.name);
                if (options.length > 1 && options.length <= 15) { 
                    try {
                        setClassificationsLoading(prev => ({ ...prev, [title]: true }));
                        const result = await classifyChartOptions(title, options);
                        setOptionClassifications(prev => ({ ...prev, [title]: result }));
                    } catch (error) {
                        console.error(`Failed to get classification for chart "${title}":`, error);
                        setOptionClassifications(prev => ({ ...prev, [title]: {} }));
                    } finally {
                        setClassificationsLoading(prev => ({ ...prev, [title]: false }));
                    }
                } else {
                    setOptionClassifications(prev => ({ ...prev, [title]: {} }));
                }
            }
        }
    };
    
    if (Object.keys(chartData).length > 0) {
        fetchAllClassifications();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartData, filteredSurveyData.rows.length]);

  const handleApplyFilters = useCallback((filters: Filter[]) => {
    setActiveFilters(filters);
    setIsFilterPanelOpen(false);
  }, []);

  const handleClearFilters = useCallback(() => {
    setActiveFilters([]);
    setIsFilterPanelOpen(false);
  }, []);

  const getItemId = (itemName: string) => {
    if (itemName === 'التحليل الذكي') return 'ai-analysis-section';
    if (itemName === 'اسأل بياناتك') return 'interactive-query-section';
    return `chart-card-${itemName.replace(/[^a-zA-Z0-9]/g, '-')}`;
  };
  
  const handleExportChart = async (chartId: string, title: string) => {
    const chartElement = document.getElementById(chartId);
    if (chartElement) {
        const canvas = await html2canvas(chartElement, { backgroundColor: '#ffffff' });
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = `${title.replace(/ /g, '_')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  const handleSelectivePrint = () => {
    const printContainer = document.createElement('div');
    printContainer.id = 'print-container';
    document.body.appendChild(printContainer);

    Object.entries(selectedItems).forEach(([itemName, isSelected]) => {
        if (isSelected) {
            const elementToPrint = document.getElementById(getItemId(itemName));
            if (elementToPrint) {
                const clonedElement = elementToPrint.cloneNode(true) as HTMLElement;
                printContainer.appendChild(clonedElement);
            }
        }
    });
    
    setIsExportModalOpen(false);
    setTimeout(() => window.print(), 100);
  };
  
  const handleExportPdf = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const itemsToExport = Object.entries(selectedItems).filter(([, isSelected]) => isSelected);
    let yOffset = 10;
    const pageMargin = 10;
    const pdfWidth = pdf.internal.pageSize.getWidth() - 2 * pageMargin;
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (const [itemName] of itemsToExport) {
        const element = document.getElementById(getItemId(itemName));
        if (element) {
            const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            if (yOffset + pdfHeight > pageHeight - pageMargin) {
                pdf.addPage();
                yOffset = pageMargin;
            }

            pdf.addImage(imgData, 'PNG', pageMargin, yOffset, pdfWidth, pdfHeight);
            yOffset += pdfHeight + 10;
        }
    }
    
    pdf.save(`${fileName.replace('.csv', '')}_report.pdf`);
    setIsExportModalOpen(false);
  };

  const handleShareWhatsApp = () => {
    const summary = `ملخص تحليل استطلاع "${fileName}":\n\n${aiAnalysisText.substring(0, 500)}...`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(summary)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleComparisonFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
            const headers = results.meta.fields || [];
            const rows = results.data as Record<string, string>[];
            onCompareFileLoad({ headers, rows }, file);
        },
        error: (err) => {
            alert(`حدث خطأ أثناء معالجة ملف المقارنة: ${err.message}`);
        }
    });
  };
  
  const renderChart = (title: string, data: ChartData[]) => {
    const chartId = `chart-content-${title.replace(/[^a-zA-Z0-9]/g, '-')}`;
    const cardId = getItemId(title);
    const usePieChart = data.length > 1 && data.length <= 8;
    
    const classifications = optionClassifications[title];
    const isLoadingScore = classificationsLoading[title] || classifications === undefined;
    
    let generalScore: number | undefined = undefined;

    if (classifications && Object.keys(classifications).length > 0) {
        const positiveOptions = Object.keys(classifications).filter(
            option => classifications[option] === 'Positive'
        );

        if (positiveOptions.length > 0) {
            const positiveValues = data
                .filter(d => positiveOptions.includes(d.name))
                .reduce((sum, item) => sum + item.value, 0);
            
            const totalValues = data.reduce((sum, item) => sum + item.value, 0);

            if (totalValues > 0) {
                generalScore = (positiveValues / totalValues) * 100;
            }
        }
    }

    const total = useMemo(() => data.reduce((sum, entry) => sum + entry.value, 0), [data]);

    const tooltipFormatter = (value: number, name: string) => {
        const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
        return [`${value} (${percentage}%)`, name];
    };

    const renderPieLabel = ({ percent }: { percent: number }) => {
        if (percent < 0.05) return ''; // Don't render for small slices
        return `${(percent * 100).toFixed(0)}%`;
    };

    return (
      <ChartCard 
        key={title} 
        id={cardId} 
        title={title} 
        onExport={() => handleExportChart(chartId, title)}
        generalScore={generalScore}
        isLoadingScore={isLoadingScore}
      >
        <div id={chartId} className="bg-white">
          {usePieChart ? (
            <ResponsiveContainer width="100%" height={350}>
              <PieChart margin={{ top: 5, right: 30, bottom: 5, left: 30 }}>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  fill="#8884d8"
                  labelLine={true}
                  label={renderPieLabel}
                >
                  {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={tooltipFormatter} />
                <PieLegend 
                    layout="vertical" 
                    align="right" 
                    verticalAlign="middle" 
                    wrapperStyle={{fontSize: '12px', marginLeft: '30px', direction: 'rtl', textAlign: 'right'}}
                    payload={data.map((item, index) => ({
                      id: item.name,
                      type: "square",
                      value: `${item.name} (${item.value})`,
                      color: COLORS[index % COLORS.length]
                    }))}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12 }} />
                <Tooltip formatter={tooltipFormatter} />
                <Bar dataKey="value" name="عدد الإجابات">
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <AiChartSummary 
            summary={chartSummaries[title]}
            isLoading={summariesLoading[title] ?? true}
        />
      </ChartCard>
    );
  };
  
  return (
    <>
      <input type="file" accept=".csv" ref={comparisonFileRef} onChange={handleComparisonFileSelected} style={{ display: 'none' }} />
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        items={exportableItems}
        selectedItems={selectedItems}
        onSelectionChange={setSelectedItems}
        onPrint={handleSelectivePrint}
        onExportPdf={handleExportPdf}
      />
      <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-md no-print">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">لوحة التحكم التحليلية</h2>
              <p className="text-sm text-gray-500 mt-1">ملف: {fileName}</p>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
               <button
                 onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                 className={`flex items-center space-x-2 space-x-reverse px-4 py-2 text-white rounded-md transition-colors ${activeFilters.length > 0 ? 'bg-teal-700 hover:bg-teal-800' : 'bg-gray-500 hover:bg-gray-600'}`}
                 title="فلترة البيانات"
               >
                 <FilterIcon className="h-5 w-5"/>
                 <span>فلترة {activeFilters.length > 0 ? `(${activeFilters.length})` : ''}</span>
               </button>
               <button
                  onClick={() => comparisonFileRef.current?.click()}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  title="قارن مع ملف استبيان آخر"
               >
                  <CompareIcon className="h-5 w-5"/>
                  <span>مقارنة</span>
               </button>
               <button
                  onClick={handleShareWhatsApp}
                  disabled={!aiAnalysisText}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:bg-gray-300 transition-colors"
               >
                  <WhatsAppIcon className="h-5 w-5"/>
               </button>
               <button
                  onClick={() => setIsExportModalOpen(true)}
                  className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-600 transition-colors"
               >
                  <PrinterIcon className="h-5 w-5"/>
                  <span>طباعة / تصدير</span>
               </button>
            </div>
          </div>
           {activeFilters.length > 0 && (
            <div className="mt-4 p-3 bg-teal-50 border-r-4 border-teal-500 text-teal-800 rounded-md">
              <p className="font-semibold">
                يتم عرض {filteredSurveyData.rows.length} من أصل {surveyData.rows.length} إجابة بناءً على الفلاتر المطبقة.
              </p>
            </div>
          )}
        </div>

        {isFilterPanelOpen && (
          <FilterPanel
            surveyData={surveyData}
            activeFilters={activeFilters}
            onApplyFilters={handleApplyFilters}
            onClearFilters={handleClearFilters}
          />
        )}
        
        <div className="print-area space-y-8">
          <div id={getItemId('التحليل الذكي')}>
            <AiAnalysis surveyData={filteredSurveyData} onAnalysisComplete={setAiAnalysisText}/>
          </div>

          <div id={getItemId('اسأل بياناتك')}>
            <InteractiveQuery surveyData={filteredSurveyData} />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Object.keys(chartData).length > 0 ? (
                Object.entries(chartData).map(([title, data]) => renderChart(title, data as ChartData[]))
            ) : (
                <div className="lg:col-span-2 text-center py-12 bg-white rounded-lg shadow-md">
                    <p className="text-gray-500">لا توجد بيانات لعرضها بناءً على الفلاتر المحددة.</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;