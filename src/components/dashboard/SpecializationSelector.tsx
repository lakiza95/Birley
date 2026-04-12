import React, { useState, useRef, useEffect } from 'react';
import { ChevronRight, ChevronDown, Search } from 'lucide-react';
import { SPECIALIZATIONS } from '../../constants/specializations';

interface SpecializationSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
}

const SpecializationSelector: React.FC<SpecializationSelectorProps> = ({ selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCategory = (category: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const toggleSpecialization = (spec: string) => {
    onChange(
      selected.includes(spec) 
        ? selected.filter(s => s !== spec)
        : [...selected, spec]
    );
  };

  const filteredCategories = Object.entries(SPECIALIZATIONS).filter(([category, specs]) => 
    category.toLowerCase().includes(search.toLowerCase()) || 
    specs.some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-1 transition-all outline-none text-sm flex items-center justify-between"
      >
        <span className="text-gray-400">
          {selected.length > 0 ? `${selected.length} selected` : 'Select specialization'}
        </span>
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-lg outline-none text-sm"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {filteredCategories.map(([category, specs]) => (
              <div key={category}>
                <div className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                  <label className="flex items-center gap-2 text-sm text-gray-900 cursor-pointer flex-1">
                    <input 
                      type="checkbox" 
                      checked={specs.length > 0 ? specs.every(s => selected.includes(s)) : selected.includes(category)}
                      onChange={() => {
                        if (specs.length > 0) {
                          const allSelected = specs.every(s => selected.includes(s));
                          onChange(allSelected ? selected.filter(s => !specs.includes(s)) : [...selected, ...specs.filter(s => !selected.includes(s))]);
                        } else {
                          onChange(selected.includes(category) ? selected.filter(s => s !== category) : [...selected, category]);
                        }
                      }}
                      className="rounded border-gray-300 text-[#4338CA] focus:ring-[#4338CA]"
                    />
                    {category}
                  </label>
                  {specs.length > 0 && (
                    <button type="button" onClick={(e) => toggleCategory(category, e)} className="p-1 hover:bg-gray-200 rounded">
                      {expandedCategories.includes(category) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  )}
                </div>
                {expandedCategories.includes(category) && specs.length > 0 && (
                  <div className="ml-6 space-y-1 py-1">
                    {specs.map(spec => (
                      <label key={spec} className="flex items-center gap-2 text-sm text-gray-600 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={selected.includes(spec)}
                          onChange={() => toggleSpecialization(spec)}
                          className="rounded border-gray-300 text-[#4338CA] focus:ring-[#4338CA]"
                        />
                        {spec}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecializationSelector;
