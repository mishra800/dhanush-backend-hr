import { useState } from 'react';
import logo from '../assets/logo.png';

export default function Help() {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const sections = [
    { id: 'overview', name: 'System Overview', icon: '🏢' },
    { id: 'authentication', name: 'Login & Authentication', icon: '🔐' },
    { id: 'dashboard', name: 'Dashboard & Navigation', icon: '📊' },
    { id: 'recruitment', name: 'Recruitment Process', icon: '👥' },
    { id: 'employees', name: 'Employee Management', icon: '👤' },
    { id: 'onboarding', name: 'Onboarding Process', icon: '🚀' },
    { id: 'attendance', name: 'Attendance System', icon: '📅' },
    { id: 'leave', name: 'Leave Management', icon: '🏖️' },
    { id: 'payroll', name: 'Payroll System', icon: '💰' },
    { id: 'assets', name: 'Asset Management', icon: '💻' },
    { id: 'performance', name: 'Performance Reviews', icon: '⭐' },
    { id: 'ai-assistant', name: 'AI Assistant', icon: '🤖' },
    { id: 'troubleshooting', name: 'Troubleshooting', icon: '🔧' },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return <OverviewSection />;
      case 'authentication':
        return <AuthenticationSection />;
      case 'dashboard':
        return <DashboardSection />;
      case 'recruitment':
        return <RecruitmentSection />;
      case 'employees':
        return <EmployeesSection />;
      case 'onboarding':
        return <OnboardingSection />;
      case 'attendance':
        return <AttendanceSection />;
      case 'leave':
        return <LeaveSection />;
      case 'payroll':
        return <PayrollSection />;
      case 'assets':
        return <AssetsSection />;
      case 'performance':
        return <PerformanceSection />;
      case 'ai-assistant':
        return <AIAssistantSection />;
      case 'troubleshooting':
        return <TroubleshootingSection />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        {/* Company Logo Header */}
        <div className="bg-white shadow rounded-lg p-6 text-center mb-8">
          <img src={logo} alt="Company Logo" className="h-20 w-auto mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900">📚 Help & Documentation</h1>
          <p className="text-gray-600 mt-2">Complete guide to using the HR Management System</p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search for help topics..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <h3 className="font-semibold text-gray-900 mb-4">Topics</h3>
              <nav className="space-y-1">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="mr-2">{section.icon}</span>
                    {section.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-8">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// Section Components
function OverviewSection() {
  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">🏢 System Overview</h2>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-blue-900 font-semibold">Welcome to the AI-Powered HR Management System</p>
        <p className="text-blue-800 text-sm mt-1">A comprehensive platform for managing all HR operations with advanced AI capabilities</p>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">🚀 Latest Features (2025)</h3>
      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
        <ul className="list-disc list-inside space-y-1 text-green-800 text-sm">
          <li><strong>Enhanced Payroll System</strong> - Comprehensive salary calculations with approval workflows</li>
          <li><strong>Asset Management</strong> - Complete asset lifecycle with photo documentation</li>
          <li><strong>AI Assistant</strong> - Real-time HR support with intelligent responses</li>
          <li><strong>Unified Dashboard</strong> - Role-based personalized dashboards</li>
          <li><strong>Advanced Onboarding</strong> - 6-phase gatekeeper model with IT provisioning</li>
          <li><strong>Attendance Hub</strong> - Centralized attendance management with WFH support</li>
        </ul>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">Key Features</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <FeatureCard icon="👥" title="AI-Powered Recruitment" desc="Intelligent candidate matching and automated interviews" />
        <FeatureCard icon="📅" title="Biometric Attendance" desc="Face recognition with GPS validation and WFH support" />
        <FeatureCard icon="🏖️" title="Leave Management" desc="Automated approval workflows with balance tracking" />
        <FeatureCard icon="💰" title="Comprehensive Payroll" desc="Automated calculations with compliance and approvals" />
        <FeatureCard icon="🚀" title="Gatekeeper Onboarding" desc="6-phase compliance-driven onboarding process" />
        <FeatureCard icon="💻" title="Asset Management" desc="Complete asset lifecycle with photo documentation" />
        <FeatureCard icon="⭐" title="Performance Analytics" desc="360° reviews with predictive insights" />
        <FeatureCard icon="🤖" title="AI Assistant" desc="Real-time HR support and intelligent responses" />
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">User Roles & Access Levels</h3>
      <div className="space-y-3">
        <RoleCard role="Super Admin" color="purple" permissions={['Complete system control', 'Audit access', 'Security monitoring', 'All module access']} />
        <RoleCard role="Admin" color="red" permissions={['User management', 'System configuration', 'All HR modules', 'Report generation']} />
        <RoleCard role="HR Manager" color="blue" permissions={['Payroll approval', 'Leave policy management', 'Final hiring decisions', 'Employee lifecycle']} />
        <RoleCard role="HR" color="indigo" permissions={['Payroll calculation', 'Recruitment management', 'Onboarding coordination', 'Attendance monitoring']} />
        <RoleCard role="Manager" color="orange" permissions={['Team management', 'Leave approvals', 'WFH approvals', 'Performance reviews']} />
        <RoleCard role="Assets Team" color="green" permissions={['Asset fulfillment', 'IT provisioning', 'Hardware management', 'Issue resolution']} />
        <RoleCard role="Employee" color="gray" permissions={['Self-service access', 'Attendance marking', 'Leave requests', 'Payslip access']} />
        <RoleCard role="Candidate" color="yellow" permissions={['Job applications', 'AI interviews', 'Application tracking', 'Limited access']} />
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">🔒 Security & Compliance</h3>
      <div className="bg-gray-50 rounded-lg p-4">
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li><strong>Role-Based Access Control</strong> - Granular permissions for each user role</li>
          <li><strong>Audit Trail</strong> - Complete logging of all user actions and system changes</li>
          <li><strong>Data Encryption</strong> - Secure data transmission and storage</li>
          <li><strong>Biometric Security</strong> - Face recognition for attendance verification</li>
          <li><strong>GPS Validation</strong> - Location-based attendance compliance</li>
          <li><strong>Document Verification</strong> - OCR-based document validation</li>
        </ul>
      </div>
    </div>
  );
}


function AuthenticationSection() {
  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">🔐 Login & Authentication</h2>
      
      <h3 className="text-xl font-semibold mt-6 mb-3">How to Login</h3>
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <ol className="list-decimal list-inside space-y-3 text-gray-700">
          <li>Navigate to the login page</li>
          <li>Enter your email address (e.g., john.doe@company.com)</li>
          <li>Enter your password</li>
          <li>Click "Sign In"</li>
          <li>You'll be redirected to your role-specific dashboard</li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">🎭 Demo Credentials (Testing)</h3>
      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
        <p className="text-green-900 font-semibold">✅ LEAN 5-Role Structure Available</p>
        <div className="mt-3 space-y-2 text-sm">
          <p><strong>👑 Super Admin:</strong> admin@company.com / admin123</p>
          <p><strong>💼 HR Admin:</strong> hr@company.com / hr123</p>
          <p><strong>👨‍💼 Manager:</strong> manager@company.com / manager123</p>
          <p><strong>👤 Employee:</strong> employee@company.com / employee123</p>
          <p><strong>🎓 Candidate:</strong> candidate@company.com / candidate123</p>
        </div>
        <p className="text-green-800 text-xs mt-2">Click any role in the login page demo section to auto-login</p>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">🔒 Security Features</h3>
      <div className="space-y-3">
        <SecurityFeature icon="🛡️" title="Rate Limiting" desc="Protection against brute force attacks" />
        <SecurityFeature icon="🔐" title="JWT Tokens" desc="Secure session management with automatic expiry" />
        <SecurityFeature icon="👤" title="Role-Based Access" desc="Granular permissions based on user roles" />
        <SecurityFeature icon="📱" title="Remember Me" desc="Secure credential storage for convenience" />
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">Password Requirements</h3>
      <ul className="list-disc list-inside space-y-2 text-gray-700">
        <li>Minimum 6 characters (enhanced security recommended)</li>
        <li>Mix of letters and numbers recommended</li>
        <li>Avoid common passwords</li>
        <li>Change passwords regularly</li>
      </ul>

      <h3 className="text-xl font-semibold mt-6 mb-3">🆘 Account Issues</h3>
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <p className="text-yellow-900 font-semibold">Need Help?</p>
        <ul className="text-yellow-800 text-sm mt-2 space-y-1">
          <li>• <strong>Forgot Password:</strong> Contact your HR administrator</li>
          <li>• <strong>Account Locked:</strong> Wait 15 minutes or contact support</li>
          <li>• <strong>Role Issues:</strong> Verify with your manager or HR</li>
          <li>• <strong>New Employee:</strong> HR will provide credentials after onboarding</li>
        </ul>
      </div>
    </div>
  );
}

function DashboardSection() {
  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Dashboard & Navigation</h2>
      
      <h3 className="text-xl font-semibold mt-6 mb-3">🎯 Role-Based Dashboards</h3>
      <div className="space-y-4">
        <DashboardCard 
          role="Super Admin" 
          color="purple" 
          features={['System overview', 'User management', 'Audit logs', 'Security monitoring']}
          description="Complete system control with administrative tools"
        />
        <DashboardCard 
          role="HR Admin" 
          color="blue" 
          features={['Employee stats', 'Recruitment pipeline', 'Leave approvals', 'Payroll overview']}
          description="Comprehensive HR operations dashboard"
        />
        <DashboardCard 
          role="Manager" 
          color="orange" 
          features={['Team workload', 'Attendance overview', 'Performance metrics', 'Approval queue']}
          description="Team management and oversight tools"
        />
        <DashboardCard 
          role="Employee" 
          color="gray" 
          features={['Attendance status', 'Leave balance', 'Goals progress', 'Quick actions']}
          description="Personal productivity and self-service portal"
        />
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">🧭 Navigation Guide</h3>
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h4 className="font-semibold mb-3">Sidebar Navigation:</h4>
        <ul className="space-y-2 text-gray-700">
          <li><strong>📊 Dashboard:</strong> Main overview and statistics</li>
          <li><strong>👥 Recruitment:</strong> Job postings and candidate management</li>
          <li><strong>👤 Employees:</strong> Employee directory and management</li>
          <li><strong>📅 Attendance:</strong> Attendance tracking and reports</li>
          <li><strong>🏖️ Leave:</strong> Leave requests and approvals</li>
          <li><strong>💰 Payroll:</strong> Salary management and payslips</li>
          <li><strong>💻 Assets:</strong> IT asset management and requests</li>
          <li><strong>🚀 Onboarding:</strong> New employee onboarding process</li>
          <li><strong>⭐ Performance:</strong> Performance reviews and goals</li>
        </ul>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">🤖 AI Assistant</h3>
      <div className="bg-pink-50 border-l-4 border-pink-500 p-4 mb-6">
        <p className="text-pink-900 font-semibold">💬 Your Personal HR Assistant</p>
        <p className="text-pink-800 text-sm mt-1">Click the chat icon (bottom-right) for instant help with:</p>
        <ul className="text-pink-800 text-sm mt-2 space-y-1">
          <li>• Leave balance inquiries</li>
          <li>• Attendance status checks</li>
          <li>• Payroll information</li>
          <li>• System navigation help</li>
          <li>• Policy clarifications</li>
        </ul>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">🔔 Notifications</h3>
      <div className="space-y-2 text-gray-700">
        <p><strong>Bell Icon (Top Bar):</strong> System notifications and alerts</p>
        <p><strong>Real-time Updates:</strong> Leave approvals, payroll updates, system announcements</p>
        <p><strong>Priority Alerts:</strong> Urgent items requiring immediate attention</p>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">📱 Mobile Responsiveness</h3>
      <div className="bg-blue-50 rounded-lg p-4">
        <p className="text-blue-900 font-semibold">✅ Fully Mobile Optimized</p>
        <ul className="text-blue-800 text-sm mt-2 space-y-1">
          <li>• Responsive design works on all devices</li>
          <li>• Touch-friendly interface for mobile attendance</li>
          <li>• Optimized camera integration for face recognition</li>
          <li>• GPS functionality for location-based features</li>
        </ul>
      </div>
    </div>
  );
}


