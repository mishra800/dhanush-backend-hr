import { useState } from 'react';
import { Users, BarChart3, Upload, Network, UserPlus, Settings } from 'lucide-react';
import EmployeeDirectory from '../components/employees/EmployeeDirectory';
import OrganizationalChart from '../components/employees/OrganizationalChart';
import BulkImportEmployees from '../components/employees/BulkImportEmployees';
import EmployeeAnalytics from '../components/employees/EmployeeAnalytics';

export default function EmployeeManagement() {
  const [activeTab, setActiveTab] = useState('directory');

  const tabs = [
    {
      id: 'directory',
      name: 'Employee Directory',
      icon: Users,
      component: EmployeeDirectory
    },
    {
      id: 'org-chart',
      name: 'Org Chart',
      icon: Network,
      component: OrganizationalChart
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: BarChart3,
      component: EmployeeAnalytics
    },
    {
      id: 'bulk-import',
      name: 'Bulk Import',
      icon: Upload,
      component: BulkImportEmployees
    }
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
              <p className="text-gray-600">Comprehensive employee management system</p>
            </div>
            
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <UserPlus className="w-4 h-4" />
                Add Employee
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Settings className="w-4 h-4" />
                Settings
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
}