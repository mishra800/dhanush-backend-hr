import { useState, useEffect } from 'react';
import { Users, Building, TrendingUp, TrendingDown, Award, Target, BarChart3 } from 'lucide-react';
import api from '../../api/axios';

export default function EmployeeAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [departmentAnalytics, setDepartmentAnalytics] = useState([]);
  const [skillsAnalytics, setSkillsAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [overviewRes, departmentRes, skillsRes] = await Promise.all([
        api.get('/employees/analytics/overview'),
        api.get('/employees/analytics/departments'),
        api.get('/employees/analytics/skills')
      ]);

      setAnalytics(overviewRes.data);
      setDepartmentAnalytics(departmentRes.data);
      setSkillsAnalytics(skillsRes.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTenure = (months) => {
    if (months < 12) {
      return `${Math.round(months)} months`;
    }
    const years = Math.floor(months / 12);
    const remainingMonths = Math.round(months % 12);
    return remainingMonths > 0 ? `${years}y ${remainingMonths}m` : `${years} years`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employee Analytics</h1>
          <p className="text-gray-600">Comprehensive insights into your workforce</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'departments'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Departments
        </button>
        <button
          onClick={() => setActiveTab('skills')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'skills'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Skills
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Employees</p>
                  <p className="text-3xl font-bold text-gray-900">{analytics.total_employees}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Employees</p>
                  <p className="text-3xl font-bold text-green-600">{analytics.active_employees}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-2">
                <span className="text-sm text-gray-500">
                  {((analytics.active_employees / analytics.total_employees) * 100).toFixed(1)}% active
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Tenure</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {formatTenure(analytics.avg_tenure_months)}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Award className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Turnover Rate</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {analytics.turnover_rate.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <TrendingDown className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900">New Hires</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {analytics.new_hires_this_month}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-900">Exits</span>
                  </div>
                  <span className="text-2xl font-bold text-red-600">
                    {analytics.exits_this_month}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Net Growth</span>
                  </div>
                  <span className={`text-2xl font-bold ${
                    analytics.new_hires_this_month - analytics.exits_this_month >= 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {analytics.new_hires_this_month - analytics.exits_this_month >= 0 ? '+' : ''}
                    {analytics.new_hires_this_month - analytics.exits_this_month}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Distribution</h3>
              <div className="space-y-3">
                {analytics.departments.slice(0, 6).map((dept, index) => {
                  const deptData = departmentAnalytics.find(d => d.department === dept);
                  const employeeCount = deptData?.total_employees || 0;
                  const percentage = ((employeeCount / analytics.total_employees) * 100).toFixed(1);
                  
                  return (
                    <div key={dept} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ 
                            backgroundColor: `hsl(${index * 60}, 70%, 50%)` 
                          }}
                        ></div>
                        <span className="text-sm font-medium text-gray-700">{dept}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-gray-900">{employeeCount}</span>
                        <span className="text-xs text-gray-500 ml-1">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Departments Tab */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {departmentAnalytics.map((dept, index) => (
              <div key={dept.department} className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{dept.department}</h3>
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Building className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Employees</span>
                    <span className="text-lg font-bold text-gray-900">{dept.total_employees}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Department Heads</span>
                    <span className="text-lg font-bold text-gray-900">{dept.department_heads}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Tenure</span>
                    <span className="text-lg font-bold text-gray-900">
                      {dept.avg_tenure_years.toFixed(1)} years
                    </span>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">% of Company</span>
                      <span className="text-sm font-medium text-blue-600">
                        {((dept.total_employees / analytics?.total_employees || 1) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills Tab */}
      {activeTab === 'skills' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Employee Skills Overview</h3>
              <p className="text-sm text-gray-600 mt-1">Skills distribution across employees</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Skills
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Avg Proficiency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Certified Skills
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {skillsAnalytics.slice(0, 10).map((employee) => (
                    <tr key={employee.employee_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.employee_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{employee.department}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{employee.total_skills}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900 mr-2">
                            {employee.avg_proficiency.toFixed(1)}/10
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(employee.avg_proficiency / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {employee.certified_skills}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {skillsAnalytics.length > 10 && (
              <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing 10 of {skillsAnalytics.length} employees
                </p>
              </div>
            )}
          </div>

          {/* Skills Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <BarChart3 className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Total Skills</h3>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {skillsAnalytics.reduce((sum, emp) => sum + emp.total_skills, 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Across all employees</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-green-600" />
                <h3 className="text-lg font-semibold text-gray-900">Avg Proficiency</h3>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {skillsAnalytics.length > 0 
                  ? (skillsAnalytics.reduce((sum, emp) => sum + emp.avg_proficiency, 0) / skillsAnalytics.length).toFixed(1)
                  : '0'
                }/10
              </p>
              <p className="text-sm text-gray-600 mt-1">Company average</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-4">
                <Award className="w-6 h-6 text-purple-600" />
                <h3 className="text-lg font-semibold text-gray-900">Certifications</h3>
              </div>
              <p className="text-3xl font-bold text-purple-600">
                {skillsAnalytics.reduce((sum, emp) => sum + emp.certified_skills, 0)}
              </p>
              <p className="text-sm text-gray-600 mt-1">Total certified skills</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}