function RecruitmentSection() {
  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">👥 Recruitment Process</h2>
      
      <h3 className="text-xl font-semibold mt-6 mb-3">Complete Workflow</h3>
      <div className="space-y-4">
        <WorkflowStep number="1" title="Create Job Requisition" desc="HR creates a new job opening with details" />
        <WorkflowStep number="2" title="Candidate Application" desc="Candidates apply through the portal" />
        <WorkflowStep number="3" title="Resume Screening" desc="AI-powered resume parsing and screening" />
        <WorkflowStep number="4" title="Interview Scheduling" desc="Schedule interviews with candidates" />
        <WorkflowStep number="5" title="Interview Feedback" desc="Interviewers provide feedback" />
        <WorkflowStep number="6" title="Offer Generation" desc="Generate and send offer letters" />
        <WorkflowStep number="7" title="Onboarding" desc="Accepted candidates move to onboarding" />
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">Kanban Board Stages</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StageCard stage="Applied" color="blue" />
        <StageCard stage="Screening" color="yellow" />
        <StageCard stage="Interview" color="purple" />
        <StageCard stage="Offer" color="green" />
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">How to Add a Candidate</h3>
      <div className="bg-gray-50 rounded-lg p-6">
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Go to Recruitment page</li>
          <li>Click "Add Candidate" button</li>
          <li>Fill in candidate details (name, email, phone, position)</li>
          <li>Upload resume (optional - AI will parse it)</li>
          <li>Click "Submit"</li>
          <li>Candidate appears in "Applied" stage</li>
        </ol>
      </div>
    </div>
  );
}


