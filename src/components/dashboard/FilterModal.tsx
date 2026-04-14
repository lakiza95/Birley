import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'range';
  options?: string[];
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  fields: FilterField[];
  activeFilters: Record<string, string>;
  onApply: (filters: Record<string, string>) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({ isOpen, onClose, fields, activeFilters, onApply }) => {
  const [localFilters, setLocalFilters] = useState<Record<string, string>>(activeFilters);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(activeFilters);
    }
  }, [isOpen, activeFilters]);

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleClear = () => {
    setLocalFilters({});
    onApply({});
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Advanced Filters</h3>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
              {fields.map(field => (
                <div key={field.key} className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">{field.label}</label>
                  {field.type === 'select' ? (
                    <select
                      value={localFilters[field.key] || ''}
                      onChange={(e) => setLocalFilters(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-indigo-600 transition-colors text-sm"
                    >
                      <option value="">All</option>
                      {field.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : field.type === 'range' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={localFilters[`${field.key}_min`] || ''}
                        onChange={(e) => setLocalFilters(prev => ({ ...prev, [`${field.key}_min`]: e.target.value }))}
                        placeholder="From"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-indigo-600 transition-colors text-sm"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="number"
                        value={localFilters[`${field.key}_max`] || ''}
                        onChange={(e) => setLocalFilters(prev => ({ ...prev, [`${field.key}_max`]: e.target.value }))}
                        placeholder="To"
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-indigo-600 transition-colors text-sm"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={localFilters[field.key] || ''}
                      onChange={(e) => setLocalFilters(prev => ({ ...prev, [field.key]: e.target.value }))}
                      placeholder={`Filter by ${field.label.toLowerCase()}...`}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-indigo-600 transition-colors text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50/50">
              <button onClick={handleClear} className="px-4 py-2.5 text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
                Clear All
              </button>
              <button onClick={handleApply} className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                Apply Filters
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
