import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function CareerDashboard() {
  const [careerData, setCareerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCareerData();
  }, []);

  const fetchCareerData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/career/dashboard');
      setCareerData(response.data);
    } catch (err) {
      console.error('Error fetching career data:', err);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Career Development Hub</h1>
            <p className="text-blue-100 mt-2">Shape your future with personalized career guidance</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{careerData?.career_score || 0}/100</div>
            <div className="text-sm text-blue-100">Career Score</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'pathways', name: 'Career Pathways', icon: '🛤️' },
              { id: 'skills', name: 'Skills Development', icon: '🎯' },
              { id: 'goals', name: 'Goals & Milestones', icon: '🏆' },
              { id: 'mentorship', name: 'Mentorship', icon: '👥' },
              { id: 'opportunities', name: 'Internal Opportunities', icon: '🚀' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && <CareerOverview data={careerData} />}
          {activeTab === 'pathways' && <CareerPathways data={careerData} />}
          {activeTab === 'skills' && <SkillsDevelopment data={careerData} />}
          {activeTab === 'goals' && <GoalsAndMilestones data={careerData} />}
          {activeTab === 'mentorship' && <MentorshipProgram data={careerData} />}
          {activeTab === 'opportunities' && <InternalOpportunities data={careerData} />}
        </div>
      </div>
    </div>
  );
}