function EmployeesSection() {
  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">👤 Employee Management</h2>
      
      <h3 className="text-xl font-semibold mt-6 mb-3">Adding New Employees</h3>
      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
        <p className="text-green-900 font-semibold">✅ Recommended Method</p>
        <p className="text-green-800 text-sm mt-1">Use "Create with Account" to automatically create both user account and employee profile</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <h4 className="font-semibold mb-3">Step-by-Step Process:</h4>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Login as Admin/HR</li>
          <li>Go to Employees page</li>
          <li>Click "Add Employee" button</li>
          <li>Fill in employee details:
            <ul className="list-disc list-inside ml-6 mt-2">
              <li>First Name & Last Name</li>
              <li>Email (for login)</li>
              <li>Department & Position</li>
              <li>Date of Joining</li>
              <li>PAN & Aadhaar (optional)</li>
            </ul>
          </li>
          <li>Choose password option:
            <ul className="list-disc list-inside ml-6 mt-2">
              <li>Auto-generate (recommended)</li>
              <li>Set custom password</li>
            </ul>
          </li>
          <li>Select user role (Employee/Manager/HR/Admin)</li>
          <li>Click "Create Employee"</li>
          <li>📋 Copy the generated credentials</li>
          <li>Share credentials securely with employee</li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">AI Document Extraction</h3>
      <p className="text-gray-700 mb-3">Upload documents to auto-fill employee details:</p>
      <ul className="list-disc list-inside space-y-2 text-gray-700">
        <li>Offer Letter → Extracts name, position, salary</li>
        <li>PAN Card → Extracts PAN number</li>
        <li>Aadhaar Card → Extracts Aadhaar number</li>
        <li>Resume → Extracts profile summary</li>
      </ul>
    </div>
  );
}


function AttendanceSection() {
  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">📅 Attendance System</h2>
      
      <h3 className="text-xl font-semibold mt-6 mb-3">How to Mark Attendance</h3>
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <h4 className="font-semibold mb-3">One-Click Attendance Process:</h4>
        <ol className="list-decimal list-inside space-y-3 text-gray-700">
          <li><strong>Click "Start Camera & Mark Attendance"</strong>
            <p className="text-sm ml-6 mt-1">Browser will request camera permission - click "Allow"</p>
          </li>
          <li><strong>Wait for Camera Ready</strong>
            <p className="text-sm ml-6 mt-1">You'll see a "LIVE" badge and "Camera Ready" message</p>
          </li>
          <li><strong>Position Your Face</strong>
            <p className="text-sm ml-6 mt-1">Align your face within the circle guide</p>
          </li>
          <li><strong>Click "Capture & Mark Attendance"</strong>
            <p className="text-sm ml-6 mt-1">Browser will request location permission - click "Allow"</p>
          </li>
          <li><strong>Success!</strong>
            <p className="text-sm ml-6 mt-1">Your attendance is marked with photo and location</p>
          </li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">Attendance Rules</h3>
      <div className="space-y-3">
        <RuleCard icon="⏰" title="Check-in Window" desc="8:00 AM - 11:00 AM (Late after 11 AM)" />
        <RuleCard icon="🏢" title="Office Mode" desc="Must be within 100m of office location" />
        <RuleCard icon="🏠" title="WFH Mode" desc="Can mark from anywhere with approved WFH request" />
        <RuleCard icon="📸" title="Photo Required" desc="Face photo captured for verification" />
        <RuleCard icon="📍" title="GPS Required" desc="Location tracked for compliance" />
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">Troubleshooting</h3>
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <p className="font-semibold text-yellow-900 mb-2">Common Issues:</p>
        <ul className="list-disc list-inside space-y-1 text-yellow-800 text-sm">
          <li><strong>Camera not starting:</strong> Check browser permissions</li>
          <li><strong>Location error:</strong> Enable location services</li>
          <li><strong>"Too far from office":</strong> Request WFH or move closer</li>
          <li><strong>"Already marked":</strong> Can only mark once per day</li>
        </ul>
      </div>
    </div>
  );
}


