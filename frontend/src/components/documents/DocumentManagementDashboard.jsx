import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useToast } from '../../hooks/usetoast';

export default function DocumentManagementDashboard() {
  const [documents, setDocuments] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationForm, setVerificationForm] = useState({
    status: true,
    rejection_reason: ''
  });
  const { showToast } = useToast();

  useEffect(() => {
    fetchDocuments();
    fetchStatistics();
  }, [filter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      let params = {};
      
      if (filter === 'pending') {
        params.verification_status = false;
      } else if (filter === 'verified') {
        params.verification_status = true;
      }
      
      const response = await api.get('/documents/all', { params });
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
      showToast('Failed to load documents', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/documents/statistics');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleVerifyDocument = async (e) => {
    e.preventDefault();
    
    try {
      await api.put(`/documents/${selectedDocument.document_id}/verify`, null, {
        params: {
          verification_status: verificationForm.status,
          rejection_reason: verificationForm.status ? null : verificationForm.rejection_reason
        }
      });
      
      showToast(
        `Document ${verificationForm.status ? 'verified' : 'rejected'} successfully`,
        'success'
      );
      
      setShowVerificationModal(false);
      setSelectedDocument(null);
      setVerificationForm({ status: true, rejection_reason: '' });
      fetchDocuments();
      fetchStatistics();
    } catch (error) {
      console.error('Error verifying document:', error);
      showToast('Failed to update document status', 'error');
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
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png': return '🖼️';
      default: return '📎';
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Document Management</h2>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Documents</h3>
            <p className="text-3xl font-bold text-blue-600">{statistics.total_documents}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Verified</h3>
            <p className="text-3xl font-bold text-green-600">{statistics.verified_documents}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-orange-600">{statistics.pending_documents}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Verification Rate</h3>
            <p className="text-3xl font-bold text-purple-600">{statistics.verification_rate}%</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            All Documents
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'pending' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Pending Verification
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'verified' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Verified
          </button>
        </div>

        {/* Documents Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  OCR Confidence
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uploaded
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.document_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getFileIcon(doc.document_url)}</span>
                      <span className="text-sm font-medium text-gray-900">
                        Document #{doc.document_id}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{doc.employee_name}</div>
                    <div className="text-sm text-gray-500">ID: {doc.employee_id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{doc.document_type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(doc.is_verified, doc.ocr_confidence)}`}>
                      {getStatusText(doc.is_verified, doc.ocr_confidence)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{doc.ocr_confidence}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${doc.ocr_confidence >= 75 ? 'bg-green-600' : 'bg-red-600'}`}
                        style={{ width: `${doc.ocr_confidence}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleDownload(doc.document_id, `${doc.document_type}_${doc.employee_name}`)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Download
                      </button>
                      {!doc.is_verified && (
                        <button
                          onClick={() => {
                            setSelectedDocument(doc);
                            setShowVerificationModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Verify
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {documents.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">No documents found</p>
            <p className="text-sm">Documents will appear here when employees upload them</p>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {showVerificationModal && selectedDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Verify Document</h2>
              <button
                onClick={() => {
                  setShowVerificationModal(false);
                  setSelectedDocument(null);
                  setVerificationForm({ status: true, rejection_reason: '' });
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-gray-900">{selectedDocument.document_type}</h3>
              <p className="text-sm text-gray-600">Employee: {selectedDocument.employee_name}</p>
              <p className="text-sm text-gray-600">OCR Confidence: {selectedDocument.ocr_confidence}%</p>
              {selectedDocument.rejection_reason && (
                <p className="text-sm text-red-600 mt-2">
                  Current Issue: {selectedDocument.rejection_reason}
                </p>
              )}
            </div>

            <form onSubmit={handleVerifyDocument} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Verification Decision
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      checked={verificationForm.status === true}
                      onChange={() => setVerificationForm(prev => ({ ...prev, status: true }))}
                      className="mr-2"
                    />
                    <span className="text-green-600">✅ Approve Document</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="status"
                      checked={verificationForm.status === false}
                      onChange={() => setVerificationForm(prev => ({ ...prev, status: false }))}
                      className="mr-2"
                    />
                    <span className="text-red-600">❌ Reject Document</span>
                  </label>
                </div>
              </div>

              {verificationForm.status === false && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={verificationForm.rejection_reason}
                    onChange={(e) => setVerificationForm(prev => ({ ...prev, rejection_reason: e.target.value }))}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    placeholder="Please provide a clear reason for rejection..."
                    required={verificationForm.status === false}
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className={`flex-1 py-2 px-4 rounded-md text-white ${
                    verificationForm.status 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {verificationForm.status ? 'Approve Document' : 'Reject Document'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowVerificationModal(false);
                    setSelectedDocument(null);
                    setVerificationForm({ status: true, rejection_reason: '' });
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
    </div>
  );
}