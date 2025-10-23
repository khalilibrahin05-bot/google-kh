import React from 'react';
import { XIcon, PrinterIcon } from './icons';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: string[];
  selectedItems: Record<string, boolean>;
  onSelectionChange: (newSelection: Record<string, boolean>) => void;
  onPrint: () => void;
  onExportPdf: () => void;
}

const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  items,
  selectedItems,
  onSelectionChange,
  onPrint,
  onExportPdf,
}) => {
  if (!isOpen) return null;

  const handleCheckboxChange = (item: string) => {
    onSelectionChange({
      ...selectedItems,
      [item]: !selectedItems[item],
    });
  };

  const handleSelectAll = () => {
    const newSelection = items.reduce((acc, item) => ({ ...acc, [item]: true }), {});
    onSelectionChange(newSelection);
  };
  
  const handleDeselectAll = () => {
    const newSelection = items.reduce((acc, item) => ({ ...acc, [item]: false }), {});
    onSelectionChange(newSelection);
  };

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center no-print"
      id="export-modal"
      onClick={onClose}
    >
      <div
        className="relative mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b pb-3 mb-3">
          <h3 className="text-lg font-bold text-gray-900">خيارات الطباعة والتصدير</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <XIcon className="h-5 w-5 text-gray-600" />
          </button>
        </div>
        <div className="text-sm text-gray-700">
          <p className="mb-4">حدد الأقسام التي تريد تضمينها في تقريرك.</p>
          <div className="flex space-x-2 space-x-reverse mb-4">
              <button onClick={handleSelectAll} className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">تحديد الكل</button>
              <button onClick={handleDeselectAll} className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300">إلغاء تحديد الكل</button>
          </div>
          <div className="max-h-60 overflow-y-auto space-y-2 pr-2 border-r-2 border-gray-100">
            {items.map((item) => (
              <label key={item} className="flex items-center space-x-3 space-x-reverse cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  checked={selectedItems[item] ?? false}
                  onChange={() => handleCheckboxChange(item)}
                />
                <span className="text-gray-800">{item}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3 space-x-reverse">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-300"
          >
            إلغاء
          </button>
          <button
            onClick={onPrint}
            className="flex items-center space-x-2 space-x-reverse px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
             <PrinterIcon className="h-5 w-5"/>
            <span>طباعة</span>
          </button>
          <button
            onClick={onExportPdf}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            تصدير PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;