function LeaveSection() {
  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">🏖️ Leave Management</h2>
      
      <h3 className="text-xl font-semibold mt-6 mb-3">How to Request Leave</h3>
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Go to Leave page</li>
          <li>Click "Request Leave" button</li>
          <li>Select leave type (Casual/Sick/Earned)</li>
          <li>Choose start and end dates</li>
          <li>Enter reason for leave</li>
          <li>Click "Submit Request"</li>
          <li>Wait for manager/HR approval</li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">Leave Types</h3>
      <div className="space-y-3">
        <LeaveTypeCard type="Casual Leave" days="12 days/year" desc="For personal matters" />
        <LeaveTypeCard type="Sick Leave" days="10 days/year" desc="For medical reasons" />
        <LeaveTypeCard type="Earned Leave" days="15 days/year" desc="Accumulated leave" />
        <LeaveTypeCard type="WFH" days="2 days/week" desc="Work from home" />
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">Approval Process</h3>
      <div className="space-y-2 text-gray-700">
        <p>1. Employee submits leave request</p>
        <p>2. Manager receives notification</p>
        <p>3. Manager approves/rejects with comments</p>
        <p>4. Employee receives notification</p>
        <p>5. Leave is reflected in calendar</p>
      </div>
    </div>
  );
}

function PerformanceSection() {
  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">⭐ Performance Reviews</h2>
      
      <h3 className="text-xl font-semibold mt-6 mb-3">Review Cycle</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <CycleCard title="Quarterly Reviews" desc="Every 3 months" />
        <CycleCard title="Annual Reviews" desc="Once a year" />
        <CycleCard title="360° Feedback" desc="Peer reviews" />
        <CycleCard title="Self Assessment" desc="Employee self-review" />
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">Rating Scale</h3>
      <div className="space-y-2">
        <RatingCard rating="5" label="Outstanding" color="green" />
        <RatingCard rating="4" label="Exceeds Expectations" color="blue" />
        <RatingCard rating="3" label="Meets Expectations" color="yellow" />
        <RatingCard rating="2" label="Needs Improvement" color="orange" />
        <RatingCard rating="1" label="Unsatisfactory" color="red" />
      </div>
    </div>
  );
}


function OnboardingSection() {
  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">🚀 Onboarding Process</h2>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-blue-900 font-semibold">🛡️ 6-Phase Gatekeeper Model</p>
        <p className="text-blue-800 text-sm mt-1">Compliance-driven onboarding with mandatory checkpoints</p>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">Onboarding Phases</h3>
      <div className="space-y-4">
        <OnboardingPhase 
          number="1" 
          title="Pre-boarding" 
          desc="Offer acceptance, welcome email, document collection checklist"
          status="automatic"
        />
        <OnboardingPhase 
          number="2" 
          title="Day 1 Welcome" 
          desc="First day orientation, initial setup, welcome kit distribution"
          status="hr-guided"
        />
        <OnboardingPhase 
          number="3" 
          title="🚪 Compliance Gate (CRITICAL)" 
          desc="Document upload, OCR verification, admin review - MUST PASS TO PROCEED"
          status="gatekeeper"
        />
        <OnboardingPhase 
          number="4" 
          title="IT Fulfillment (Auto-triggered)" 
          desc="Email setup, VPN access, access card, hardware assignment, software installation"
          status="it-automated"
        />
        <OnboardingPhase 
          number="5" 
          title="Induction & Activation" 
          desc="Training modules, department introduction, role activation"
          status="hr-guided"
        />
        <OnboardingPhase 
          number="6" 
          title="Monitoring & Support" 
          desc="30-day check-in, performance tracking, feedback collection"
          status="ongoing"
        />
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">📋 Required Documents</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <DocumentCard title="Identity Documents" docs={['PAN Card', 'Aadhaar Card', 'Passport (if applicable)']} />
        <DocumentCard title="Educational Certificates" docs={['Degree Certificates', 'Mark Sheets', 'Professional Certifications']} />
        <DocumentCard title="Employment Documents" docs={['Previous Employment Letters', 'Experience Certificates', 'Salary Slips']} />
        <DocumentCard title="Banking & Personal" docs={['Bank Account Details', 'Passport Size Photos', 'Address Proof']} />
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">🤖 AI Document Processing</h3>
      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
        <p className="text-green-900 font-semibold">✨ Intelligent OCR Extraction</p>
        <ul className="text-green-800 text-sm mt-2 space-y-1">
          <li>• <strong>PAN Card:</strong> Auto-extracts PAN number and name</li>
          <li>• <strong>Aadhaar Card:</strong> Extracts Aadhaar number and address</li>
          <li>• <strong>Offer Letter:</strong> Extracts salary, position, and joining date</li>
          <li>• <strong>Resume:</strong> Extracts skills, experience, and education</li>
        </ul>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">🔄 Process Flow</h3>
      <div className="bg-gray-50 rounded-lg p-6">
        <ol className="list-decimal list-inside space-y-3 text-gray-700">
          <li><strong>Employee Joins:</strong> HR creates employee profile and initiates onboarding</li>
          <li><strong>Document Upload:</strong> Employee uploads required documents through portal</li>
          <li><strong>AI Processing:</strong> OCR extracts data and pre-fills employee information</li>
          <li><strong>Compliance Review:</strong> Admin reviews and approves documents (GATE)</li>
          <li><strong>IT Provisioning:</strong> Automatic IT ticket creation and resource allocation</li>
          <li><strong>Asset Assignment:</strong> Hardware and software provisioning with photo documentation</li>
          <li><strong>Account Activation:</strong> System access and role assignment</li>
          <li><strong>Training Assignment:</strong> Role-specific training modules and induction</li>
        </ol>
      </div>
    </div>
  );
}

