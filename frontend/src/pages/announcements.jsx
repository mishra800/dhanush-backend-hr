import { useState, useEffect } from 'react';
import { useAuth } from '../context/authcontext';
import api from '../api/axios';

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    category: 'all',
    priority: 'all',
    showExpired: false
  });
  const [newAnn, setNewAnn] = useState({ 
    title: '', 
    content: '', 
    priority: 'normal',
    category: 'general',
    expires_at: ''
  });
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const { user } = useAuth();
  
  const isAdmin = user && ['admin', 'hr'].includes(user.role);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'hr': return '👥';
      case 'it': return '💻';
      case 'finance': return '💰';
      case 'general': return '📢';
      case 'urgent': return '🚨';
      default: return '📢';
    }
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  useEffect(() => {
    fetchAnnouncements();
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/announcements/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    applyFilters();
  }, [announcements, filters]);

  const applyFilters = () => {
    let filtered = [...announcements];
    
    // Filter by category
    if (filters.category !== 'all') {
      filtered = filtered.filter(ann => ann.category === filters.category);
    }
    
    // Filter by priority
    if (filters.priority !== 'all') {
      filtered = filtered.filter(ann => ann.priority === filters.priority);
    }
    
    // Filter expired announcements
    if (!filters.showExpired) {
      filtered = filtered.filter(ann => !isExpired(ann.expires_at));
    }
    
    setFilteredAnnouncements(filtered);
  };

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      // Use the endpoint that includes acknowledgment status if user is logged in
      const endpoint = user ? '/announcements/with-status' : '/announcements/';
      const response = await api.get(endpoint);
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
      // Fallback to basic endpoint
      try {
        const response = await api.get('/announcements/');
        setAnnouncements(response.data);
      } catch (fallbackError) {
        console.error('Error fetching announcements (fallback):', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newAnn.title.trim() || !newAnn.content.trim()) {
      alert('Please fill in both title and content');
      return;
    }
    
    try {
      setPosting(true);
      const payload = {
        title: newAnn.title,
        content: newAnn.content,
        priority: newAnn.priority,
        category: newAnn.category
      };
      
      // Add expires_at if provided
      if (newAnn.expires_at) {
        payload.expires_at = new Date(newAnn.expires_at).toISOString();
      }
      
      await api.post('/announcements/', payload);
      setNewAnn({ 
        title: '', 
        content: '', 
        priority: 'normal',
        category: 'general',
        expires_at: ''
      });
      fetchAnnouncements();
      if (isAdmin) {
        fetchStats();
      }
      alert("Announcement posted successfully!");
    } catch (error) {
      console.error('Error posting announcement:', error);
      alert('Error posting announcement. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const handleAcknowledge = async (announcementId) => {
    try {
      const response = await api.post(`/announcements/${announcementId}/acknowledge`);
      alert(response.data.message);
      fetchAnnouncements(); // Refresh to update acknowledgment status
    } catch (error) {
      console.error('Error acknowledging announcement:', error);
      if (error.response?.status === 404) {
        alert('Announcement not found or you are not registered as an employee.');
      } else {
        alert('Error acknowledging announcement. Please try again.');
      }
    }
  };

  const handleToggleStatus = async (announcementId, currentStatus) => {
    try {
      const response = await api.put(`/announcements/${announcementId}/toggle-status`);
      alert(response.data.message);
      fetchAnnouncements();
      if (isAdmin) {
        fetchStats();
      }
    } catch (error) {
      console.error('Error toggling announcement status:', error);
      alert('Error updating announcement status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading announcements...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">📢 Communication Hub</h1>

      {/* Filters */}
      <div className="bg-white shadow sm:rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Category:</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              className="border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="general">General</option>
              <option value="hr">HR</option>
              <option value="it">IT</option>
              <option value="finance">Finance</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Priority:</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
              className="border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showExpired"
              checked={filters.showExpired}
              onChange={(e) => setFilters({ ...filters, showExpired: e.target.checked })}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="showExpired" className="text-sm font-medium text-gray-700">
              Show expired
            </label>
          </div>
          
          <div className="ml-auto text-sm text-gray-500">
            Showing {filteredAnnouncements.length} of {announcements.length} announcements
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Feed */}
        <div className="lg:col-span-2 space-y-6">
          {filteredAnnouncements.map((ann) => (
            <div key={ann.id} className={`bg-white shadow overflow-hidden sm:rounded-lg ${isExpired(ann.expires_at) ? 'opacity-60' : ''} ${!ann.is_active ? 'border-l-4 border-red-500' : ''}`}>
              <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getCategoryIcon(ann.category)}</span>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">{ann.title}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(ann.priority)}`}>
                      {ann.priority.toUpperCase()}
                    </span>
                    {ann.category !== 'general' && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                        {ann.category.toUpperCase()}
                      </span>
                    )}
                    {!ann.is_active && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        INACTIVE
                      </span>
                    )}
                  </div>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Posted by {ann.author_name || 'HR'} • {new Date(ann.created_at).toLocaleDateString()}
                    {ann.expires_at && (
                      <span className={`ml-2 ${isExpired(ann.expires_at) ? 'text-red-600 font-medium' : 'text-orange-600'}`}>
                        • {isExpired(ann.expires_at) ? 'Expired' : 'Expires'} {new Date(ann.expires_at).toLocaleDateString()}
                      </span>
                    )}
                    {ann.acknowledged && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Acknowledged
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <p className="text-gray-700 whitespace-pre-wrap">{ann.content}</p>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {ann.acknowledged_at && (
                    <span>Acknowledged on {new Date(ann.acknowledged_at).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {user && !ann.acknowledged && ann.is_active && (
                    <button 
                      onClick={() => handleAcknowledge(ann.id)}
                      className="text-sm text-blue-600 hover:text-blue-500 font-medium hover:bg-blue-50 px-3 py-1 rounded"
                    >
                      Mark as Read
                    </button>
                  )}
                  {ann.acknowledged && (
                    <span className="text-sm text-green-600 font-medium">✓ Read</span>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleToggleStatus(ann.id, ann.is_active)}
                      className={`text-sm font-medium px-3 py-1 rounded ${
                        ann.is_active 
                          ? 'text-red-600 hover:text-red-500 hover:bg-red-50' 
                          : 'text-green-600 hover:text-green-500 hover:bg-green-50'
                      }`}
                    >
                      {ann.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filteredAnnouncements.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📢</div>
              {announcements.length === 0 ? (
                <>
                  <p className="text-gray-500 text-lg">No announcements yet.</p>
                  <p className="text-gray-400 text-sm">Check back later for company updates.</p>
                </>
              ) : (
                <>
                  <p className="text-gray-500 text-lg">No announcements match your filters.</p>
                  <p className="text-gray-400 text-sm">Try adjusting your filter settings.</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Post Form (Admin Only) */}
        {isAdmin && (
          <div className="space-y-6">
            {/* Stats Panel */}
            {stats && (
              <div className="bg-white shadow sm:rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">📊 Statistics</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.total_announcements}</div>
                    <div className="text-sm text-blue-800">Total</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.active_announcements}</div>
                    <div className="text-sm text-green-800">Active</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700">Recent Acknowledgment Rates:</h4>
                  {stats.recent_announcement_stats.map((stat) => (
                    <div key={stat.id} className="flex justify-between items-center text-sm">
                      <span className="truncate flex-1 mr-2" title={stat.title}>
                        {stat.title.length > 25 ? stat.title.substring(0, 25) + '...' : stat.title}
                      </span>
                      <span className={`font-medium ${
                        stat.acknowledgment_rate >= 80 ? 'text-green-600' :
                        stat.acknowledgment_rate >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {stat.acknowledgment_rate}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Post Form */}
            <div className="bg-white shadow sm:rounded-lg p-6 sticky top-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Post New Announcement</h3>
            <form onSubmit={handlePost} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={newAnn.title}
                  onChange={(e) => setNewAnn({ ...newAnn, title: e.target.value })}
                  required
                  disabled={posting}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                  placeholder="Enter announcement title..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    value={newAnn.priority}
                    onChange={(e) => setNewAnn({ ...newAnn, priority: e.target.value })}
                    disabled={posting}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={newAnn.category}
                    onChange={(e) => setNewAnn({ ...newAnn, category: e.target.value })}
                    disabled={posting}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                  >
                    <option value="general">General</option>
                    <option value="hr">HR</option>
                    <option value="it">IT</option>
                    <option value="finance">Finance</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <textarea
                  rows={4}
                  value={newAnn.content}
                  onChange={(e) => setNewAnn({ ...newAnn, content: e.target.value })}
                  required
                  disabled={posting}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                  placeholder="Enter announcement content..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Expires On (Optional)</label>
                <input
                  type="date"
                  value={newAnn.expires_at}
                  onChange={(e) => setNewAnn({ ...newAnn, expires_at: e.target.value })}
                  disabled={posting}
                  min={new Date().toISOString().split('T')[0]}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                />
                <p className="mt-1 text-xs text-gray-500">Leave empty for permanent announcements</p>
              </div>
              
              <button 
                type="submit" 
                disabled={posting}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {posting ? 'Posting...' : 'Broadcast to All'}
              </button>
            </form>
            </div>
          </div>
        )}
        
        {/* Info Panel for Non-Admins */}
        {!isAdmin && user && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 h-fit sticky top-6">
            <div className="flex items-center mb-3">
              <div className="text-blue-600 text-2xl mr-3">ℹ️</div>
              <h3 className="text-lg font-medium text-blue-900">Stay Updated</h3>
            </div>
            <p className="text-blue-700 text-sm mb-4">
              This is your company communication hub. Important announcements, updates, and news will appear here.
            </p>
            <div className="text-xs text-blue-600">
              <p>• Mark announcements as read to track your progress</p>
              <p>• Check regularly for important updates</p>
              <p>• Contact HR if you have questions</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
