import React from 'react';
import { 
  Clock, UserPlus, FileText, Calendar, 
  DollarSign, Settings, Bell, MessageSquare,
  Plus, ArrowRight
} from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

const QuickActions = ({ userRole = 'employee' }) => {
  const actionsByRole = {
    employee: [
      {
        title: 'Clock In/Out',
        description: 'Mark your attendance',
        icon: <Clock className="w-5 h-5" />,
        href: '/dashboard/attendance',
        color: 'bg-blue-500',
        urgent: true
      },
      {
        title: 'Request Leave',
        description: 'Apply for time off',
        icon: <Calendar className="w-5 h-5" />,
        href: '/dashboard/leave',
        color: 'bg-green-500'
      },
      {
        title: 'View Payslip',
        description: 'Check your salary details',
        icon: <DollarSign className="w-5 h-5" />,
        href: '/dashboard/payroll',
        color: 'bg-purple-500'
      },
      {
        title: 'Submit Expense',
        description: 'Report business expenses',
        icon: <FileText className="w-5 h-5" />,
        href: '/dashboard/expenses',
        color: 'bg-orange-500'
      }
    ],
    manager: [
      {
        title: 'Approve Leaves',
        description: 'Review pending requests',
        icon: <Calendar className="w-5 h-5" />,
        href: '/dashboard/leave/approvals',
        color: 'bg-blue-500',
        badge: '3 pending'
      },
      {
        title: 'Team Performance',
        description: 'View team metrics',
        icon: <FileText className="w-5 h-5" />,
        href: '/dashboard/performance',
        color: 'bg-green-500'
      },
      {
        title: 'Schedule Meeting',
        description: 'Book meeting rooms',
        icon: <MessageSquare className="w-5 h-5" />,
        href: '/dashboard/meetings',
        color: 'bg-purple-500'
      },
      {
        title: 'Add Employee',
        description: 'Onboard new team member',
        icon: <UserPlus className="w-5 h-5" />,
        href: '/dashboard/employees/add',
        color: 'bg-indigo-500'
      }
    ],
    hr: [
      {
        title: 'Post Job',
        description: 'Create new job posting',
        icon: <Plus className="w-5 h-5" />,
        href: '/dashboard/recruitment/jobs/new',
        color: 'bg-blue-500'
      },
      {
        title: 'Review Applications',
        description: 'Screen candidates',
        icon: <FileText className="w-5 h-5" />,
        href: '/dashboard/recruitment',
        color: 'bg-green-500',
        badge: '12 new'
      },
      {
        title: 'Employee Analytics',
        description: 'View workforce insights',
        icon: <Settings className="w-5 h-5" />,
        href: '/dashboard/analytics',
        color: 'bg-purple-500'
      },
      {
        title: 'Send Announcement',
        description: 'Broadcast to all employees',
        icon: <Bell className="w-5 h-5" />,
        href: '/dashboard/announcements/new',
        color: 'bg-orange-500'
      }
    ],
    admin: [
      {
        title: 'System Settings',
        description: 'Configure HR system',
        icon: <Settings className="w-5 h-5" />,
        href: '/dashboard/settings',
        color: 'bg-gray-600'
      },
      {
        title: 'User Management',
        description: 'Manage user accounts',
        icon: <UserPlus className="w-5 h-5" />,
        href: '/dashboard/users',
        color: 'bg-blue-500'
      },
      {
        title: 'Reports',
        description: 'Generate system reports',
        icon: <FileText className="w-5 h-5" />,
        href: '/dashboard/reports',
        color: 'bg-green-500'
      },
      {
        title: 'Audit Logs',
        description: 'View system activity',
        icon: <Bell className="w-5 h-5" />,
        href: '/dashboard/audit',
        color: 'bg-red-500'
      }
    ]
  };

  const actions = actionsByRole[userRole] || actionsByRole.employee;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        <Button variant="ghost" size="sm">
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <div
            key={index}
            className="group relative p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 cursor-pointer hover:scale-105 transform"
            onClick={() => window.location.href = action.href}
          >
            {/* Urgent indicator */}
            {action.urgent && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            )}

            {/* Badge */}
            {action.badge && (
              <div className="absolute -top-2 -right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                {action.badge}
              </div>
            )}

            <div className="flex items-start space-x-3">
              <div className={`
                w-10 h-10 rounded-lg flex items-center justify-center text-white
                ${action.color} group-hover:scale-110 transition-transform duration-200
              `}>
                {action.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                  {action.title}
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  {action.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Custom action button */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          fullWidth
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Customize Quick Actions
        </Button>
      </div>
    </Card>
  );
};

export default QuickActions;