function PayrollSection() {
  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">💰 Payroll System</h2>
      
      <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-6">
        <p className="text-green-900 font-semibold">🆕 Enhanced Payroll System (2025)</p>
        <p className="text-green-800 text-sm mt-1">Comprehensive salary calculations with approval workflows and compliance</p>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">🔄 Payroll Process Flow</h3>
      <div className="space-y-4">
        <PayrollStep 
          number="1" 
          title="Monthly Calculation" 
          desc="HR calculates payroll based on attendance, salary structure, and adjustments"
          role="HR"
        />
        <PayrollStep 
          number="2" 
          title="Review & Verification" 
          desc="HR reviews calculations, checks for errors, and adds manual adjustments if needed"
          role="HR"
        />
        <PayrollStep 
          number="3" 
          title="Approval Required" 
          desc="HR Manager approves the calculated payroll before distribution"
          role="HR Manager"
        />
        <PayrollStep 
          number="4" 
          title="Payslip Generation" 
          desc="System generates detailed payslips with all earnings and deductions"
          role="System"
        />
        <PayrollStep 
          number="5" 
          title="Distribution" 
          desc="Payslips are distributed to employees via email and portal access"
          role="System"
        />
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">💵 Salary Components</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <ComponentCard 
          title="Earnings" 
          color="green"
          items={['Basic Salary', 'HRA (House Rent Allowance)', 'Transport Allowance', 'Medical Allowance', 'Special Allowance', 'Bonus & Incentives', 'Overtime Amount']}
        />
        <ComponentCard 
          title="Deductions" 
          color="red"
          items={['PF (Provident Fund)', 'ESI (Employee State Insurance)', 'Professional Tax', 'Income Tax (TDS)', 'Loan Deductions', 'Other Deductions']}
        />
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">📊 For Employees</h3>
      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <h4 className="font-semibold mb-3">How to Access Your Payslip:</h4>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Go to Payroll section in the dashboard</li>
          <li>View your current month payslip</li>
          <li>Download PDF version for records</li>
          <li>Check payroll history for previous months</li>
          <li>View salary structure and components breakdown</li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">🏢 For HR Team</h3>
      <div className="bg-purple-50 rounded-lg p-6 mb-6">
        <h4 className="font-semibold mb-3">Payroll Management Process:</h4>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li><strong>Calculate Payroll:</strong> Use "Calculate All" for batch processing</li>
          <li><strong>Review Calculations:</strong> Check individual payroll records for accuracy</li>
          <li><strong>Manual Adjustments:</strong> Add bonuses, deductions, or corrections</li>
          <li><strong>Submit for Approval:</strong> Send to HR Manager for final approval</li>
          <li><strong>Generate Reports:</strong> Export payroll summary and detailed reports</li>
          <li><strong>Distribute Payslips:</strong> Email payslips to all employees</li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">⚙️ Advanced Features</h3>
      <div className="space-y-3">
        <FeatureHighlight icon="🔄" title="Attendance Integration" desc="Automatic working days calculation from attendance data" />
        <FeatureHighlight icon="📈" title="Tax Calculation" desc="Automated income tax calculation based on current tax slabs" />
        <FeatureHighlight icon="✏️" title="Manual Adjustments" desc="Add custom earnings or deductions with audit trail" />
        <FeatureHighlight icon="📋" title="Approval Workflow" desc="Role-based approval system with notifications" />
        <FeatureHighlight icon="📊" title="Detailed Reports" desc="Comprehensive payroll analytics and export options" />
      </div>
    </div>
  );
}

function AssetsSection() {
  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">💻 Asset Management</h2>
      
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-blue-900 font-semibold">🔧 Complete Asset Lifecycle Management</p>
        <p className="text-blue-800 text-sm mt-1">From request to retirement with photo documentation and complaint tracking</p>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">🔄 Asset Request Process</h3>
      <div className="space-y-4">
        <AssetStep 
          number="1" 
          title="Employee Request" 
          desc="Employee submits asset request with justification and requirements"
          icon="📝"
        />
        <AssetStep 
          number="2" 
          title="Manager Approval" 
          desc="Direct manager reviews and approves/rejects the request"
          icon="👨‍💼"
        />
        <AssetStep 
          number="3" 
          title="HR Approval" 
          desc="HR team validates budget and policy compliance"
          icon="💼"
        />
        <AssetStep 
          number="4" 
          title="Assets Team Assignment" 
          desc="IT/Assets team receives ticket and processes fulfillment"
          icon="🔧"
        />
        <AssetStep 
          number="5" 
          title="Asset Allocation" 
          desc="Physical asset assignment with photo documentation"
          icon="📸"
        />
        <AssetStep 
          number="6" 
          title="Employee Acknowledgment" 
          desc="Employee confirms receipt and accepts responsibility"
          icon="✅"
        />
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">💻 Asset Categories</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <AssetCategory 
          title="Hardware Assets" 
          icon="🖥️"
          items={['Laptops & Desktops', 'Monitors & Peripherals', 'Mobile Devices', 'Printers & Scanners', 'Network Equipment']}
        />
        <AssetCategory 
          title="Software Assets" 
          icon="💿"
          items={['Operating System Licenses', 'Productivity Software', 'Development Tools', 'Security Software', 'Cloud Subscriptions']}
        />
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">📱 For Employees</h3>
      <div className="bg-green-50 rounded-lg p-6 mb-6">
        <h4 className="font-semibold mb-3">How to Request Assets:</h4>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Go to Assets section in dashboard</li>
          <li>Click "Request New Asset"</li>
          <li>Fill in asset details and justification</li>
          <li>Submit request for approval</li>
          <li>Track request status in real-time</li>
          <li>Acknowledge receipt when asset is delivered</li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">🛠️ Asset Complaints & Issues</h3>
      <div className="bg-orange-50 rounded-lg p-6 mb-6">
        <h4 className="font-semibold mb-3">Reporting Asset Problems:</h4>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Navigate to your assigned assets</li>
          <li>Click "Report Issue" on the problematic asset</li>
          <li>Describe the problem with photos if needed</li>
          <li>Assets team will be automatically notified</li>
          <li>Track resolution progress and updates</li>
          <li>Confirm resolution when issue is fixed</li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">🏢 For Assets Team</h3>
      <div className="bg-purple-50 rounded-lg p-6 mb-6">
        <h4 className="font-semibold mb-3">Asset Management Dashboard:</h4>
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li><strong>Pending Requests:</strong> View and process new asset requests</li>
          <li><strong>Fulfillment Queue:</strong> Manage asset allocation and delivery</li>
          <li><strong>Photo Documentation:</strong> Upload photos during asset handover</li>
          <li><strong>Issue Resolution:</strong> Handle complaints and maintenance requests</li>
          <li><strong>Inventory Management:</strong> Track asset status and availability</li>
          <li><strong>Compliance Tracking:</strong> Ensure proper documentation and approvals</li>
        </ul>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">📸 Photo Documentation</h3>
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="font-semibold text-gray-900 mb-2">📷 Visual Asset Tracking</p>
        <ul className="text-gray-700 text-sm space-y-1">
          <li>• Photos required during asset handover</li>
          <li>• Before/after photos for repairs and maintenance</li>
          <li>• Asset condition documentation</li>
          <li>• Compliance and audit trail maintenance</li>
        </ul>
      </div>
    </div>
  );
}

