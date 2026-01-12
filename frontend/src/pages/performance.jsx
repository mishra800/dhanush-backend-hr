import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function Performance() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employee, setEmployee] = useState(null);

  // Goals & OKRs State
  const [goals, setGoals] = useState([
    { id: 1, title: 'Complete React Migration', progress: 75, deadline: '2024-12-31', status: 'on-track' },
    { id: 2, title: 'Improve Code Coverage to 80%', progress: 60, deadline: '2024-12-15', status: 'at-risk' },
    { id: 3, title: 'Mentor 2 Junior Developers', progress: 100, deadline: '2024-11-30', status: 'completed' },
  ]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', deadline: '', description: '' });

  // State for features
  const [sentimentText, setSentimentText] = useState('');
  const [sentimentResult, setSentimentResult] = useState(null);

  const [predictionData, setPredictionData] = useState({
    kpi_completed: 8,
    total_kpis: 10,
    projects_completed: 5,
    project_success_rate: 90,
    peer_rating: 8.5
  });
  const [predictionResult, setPredictionResult] = useState(null);

  const [feedbackData, setFeedbackData] = useState({
    role: 'Senior Developer',
    period: 'Q4 2023',
    technical_score: 8,
    communication_score: 7,
    teamwork_score: 9,
    leadership_score: 6
  });
  const [feedbackResult, setFeedbackResult] = useState(null);

  const [engagementText, setEngagementText] = useState('');
  const [engagementResult, setEngagementResult] = useState(null);

  // New state for enhanced features
  const [performanceScore, setPerformanceScore] = useState(null);
  const [performanceTrends, setPerformanceTrends] = useState(null);
  const [performanceInsights, setPerformanceInsights] = useState(null);
  const [kpiData, setKpiData] = useState(null);
  const [teamAnalytics, setTeamAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchPerformanceData();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await api.get('/users/me/profile');
      setEmployee(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      
      // Get current employee ID
      const empResponse = await api.get('/onboarding/my-employee-id');
      const empId = empResponse.data.employee_id;
      
      // Fetch comprehensive performance data
      const [scoreRes, trendsRes, insightsRes, kpiRes] = await Promise.all([
        api.get(`/performance/employee/${empId}/score`).catch(() => null),
        api.get(`/performance/employee/${empId}/trends`).catch(() => null),
        api.get(`/performance/employee/${empId}/insights`).catch(() => null),
        api.get(`/performance/kpis/employee/${empId}`).catch(() => null)
      ]);
      
      if (scoreRes) setPerformanceScore(scoreRes.data);
      if (trendsRes) setPerformanceTrends(trendsRes.data);
      if (insightsRes) setPerformanceInsights(insightsRes.data);
      if (kpiRes) setKpiData(kpiRes.data);
      
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handlers
  const handleAnalyzeSentiment = async () => {
    try {
      const res = await api.post('/performance/analyze-sentiment?feedback_text=' + encodeURIComponent(sentimentText));
      setSentimentResult(res.data);
    } catch (err) { console.error(err); }
  };

  const handlePredictScore = async () => {
    try {
      // Get current employee ID
      let empId = employee?.id;
      if (!empId) {
        const empResponse = await api.get('/onboarding/my-employee-id');
        empId = empResponse.data.employee_id;
      }
      
      const res = await api.post('/performance/predict-score', { ...predictionData, employee_id: empId });
      setPredictionResult(res.data);
    } catch (err) { 
      console.error(err);
      alert('Failed to predict score. Please try again.');
    }
  };

  const handleGenerateFeedback = async () => {
    try {
      // Get current employee ID
      let empId = employee?.id;
      if (!empId) {
        const empResponse = await api.get('/onboarding/my-employee-id');
        empId = empResponse.data.employee_id;
      }
      
      const res = await api.post('/performance/generate-feedback', { ...feedbackData, employee_id: empId });
      setFeedbackResult(res.data);
    } catch (err) { 
      console.error(err);
      alert('Failed to generate feedback. Please try again.');
    }
  };

  const handleAnalyzeEngagement = async () => {
    try {
      const res = await api.post('/performance/analyze-engagement', { source: 'survey', text: engagementText });
      setEngagementResult(res.data);
    } catch (err) { console.error(err); }
  };

  // Renderers
  const renderDashboard = () => (
    <div className="space-y-6">
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading performance data...</p>
        </div>
      )}
      
      {/* Performance Score Overview */}
      {performanceScore && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Overall Performance Score</h3>
              <p className="text-gray-500">{performanceScore.period}</p>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${performanceScore.color === 'green' ? 'text-green-600' : 
                performanceScore.color === 'blue' ? 'text-blue-600' : 
                performanceScore.color === 'yellow' ? 'text-yellow-600' : 
                performanceScore.color === 'orange' ? 'text-orange-600' : 'text-red-600'}`}>
                {performanceScore.final_score}/100
              </div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold mt-2 ${
                performanceScore.color === 'green' ? 'bg-green-100 text-green-800' :
                performanceScore.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                performanceScore.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                performanceScore.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                {performanceScore.category}
              </span>
            </div>
          </div>
          
          {/* Performance Breakdown */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(performanceScore.breakdown).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold text-gray-800">{value}%</div>
                <div className="text-xs text-gray-500 capitalize">{key.replace('_', ' ')}</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full ${value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Dashboard */}
      {kpiData && (
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Key Performance Indicators</h3>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{kpiData.summary.overall_score}%</div>
              <div className="text-sm text-gray-500">Overall KPI Score</div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-800">{kpiData.summary.total_kpis}</div>
              <div className="text-sm text-blue-600">Total KPIs</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-800">{kpiData.summary.completed_kpis}</div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-800">{kpiData.summary.in_progress}</div>
              <div className="text-sm text-orange-600">In Progress</div>
            </div>
          </div>
          
          {/* KPI List */}
          <div className="space-y-3">
            {kpiData.kpis.slice(0, 5).map((kpi) => (
              <div key={kpi.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{kpi.title}</h4>
                  <p className="text-sm text-gray-500">{kpi.description}</p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-lg font-bold text-gray-800">{kpi.progress}%</div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    kpi.status === 'completed' ? 'bg-green-100 text-green-800' :
                    kpi.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {kpi.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Insights */}
      {performanceInsights && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold text-gray-900 mb-4">AI Performance Insights</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-green-700 mb-2">Strengths</h4>
              <ul className="space-y-1">
                {performanceInsights.strengths.map((strength, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-center">
                    <span className="text-green-500 mr-2">✓</span>
                    {strength.replace('_', ' ')}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-orange-700 mb-2">Improvement Areas</h4>
              <ul className="space-y-1">
                {performanceInsights.improvement_areas.map((area, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-center">
                    <span className="text-orange-500 mr-2">→</span>
                    {area.replace('_', ' ')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Recommendations</h4>
            <ul className="space-y-1">
              {performanceInsights.recommendations.map((rec, i) => (
                <li key={i} className="text-sm text-blue-700">• {rec}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Performance Trends Chart */}
      {performanceTrends && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Performance Trends</h3>
          <div className="h-64 bg-gray-50 flex items-end justify-around p-4 rounded">
            {performanceTrends.trends.slice(-6).map((trend, i) => (
              <div key={i} className="flex flex-col items-center">
                <div 
                  className="w-12 bg-blue-500 rounded-t mb-2" 
                  style={{ height: `${Math.max(trend.performance_rating * 20, 10)}px` }}
                >
                  <div className="text-white text-xs text-center pt-1">
                    {trend.performance_rating}
                  </div>
                </div>
                <div className="text-xs text-gray-600 text-center">
                  {trend.month}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback for when no data is available */}
      {!loading && !performanceScore && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm font-bold uppercase">Avg Performance</h3>
            <p className="text-3xl font-bold text-gray-800">7.8/10</p>
            <p className="text-green-500 text-sm">↑ 12% vs last quarter</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-bold uppercase">Goal Achievement</h3>
            <p className="text-3xl font-bold text-gray-800">85%</p>
            <p className="text-gray-500 text-sm">34/40 Goals Met</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
            <h3 className="text-gray-500 text-sm font-bold uppercase">Training Completion</h3>
            <p className="text-3xl font-bold text-gray-800">92%</p>
            <p className="text-gray-500 text-sm">Top Department: Engineering</p>
          </div>
        </div>
      )}
    </div>
  );

  const renderKPIs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-900">Key Performance Indicators 📊</h3>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          + Add KPI
        </button>
      </div>

      {kpiData && (
        <>
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
              <div className="text-3xl font-bold">{kpiData.summary.total_kpis}</div>
              <div className="text-blue-100">Total KPIs</div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
              <div className="text-3xl font-bold">{kpiData.summary.completed_kpis}</div>
              <div className="text-green-100">Completed</div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
              <div className="text-3xl font-bold">{kpiData.summary.in_progress}</div>
              <div className="text-orange-100">In Progress</div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
              <div className="text-3xl font-bold">{kpiData.summary.overall_score}%</div>
              <div className="text-purple-100">Overall Score</div>
            </div>
          </div>

          {/* Detailed KPI List */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900">KPI Details</h4>
            </div>
            <div className="divide-y divide-gray-200">
              {kpiData.kpis.map((kpi) => (
                <div key={kpi.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h5 className="text-lg font-medium text-gray-900">{kpi.title}</h5>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          kpi.status === 'completed' ? 'bg-green-100 text-green-800' :
                          kpi.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {kpi.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-1">{kpi.description}</p>
                      <div className="mt-3 flex items-center space-x-4 text-sm text-gray-500">
                        <span>Category: {kpi.category}</span>
                        <span>Weight: {kpi.weight}</span>
                        {kpi.target_date && <span>Due: {new Date(kpi.target_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="ml-6 text-right">
                      <div className="text-2xl font-bold text-gray-900">{kpi.progress}%</div>
                      <div className="w-24 bg-gray-200 rounded-full h-2 mt-2">
                        <div 
                          className={`h-2 rounded-full ${
                            kpi.progress >= 100 ? 'bg-green-500' :
                            kpi.progress >= 75 ? 'bg-blue-500' :
                            kpi.progress >= 50 ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${kpi.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex space-x-3">
                    <button className="text-sm text-blue-600 hover:text-blue-800">Update Progress</button>
                    <button className="text-sm text-gray-600 hover:text-gray-800">View History</button>
                    <button className="text-sm text-gray-600 hover:text-gray-800">Edit KPI</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!kpiData && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No KPIs Found</h3>
          <p className="text-gray-500 mb-4">Start tracking your key performance indicators</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Create Your First KPI
          </button>
        </div>
      )}
    </div>
  );

  const renderSentiment = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-bold text-lg mb-4">Feedback Sentiment Analysis 🧠</h3>
        <textarea
          className="w-full p-3 border rounded-lg mb-4"
          rows="4"
          placeholder="Paste feedback text here (e.g., 'John is a great team player but needs to improve communication...')"
          value={sentimentText}
          onChange={(e) => setSentimentText(e.target.value)}
        />
        <button onClick={handleAnalyzeSentiment} className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">Analyze</button>
      </div>

      {sentimentResult && (
        <div className="bg-white p-6 rounded-lg shadow animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500">Overall Sentiment</p>
              <h2 className={`text-3xl font-bold ${sentimentResult.sentiment === 'Positive' ? 'text-green-600' : sentimentResult.sentiment === 'Negative' ? 'text-red-600' : 'text-yellow-600'}`}>
                {sentimentResult.sentiment === 'Positive' ? '😊' : sentimentResult.sentiment === 'Negative' ? '😟' : '😐'} {sentimentResult.sentiment}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Confidence</p>
              <p className="text-2xl font-bold">{sentimentResult.confidence}%</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 p-3 rounded text-center">
              <p className="text-green-800 font-bold">{sentimentResult.breakdown.positive}%</p>
              <p className="text-xs text-green-600">Positive</p>
            </div>
            <div className="bg-yellow-50 p-3 rounded text-center">
              <p className="text-yellow-800 font-bold">{sentimentResult.breakdown.neutral}%</p>
              <p className="text-xs text-yellow-600">Neutral</p>
            </div>
            <div className="bg-red-50 p-3 rounded text-center">
              <p className="text-red-800 font-bold">{sentimentResult.breakdown.negative}%</p>
              <p className="text-xs text-red-600">Negative</p>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-2">Key Themes</h4>
            <div className="flex flex-wrap gap-2">
              {sentimentResult.themes.map((theme, i) => (
                <span key={i} className={`px-3 py-1 rounded-full text-sm font-medium ${theme.sentiment === 'Positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {theme.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPrediction = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-bold text-lg mb-4">Predictive Performance Scoring 🔮</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">KPIs Completed</label>
            <input type="number" className="mt-1 block w-full border rounded p-2" value={predictionData.kpi_completed} onChange={e => setPredictionData({ ...predictionData, kpi_completed: parseInt(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Total KPIs</label>
            <input type="number" className="mt-1 block w-full border rounded p-2" value={predictionData.total_kpis} onChange={e => setPredictionData({ ...predictionData, total_kpis: parseInt(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Project Success Rate (%)</label>
            <input type="number" className="mt-1 block w-full border rounded p-2" value={predictionData.project_success_rate} onChange={e => setPredictionData({ ...predictionData, project_success_rate: parseInt(e.target.value) })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Peer Rating (0-10)</label>
            <input type="number" className="mt-1 block w-full border rounded p-2" value={predictionData.peer_rating} onChange={e => setPredictionData({ ...predictionData, peer_rating: parseFloat(e.target.value) })} />
          </div>
        </div>
        <button onClick={handlePredictScore} className="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">Predict Score</button>
      </div>

      {predictionResult && (
        <div className="bg-white p-6 rounded-lg shadow animate-fade-in-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-sm text-gray-500">Predicted Score</p>
              <h2 className="text-4xl font-bold text-purple-700">{predictionResult.predicted_score}/10</h2>
              <span className="inline-block px-3 py-1 mt-2 rounded-full text-sm font-bold bg-purple-100 text-purple-800">{predictionResult.category}</span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">ML Confidence</p>
              <p className="text-2xl font-bold">{predictionResult.confidence}%</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1"><span>Goal Achievement</span><span>{predictionResult.breakdown.goal_achievement}%</span></div>
              <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: `${predictionResult.breakdown.goal_achievement}%` }}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span>Quality of Work</span><span>{predictionResult.breakdown.quality_of_work}%</span></div>
              <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full" style={{ width: `${predictionResult.breakdown.quality_of_work}%` }}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1"><span>Collaboration</span><span>{predictionResult.breakdown.collaboration}%</span></div>
              <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-orange-600 h-2 rounded-full" style={{ width: `${predictionResult.breakdown.collaboration}%` }}></div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFeedback = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-bold text-lg mb-4">AI Feedback Assistant ✍️</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><label className="block text-sm">Role</label><input className="border w-full p-2 rounded" value={feedbackData.role} onChange={e => setFeedbackData({ ...feedbackData, role: e.target.value })} /></div>
          <div><label className="block text-sm">Period</label><input className="border w-full p-2 rounded" value={feedbackData.period} onChange={e => setFeedbackData({ ...feedbackData, period: e.target.value })} /></div>
          <div><label className="block text-sm">Tech Score</label><input type="number" className="border w-full p-2 rounded" value={feedbackData.technical_score} onChange={e => setFeedbackData({ ...feedbackData, technical_score: parseFloat(e.target.value) })} /></div>
          <div><label className="block text-sm">Comm Score</label><input type="number" className="border w-full p-2 rounded" value={feedbackData.communication_score} onChange={e => setFeedbackData({ ...feedbackData, communication_score: parseFloat(e.target.value) })} /></div>
        </div>
        <button onClick={handleGenerateFeedback} className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700">Generate Review</button>
      </div>

      {feedbackResult && (
        <div className="bg-white p-8 rounded-lg shadow border border-gray-200 animate-fade-in-up">
          <div className="border-b pb-4 mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Performance Review</h2>
            <p className="text-gray-500">{feedbackData.role} | {feedbackData.period}</p>
          </div>

          <div className="mb-6">
            <h4 className="font-bold text-gray-700 mb-2">Executive Summary</h4>
            <p className="text-gray-600 leading-relaxed">{feedbackResult.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-8 mb-6">
            <div>
              <h4 className="font-bold text-green-700 mb-2">Key Strengths</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {feedbackResult.strengths.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-orange-700 mb-2">Development Areas</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {feedbackResult.development.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-bold text-gray-700 mb-2">Next Period Goals</h4>
            <ul className="list-decimal list-inside text-gray-600 space-y-1">
              {feedbackResult.goals.map((g, i) => <li key={i}>{g}</li>)}
            </ul>
          </div>

          <p className="text-xs text-gray-400 mt-4 text-center">Generated by AI Assistant • Reviewed by Manager</p>
        </div>
      )}
    </div>
  );

  // Goals & OKRs Renderer
  const renderGoals = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-gray-900">Goals & OKRs 🎯</h3>
        <button
          onClick={() => setShowAddGoal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Add Goal
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal) => (
          <div key={goal.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h4 className="font-bold text-gray-900 text-lg">{goal.title}</h4>
                <p className="text-sm text-gray-500 mt-1">Deadline: {goal.deadline}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                goal.status === 'completed' ? 'bg-green-100 text-green-800' :
                goal.status === 'on-track' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }`}>
                {goal.status === 'completed' ? '✓ Completed' :
                 goal.status === 'on-track' ? '→ On Track' :
                 '⚠ At Risk'}
              </span>
            </div>

            <div className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold text-gray-900">{goal.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all ${
                    goal.progress === 100 ? 'bg-green-500' :
                    goal.progress >= 70 ? 'bg-blue-500' :
                    'bg-orange-500'
                  }`}
                  style={{ width: `${goal.progress}%` }}
                />
              </div>
            </div>

            <div className="flex space-x-2 mt-4">
              <button className="text-sm text-blue-600 hover:text-blue-800">Update Progress</button>
              <button className="text-sm text-gray-600 hover:text-gray-800">View Details</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Add New Goal</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="e.g., Complete Project X"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Describe the goal..."
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddGoal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setGoals([...goals, {...newGoal, id: goals.length + 1, progress: 0, status: 'on-track'}]);
                  setNewGoal({ title: '', deadline: '', description: '' });
                  setShowAddGoal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderEngagement = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="font-bold text-lg mb-4">Engagement & Retention Analysis ❤️</h3>
        <textarea
          className="w-full p-3 border rounded-lg mb-4"
          rows="4"
          placeholder="Paste survey response or email text..."
          value={engagementText}
          onChange={(e) => setEngagementText(e.target.value)}
        />
        <button onClick={handleAnalyzeEngagement} className="bg-pink-600 text-white px-6 py-2 rounded hover:bg-pink-700">Analyze Engagement</button>
      </div>

      {engagementResult && (
        <div className="bg-white p-6 rounded-lg shadow animate-fade-in-up">
          <div className="grid grid-cols-3 gap-6 text-center">
            <div className="p-4 rounded bg-gray-50">
              <p className="text-sm text-gray-500">Engagement Score</p>
              <p className={`text-3xl font-bold ${engagementResult.engagement_score >= 7 ? 'text-green-600' : 'text-red-600'}`}>{engagementResult.engagement_score}/10</p>
            </div>
            <div className="p-4 rounded bg-gray-50">
              <p className="text-sm text-gray-500">Stress Level</p>
              <p className={`text-3xl font-bold ${engagementResult.stress_level < 5 ? 'text-green-600' : 'text-red-600'}`}>{engagementResult.stress_level}/10</p>
            </div>
            <div className="p-4 rounded bg-gray-50">
              <p className="text-sm text-gray-500">Sentiment</p>
              <p className="text-xl font-bold text-gray-800">{engagementResult.sentiment}</p>
            </div>
          </div>

          {engagementResult.stress_level > 6 && (
            <div className="mt-6 bg-red-50 border-l-4 border-red-500 p-4">
              <h4 className="font-bold text-red-700">⚠️ High Stress Detected</h4>
              <p className="text-sm text-red-600 mt-1">Recommended Actions: Schedule 1-on-1, Review Workload, Offer Leave.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Performance Management</h1>
          <p className="text-gray-500">AI-Driven Insights & Reviews</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mb-6 overflow-x-auto pb-2">
          {['dashboard', 'kpis', 'goals', 'sentiment', 'prediction', 'feedback', 'engagement'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg font-medium capitalize whitespace-nowrap ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {tab === 'goals' ? '🎯 Goals & OKRs' : 
               tab === 'kpis' ? '📊 KPIs' :
               tab === 'dashboard' ? '📈 Dashboard' :
               tab === 'sentiment' ? '🧠 Sentiment' :
               tab === 'prediction' ? '🔮 Prediction' :
               tab === 'feedback' ? '✍️ Feedback' :
               tab === 'engagement' ? '❤️ Engagement' : tab}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'kpis' && renderKPIs()}
        {activeTab === 'goals' && renderGoals()}
        {activeTab === 'sentiment' && renderSentiment()}
        {activeTab === 'prediction' && renderPrediction()}
        {activeTab === 'feedback' && renderFeedback()}
        {activeTab === 'engagement' && renderEngagement()}
      </div>
    </div>
  );
}