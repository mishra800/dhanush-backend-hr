import React from 'react';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

const FormField = ({
  children,
  label,
  error,
  success,
  hint,
  required = false,
  className = '',
  labelClassName = '',
  ...props
}) => {
  return (
    <div className={`space-y-2 ${className}`} {...props}>
      {label && (
        <label className={`block text-sm font-medium text-gray-700 ${labelClassName}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {children}
      
      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      {success && !error && (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}
      
      {hint && !error && !success && (
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{hint}</span>
        </div>
      )}
    </div>
  );
};

export default FormField;