function AIAssistantSection() {
  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">🤖 AI Assistant</h2>
      
      <div className="bg-pink-50 border-l-4 border-pink-500 p-4 mb-6">
        <p className="text-pink-900 font-semibold">🆕 Your Personal HR Assistant (2025)</p>
        <p className="text-pink-800 text-sm mt-1">Real-time HR support with intelligent responses and data integration</p>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">💬 How to Use the AI Assistant</h3>
      <div className="bg-gray-50 rounded-lg p-6 mb-6">
        <ol className="list-decimal list-inside space-y-3 text-gray-700">
          <li><strong>Access:</strong> Click the chat icon (🎙️) in the bottom-right corner</li>
          <li><strong>Ask Questions:</strong> Type your HR-related questions in natural language</li>
          <li><strong>Get Instant Answers:</strong> Receive real-time responses with relevant data</li>
          <li><strong>Follow Suggestions:</strong> Use quick suggestion buttons for common queries</li>
          <li><strong>Continue Conversation:</strong> Ask follow-up questions for detailed help</li>
        </ol>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">🎯 What You Can Ask</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <QueryCategory 
          title="Leave & Attendance" 
          icon="📅"
          examples={[
            '"What is my leave balance?"',
            '"How many days have I worked this month?"',
            '"When is my next holiday?"',
            '"Can I take leave next week?"'
          ]}
        />
        <QueryCategory 
          title="Payroll & Salary" 
          icon="💰"
          examples={[
            '"When will I get my salary?"',
            '"What are my salary components?"',
            '"How is my tax calculated?"',
            '"Show me my last payslip"'
          ]}
        />
        <QueryCategory 
          title="Policies & Procedures" 
          icon="📋"
          examples={[
            '"What is the WFH policy?"',
            '"How do I request assets?"',
            '"What documents do I need for onboarding?"',
            '"How do I mark attendance?"'
          ]}
        />
        <QueryCategory 
          title="System Navigation" 
          icon="🧭"
          examples={[
            '"How do I update my profile?"',
            '"Where can I see my team?"',
            '"How do I submit a complaint?"',
            '"Where is the recruitment section?"'
          ]}
        />
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">🚀 Smart Features</h3>
      <div className="space-y-3">
        <AIFeature 
          icon="🔍" 
          title="Real-time Data Access" 
          desc="Fetches live data from your profile, attendance, and payroll records"
        />
        <AIFeature 
          icon="🧠" 
          title="Context Awareness" 
          desc="Understands your role and provides relevant information"
        />
        <AIFeature 
          icon="💡" 
          title="Smart Suggestions" 
          desc="Offers quick action buttons for common tasks"
        />
        <AIFeature 
          icon="📚" 
          title="Policy Knowledge" 
          desc="Provides accurate information about company policies and procedures"
        />
        <AIFeature 
          icon="🔄" 
          title="Fallback Support" 
          desc="Works offline with cached responses when API is unavailable"
        />
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">💡 Pro Tips</h3>
      <div className="bg-blue-50 rounded-lg p-6">
        <ul className="space-y-2 text-blue-800">
          <li><strong>🎯 Be Specific:</strong> "My leave balance for casual leave" vs "leave balance"</li>
          <li><strong>📅 Include Dates:</strong> "Attendance for last week" vs "attendance"</li>
          <li><strong>🔄 Try Variations:</strong> If one question doesn't work, rephrase it</li>
          <li><strong>📱 Use Anywhere:</strong> AI assistant works on all pages and devices</li>
          <li><strong>🆘 Escalate When Needed:</strong> AI will guide you to human support for complex issues</li>
        </ul>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">⚠️ Limitations</h3>
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <p className="text-yellow-900 font-semibold">Current Limitations:</p>
        <ul className="text-yellow-800 text-sm mt-2 space-y-1">
          <li>• Cannot perform actions (like submitting leave requests)</li>
          <li>• Limited to information retrieval and guidance</li>
          <li>• May not have access to confidential HR decisions</li>
          <li>• For complex issues, will redirect to human support</li>
        </ul>
      </div>
    </div>
  );
}

