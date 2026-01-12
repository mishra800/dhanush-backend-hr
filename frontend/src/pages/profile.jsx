import { useState, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import ProfileImageUpload from '../components/ProfileImageUpload';
import ProfileValidation from '../components/ProfileValidation';
import api from '../api/axios';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    department: '',
    position: '',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    date_of_birth: ''
  });
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [missingFields, setMissingFields] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Use validation hook
  const validation = ProfileValidation({ 
    formData, 
    onValidationChange: (isValid, errors) => {
      setIsFormValid(isValid);
      setValidationErrors(errors);
    }
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get('/users/me');
      setProfile(response.data);
      
      // Load employee details if available
      if (response.data.employee) {
        setFormData({
          first_name: response.data.employee.first_name || '',
          last_name: response.data.employee.last_name || '',
          phone: response.data.employee.phone || '',
          department: response.data.employee.department || '',
          position: response.data.employee.position || '',
          address: response.data.employee.address || '',
          emergency_contact_name: response.data.employee.emergency_contact_name || '',
          emergency_contact_phone: response.data.employee.emergency_contact_phone || '',
          date_of_birth: response.data.employee.date_of_birth ? response.data.employee.date_of_birth.split('T')[0] : ''
        });
      }

      // Load profile completion status
      try {
        const statusResponse = await api.get('/employees/me/profile-status');
        setProfileCompletion(statusResponse.data.profile_completion);
        setMissingFields(statusResponse.data.missing_fields);
      } catch (statusError) {
        console.log('Error loading profile status:', statusError);
      }

      // Load profile image
      try {
        const imageResponse = await api.get('/attendance/check-profile-image');
        if (imageResponse.data.profile_image_url) {
          setProfileImage(imageResponse.data.profile_image_url);
        }
      } catch (imageError) {
        console.log('No profile image found or error loading image');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!isFormValid) {
      alert('Please fix the validation errors before saving.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.put('/employees/me/profile', formData);
      alert('Profile updated successfully!');
      setEditing(false);
      
      // Update profile completion from response
      if (response.data.profile_completion) {
        setProfileCompletion(response.data.profile_completion);
      }
      
      loadProfile();
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message;
      alert('Failed to update profile: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpdate = (imageData) => {
    // Update the profile image immediately
    setProfileImage(imageData);
    // Also refresh profile to get updated image from server
    loadProfile();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600">Manage your personal information and profile photo</p>
              
              {/* Profile Completion Status */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Profile Completion</span>
                  <span className="text-sm font-medium text-gray-900">{profileCompletion}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      profileCompletion >= 80 ? 'bg-green-600' : 
                      profileCompletion >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                    }`}
                    style={{ width: `${profileCompletion}%` }}
                  ></div>
                </div>
                {missingFields.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Missing: {missingFields.join(', ').replace(/_/g, ' ')}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  {editing ? (
                    <div>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                        className={validation.getFieldClassName('first_name', 'w-full px-3 py-2 border rounded-lg focus:ring-2')}
                      />
                      {validation.hasError('first_name') && (
                        <p className="text-red-500 text-xs mt-1">{validation.getFieldError('first_name')}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-900">{formData.first_name || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  {editing ? (
                    <div>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                        className={validation.getFieldClassName('last_name', 'w-full px-3 py-2 border rounded-lg focus:ring-2')}
                      />
                      {validation.hasError('last_name') && (
                        <p className="text-red-500 text-xs mt-1">{validation.getFieldError('last_name')}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-900">{formData.last_name || 'Not set'}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900">{user?.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                {editing ? (
                  <div>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className={validation.getFieldClassName('phone', 'w-full px-3 py-2 border rounded-lg focus:ring-2')}
                      placeholder="Enter your phone number"
                    />
                    {validation.hasError('phone') && (
                      <p className="text-red-500 text-xs mt-1">{validation.getFieldError('phone')}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">{formData.phone || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                {editing ? (
                  <div>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                      className={validation.getFieldClassName('department', 'w-full px-3 py-2 border rounded-lg focus:ring-2')}
                    />
                    {validation.hasError('department') && (
                      <p className="text-red-500 text-xs mt-1">{validation.getFieldError('department')}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">{formData.department || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                {editing ? (
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{formData.position || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <p className="text-gray-900 capitalize">{user?.role || 'Employee'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                {editing ? (
                  <div>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                      className={validation.getFieldClassName('date_of_birth', 'w-full px-3 py-2 border rounded-lg focus:ring-2')}
                    />
                    {validation.hasError('date_of_birth') && (
                      <p className="text-red-500 text-xs mt-1">{validation.getFieldError('date_of_birth')}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900">{formData.date_of_birth || 'Not set'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                {editing ? (
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your full address"
                  />
                ) : (
                  <p className="text-gray-900">{formData.address || 'Not set'}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                  {editing ? (
                    <input
                      type="text"
                      value={formData.emergency_contact_name}
                      onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Emergency contact name"
                    />
                  ) : (
                    <p className="text-gray-900">{formData.emergency_contact_name || 'Not set'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                  {editing ? (
                    <div>
                      <input
                        type="tel"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                        className={validation.getFieldClassName('emergency_contact_phone', 'w-full px-3 py-2 border rounded-lg focus:ring-2')}
                        placeholder="Emergency contact phone"
                      />
                      {validation.hasError('emergency_contact_phone') && (
                        <p className="text-red-500 text-xs mt-1">{validation.getFieldError('emergency_contact_phone')}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-900">{formData.emergency_contact_phone || 'Not set'}</p>
                  )}
                </div>
              </div>

              {editing && (
                <div className="space-y-2">
                  <button
                    onClick={handleSave}
                    disabled={loading || !isFormValid}
                    className={`w-full py-2 rounded-lg transition ${
                      loading || !isFormValid 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white`}
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                  
                  {!isFormValid && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-red-800 text-sm font-medium">Please fix the following errors:</p>
                      <ul className="text-red-700 text-xs mt-1 list-disc list-inside">
                        {Object.values(validationErrors).map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Profile Image Upload */}
          <ProfileImageUpload 
            currentImage={profileImage}
            onImageUpdate={handleImageUpdate}
          />
        </div>

        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-800">Profile Photo Required for Attendance</h3>
              <p className="text-sm text-blue-700 mt-1">
                Please upload your profile photo to use the face recognition attendance system.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}