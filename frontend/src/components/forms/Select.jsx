import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

const Select = React.forwardRef(({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option...',
  searchable = false,
  multiple = false,
  clearable = false,
  disabled = false,
  loading = false,
  error = false,
  className = '',
  optionClassName = '',
  renderOption,
  renderValue,
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const selectRef = useRef(null);
  const searchInputRef = useRef(null);

  // Filter options based on search query
  const filteredOptions = searchable && searchQuery
    ? options.filter(option => 
        option.label?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        option.value?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, searchable]);

  const handleOptionClick = (option) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const isSelected = currentValues.some(v => v.value === option.value);
      
      if (isSelected) {
        onChange(currentValues.filter(v => v.value !== option.value));
      } else {
        onChange([...currentValues, option]);
      }
    } else {
      onChange(option);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(multiple ? [] : null);
  };

  const handleRemoveValue = (valueToRemove, e) => {
    e.stopPropagation();
    if (multiple && Array.isArray(value)) {
      onChange(value.filter(v => v.value !== valueToRemove.value));
    }
  };

  const isSelected = (option) => {
    if (multiple) {
      return Array.isArray(value) && value.some(v => v.value === option.value);
    }
    return value?.value === option.value;
  };

  const getDisplayValue = () => {
    if (multiple && Array.isArray(value)) {
      if (value.length === 0) return placeholder;
      if (value.length === 1) return renderValue ? renderValue(value[0]) : value[0].label;
      return `${value.length} items selected`;
    }
    
    if (value) {
      return renderValue ? renderValue(value) : value.label;
    }
    
    return placeholder;
  };

  const baseClasses = `
    relative w-full bg-white border rounded-lg shadow-sm cursor-pointer
    transition-colors duration-200 focus-within:ring-2 focus-within:ring-offset-0
    ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'hover:border-gray-400'}
    ${error ? 'border-red-300 focus-within:border-red-500 focus-within:ring-red-500' : 'border-gray-300 focus-within:border-blue-500 focus-within:ring-blue-500'}
    ${className}
  `;

  return (
    <div ref={selectRef} className={baseClasses}>
      <div
        className="flex items-center justify-between px-3 py-2.5 min-h-[42px]"
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex-1 flex items-center space-x-2 min-w-0">
          {multiple && Array.isArray(value) && value.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {value.slice(0, 3).map((item) => (
                <span
                  key={item.value}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                >
                  {item.label}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveValue(item, e)}
                    className="ml-1 hover:text-blue-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {value.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{value.length - 3} more
                </span>
              )}
            </div>
          ) : (
            <span className={`truncate ${!value ? 'text-gray-400' : 'text-gray-900'}`}>
              {getDisplayValue()}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {clearable && value && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search options..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-2 text-sm text-gray-500">Loading...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">
                {searchQuery ? 'No options found' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`
                    flex items-center justify-between px-3 py-2 text-sm cursor-pointer
                    hover:bg-gray-50 transition-colors duration-150
                    ${isSelected(option) ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                    ${optionClassName}
                  `}
                  onClick={() => handleOptionClick(option)}
                >
                  <div className="flex-1">
                    {renderOption ? renderOption(option) : option.label}
                  </div>
                  
                  {isSelected(option) && (
                    <Check className="w-4 h-4 text-blue-600" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});

Select.displayName = 'Select';

export default Select;