function TroubleshootingSection() {
  return (
    <div className="prose max-w-none">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">🔧 Troubleshooting</h2>
      
      <h3 className="text-xl font-semibold mt-6 mb-3">🚨 Common Issues & Solutions</h3>
      
      <div className="space-y-6">
        <TroubleshootCard 
          issue="Cannot Login / Authentication Failed"
          solutions={[
            'Verify email and password are correct (case-sensitive)',
            'Check if Caps Lock is enabled',
            'Clear browser cache and cookies',
            'Try incognito/private browsing mode',
            'Contact HR if account is locked or deactivated'
          ]}
        />
        
        <TroubleshootCard 
          issue="Camera Not Working (Attendance)"
          solutions={[
            'Allow camera permission when browser prompts',
            'Close other applications using the camera',
            'Try a different browser (Chrome recommended)',
            'Check if camera works in other applications',
            'Restart browser and try again',
            'Ensure good lighting for face recognition'
          ]}
        />
        
        <TroubleshootCard 
          issue="Location/GPS Error (Attendance)"
          solutions={[
            'Allow location permission in browser',
            'Enable location services in system settings',
            'Check if GPS is working in other apps',
            'Move to an area with better GPS signal',
            'For WFH: Ensure WFH request is approved',
            'Contact manager if location validation fails'
          ]}
        />

        <TroubleshootCard 
          issue="Payroll/Payslip Not Visible"
          solutions={[
            'Check if payroll has been processed for the month',
            'Verify your employee profile is complete',
            'Contact HR if payroll calculation is pending',
            'Ensure you have the correct role permissions',
            'Try refreshing the page or logging out/in'
          ]}
        />

        <TroubleshootCard 
          issue="Asset Request Stuck/Not Progressing"
          solutions={[
            'Check request status in Assets section',
            'Verify all required approvals are obtained',
            'Contact your manager for approval status',
            'Reach out to Assets team for fulfillment updates',
            'Ensure request details are complete and accurate'
          ]}
        />

        <TroubleshootCard 
          issue="Leave Balance Incorrect"
          solutions={[
            'Check leave history for recent deductions',
            'Verify if any leaves are pending approval',
            'Contact HR for balance reconciliation',
            'Check if annual leave allocation has been updated',
            'Review leave policy for calculation rules'
          ]}
        />

        <TroubleshootCard 
          issue="AI Assistant Not Responding"
          solutions={[
            'Check internet connection',
            'Try rephrasing your question',
            'Use suggested quick questions',
            'Clear browser cache and reload page',
            'AI works offline with limited responses',
            'Contact support if issue persists'
          ]}
        />

        <TroubleshootCard 
          issue="Page Loading Issues/Slow Performance"
          solutions={[
            'Check internet connection speed',
            'Clear browser cache and cookies',
            'Disable browser extensions temporarily',
            'Try a different browser',
            'Close unnecessary browser tabs',
            'Restart browser or device'
          ]}
        />
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">🆘 Emergency Contacts</h3>
      <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
        <p className="text-red-900 font-semibold">Critical System Issues</p>
        <div className="text-red-800 text-sm mt-2 space-y-1">
          <p><strong>🔥 System Down:</strong> Contact IT Support immediately</p>
          <p><strong>🔐 Security Issues:</strong> Report to Security Team</p>
          <p><strong>💰 Payroll Emergencies:</strong> Contact HR Manager directly</p>
          <p><strong>📅 Attendance Issues (Same Day):</strong> Notify manager immediately</p>
        </div>
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">📞 Support Channels</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SupportChannel 
          title="HR Support" 
          icon="💼"
          contact="hr@company.com"
          hours="Mon-Fri, 9 AM - 6 PM"
          for="Leave, Payroll, Policies"
        />
        <SupportChannel 
          title="IT Support" 
          icon="💻"
          contact="it@company.com"
          hours="Mon-Fri, 8 AM - 8 PM"
          for="Technical Issues, Assets"
        />
      </div>

      <h3 className="text-xl font-semibold mt-6 mb-3">🔍 Self-Help Resources</h3>
      <div className="bg-blue-50 rounded-lg p-6">
        <ul className="space-y-2 text-blue-800">
          <li><strong>🤖 AI Assistant:</strong> Ask questions 24/7 for instant help</li>
          <li><strong>📚 This Help Section:</strong> Comprehensive guides for all features</li>
          <li><strong>🔔 Notifications:</strong> Check for system announcements and updates</li>
          <li><strong>👥 Team Members:</strong> Ask colleagues who use the same features</li>
          <li><strong>📱 Mobile Access:</strong> Try accessing from mobile if desktop fails</li>
        </ul>
      </div>

      <h3 className="text-xl font-semibent mt-6 mb-3">🐛 Reporting Bugs</h3>
      <div className="bg-gray-50 rounded-lg p-6">
        <p className="font-semibold text-gray-900 mb-3">When reporting issues, please include:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
          <li>Your browser and version (Chrome, Firefox, etc.)</li>
          <li>Operating system (Windows, Mac, Mobile)</li>
          <li>Exact error message (screenshot if possible)</li>
          <li>Steps to reproduce the issue</li>
          <li>Your user role and permissions</li>
          <li>Time when the issue occurred</li>
        </ul>
      </div>
    </div>
  );
}


// Helper Components
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="text-3xl mb-2">{icon}</div>
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600 mt-1">{desc}</p>
    </div>
  );
}

function RoleCard({ role, color, permissions }) {
  const colors = {
    purple: 'bg-purple-50 border-purple-200 text-purple-900',
    red: 'bg-red-50 border-red-200 text-red-900',
    blue: 'bg-blue-50 border-blue-200 text-blue-900',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-900',
    orange: 'bg-orange-50 border-orange-200 text-orange-900',
    green: 'bg-green-50 border-green-200 text-green-900',
    gray: 'bg-gray-50 border-gray-200 text-gray-900',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-900'
  };
  
  return (
    <div className={`border rounded-lg p-4 ${colors[color]}`}>
      <h4 className="font-semibold mb-2">{role}</h4>
      <ul className="text-sm space-y-1">
        {permissions.map((perm, idx) => (
          <li key={idx}>• {perm}</li>
        ))}
      </ul>
    </div>
  );
}

function SecurityFeature({ icon, title, desc }) {
  return (
    <div className="flex items-start space-x-3 bg-gray-50 rounded-lg p-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </div>
  );
}