function CareerOverview({ data }) {
  return (
    <div className="space-y-6">
      {/* Career Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="text-blue-600 text-3xl mr-4">📈</div>
            <div>
              <p className="text-sm font-medium text-blue-900">Career Level</p>
              <p className="text-2xl font-bold text-blue-700">{data?.current_level || 'Mid-Level'}</p>
              <p className="text-xs text-blue-600">Next: {data?.next_level || 'Senior Level'}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="text-green-600 text-3xl mr-4">🎯</div>
            <div>
              <p className="text-sm font-medium text-green-900">Skills Mastery</p>
              <p className="text-2xl font-bold text-green-700">{data?.skills_mastery || 75}%</p>
              <p className="text-xs text-green-600">+5% this quarter</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-6 rounded-lg">
          <div className="flex items-center">
            <div className="text-purple-600 text-3xl mr-4">⏱️</div>
            <div>
              <p className="text-sm font-medium text-purple-900">Time in Role</p>
              <p className="text-2xl font-bold text-purple-700">{data?.time_in_role || '2.5'} years</p>
              <p className="text-xs text-purple-600">Ready for growth</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Recent Achievements</h3>
        <div className="space-y-3">
          {(data?.recent_achievements || [
            { title: 'Completed Advanced React Course', date: '2024-01-10', type: 'learning' },
            { title: 'Led successful project delivery', date: '2024-01-05', type: 'performance' },
            { title: 'Mentored 2 junior developers', date: '2023-12-20', type: 'leadership' }
          ]).map((achievement, index) => (
            <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl mr-3">
                {achievement.type === 'learning' ? '📚' : 
                 achievement.type === 'performance' ? '⭐' : '👥'}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{achievement.title}</p>
                <p className="text-sm text-gray-500">{new Date(achievement.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
          <div className="text-2xl mb-2">📝</div>
          <div className="text-sm font-medium text-blue-900">Update Career Goals</div>
        </button>
        <button className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
          <div className="text-2xl mb-2">🎓</div>
          <div className="text-sm font-medium text-green-900">Browse Learning</div>
        </button>
        <button className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors">
          <div className="text-2xl mb-2">👥</div>
          <div className="text-sm font-medium text-purple-900">Find Mentor</div>
        </button>
        <button className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors">
          <div className="text-2xl mb-2">🔍</div>
          <div className="text-sm font-medium text-orange-900">Explore Roles</div>
        </button>
      </div>
    </div>
  );
}

function CareerPathways({ data }) {
  const pathways = data?.career_pathways || [
    {
      id: 1,
      title: 'Technical Leadership Track',
      description: 'Progress from Senior Developer to Tech Lead to Engineering Manager',
      steps: [
        { role: 'Senior Software Engineer', timeframe: '6-12 months', current: true },
        { role: 'Tech Lead', timeframe: '12-18 months', current: false },
        { role: 'Engineering Manager', timeframe: '24-36 months', current: false }
      ],
      match_score: 85,
      required_skills: ['Leadership', 'System Design', 'Team Management']
    },
    {
      id: 2,
      title: 'Technical Specialist Track',
      description: 'Become a domain expert and technical architect',
      steps: [
        { role: 'Senior Software Engineer', timeframe: '6-12 months', current: true },
        { role: 'Principal Engineer', timeframe: '18-24 months', current: false },
        { role: 'Distinguished Engineer', timeframe: '36-48 months', current: false }
      ],
      match_score: 78,
      required_skills: ['Advanced Architecture', 'Domain Expertise', 'Technical Mentoring']
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Career Pathways</h3>
        <p className="text-gray-600">AI-powered recommendations based on your skills and interests</p>
      </div>

      <div className="grid gap-6">
        {pathways.map((pathway) => (
          <div key={pathway.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-bold text-gray-900">{pathway.title}</h4>
                <p className="text-gray-600 mt-1">{pathway.description}</p>
              </div>
              <div className="text-right">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                  {pathway.match_score}% Match
                </div>
              </div>
            </div>

            {/* Career Steps */}
            <div className="mb-6">
              <div className="flex items-center space-x-4 overflow-x-auto pb-2">
                {pathway.steps.map((step, index) => (
                  <div key={index} className="flex items-center flex-shrink-0">
                    <div className={`p-4 rounded-lg border-2 ${
                      step.current 
                        ? 'bg-blue-50 border-blue-300 text-blue-900' 
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    }`}>
                      <div className="font-semibold text-sm">{step.role}</div>
                      <div className="text-xs mt-1">{step.timeframe}</div>
                    </div>
                    {index < pathway.steps.length - 1 && (
                      <div className="text-gray-400 mx-2">→</div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Required Skills */}
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Skills to Develop:</p>
              <div className="flex flex-wrap gap-2">
                {pathway.required_skills.map((skill, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                Start This Path
              </button>
              <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkillsDevelopment({ data }) {
  const skills = data?.skills || [
    { name: 'React/Frontend', current: 85, target: 95, category: 'Technical' },
    { name: 'System Design', current: 60, target: 85, category: 'Technical' },
    { name: 'Leadership', current: 45, target: 75, category: 'Soft Skills' },
    { name: 'Project Management', current: 55, target: 80, category: 'Management' }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Skills Development</h3>
        <p className="text-gray-600">Track your progress and identify growth opportunities</p>
      </div>

      <div className="grid gap-6">
        {skills.map((skill, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{skill.name}</h4>
                <p className="text-sm text-gray-500">{skill.category}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">{skill.current}%</div>
                <div className="text-sm text-gray-500">Target: {skill.target}%</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Current Level</span>
                <span>Target Level</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div className="relative h-3 bg-blue-600 rounded-full" style={{ width: `${skill.current}%` }}>
                  <div 
                    className="absolute top-0 h-3 bg-blue-300 rounded-full opacity-50" 
                    style={{ width: `${(skill.target - skill.current) / skill.current * 100}%`, left: '100%' }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                Find Learning Resources
              </button>
              <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50 transition-colors">
                Request Assessment
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GoalsAndMilestones({ data }) {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', target_date: '', category: 'skill' });

  const goals = data?.career_goals || [
    {
      id: 1,
      title: 'Complete System Design Course',
      description: 'Master advanced system design patterns and architecture',
      category: 'skill',
      target_date: '2024-03-15',
      progress: 65,
      status: 'in_progress'
    },
    {
      id: 2,
      title: 'Lead a Cross-functional Project',
      description: 'Successfully lead a project involving multiple teams',
      category: 'experience',
      target_date: '2024-06-30',
      progress: 30,
      status: 'in_progress'
    }
  ];

  const handleAddGoal = async () => {
    try {
      await api.post('/career/goals', newGoal);
      setShowAddGoal(false);
      setNewGoal({ title: '', description: '', target_date: '', category: 'skill' });
      // Refresh goals
    } catch (err) {
      console.error('Error adding goal:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Career Goals & Milestones</h3>
          <p className="text-gray-600">Set and track your professional development goals</p>
        </div>
        <button
          onClick={() => setShowAddGoal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Add Goal
        </button>
      </div>

      <div className="grid gap-6">
        {goals.map((goal) => (
          <div key={goal.id} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{goal.title}</h4>
                <p className="text-gray-600 mt-1">{goal.description}</p>
              </div>
              <div className="text-right">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  goal.status === 'completed' ? 'bg-green-100 text-green-800' :
                  goal.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {goal.status.replace('_', ' ').toUpperCase()}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{goal.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${goal.progress}%` }}
                ></div>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm text-gray-500">
              <span>Target Date: {new Date(goal.target_date).toLocaleDateString()}</span>
              <div className="flex gap-2">
                <button className="text-blue-600 hover:text-blue-800">Update Progress</button>
                <button className="text-gray-600 hover:text-gray-800">Edit</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Career Goal</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Goal Title</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Complete Leadership Training"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your goal in detail..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="skill">Skill Development</option>
                  <option value="experience">Experience</option>
                  <option value="certification">Certification</option>
                  <option value="leadership">Leadership</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Date</label>
                <input
                  type="date"
                  value={newGoal.target_date}
                  onChange={(e) => setNewGoal({...newGoal, target_date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddGoal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGoal}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Goal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MentorshipProgram({ data }) {
  const mentors = data?.available_mentors || [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Senior Engineering Manager',
      expertise: ['Leadership', 'System Design', 'Team Building'],
      experience: '8 years',
      rating: 4.9,
      availability: 'Available'
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'Principal Engineer',
      expertise: ['Architecture', 'Performance', 'Mentoring'],
      experience: '12 years',
      rating: 4.8,
      availability: 'Limited'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Mentorship Program</h3>
        <p className="text-gray-600">Connect with experienced professionals to accelerate your growth</p>
      </div>

      {/* Current Mentorship Status */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold text-blue-900">Your Mentorship Status</h4>
            <p className="text-blue-700 mt-1">
              {data?.current_mentor ? 
                `Currently mentored by ${data.current_mentor.name}` : 
                'No active mentorship - Find a mentor to accelerate your growth!'
              }
            </p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            {data?.current_mentor ? 'Schedule Session' : 'Find Mentor'}
          </button>
        </div>
      </div>

      {/* Available Mentors */}
      <div>
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Available Mentors</h4>
        <div className="grid gap-4">
          {mentors.map((mentor) => (
            <div key={mentor.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h5 className="text-lg font-semibold text-gray-900">{mentor.name}</h5>
                    <div className="ml-3 flex items-center">
                      <span className="text-yellow-400">⭐</span>
                      <span className="text-sm text-gray-600 ml-1">{mentor.rating}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-2">{mentor.role} • {mentor.experience} experience</p>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {mentor.expertise.map((skill, index) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    mentor.availability === 'Available' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {mentor.availability}
                  </div>
                </div>
                
                <div className="ml-4 flex flex-col gap-2">
                  <button className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors">
                    Request Mentorship
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50 transition-colors">
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Mentorship Benefits */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-purple-900 mb-4">Benefits of Mentorship</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl mb-2">🎯</div>
            <h5 className="font-medium text-purple-900">Personalized Guidance</h5>
            <p className="text-sm text-purple-700">Get tailored advice for your career path</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🚀</div>
            <h5 className="font-medium text-purple-900">Accelerated Growth</h5>
            <p className="text-sm text-purple-700">Learn from experienced professionals</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-2">🤝</div>
            <h5 className="font-medium text-purple-900">Network Expansion</h5>
            <p className="text-sm text-purple-700">Build valuable professional connections</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InternalOpportunities({ data }) {
  const opportunities = data?.internal_opportunities || [
    {
      id: 1,
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      location: 'Remote',
      type: 'Full-time',
      match_score: 92,
      posted_date: '2024-01-10',
      application_deadline: '2024-02-10',
      skills_match: ['React', 'TypeScript', 'System Design'],
      skills_gap: ['GraphQL'],
      description: 'Lead frontend development for our next-generation healthcare platform'
    },
    {
      id: 2,
      title: 'Technical Lead - Mobile',
      department: 'Engineering',
      location: 'Hybrid',
      type: 'Full-time',
      match_score: 78,
      posted_date: '2024-01-08',
      application_deadline: '2024-02-15',
      skills_match: ['Leadership', 'Mobile Development'],
      skills_gap: ['React Native', 'Team Management'],
      description: 'Lead our mobile development team and drive technical excellence'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Internal Opportunities</h3>
        <p className="text-gray-600">Explore career advancement opportunities within the company</p>
      </div>

      {/* Opportunity Alerts */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-green-600 text-xl mr-3">🔔</div>
          <div>
            <h4 className="font-medium text-green-900">New Opportunities Alert</h4>
            <p className="text-sm text-green-700">2 new positions match your career interests and skills</p>
          </div>
        </div>
      </div>

      {/* Opportunities List */}
      <div className="space-y-4">
        {opportunities.map((opportunity) => (
          <div key={opportunity.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="text-xl font-semibold text-gray-900">{opportunity.title}</h4>
                <div className="flex items-center text-sm text-gray-600 mt-1 space-x-4">
                  <span>{opportunity.department}</span>
                  <span>•</span>
                  <span>{opportunity.location}</span>
                  <span>•</span>
                  <span>{opportunity.type}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold mb-2">
                  {opportunity.match_score}% Match
                </div>
                <div className="text-xs text-gray-500">
                  Posted {new Date(opportunity.posted_date).toLocaleDateString()}
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{opportunity.description}</p>

            {/* Skills Analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm font-medium text-green-700 mb-2">✅ Skills You Have</p>
                <div className="flex flex-wrap gap-2">
                  {opportunity.skills_match.map((skill, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-orange-700 mb-2">📚 Skills to Develop</p>
                <div className="flex flex-wrap gap-2">
                  {opportunity.skills_gap.map((skill, index) => (
                    <span key={index} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Application Deadline */}
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
              <div className="flex items-center">
                <div className="text-yellow-600 mr-2">⏰</div>
                <span className="text-sm text-yellow-800">
                  Application deadline: {new Date(opportunity.application_deadline).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Apply Now
              </button>
              <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Learn More
              </button>
              <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Save for Later
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Career Interest Survey */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-blue-900 mb-2">Get Better Recommendations</h4>
        <p className="text-blue-700 mb-4">
          Take our career interest survey to receive more personalized opportunity recommendations
        </p>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Take Survey (5 min)
        </button>
      </div>
    </div>
  );
}