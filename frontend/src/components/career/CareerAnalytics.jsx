import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function CareerAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/career/analytics');
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching career analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Unable to load career analytics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Career Analytics Dashboard</h1>
        <p className="text-indigo-100">Organization-wide career development insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="text-blue-600 text-3xl mr-4">👥</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.total_employees}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="text-green-600 text-3xl mr-4">📈</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Internal Mobility Rate</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.internal_mobility_rate}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="text-purple-600 text-3xl mr-4">⭐</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Career Satisfaction</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.career_satisfaction_score}/5</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="text-orange-600 text-3xl mr-4">🎯</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Promotion Time</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.career_progression_stats.average_promotion_time}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Career Progression Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Career Progression Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{analytics.career_progression_stats.internal_promotion_rate}</div>
            <div className="text-sm text-blue-800">Internal Promotion Rate</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{analytics.career_progression_stats.skill_development_completion_rate}</div>
            <div className="text-sm text-green-800">Skill Development Completion</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{analytics.career_progression_stats.career_satisfaction_score}</div>
            <div className="text-sm text-purple-800">Career Satisfaction Score</div>
          </div>
        </div>
      </div>

      {/* Skills Gap Analysis */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Skills Gap Analysis</h3>
        <div className="space-y-4">
          {analytics.skills_gap_analysis.map((gap, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{gap.skill}</h4>
                <p className="text-sm text-gray-600">{gap.employees_affected} employees affected</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-red-600">{gap.gap_percentage}%</div>
                <div className="text-sm text-gray-500">Gap</div>
              </div>
              <div className="ml-4 w-32">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${gap.gap_percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mentorship Program Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Mentorship Program Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Active Mentorships</span>
              <span className="text-lg font-bold text-gray-900">{analytics.mentorship_program_stats.active_mentorships}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Available Mentors</span>
              <span className="text-lg font-bold text-gray-900">{analytics.mentorship_program_stats.available_mentors}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Satisfaction Score</span>
              <span className="text-lg font-bold text-gray-900">{analytics.mentorship_program_stats.mentorship_satisfaction}/5</span>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-medium text-green-900 mb-2">Success Rate</h4>
            <p className="text-sm text-green-700">{analytics.mentorship_program_stats.career_advancement_rate}</p>
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-4">Recommended Actions</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <div className="text-yellow-600 mr-3">⚠️</div>
            <div>
              <p className="font-medium text-yellow-900">Address Cloud Architecture Skills Gap</p>
              <p className="text-sm text-yellow-700">45% gap affecting 23 employees - Consider organizing training programs</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="text-yellow-600 mr-3">📈</div>
            <div>
              <p className="font-medium text-yellow-900">Expand Mentorship Program</p>
              <p className="text-sm text-yellow-700">High satisfaction scores indicate opportunity to scale the program</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="text-yellow-600 mr-3">🎯</div>
            <div>
              <p className="font-medium text-yellow-900">Focus on Leadership Development</p>
              <p className="text-sm text-yellow-700">38% leadership skills gap - Critical for succession planning</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}