function DashboardCard({ role, color, features, description }) {
  const colors = {
    purple: 'bg-purple-50 border-purple-200',
    blue: 'bg-blue-50 border-blue-200',
    orange: 'bg-orange-50 border-orange-200',
    gray: 'bg-gray-50 border-gray-200'
  };
  
  return (
    <div className={`border rounded-lg p-4 ${colors[color]}`}>
      <h4 className="font-semibold text-gray-900 mb-2">{role} Dashboard</h4>
      <p className="text-sm text-gray-600 mb-3">{description}</p>
      <ul className="text-sm space-y-1">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-center">
            <span className="w-2 h-2 bg-current rounded-full mr-2"></span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}

function OnboardingPhase({ number, title, desc, status }) {
  const statusColors = {
    automatic: 'bg-blue-100 text-blue-800',
    'hr-guided': 'bg-green-100 text-green-800',
    gatekeeper: 'bg-red-100 text-red-800',
    'it-automated': 'bg-purple-100 text-purple-800',
    ongoing: 'bg-yellow-100 text-yellow-800'
  };
  
  const statusLabels = {
    automatic: 'Automatic',
    'hr-guided': 'HR Guided',
    gatekeeper: 'CRITICAL GATE',
    'it-automated': 'IT Automated',
    ongoing: 'Ongoing'
  };
  
  return (
    <div className="flex items-start space-x-4 bg-gray-50 rounded-lg p-4">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <span className={`px-2 py-1 text-xs font-semibold rounded ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
        </div>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </div>
  );
}

function DocumentCard({ title, docs }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h4 className="font-semibold text-gray-900 mb-3">{title}</h4>
      <ul className="text-sm text-gray-600 space-y-1">
        {docs.map((doc, idx) => (
          <li key={idx} className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            {doc}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PayrollStep({ number, title, desc, role }) {
  const roleColors = {
    'HR': 'bg-blue-100 text-blue-800',
    'HR Manager': 'bg-purple-100 text-purple-800',
    'System': 'bg-green-100 text-green-800'
  };
  
  return (
    <div className="flex items-start space-x-4 bg-gray-50 rounded-lg p-4">
      <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-900">{title}</h4>
          <span className={`px-2 py-1 text-xs font-semibold rounded ${roleColors[role]}`}>
            {role}
          </span>
        </div>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </div>
  );
}

function ComponentCard({ title, color, items }) {
  const colors = {
    green: 'bg-green-50 border-green-200 text-green-900',
    red: 'bg-red-50 border-red-200 text-red-900'
  };
  
  return (
    <div className={`border rounded-lg p-4 ${colors[color]}`}>
      <h4 className="font-semibold mb-3">{title}</h4>
      <ul className="text-sm space-y-1">
        {items.map((item, idx) => (
          <li key={idx}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}

function FeatureHighlight({ icon, title, desc }) {
  return (
    <div className="flex items-start space-x-3 bg-gray-50 rounded-lg p-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </div>
  );
}

function AssetStep({ number, title, desc, icon }) {
  return (
    <div className="flex items-start space-x-4 bg-gray-50 rounded-lg p-4">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
        {number}
      </div>
      <div className="flex-1">
        <div className="flex items-center mb-2">
          <span className="text-xl mr-2">{icon}</span>
          <h4 className="font-semibold text-gray-900">{title}</h4>
        </div>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </div>
  );
}

function AssetCategory({ title, icon, items }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center mb-3">
        <span className="text-2xl mr-2">{icon}</span>
        <h4 className="font-semibold text-gray-900">{title}</h4>
      </div>
      <ul className="text-sm text-gray-600 space-y-1">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-center">
            <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function QueryCategory({ title, icon, examples }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center mb-3">
        <span className="text-2xl mr-2">{icon}</span>
        <h4 className="font-semibold text-gray-900">{title}</h4>
      </div>
      <ul className="text-sm text-gray-600 space-y-2">
        {examples.map((example, idx) => (
          <li key={idx} className="bg-gray-50 rounded px-2 py-1 font-mono text-xs">
            {example}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AIFeature({ icon, title, desc }) {
  return (
    <div className="flex items-start space-x-3 bg-pink-50 rounded-lg p-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </div>
  );
}

function SupportChannel({ title, icon, contact, hours, for: forWhat }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center mb-3">
        <span className="text-2xl mr-2">{icon}</span>
        <h4 className="font-semibold text-gray-900">{title}</h4>
      </div>
      <div className="text-sm text-gray-600 space-y-1">
        <p><strong>Contact:</strong> {contact}</p>
        <p><strong>Hours:</strong> {hours}</p>
        <p><strong>For:</strong> {forWhat}</p>
      </div>
    </div>
  );
}

function WorkflowStep({ number, title, desc }) {
  return (
    <div className="flex items-start space-x-4">
      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </div>
  );
}

function StageCard({ stage, color }) {
  const colors = {
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    green: 'bg-green-100 text-green-800'
  };
  
  return (
    <div className={`${colors[color]} rounded-lg p-3 text-center font-semibold`}>
      {stage}
    </div>
  );
}

function RuleCard({ icon, title, desc }) {
  return (
    <div className="flex items-start space-x-3 bg-gray-50 rounded-lg p-4">
      <span className="text-2xl">{icon}</span>
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </div>
  );
}

function LeaveTypeCard({ type, days, desc }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-gray-900">{type}</h4>
          <p className="text-sm text-gray-600 mt-1">{desc}</p>
        </div>
        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">{days}</span>
      </div>
    </div>
  );
}

function CycleCard({ title, desc }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600 mt-1">{desc}</p>
    </div>
  );
}

function RatingCard({ rating, label, color }) {
  const colors = {
    green: 'bg-green-100 text-green-800',
    blue: 'bg-blue-100 text-blue-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    orange: 'bg-orange-100 text-orange-800',
    red: 'bg-red-100 text-red-800'
  };
  
  return (
    <div className="flex items-center space-x-3">
      <span className={`${colors[color]} w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg`}>
        {rating}
      </span>
      <span className="font-medium text-gray-900">{label}</span>
    </div>
  );
}

function OnboardingStep({ number, title, desc }) {
  return (
    <div className="flex items-start space-x-4 bg-gray-50 rounded-lg p-4">
      <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
        {number}
      </div>
      <div>
        <h4 className="font-semibold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600">{desc}</p>
      </div>
    </div>
  );
}

function TroubleshootCard({ issue, solutions }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <h4 className="font-semibold text-red-900 mb-3">❌ {issue}</h4>
      <div className="space-y-2">
        <p className="text-sm font-medium text-red-800">Solutions:</p>
        <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
          {solutions.map((solution, idx) => (
            <li key={idx}>{solution}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
