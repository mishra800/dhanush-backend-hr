import { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X, Eye } from 'lucide-react';
import api from '../../api/axios';

export default function BulkImportEmployees() {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setImportResult(null);
      previewFile(selectedFile);
    }
  };

  const previewFile = async (file) => {
    try {
      const text = await file.text();
      const lines = text.split('\n').slice(0, 6); // Preview first 5 rows + header
      const preview = lines.map(line => line.split(','));
      setPreviewData(preview);
      setShowPreview(true);
    } catch (error) {
      console.error('Error previewing file:', error);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/employees/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setImportResult(response.data);
    } catch (error) {
      console.error('Error importing employees:', error);
      setImportResult({
        status: 'failed',
        error_details: { system_error: error.response?.data?.detail || 'Import failed' }
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await api.get('/employees/bulk-import/template', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employee_import_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  const resetImport = () => {
    setFile(null);
    setImportResult(null);
    setShowPreview(false);
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Import Employees</h1>
          <p className="text-gray-600">Import multiple employees from CSV or Excel file</p>
        </div>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          ← Back to Directory
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-900 mb-2">Import Instructions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Download the template file to see the required format</li>
          <li>• Required fields: first_name, last_name, email</li>
          <li>• Optional fields: department, position, phone, date_of_joining, employee_code, manager_email, employment_type, work_location</li>
          <li>• Supported formats: CSV, Excel (.xlsx, .xls)</li>
          <li>• Email addresses must be unique</li>
        </ul>
      </div>

      {/* Template Download */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="font-medium text-gray-900">Download Template</h3>
              <p className="text-sm text-gray-600">Get the CSV template with sample data</p>
            </div>
          </div>
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            Download Template
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="font-medium text-gray-900 mb-4">Upload Employee Data</h3>
        
        {!file ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Choose a file to upload</h4>
            <p className="text-gray-600 mb-4">CSV or Excel files up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Select File
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                onClick={resetImport}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview */}
            {showPreview && previewData.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">File Preview (first 5 rows)</span>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className={index === 0 ? 'bg-blue-50' : 'bg-white'}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-4 py-2 text-sm border-r border-gray-200 last:border-r-0">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Import Button */}
            <div className="flex justify-end">
              <button
                onClick={handleImport}
                disabled={importing}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Import Employees
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import Results */}
      {importResult && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-medium text-gray-900 mb-4">Import Results</h3>
          
          {/* Status */}
          <div className={`flex items-center gap-2 p-4 rounded-lg mb-4 ${
            importResult.status === 'completed' 
              ? 'bg-green-50 border border-green-200' 
              : importResult.status === 'partial'
              ? 'bg-yellow-50 border border-yellow-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            {importResult.status === 'completed' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            <span className={`font-medium ${
              importResult.status === 'completed' 
                ? 'text-green-800' 
                : importResult.status === 'partial'
                ? 'text-yellow-800'
                : 'text-red-800'
            }`}>
              {importResult.status === 'completed' && 'Import Completed Successfully'}
              {importResult.status === 'partial' && 'Import Partially Completed'}
              {importResult.status === 'failed' && 'Import Failed'}
            </span>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Total Records</p>
              <p className="text-2xl font-bold text-gray-900">{importResult.total_records}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600">Successful</p>
              <p className="text-2xl font-bold text-green-900">{importResult.successful_records}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <p className="text-sm text-red-600">Failed</p>
              <p className="text-2xl font-bold text-red-900">{importResult.failed_records}</p>
            </div>
          </div>

          {/* Errors */}
          {importResult.error_details && (
            <div className="space-y-4">
              {importResult.error_details.validation_errors && (
                <div>
                  <h4 className="font-medium text-red-900 mb-2">Validation Errors</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <ul className="text-sm text-red-800 space-y-1">
                      {importResult.error_details.validation_errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {importResult.error_details.import_errors && (
                <div>
                  <h4 className="font-medium text-red-900 mb-2">Import Errors</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <ul className="text-sm text-red-800 space-y-1">
                      {importResult.error_details.import_errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {importResult.error_details.system_error && (
                <div>
                  <h4 className="font-medium text-red-900 mb-2">System Error</h4>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">{importResult.error_details.system_error}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={resetImport}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Import Another File
            </button>
            <button
              onClick={() => window.location.href = '/employees/directory'}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Employee Directory
            </button>
          </div>
        </div>
      )}
    </div>
  );
}