import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function OnboardingAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/onboarding/analytics?range=${timeRange}`);
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Unable to load analytics data.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            📊 Onboarding Analytics
          </h2>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      <div className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="text-blue-600 text-2xl mr-3">👥</div>
              <div>
                <p className="text-sm font-medium text-blue-900">Total Onboarded</p>
                <p className="text-2xl font-bold text-blue-700">{analytics.total_onboarded}</p>
                <p className="text-xs text-blue-600">
                  {analytics.onboarding_growth > 0 ? '+' : ''}{analytics.onboarding_growth}% vs previous period
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="text-green-600 text-2xl mr-3">⚡</div>
              <div>
                <p className="text-sm font-medium text-green-900">Avg. Completion Time</p>
                <p className="text-2xl font-bold text-green-700">{analytics.avg_completion_days}d</p>
                <p className="text-xs text-green-600">
                  Target: {analytics.target_completion_days}d
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="text-yellow-600 text-2xl mr-3">⏰</div>
              <div>
                <p className="text-sm font-medium text-yellow-900">Overdue</p>
                <p className="text-2xl font-bold text-yellow-700">{analytics.overdue_count}</p>
                <p className="text-xs text-yellow-600">
                  {analytics.overdue_percentage}% of active onboarding
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <div className="text-purple-600 text-2xl mr-3">🎯</div>
              <div>
                <p className="text-sm font-medium text-purple-900">Success Rate</p>
                <p className="text-2xl font-bold text-purple-700">{analytics.success_rate}%</p>
                <p className="text-xs text-purple-600">
                  Completed within target time
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Distribution */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Phase Distribution</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {Object.entries(analytics.phase_distribution).map(([phase, count]) => (
              <div key={phase} className="bg-gray-50 p-3 rounded-lg text-center">
                <p className="text-sm font-medium text-gray-700 capitalize">
                  {phase.replace('_', ' ')}
                </p>
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(count / analytics.total_active) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Performance */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h3>
          <div className="space-y-3">
            {analytics.department_performance.map((dept) => (
              <div key={dept.department} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{dept.department}</p>
                  <p className="text-sm text-gray-600">
                    {dept.completed} completed, {dept.active} active
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{dept.avg_days}d</p>
                  <p className="text-xs text-gray-500">avg. time</p>
                </div>
                <div className="ml-4 w-20">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        dept.avg_days <= analytics.target_completion_days 
                          ? 'bg-green-500' 
                          : dept.avg_days <= analytics.target_completion_days * 1.5
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min((dept.avg_days / (analytics.target_completion_days * 2)) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottlenecks */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Identified Bottlenecks</h3>
          <div className="space-y-3">
            {analytics.bottlenecks.map((bottleneck, index) => (
              <div key={index} className="p-4 border border-red-200 bg-red-50 rounded-lg">
                <div className="flex items-start">
                  <div className="text-red-500 text-xl mr-3">⚠️</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900">{bottleneck.phase}</h4>
                    <p className="text-sm text-red-700 mt-1">{bottleneck.description}</p>
                    <div className="mt-2 flex items-center text-sm text-red-600">
                      <span className="font-medium">Impact:</span>
                      <span className="ml-1">{bottleneck.avg_delay_days} days average delay</span>
                      <span className="mx-2">•</span>
                      <span>{bottleneck.affected_employees} employees affected</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Trends */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Completion Rate Trend</h4>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-blue-700">
                  {analytics.completion_trend > 0 ? '📈' : '📉'}
                </span>
                <div className="ml-3">
                  <p className="text-lg font-bold text-blue-700">
                    {analytics.completion_trend > 0 ? '+' : ''}{analytics.completion_trend}%
                  </p>
                  <p className="text-sm text-blue-600">vs previous period</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2">Time Efficiency</h4>
              <div className="flex items-center">
                <span className="text-2xl font-bold text-green-700">
                  {analytics.efficiency_trend > 0 ? '⚡' : '🐌'}
                </span>
                <div className="ml-3">
                  <p className="text-lg font-bold text-green-700">
                    {analytics.efficiency_trend > 0 ? '+' : ''}{analytics.efficiency_trend}%
                  </p>
                  <p className="text-sm text-green-600">faster completion</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}