import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function OnboardingNotifications({ employeeId }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (employeeId) {
      fetchNotifications();
    }
  }, [employeeId]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/onboarding/notifications/${employeeId}`);
      setNotifications(response.data);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/onboarding/notifications/${notificationId}/read`);
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, is_read: true }
            : notif
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'phase_advance': '🎯',
      'compliance_approved': '✅',
      'it_provisioned': '💻',
      'document_verified': '📄',
      'reminder': '⏰',
      'welcome': '👋',
      'completion': '🎉'
    };
    return icons[type] || '📢';
  };

  const getNotificationColor = (type, priority) => {
    if (priority === 'high') return 'bg-red-50 border-red-200 text-red-800';
    if (priority === 'medium') return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    
    const colors = {
      'compliance_approved': 'bg-green-50 border-green-200 text-green-800',
      'it_provisioned': 'bg-blue-50 border-blue-200 text-blue-800',
      'document_verified': 'bg-purple-50 border-purple-200 text-purple-800',
      'phase_advance': 'bg-indigo-50 border-indigo-200 text-indigo-800'
    };
    
    return colors[type] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  const displayedNotifications = showAll ? notifications : notifications.slice(0, 5);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            📢 Onboarding Updates
          </h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📭</div>
            <p className="text-gray-500">No notifications yet</p>
            <p className="text-sm text-gray-400">You'll receive updates as you progress through onboarding</p>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md ${
                  getNotificationColor(notification.type, notification.priority)
                } ${!notification.is_read ? 'ring-2 ring-blue-200' : ''}`}
                onClick={() => !notification.is_read && markAsRead(notification.id)}
              >
                <div className="flex items-start">
                  <span className="text-2xl mr-3 flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold truncate">
                        {notification.title}
                      </h4>
                      <div className="flex items-center ml-2">
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm mt-1 text-gray-600">
                      {notification.message}
                    </p>
                    {notification.action_url && (
                      <a
                        href={notification.action_url}
                        className="inline-flex items-center mt-2 text-xs font-medium text-blue-600 hover:text-blue-800"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Take Action →
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {notifications.length > 5 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="w-full py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                {showAll ? 'Show Less' : `Show All (${notifications.length - 5} more)`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}