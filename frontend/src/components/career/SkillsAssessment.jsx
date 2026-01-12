import { useState, useEffect } from 'react';
import api from '../../api/axios';

export default function SkillsAssessment() {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);

  useEffect(() => {
    fetchSkillsAssessment();
  }, []);

  const fetchSkillsAssessment = async () => {
    try {
      setLoading(true);
      const response = await api.get('/career/skills-assessment');
      setAssessment(response.data);
    } catch (err) {
      console.error('Error fetching skills assessment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeAssessment = (skill) => {
    setSelectedSkill(skill);
    setShowAssessmentModal(true);
  };

  const categories = ['all', 'Technical', 'Soft Skills', 'Management', 'Leadership'];
  
  const filteredSkills = assessment?.skills?.filter(skill => 
    activeCategory === 'all' || skill.category === activeCategory
  ) || [];

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
      <div className="bg-gradient-to-r from-green-600 via-teal-600 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Skills Assessment Center</h1>
        <p className="text-green-100">Evaluate and track your professional skills development</p>
      </div>

      {/* Overall Progress */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Overall Skills Progress</h3>
          <div className="text-right">
            <div className="text-2xl font-bold text-green-600">{assessment?.overall_score || 75}%</div>
            <div className="text-sm text-gray-500">Average Score</div>
          </div>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div 
            className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full transition-all duration-500"
            style={{ width: `${assessment?.overall_score || 75}%` }}
          ></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">{assessment?.completed_assessments || 8}</div>
            <div className="text-sm text-blue-800">Completed</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-lg font-bold text-yellow-600">{assessment?.pending_assessments || 3}</div>
            <div className="text-sm text-yellow-800">Pending</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">{assessment?.improved_skills || 5}</div>
            <div className="text-sm text-green-800">Improved</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">{assessment?.certifications || 2}</div>
            <div className="text-sm text-purple-800">Certifications</div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'All Skills' : category}
            </button>
          ))}
        </div>

        {/* Skills Grid */}
        <div className="grid gap-4">
          {filteredSkills.map((skill, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{skill.name}</h4>
                  <p className="text-sm text-gray-500">{skill.category}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{skill.current}%</div>
                  <div className="text-sm text-gray-500">Current Level</div>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Current Level</span>
                    <span>Target Level ({skill.target}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-blue-600 h-3 rounded-full relative"
                      style={{ width: `${skill.current}%` }}
                    >
                      <div 
                        className="absolute top-0 right-0 h-3 bg-blue-300 rounded-full opacity-50"
                        style={{ width: `${Math.max(0, skill.target - skill.current)}px` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skill Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">PROFICIENCY</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {skill.current >= 80 ? 'Expert' : 
                     skill.current >= 60 ? 'Advanced' : 
                     skill.current >= 40 ? 'Intermediate' : 'Beginner'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">LAST ASSESSED</p>
                  <p className="text-sm text-gray-700">{skill.last_assessed || '2 weeks ago'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">TREND</p>
                  <p className={`text-sm font-semibold ${
                    (skill.trend || 'up') === 'up' ? 'text-green-600' : 
                    skill.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {(skill.trend || 'up') === 'up' ? '↗ Improving' : 
                     skill.trend === 'down' ? '↘ Declining' : '→ Stable'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleTakeAssessment(skill)}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                >
                  Take Assessment
                </button>
                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50 transition-colors">
                  View Learning Path
                </button>
                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-50 transition-colors">
                  Find Mentor
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Assessments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommended Assessments</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: 'Cloud Architecture', priority: 'High', duration: '45 min', type: 'Technical' },
            { name: 'Team Leadership', priority: 'Medium', duration: '30 min', type: 'Leadership' },
            { name: 'Data Analysis', priority: 'Low', duration: '60 min', type: 'Technical' }
          ].map((rec, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-gray-900">{rec.name}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  rec.priority === 'High' ? 'bg-red-100 text-red-800' :
                  rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {rec.priority}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{rec.type} • {rec.duration}</p>
              <button className="w-full bg-gray-100 text-gray-700 py-2 rounded text-sm hover:bg-gray-200 transition-colors">
                Start Assessment
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Assessment Modal */}
      {showAssessmentModal && selectedSkill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedSkill.name} Assessment
                </h3>
                <button
                  onClick={() => setShowAssessmentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-blue-900 mb-2">Assessment Overview</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Duration: 30-45 minutes</li>
                    <li>• Format: Multiple choice and practical scenarios</li>
                    <li>• Immediate results and feedback</li>
                    <li>• Personalized learning recommendations</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">What You'll Be Assessed On:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Core concepts and fundamentals</li>
                      <li>• Practical application scenarios</li>
                      <li>• Best practices and methodologies</li>
                      <li>• Problem-solving approaches</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAssessmentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Start assessment logic here
                    setShowAssessmentModal(false);
                    alert('Assessment started! (This would redirect to the assessment platform)');
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Start Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}