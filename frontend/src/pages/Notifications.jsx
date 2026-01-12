import React, { useState, useEffect } from 'react';
import { Bell, Check, X, Filter, Search, AlertCircle, Info, CheckCircle, AlertTriangle, Trash2, Settings } from 'lucide-react';
import { useAuth } from '../context/authcontext';
import api from '../api/axios';
import logo from '../assets/logo.png';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, application, status_change, leave, attendance, payroll, assets
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    email_enabled: true,
    sms_enabled: false,
    whatsapp_enabled: false,
    phone_number: '',
    whatsapp_number: ''
  });

  useEffect(() => {
    loadNotifications();
    loadPreferences();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/notifications/');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setError('Failed to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await api.get('/notifications/preferences');
      setPreferences(response.data);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.patch(`/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to mark notification as read.');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/mark-all-read');
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setError('Failed to mark all notifications as read.');
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification.');
    }
  };

  const bulkMarkAsRead = async () => {
    if (selectedNotifications.length === 0) return;
    
    try {
      setError(null);
      const promises = selectedNotifications.map(id => 
        api.patch(`/notifications/${id}/read`)
      );
      await Promise.all(promises);
      
      setNotifications(prev => 
        prev.map(notif => 
          selectedNotifications.includes(notif.id) 
            ? { ...notif, is_read: true }
            : notif
        )
      );
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error bulk marking as read:', error);
      setError('Failed to mark selected notifications as read. Please try again.');
    }
  };

  const bulkDelete = async () => {
    if (selectedNotifications.length === 0) return;
    
    if (!window.confirm(`Delete ${selectedNotifications.length} selected notifications? This action cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      const promises = selectedNotifications.map(id => 
        api.delete(`/notifications/${id}`)
      );
      await Promise.all(promises);
      
      setNotifications(prev => 
        prev.filter(notif => !selectedNotifications.includes(notif.id))
      );
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error bulk deleting:', error);
      setError('Failed to delete selected notifications. Please try again.');
    }
  };

  const sendTestNotification = async () => {
    try {
      setError(null);
      await api.post('/notifications/test-notification');
      
      // Show success message
      const successNotification = {
        id: Date.now(),
        title: "Test Notification Sent",
        message: "A test notification has been sent successfully.",
        type: "success",
        created_at: new Date().toISOString(),
        is_read: false
      };
      setNotifications(prev => [successNotification, ...prev]);
    } catch (error) {
      console.error('Error sending test notification:', error);
      setError('Failed to send test notification. You may not have permission.');
    }
  };

  const updatePreferences = async (newPreferences) => {
    try {
      setError(null);
      await api.patch('/notifications/preferences', newPreferences);
      setPreferences(newPreferences);
      setShowPreferences(false);
      
      // Show success message
      const successNotification = {
        id: Date.now(),
        title: "Preferences Updated",
        message: "Your notification preferences have been saved successfully.",
        type: "success",
        created_at: new Date().toISOString(),
        is_read: false
      };
      setNotifications(prev => [successNotification, ...prev]);
    } catch (error) {
      console.error('Error updating preferences:', error);
      setError('Failed to update notification preferences. Please try again.');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_application':
      case 'application':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'status_change':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'leave':
        return <span className="text-emerald-500 text-lg">🏖️</span>;
      case 'attendance':
        return <span className="text-orange-500 text-lg">📅</span>;
      case 'payroll':
        return <span className="text-yellow-500 text-lg">💰</span>;
      case 'assets':
        return <span className="text-purple-500 text-lg">💻</span>;
      case 'wfh':
        return <span className="text-indigo-500 text-lg">🏠</span>;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.is_read) ||
      (filter === 'application' && notification.type === 'new_application') ||
      (filter === 'status_change' && notification.type === 'status_change') ||
      (filter === 'leave' && notification.type === 'leave') ||
      (filter === 'attendance' && notification.type === 'attendance') ||
      (filter === 'payroll' && notification.type === 'payroll') ||
      (filter === 'assets' && notification.type === 'assets') ||
      (filter === 'wfh' && notification.type === 'wfh');
    
    const matchesSearch = searchTerm === '' || 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const selectedCount = selectedNotifications.length;

  const toggleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Company Logo Header */}
        <div className="bg-white shadow rounded-lg p-6 text-center mb-8">
          <img src={logo} alt="Company Logo" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">🔔 Notifications</h1>
          <p className="text-gray-600 mt-2">Stay updated with the latest activities and alerts</p>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Company Logo Header */}
        <div className="bg-white shadow rounded-lg p-6 text-center mb-8">
          <img src={logo} alt="Company Logo" className="h-16 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">🔔 Notifications</h1>
          <p className="text-gray-600 mt-2">Stay updated with the latest activities and alerts</p>
        </div>
        
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
            <div className="flex-1">
              <h3 className="text-red-800 font-medium">Error Loading Notifications</h3>
              <p className="text-red-700 text-sm mt-1">{error}</p>
              <div className="mt-3 flex space-x-3">
                <button 
                  onClick={loadNotifications}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  Try Again
                </button>
                <button 
                  onClick={() => setError(null)}
                  className="text-sm text-red-600 hover:text-red-800 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Company Logo Header */}
      <div className="bg-white shadow rounded-lg p-6 text-center mb-8">
        <img src={logo} alt="Company Logo" className="h-16 w-auto mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-gray-900">🔔 Notifications</h1>
        <p className="text-gray-600 mt-2">Stay updated with the latest activities and alerts</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-3" />
              <div>
                <h3 className="text-red-800 font-medium">Error</h3>
                <p className="text-red-700 text-sm mt-1">{error}</p>
              </div>
            </div>
            <button 
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Your Notifications ({notifications.length})
            </h2>
            {unreadCount > 0 && (
              <span className="bg-red-100 text-red-800 text-xs font-semibold px-2 py-1 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {selectedCount > 0 && (
              <>
                <button
                  onClick={bulkMarkAsRead}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center text-sm"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Mark Read ({selectedCount})
                </button>
                <button
                  onClick={bulkDelete}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center text-sm"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete ({selectedCount})
                </button>
              </>
            )}
            
            <button
              onClick={() => setShowPreferences(true)}
              className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center text-sm"
            >
              <Settings className="w-4 h-4 mr-1" />
              Preferences
            </button>
            
            <button
              onClick={sendTestNotification}
              className="bg-purple-100 text-purple-700 px-3 py-2 rounded-lg hover:bg-purple-200 transition-colors flex items-center text-sm"
              title="Send test notification (Admin only)"
            >
              <Bell className="w-4 h-4 mr-1" />
              Test
            </button>
            
            <button
              onClick={loadNotifications}
              className="bg-blue-100 text-blue-700 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors flex items-center text-sm"
              title="Refresh notifications"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
              >
                <Check className="w-4 h-4 mr-2" />
                Mark All Read ({unreadCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread Only</option>
              <option value="application">📝 Applications</option>
              <option value="status_change">✅ Status Changes</option>
              <option value="leave">🏖️ Leave Management</option>
              <option value="attendance">📅 Attendance</option>
              <option value="payroll">💰 Payroll</option>
              <option value="assets">💻 Assets</option>
              <option value="wfh">🏠 Work From Home</option>
            </select>
          </div>
          
          {/* Select All Checkbox */}
          {filteredNotifications.length > 0 && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="selectAll"
                checked={selectedNotifications.length === filteredNotifications.length}
                onChange={toggleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="selectAll" className="text-sm text-gray-700">
                Select All
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-500">
              {filter === 'unread' 
                ? "You're all caught up! No unread notifications."
                : searchTerm 
                ? "No notifications match your search criteria."
                : "You don't have any notifications yet."
              }
            </p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition-all hover:shadow-md ${
                !notification.is_read ? 'border-l-4 border-l-blue-500 bg-blue-50' : ''
              } ${selectedNotifications.includes(notification.id) ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-start space-x-4">
                {/* Selection Checkbox */}
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="checkbox"
                    checked={selectedNotifications.includes(notification.id)}
                    onChange={() => toggleSelectNotification(notification.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                
                {/* Notification Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`text-lg font-medium ${
                        !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {notification.title}
                        {!notification.is_read && (
                          <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </h3>
                      
                      <p className="text-gray-600 mt-2 leading-relaxed">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-gray-400">
                          {formatDate(notification.created_at)}
                        </p>
                        
                        <div className="flex items-center space-x-2">
                          {notification.action_url && (
                            <button
                              onClick={() => {
                                window.location.href = notification.action_url;
                                if (!notification.is_read) {
                                  markAsRead(notification.id);
                                }
                              }}
                              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                            >
                              View Details →
                            </button>
                          )}
                          
                          {!notification.is_read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Mark as read"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                            title="Delete notification"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Notification data display for application notifications */}
                  {notification.notification_data && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {notification.notification_data.candidate_name && (
                          <div>
                            <span className="font-medium text-gray-700">Candidate:</span>
                            <span className="ml-2 text-gray-600">{notification.notification_data.candidate_name}</span>
                          </div>
                        )}
                        {notification.notification_data.job_title && (
                          <div>
                            <span className="font-medium text-gray-700">Position:</span>
                            <span className="ml-2 text-gray-600">{notification.notification_data.job_title}</span>
                          </div>
                        )}
                        {notification.notification_data.employee_name && (
                          <div>
                            <span className="font-medium text-gray-700">Employee:</span>
                            <span className="ml-2 text-gray-600">{notification.notification_data.employee_name}</span>
                          </div>
                        )}
                        {notification.notification_data.old_status && notification.notification_data.new_status && (
                          <div className="col-span-2">
                            <span className="font-medium text-gray-700">Status Change:</span>
                            <span className="ml-2 text-gray-600">
                              {notification.notification_data.old_status} → {notification.notification_data.new_status}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Load More Button (if needed) */}
      {filteredNotifications.length > 0 && filteredNotifications.length % 20 === 0 && (
        <div className="text-center mt-8">
          <button
            onClick={() => {
              // Load more notifications logic here
              console.log('Load more notifications');
            }}
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Load More Notifications
          </button>
        </div>
      )}

      {/* Notification Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notification Preferences</h3>
                <button
                  onClick={() => setShowPreferences(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4">
              <div className="space-y-4">
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                    <p className="text-xs text-gray-500">Receive notifications via email</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.email_enabled}
                    onChange={(e) => setPreferences(prev => ({ ...prev, email_enabled: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                {/* SMS Notifications */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">SMS Notifications</label>
                      <p className="text-xs text-gray-500">Receive notifications via SMS</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.sms_enabled}
                      onChange={(e) => setPreferences(prev => ({ ...prev, sms_enabled: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  {preferences.sms_enabled && (
                    <input
                      type="tel"
                      placeholder="Phone number (e.g., +1234567890)"
                      value={preferences.phone_number}
                      onChange={(e) => setPreferences(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  )}
                </div>

                {/* WhatsApp Notifications */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">WhatsApp Notifications</label>
                      <p className="text-xs text-gray-500">Receive notifications via WhatsApp</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.whatsapp_enabled}
                      onChange={(e) => setPreferences(prev => ({ ...prev, whatsapp_enabled: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  {preferences.whatsapp_enabled && (
                    <input
                      type="tel"
                      placeholder="WhatsApp number (e.g., +1234567890)"
                      value={preferences.whatsapp_number}
                      onChange={(e) => setPreferences(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  )}
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowPreferences(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => updatePreferences(preferences)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;