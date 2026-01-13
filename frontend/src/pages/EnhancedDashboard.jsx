import React, { useState, useEffect } from 'react';
import { 
  Users, Clock, Calendar, DollarSign, 
  TrendingUp, AlertCircle, CheckCircle,
  BarChart3, PieChart, Activity
} from 'lucide-react';
import EnhancedMetricCard from '../components/dashboard/EnhancedMetricCard';
import QuickActions from '../components/dashboard/QuickActions';
import Card, { CardHeader, CardBody } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { useAuth } from '../context/authcontext';
import { useToast } from '../context/ToastContext';

const EnhancedDashboard = () => {
  const { user } = useAuth();
  const { success, error, info } = useToast();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const userRole = user?.role || 'employee';

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data based on role
      const mockData = {
        employee: {
          metrics: [
            { title: 'Leave Balance', value: '12 days', change: 0, color: 'green', icon: '🏖️' },
            { title: 'Hours This Week', value: '32h', change: 8, color: 'blue', icon: '⏰' },
            { title: 'Performance Score', value: '4.2/5', change: 5, color: 'purple', icon: '⭐' },
            { title: 'Learning Hours', value: '8h', change: 15, color: 'indigo', icon: '📚' }
          ],
          recentActivities: [
            { type: 'attendance', message: 'Checked in at 9:00 AM', time: '2 hours ago' },
            { type: 'leave', message: 'Leave request approved', time: '1 day ago' },
            { type: 'training', message: 'Completed React Training', time: '3 days ago' }
          ]
        },
        manager: {
          metrics: [
            { title: 'Team Size', value: '12', change: 2, color: 'blue', icon: '👥' },
            { title: 'Pending Approvals', value: '5', change: -20, color: 'yellow', icon: '⏳' },
            { title: 'Team Performance', value: '4.1/5', change: 3, color: 'green', icon: '📊' },
            { title: 'Open Positions', value: '3', change: 0, color: 'purple', icon: '🎯' }
          ],
          recentActivities: [
            { type: 'approval', message: 'Approved leave for John Doe', time: '1 hour ago' },
            { type: 'review', message: 'Performance review scheduled', time: '2 hours ago' },
            { type: 'hiring', message: 'New candidate interviewed', time: '1 day ago' }
          ]
        },
        hr: {
          metrics: [
            { title: 'Total Employees', value: '247', change: 8, color: 'blue', icon: '👥' },
            { title: 'New Hires', value: '12', change: 20, color: 'green', icon: '🆕' },
            { title: 'Turnover Rate', value: '3.2%', change: -15, color: 'red', icon: '📉' },
            { title: 'Open Positions', value: '18', change: 5, color: 'purple', icon: '🎯' }
          ],
          recentActivities: [
            { type: 'hiring', message: '5 new applications received', time: '30 minutes ago' },
            { type: 'policy', message: 'Updated leave policy', time: '2 hours ago' },
            { type: 'onboarding', message: '3 employees onboarded', time: '1 day ago' }
          ]
        },
        admin: {
          metrics: [
            { title: 'System Users', value: '247', change: 8, color: 'blue', icon: '👤' },
            { title: 'Active Sessions', value: '89', change: 12, color: 'green', icon: '🔗' },
            { title: 'System Health', value: '99.9%', change: 0, color: 'green', icon: '💚' },
            { title: 'Storage Used', value: '67%', change: 5, color: 'yellow', icon: '💾' }
          ],
          recentActivities: [
            { type: 'system', message: 'Database backup completed', time: '1 hour ago' },
            { type: 'security', message: 'Security scan passed', time: '4 hours ago' },
            { type: 'update', message: 'System updated to v2.1.0', time: '1 day ago' }
          ]
        }
      };

      setDashboardData(mockData[userRole] || mockData.employee);
      success('Dashboard loaded successfully!');
    } catch (err) {
      error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getRoleSpecificContent = () => {
    switch (userRole) {
      case 'admin':
        return {
          title: 'System Overview',
          description: 'Monitor system performance and user activity',
          primaryAction: { label: 'View System Logs', href: '/dashboard/logs' }
        };
      case 'hr':
        return {
          title: 'HR Dashboard',
          description: 'Manage employees and recruitment pipeline',
          primaryAction: { label: 'View All Employees', href: '/dashboard/employees' }
        };
      case 'manager':
        return {
          title: 'Team Management',
          description: 'Oversee your team performance and approvals',
          primaryAction: { label: 'View Team', href: '/dashboard/team' }
        };
      default:
        return {
          title: 'Employee Portal',
          description: 'Access your personal HR information and tools',
          primaryAction: { label: 'View Profile', href: '/dashboard/profile' }
        };
    }
  };

  const roleContent = getRoleSpecificContent();

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton */}
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 gradient-text">
            {getGreeting()}, {user?.name || user?.email}! 👋
          </h1>
          <p className="text-gray-600 mt-1">{roleContent.description}</p>
        </div>
        
        <div className="mt-4 lg:mt-0 flex items-center space-x-3">
          <Badge variant="primary" className="capitalize">
            {userRole}
          </Badge>
          <Button
            variant="primary"
            onClick={() => window.location.href = roleContent.primaryAction.href}
          >
            {roleContent.primaryAction.label}
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardData?.metrics.map((metric, index) => (
          <EnhancedMetricCard
            key={index}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            color={metric.color}
            icon={metric.icon}
            variant="default"
            size="default"
            onClick={() => info(`Clicked on ${metric.title}`)}
            className="hover-lift"
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2">
          <QuickActions userRole={userRole} />
        </div>

        {/* Recent Activity */}
        <Card className="hover-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            {dashboardData?.recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-white text-sm
                  ${activity.type === 'attendance' ? 'bg-blue-500' :
                    activity.type === 'leave' ? 'bg-green-500' :
                    activity.type === 'training' ? 'bg-purple-500' :
                    activity.type === 'approval' ? 'bg-yellow-500' :
                    activity.type === 'review' ? 'bg-indigo-500' :
                    activity.type === 'hiring' ? 'bg-pink-500' :
                    activity.type === 'policy' ? 'bg-orange-500' :
                    activity.type === 'onboarding' ? 'bg-teal-500' :
                    activity.type === 'system' ? 'bg-gray-500' :
                    activity.type === 'security' ? 'bg-red-500' :
                    'bg-blue-500'
                  }
                `}>
                  {activity.type === 'attendance' && <Clock className="w-4 h-4" />}
                  {activity.type === 'leave' && <Calendar className="w-4 h-4" />}
                  {activity.type === 'training' && '📚'}
                  {activity.type === 'approval' && <CheckCircle className="w-4 h-4" />}
                  {activity.type === 'review' && <BarChart3 className="w-4 h-4" />}
                  {activity.type === 'hiring' && <Users className="w-4 h-4" />}
                  {activity.type === 'policy' && '📋'}
                  {activity.type === 'onboarding' && '🚀'}
                  {activity.type === 'system' && '⚙️'}
                  {activity.type === 'security' && '🔒'}
                  {activity.type === 'update' && '🔄'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
            
            <Button variant="ghost" fullWidth className="mt-4">
              View All Activity
            </Button>
          </CardBody>
        </Card>
      </div>

      {/* Additional Role-Specific Widgets */}
      {userRole === 'hr' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="hover-lift">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Recruitment Pipeline</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Applications</span>
                  <Badge variant="primary">24 new</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Interviews</span>
                  <Badge variant="warning">8 scheduled</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Offers</span>
                  <Badge variant="success">3 pending</Badge>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card className="hover-lift">
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Employee Insights</h3>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Satisfaction Score</span>
                  <span className="font-semibold text-green-600">4.2/5</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Engagement Rate</span>
                  <span className="font-semibold text-blue-600">87%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Retention Rate</span>
                  <span className="font-semibold text-purple-600">94%</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EnhancedDashboard;