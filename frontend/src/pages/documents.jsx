import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { useToast } from '../hooks/usetoast';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const fileInputRef = useRef(null);
  const { showToast } = useToast();

  const [uploadForm, setUploadForm] = useState({
    document_type: 'General',
    description: '',
    file: null
  });

  useEffect(() => {
    fetchDocuments();
    fetchDocumentTypes();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/documents/');
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      showToast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentTypes = async () => {
    try {
      const response = await api.get('/documents/types');
      setDocumentTypes(response.data.document_types);
    } catch (error) {
      console.error('Error fetching document types:', error);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be less than 10MB', 'error');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        showToast('Invalid file type. Allowed: PDF, DOC, DOCX, JPG, PNG', 'error');
        return;
      }
      
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadForm.file) {
      showToast('Please select a file to upload', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('document_type', uploadForm.document_type);
      if (uploadForm.description) {
        formData.append('description', uploadForm.description);
      }

      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.is_verified) {
        showToast(`Document uploaded and verified! (Confidence: ${response.data.ocr_confidence}%)`, 'success');
      } else {
        showToast(`Document uploaded but needs manual verification. Reason: ${response.data.rejection_reason}`, 'warning');
      }

      setShowUploadModal(false);
      resetUploadForm();
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
      showToast('Failed to upload document', 'error');
    } finally {
      setUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadForm({
      document_type: 'General',
      description: '',
      file: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = async (documentId, fileName) => {
    try {
      const response = await api.get(`/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      showToast('Failed to download document', 'error');
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await api.delete(`/documents/${documentId}`);
      showToast('Document deleted successfully', 'success');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      showToast('Failed to delete document', 'error');
    }
  };

  const handleViewDetails = async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}`);
      setSelectedDocument(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching document details:', error);
      showToast('Failed to load document details', 'error');
    }
  };

  const filteredDocs = filter === 'all' 
    ? documents 
    : documents.filter(doc => doc.document_type === filter);

  const getStatusColor = (isVerified, ocr_confidence) => {
    if (isVerified) return 'bg-green-100 text-green-800';
    if (ocr_confidence < 75) return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (isVerified, ocr_confidence) => {
    if (isVerified) return 'Verified';
    if (ocr_confidence < 75) return 'Needs Review';
    return 'Pending';
  };

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return '🖼️';
      default:
        return '📎';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">My Documents</h1>
        <button 
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Upload Document
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            All ({documents.length})
          </button>
          {documentTypes.map((type) => {
            const count = documents.filter(doc => doc.document_type === type).length;
            return count > 0 ? (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-lg ${
                  filter === type ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {type} ({count})
              </button>
            ) : null;
          })}
        </div>

        {/* Documents List */}
        <div className="space-y-3">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-2xl">
                  {getFileIcon(doc.document_url)}
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">
                    {doc.document_type}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()} • 
                    Confidence: {doc.ocr_confidence}%
                  </p>
                  {doc.rejection_reason && (
                    <p className="text-sm text-red-600 mt-1">
                      ⚠️ {doc.rejection_reason}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(doc.is_verified, doc.ocr_confidence)}`}>
                  {getStatusText(doc.is_verified, doc.ocr_confidence)}
                </span>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleViewDetails(doc.id)}
                    className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                  >
                    Details
                  </button>
                  <button 
                    onClick={() => handleDownload(doc.id, `${doc.document_type}_${doc.id}`)}
                    className="px-3 py-1 text-green-600 hover:bg-green-50 rounded text-sm"
                  >
                    Download
                  </button>
                  <button 
                    onClick={() => handleDelete(doc.id)}
                    className="px-3 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDocs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">No documents found</p>
            <p className="text-sm">Upload your first document to get started</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Upload Document</h2>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Document Type *
                </label>
                <select
                  value={uploadForm.document_type}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, document_type: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {documentTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the document..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File *
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: PDF, DOC, DOCX, JPG, PNG (Max 10MB)
                </p>
                {uploadForm.file && (
                  <p className="text-sm text-green-600 mt-2">
                    ✅ Selected: {uploadForm.file.name}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={uploading || !uploadForm.file}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {uploading ? 'Uploading...' : 'Upload Document'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUploadForm();
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Details Modal */}
      {showDetailsModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Document Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Document Type</label>
                  <p className="text-gray-900">{selectedDocument.document_type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(selectedDocument.is_verified, selectedDocument.ocr_confidence)}`}>
                    {getStatusText(selectedDocument.is_verified, selectedDocument.ocr_confidence)}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">OCR Confidence</label>
                  <p className="text-gray-900">{selectedDocument.ocr_confidence}%</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Uploaded</label>
                  <p className="text-gray-900">{new Date(selectedDocument.uploaded_at).toLocaleString()}</p>
                </div>
              </div>

              {selectedDocument.rejection_reason && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rejection Reason</label>
                  <p className="text-red-600">{selectedDocument.rejection_reason}</p>
                </div>
              )}

              {selectedDocument.verified_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Verified At</label>
                  <p className="text-gray-900">{new Date(selectedDocument.verified_at).toLocaleString()}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => handleDownload(selectedDocument.document_id, `${selectedDocument.document_type}_${selectedDocument.document_id}`)}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                >
                  Download
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}