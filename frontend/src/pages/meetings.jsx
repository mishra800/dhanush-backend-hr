import { useState, useEffect } from 'react';
import { format, parseISO, isToday, isTomorrow, isYesterday, addDays } from 'date-fns';
import api from '../api/axios';
import { useToast } from '../hooks/usetoast';

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('upcoming');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showActionItemsModal, setShowActionItemsModal] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const { showToast } = useToast();

  // Create meeting form state
  const [newMeeting, setNewMeeting] = useState({
    title: '',
    description: '',
    meeting_date: '',
    start_time: '09:00',
    end_time: '10:00',
    location: '',
    meeting_link: '',
    meeting_type: 'meeting',
    agenda: '',
    attendee_ids: []
  });

  // Notes and action items state
  const [meetingNotes, setMeetingNotes] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [newNote, setNewNote] = useState({ content: '', note_type: 'general', is_private: false });
  const [newActionItem, setNewActionItem] = useState({
    title: '',
    description: '',
    assigned_to: '',
    due_date: '',
    priority: 'medium'
  });

  const [users, setUsers] = useState([]);

  const meetingTypes = [
    { value: 'meeting', label: 'General Meeting', icon: '👥' },
    { value: 'standup', label: 'Team Standup', icon: '🏃' },
    { value: 'one-on-one', label: 'One-on-One', icon: '👤' },
    { value: 'performance-review', label: 'Performance Review', icon: '📊' },
    { value: 'team-building', label: 'Team Building', icon: '🎯' },
    { value: 'training', label: 'Training Session', icon: '📚' }
  ];

  const noteTypes = [
    { value: 'general', label: 'General Note' },
    { value: 'action-item', label: 'Action Item' },
    { value: 'decision', label: 'Decision' },
    { value: 'follow-up', label: 'Follow-up' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'text-green-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'high', label: 'High', color: 'text-orange-600' },
    { value: 'urgent', label: 'Urgent', color: 'text-red-600' }
  ];

  useEffect(() => {
    fetchMeetings();
    fetchUsers();
    if (view === 'analytics') {
      fetchAnalytics();
    }
  }, [view]);

  const fetchMeetings = async () => {
    try {
      setLoading(true);
      let endpoint = '/meetings/';
      
      if (view === 'upcoming') {
        endpoint = '/meetings/upcoming';
      } else if (view === 'completed') {
        endpoint = '/meetings/?status=completed';
      }
      
      const response = await api.get(endpoint);
      setMeetings(response.data);
    } catch (error) {
      console.error('Error fetching meetings:', error);
      showToast('Failed to load meetings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/meetings/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const checkConflicts = async () => {
    if (!newMeeting.meeting_date || !newMeeting.start_time || !newMeeting.end_time) return;
    
    try {
      const response = await api.post('/meetings/check-conflicts', {
        meeting_date: newMeeting.meeting_date,
        start_time: newMeeting.start_time,
        end_time: newMeeting.end_time
      });
      setConflicts(response.data.conflicts || []);
    } catch (error) {
      console.error('Error checking conflicts:', error);
    }
  };

  useEffect(() => {
    if (showCreateModal) {
      checkConflicts();
    }
  }, [newMeeting.meeting_date, newMeeting.start_time, newMeeting.end_time, showCreateModal]);

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    try {
      await api.post('/meetings/', newMeeting);
      showToast('Meeting created successfully', 'success');
      setShowCreateModal(false);
      resetNewMeeting();
      fetchMeetings();
    } catch (error) {
      console.error('Error creating meeting:', error);
      showToast('Failed to create meeting', 'error');
    }
  };

  const resetNewMeeting = () => {
    setNewMeeting({
      title: '',
      description: '',
      meeting_date: '',
      start_time: '09:00',
      end_time: '10:00',
      location: '',
      meeting_link: '',
      meeting_type: 'meeting',
      agenda: '',
      attendee_ids: []
    });
    setConflicts([]);
  };

  const handleJoinMeeting = (meeting) => {
    if (meeting.meeting_link) {
      // Mark attendance when joining
      api.post(`/meetings/${meeting.id}/attendance/join`).catch(console.error);
      window.open(meeting.meeting_link, '_blank');
    } else {
      showToast('Meeting link not available', 'warning');
    }
  };

  const handleUpdateAttendeeStatus = async (meetingId, status) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      await api.put(`/meetings/${meetingId}/attendees/${currentUser.id}/status`, { status });
      showToast(`Meeting ${status}`, 'success');
      fetchMeetings();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const fetchMeetingNotes = async (meetingId) => {
    try {
      const response = await api.get(`/meetings/${meetingId}/notes`);
      setMeetingNotes(response.data);
    } catch (error) {
      console.error('Error fetching notes:', error);
    }
  };

  const fetchActionItems = async (meetingId) => {
    try {
      const response = await api.get(`/meetings/${meetingId}/action-items`);
      setActionItems(response.data);
    } catch (error) {
      console.error('Error fetching action items:', error);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/meetings/${selectedMeeting.id}/notes`, newNote);
      setNewNote({ content: '', note_type: 'general', is_private: false });
      fetchMeetingNotes(selectedMeeting.id);
      showToast('Note added successfully', 'success');
    } catch (error) {
      console.error('Error adding note:', error);
      showToast('Failed to add note', 'error');
    }
  };

  const handleAddActionItem = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/meetings/${selectedMeeting.id}/action-items`, newActionItem);
      setNewActionItem({
        title: '',
        description: '',
        assigned_to: '',
        due_date: '',
        priority: 'medium'
      });
      fetchActionItems(selectedMeeting.id);
      showToast('Action item created successfully', 'success');
    } catch (error) {
      console.error('Error creating action item:', error);
      showToast('Failed to create action item', 'error');
    }
  };

  const formatMeetingDate = (dateStr) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM d, yyyy');
  };

  const getMeetingTypeIcon = (type) => {
    const typeObj = meetingTypes.find(t => t.value === type);
    return typeObj?.icon || '📅';
  };

  const getStatusColor = (status) => {
    const colors = {
      'scheduled': 'bg-blue-100 text-blue-800',
      'in-progress': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800',
      'invited': 'bg-yellow-100 text-yellow-800',
      'accepted': 'bg-green-100 text-green-800',
      'declined': 'bg-red-100 text-red-800',
      'tentative': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const renderAnalytics = () => {
    if (!analytics) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Total Meetings</h3>
          <p className="text-3xl font-bold text-blue-600">{analytics.total_meetings}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Organized</h3>
          <p className="text-3xl font-bold text-green-600">{analytics.meetings_organized}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Attendance Rate</h3>
          <p className="text-3xl font-bold text-purple-600">{analytics.attendance_rate}%</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Attended</h3>
          <p className="text-3xl font-bold text-orange-600">{analytics.meetings_attended}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Meeting Types</h3>
          <div className="space-y-2">
            {Object.entries(analytics.type_breakdown || {}).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  {getMeetingTypeIcon(type)}
                  {meetingTypes.find(t => t.value === type)?.label || type}
                </span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(analytics.status_breakdown || {}).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className={`px-2 py-1 rounded text-sm ${getStatusColor(status)}`}>
                  {status}
                </span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
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
        <h1 className="text-2xl font-bold text-gray-800">Meetings</h1>
        <button 
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Schedule Meeting
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setView('upcoming')}
            className={`px-4 py-2 rounded-lg ${
              view === 'upcoming' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setView('completed')}
            className={`px-4 py-2 rounded-lg ${
              view === 'completed' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Past
          </button>
          <button
            onClick={() => setView('analytics')}
            className={`px-4 py-2 rounded-lg ${
              view === 'analytics' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            Analytics
          </button>
        </div>

        {view === 'analytics' ? (
          renderAnalytics()
        ) : (
          <div className="space-y-4">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{getMeetingTypeIcon(meeting.meeting_type)}</span>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {meeting.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(meeting.status)}`}>
                        {meeting.status}
                      </span>
                    </div>
                    
                    {meeting.description && (
                      <p className="text-gray-600 mb-3">{meeting.description}</p>
                    )}
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {formatMeetingDate(meeting.meeting_date)}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {meeting.start_time} - {meeting.end_time}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {meeting.location || 'Online'}
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {meeting.attendees?.length || 0} attendees
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    {meeting.status === 'scheduled' && (
                      <>
                        {meeting.meeting_link && (
                          <button 
                            onClick={() => handleJoinMeeting(meeting)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Join
                          </button>
                        )}
                        <div className="flex gap-1">
                          <button 
                            onClick={() => handleUpdateAttendeeStatus(meeting.id, 'accepted')}
                            className="px-2 py-1 text-green-600 hover:bg-green-50 rounded text-xs"
                            title="Accept"
                          >
                            ✓
                          </button>
                          <button 
                            onClick={() => handleUpdateAttendeeStatus(meeting.id, 'declined')}
                            className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-xs"
                            title="Decline"
                          >
                            ✗
                          </button>
                          <button 
                            onClick={() => handleUpdateAttendeeStatus(meeting.id, 'tentative')}
                            className="px-2 py-1 text-yellow-600 hover:bg-yellow-50 rounded text-xs"
                            title="Maybe"
                          >
                            ?
                          </button>
                        </div>
                      </>
                    )}
                    <button 
                      onClick={() => {
                        setSelectedMeeting(meeting);
                        setShowDetailsModal(true);
                      }}
                      className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded text-sm"
                    >
                      Details
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedMeeting(meeting);
                        fetchMeetingNotes(meeting.id);
                        setShowNotesModal(true);
                      }}
                      className="px-3 py-1 text-purple-600 hover:bg-purple-50 rounded text-sm"
                    >
                      Notes
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedMeeting(meeting);
                        fetchActionItems(meeting.id);
                        setShowActionItemsModal(true);
                      }}
                      className="px-3 py-1 text-orange-600 hover:bg-orange-50 rounded text-sm"
                    >
                      Tasks
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {meetings.length === 0 && view !== 'analytics' && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium">No {view} meetings</p>
            <p className="text-sm">Schedule your first meeting to get started</p>
          </div>
        )}
      </div>

      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Schedule New Meeting</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter meeting title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Type
                  </label>
                  <select
                    value={newMeeting.meeting_type}
                    onChange={(e) => setNewMeeting({...newMeeting, meeting_type: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {meetingTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newMeeting.meeting_date}
                    onChange={(e) => setNewMeeting({...newMeeting, meeting_date: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={newMeeting.start_time}
                    onChange={(e) => setNewMeeting({...newMeeting, start_time: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={newMeeting.end_time}
                    onChange={(e) => setNewMeeting({...newMeeting, end_time: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newMeeting.location}
                    onChange={(e) => setNewMeeting({...newMeeting, location: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Conference Room A or Online"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    value={newMeeting.meeting_link}
                    onChange={(e) => setNewMeeting({...newMeeting, meeting_link: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newMeeting.description}
                    onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of the meeting"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agenda
                  </label>
                  <textarea
                    value={newMeeting.agenda}
                    onChange={(e) => setNewMeeting({...newMeeting, agenda: e.target.value})}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Meeting agenda items..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Schedule Meeting
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meeting Details Modal */}
      {showDetailsModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{selectedMeeting.title}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Date:</span>
                  <p>{formatMeetingDate(selectedMeeting.meeting_date)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Time:</span>
                  <p>{selectedMeeting.start_time} - {selectedMeeting.end_time}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Location:</span>
                  <p>{selectedMeeting.location || 'Online'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <p>{meetingTypes.find(t => t.value === selectedMeeting.meeting_type)?.label}</p>
                </div>
              </div>

              {selectedMeeting.description && (
                <div>
                  <span className="font-medium text-gray-700">Description:</span>
                  <p className="mt-1">{selectedMeeting.description}</p>
                </div>
              )}

              {selectedMeeting.agenda && (
                <div>
                  <span className="font-medium text-gray-700">Agenda:</span>
                  <div className="mt-1 whitespace-pre-wrap">{selectedMeeting.agenda}</div>
                </div>
              )}

              <div>
                <span className="font-medium text-gray-700">Attendees:</span>
                <div className="mt-2 space-y-2">
                  {selectedMeeting.attendees?.map((attendee) => (
                    <div key={attendee.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{attendee.user?.email || `User ${attendee.user_id}`}</span>
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(attendee.status)}`}>
                        {attendee.status}
                      </span>
                    </div>
                  )) || <p className="text-gray-500">No attendees added</p>}
                </div>
              </div>

              {selectedMeeting.meeting_link && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleJoinMeeting(selectedMeeting)}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Join Meeting
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Create Meeting Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Schedule New Meeting</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetNewMeeting();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {conflicts.length > 0 && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">⚠️ Schedule Conflicts Detected</h4>
                <div className="space-y-1">
                  {conflicts.map((conflict, index) => (
                    <p key={index} className="text-sm text-yellow-700">
                      {conflict.title} ({conflict.start_time} - {conflict.end_time})
                    </p>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMeeting.title}
                    onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter meeting title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Type
                  </label>
                  <select
                    value={newMeeting.meeting_type}
                    onChange={(e) => setNewMeeting({...newMeeting, meeting_type: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {meetingTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newMeeting.meeting_date}
                    onChange={(e) => setNewMeeting({...newMeeting, meeting_date: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={newMeeting.start_time}
                    onChange={(e) => setNewMeeting({...newMeeting, start_time: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={newMeeting.end_time}
                    onChange={(e) => setNewMeeting({...newMeeting, end_time: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newMeeting.location}
                    onChange={(e) => setNewMeeting({...newMeeting, location: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Conference Room A or Online"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Link
                  </label>
                  <input
                    type="url"
                    value={newMeeting.meeting_link}
                    onChange={(e) => setNewMeeting({...newMeeting, meeting_link: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://zoom.us/j/..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newMeeting.description}
                    onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief description of the meeting"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Agenda
                  </label>
                  <textarea
                    value={newMeeting.agenda}
                    onChange={(e) => setNewMeeting({...newMeeting, agenda: e.target.value})}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Meeting agenda items..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Attendees
                  </label>
                  <select
                    multiple
                    value={newMeeting.attendee_ids}
                    onChange={(e) => {
                      const values = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                      setNewMeeting({...newMeeting, attendee_ids: values});
                    }}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                  >
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.email} ({user.role})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple attendees</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  disabled={conflicts.length > 0}
                >
                  {conflicts.length > 0 ? 'Resolve Conflicts First' : 'Schedule Meeting'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetNewMeeting();
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

      {/* Meeting Details Modal */}
      {showDetailsModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">{selectedMeeting.title}</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Date:</span>
                  <p>{formatMeetingDate(selectedMeeting.meeting_date)}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Time:</span>
                  <p>{selectedMeeting.start_time} - {selectedMeeting.end_time}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Location:</span>
                  <p>{selectedMeeting.location || 'Online'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Type:</span>
                  <p>{meetingTypes.find(t => t.value === selectedMeeting.meeting_type)?.label}</p>
                </div>
              </div>

              {selectedMeeting.description && (
                <div>
                  <span className="font-medium text-gray-700">Description:</span>
                  <p className="mt-1">{selectedMeeting.description}</p>
                </div>
              )}

              {selectedMeeting.agenda && (
                <div>
                  <span className="font-medium text-gray-700">Agenda:</span>
                  <div className="mt-1 whitespace-pre-wrap">{selectedMeeting.agenda}</div>
                </div>
              )}

              <div>
                <span className="font-medium text-gray-700">Attendees:</span>
                <div className="mt-2 space-y-2">
                  {selectedMeeting.attendees?.map((attendee) => (
                    <div key={attendee.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{attendee.user?.email || `User ${attendee.user_id}`}</span>
                      <span className={`px-2 py-1 text-xs rounded ${getStatusColor(attendee.status)}`}>
                        {attendee.status}
                      </span>
                    </div>
                  )) || <p className="text-gray-500">No attendees added</p>}
                </div>
              </div>

              {selectedMeeting.meeting_link && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleJoinMeeting(selectedMeeting)}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Join Meeting
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Meeting Notes Modal */}
      {showNotesModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Meeting Notes - {selectedMeeting.title}</h2>
              <button
                onClick={() => setShowNotesModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="border-b pb-6">
                <h3 className="text-lg font-semibold mb-4">Add Note</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Note Type</label>
                    <select
                      value={newNote.note_type}
                      onChange={(e) => setNewNote({...newNote, note_type: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      {noteTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newNote.is_private}
                        onChange={(e) => setNewNote({...newNote, is_private: e.target.checked})}
                        className="mr-2"
                      />
                      Private Note
                    </label>
                  </div>
                </div>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                  placeholder="Enter your note..."
                  rows={4}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="submit"
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Add Note
                </button>
              </form>

              {/* Notes List */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Notes ({meetingNotes.length})</h3>
                <div className="space-y-4">
                  {meetingNotes.map((note) => (
                    <div key={note.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded ${getStatusColor(note.note_type)}`}>
                            {noteTypes.find(t => t.value === note.note_type)?.label || note.note_type}
                          </span>
                          {note.is_private && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded">
                              Private
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">
                          {format(parseISO(note.created_at), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-gray-800 whitespace-pre-wrap">{note.content}</p>
                    </div>
                  ))}
                  {meetingNotes.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No notes added yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Items Modal */}
      {showActionItemsModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Action Items - {selectedMeeting.title}</h2>
              <button
                onClick={() => setShowActionItemsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Add Action Item Form */}
              <form onSubmit={handleAddActionItem} className="border-b pb-6">
                <h3 className="text-lg font-semibold mb-4">Create Action Item</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                    <input
                      type="text"
                      value={newActionItem.title}
                      onChange={(e) => setNewActionItem({...newActionItem, title: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Assign To *</label>
                    <select
                      value={newActionItem.assigned_to}
                      onChange={(e) => setNewActionItem({...newActionItem, assigned_to: parseInt(e.target.value)})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select assignee</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>{user.email}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <input
                      type="date"
                      value={newActionItem.due_date}
                      onChange={(e) => setNewActionItem({...newActionItem, due_date: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={newActionItem.priority}
                      onChange={(e) => setNewActionItem({...newActionItem, priority: e.target.value})}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      {priorities.map((priority) => (
                        <option key={priority.value} value={priority.value}>{priority.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={newActionItem.description}
                    onChange={(e) => setNewActionItem({...newActionItem, description: e.target.value})}
                    rows={3}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Create Action Item
                </button>
              </form>

              {/* Action Items List */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Action Items ({actionItems.length})</h3>
                <div className="space-y-4">
                  {actionItems.map((item) => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-gray-800">{item.title}</h4>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 text-xs rounded ${priorities.find(p => p.value === item.priority)?.color || 'text-gray-600'}`}>
                            {priorities.find(p => p.value === item.priority)?.label || item.priority}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                      {item.description && (
                        <p className="text-gray-600 mb-2">{item.description}</p>
                      )}
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Assigned to: {users.find(u => u.id === item.assigned_to)?.email || 'Unknown'}</span>
                        {item.due_date && (
                          <span>Due: {format(parseISO(item.due_date), 'MMM d, yyyy')}</span>
                        )}
                      </div>
                    </div>
                  ))}
                  {actionItems.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No action items created yet</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}