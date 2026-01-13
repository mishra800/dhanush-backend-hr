import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout.jsx';
import ProtectedRoute from './components/protectedroute.jsx';
import Dashboard from './pages/dashboard';
import Welcome from './pages/welcome';
import Careers from './pages/careers';
import Apply from './pages/apply';
import Login from './pages/login';
import Signup from './pages/signup';
import Recruitment from './pages/recruitment';
import AIInterview from './pages/aiinterview';
import Employees from './pages/employees';

import Attendance from './pages/Attendance';
import WFHRequest from './pages/WFHRequest';
import Onboarding from './pages/onboarding';

import Performance from './pages/performance';
import Engagement from './pages/engagement';
import Learning from './pages/learning';
import Analysis from './pages/analysis';
import Career from './pages/career';
import Leave from './pages/leave';
import Payroll from './pages/payroll';
import Assets from './pages/assets';
import Announcements from './pages/announcements';
import Profile from './pages/profile.jsx';
import Documents from './pages/documents';
import Meetings from './pages/meetings';
import SuperAdmin from './pages/superadmin';
import Help from './pages/Help';
import Notifications from './pages/Notifications';
import { AuthProvider } from './context/authcontext';

// Try to import enhanced components, fallback to basic ones if not available
let EnhancedLayout, ToastProvider;
try {
  EnhancedLayout = require('./components/layout/EnhancedLayout.jsx').default;
  ToastProvider = require('./context/ToastContext').ToastProvider;
} catch (error) {
  console.log('Enhanced components not available, using basic layout');
  EnhancedLayout = Layout;
  ToastProvider = ({ children }) => children; // Simple passthrough
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider position="top-right" maxToasts={5}>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Welcome />} />
            <Route path="/welcome" element={<Welcome />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/apply/:linkCode" element={<Apply />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/ai-interview/:applicationId" element={<AIInterview />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <EnhancedLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="superadmin" element={<SuperAdmin />} />
              <Route path="employees" element={<Employees />} />
              <Route path="recruitment" element={<Recruitment />} />
              <Route path="attendance" element={<Attendance />} />
              <Route path="wfh-request" element={<WFHRequest />} />
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="performance" element={<Performance />} />
              <Route path="engagement" element={<Engagement />} />
              <Route path="learning" element={<Learning />} />
              <Route path="analysis" element={<Analysis />} />
              <Route path="career" element={<Career />} />
              <Route path="leave" element={<Leave />} />
              <Route path="payroll" element={<Payroll />} />
              <Route path="assets" element={<Assets />} />
              <Route path="announcements" element={<Announcements />} />
              <Route path="profile" element={<Profile />} />
              <Route path="documents" element={<Documents />} />
              <Route path="meetings" element={<Meetings />} />
              <Route path="help" element={<Help />} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
          </Routes>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
