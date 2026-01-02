# Comprehensive HR Management System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [User Roles & Permissions](#user-roles--permissions)
4. [Complete Functional Flow](#complete-functional-flow)
5. [Data Flow Between Modules](#data-flow-between-modules)
6. [User Journeys for All Roles](#user-journeys-for-all-roles)
7. [API and Integration Flow](#api-and-integration-flow)
8. [Database-Level Flow](#database-level-flow)
9. [Security & Authentication](#security--authentication)
10. [Deployment & Configuration](#deployment--configuration)

---

## System Overview

This is a comprehensive AI-powered HR Management System designed for modern organizations. The system provides end-to-end HR functionality from recruitment to employee lifecycle management, built with enterprise-grade security and scalability.

### Key Features
- **AI-Powered Recruitment** with intelligent candidate matching and automated interviews
- **Biometric Attendance** with face recognition and GPS validation
- **Comprehensive Payroll** with automated calculations and compliance
- **Asset Management** with photo documentation and complaint tracking
- **Gatekeeper Onboarding** with compliance-driven IT provisioning
- **Leave Management** with approval workflows and balance tracking
- **Performance Analytics** with predictive insights and engagement metrics
- **Role-Based Access Control** with granular permissions

---

## Architecture & Technology Stack

### Backend Architecture
- **Framework**: FastAPI (Python 3.8+)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with role-based access control
- **File Storage**: Local filesystem with organized directory structure
- **API Design**: RESTful with OpenAPI documentation

### Frontend Architecture
- **Framework**: React 18 with Vite build tool
- **Styling**: Tailwind CSS for responsive design
- **State Management**: React Context API with custom hooks
- **Routing**: React Router v6 with protected routes
- **HTTP Client**: Axios with interceptors for authentication

### System Architecture Pattern
```
Frontend (React) ↔ API Gateway (FastAPI) ↔ Service Layer ↔ Database (PostgreSQL)
                                    ↓
                            External Services (Face Recognition, Email, etc.)
```

## User Roles & Permissions

### Role Hierarchy

#### 1. Super Admin
**Capabilities**: Complete system control and audit access
- System configuration and capability management
- User role assignment and permission templates
- Audit log access and security monitoring
- All module access with full permissions

#### 2. Admin
**Capabilities**: System administration and user management
- User account management (create, modify, deactivate)
- System settings configuration
- All HR modules with administrative access
- Report generation and data export

#### 3. HR Manager
**Capabilities**: HR operations with approval authority
- Payroll approval and distribution
- Leave policy management
- Recruitment oversight and final hiring decisions
- Employee lifecycle management

#### 4. HR
**Capabilities**: Day-to-day HR operations
- Payroll calculation (approval required)
- Recruitment management and candidate screening
- Employee onboarding coordination
- Leave and attendance monitoring

#### 5. Manager
**Capabilities**: Team management and approvals
- Team attendance monitoring and approval
- Leave request approvals for direct reports
- WFH request approvals
- Performance review participation

#### 6. Assets Team
**Capabilities**: IT and asset management
- Asset request fulfillment
- IT provisioning and setup
- Hardware/software issue resolution
- Asset inventory management

#### 7. Employee
**Capabilities**: Self-service access
- Attendance marking and history viewing
- Leave request submission
- Payroll and payslip access
- Asset request submission
- Profile management

#### 8. Candidate
**Capabilities**: Limited recruitment access
- Job application submission
- AI interview participation
- Application status tracking

### Permission Matrix

| Module | Super Admin | Admin | HR Manager | HR | Manager | Assets Team | Employee | Candidate |
|--------|-------------|-------|------------|----|---------| ------------|----------|-----------|
| User Management | Full | Full | Read | Read | Read | - | - | - |
| Recruitment | Full | Full | Full | Full | Read | - | - | Limited |
| Attendance | Full | Full | Read | Read | Team | - | Self | - |
| Leave Management | Full | Full | Approve | Manage | Approve | - | Request | - |
| Payroll | Full | Full | Approve | Calculate | - | - | View | - |
| Asset Management | Full | Full | Read | Read | - | Full | Request | - |
| Onboarding | Full | Full | Full | Full | - | IT Setup | - | - |
| Analytics | Full | Full | Full | Limited | Team | - | - | - |
## Complete Functional Flow

### 1. Recruitment & Hiring Flow

#### Phase 1: Job Creation
```
HR/Admin → Create Job Posting → Set Requirements → Generate Application Link → Publish
```

#### Phase 2: Application Processing
```
Candidate → Apply via Link → AI Screening → Fit Score Calculation → Application Review
```

#### Phase 3: Interview Process
```
Shortlisted Candidate → AI Interview → Human Interview → Final Decision → Offer Generation
```

#### Phase 4: Onboarding Trigger
```
Offer Accepted → Employee Record Creation → Onboarding Workflow Initiation
```

### 2. Onboarding Flow (6-Phase Gatekeeper Model)

#### Phase 1: Pre-boarding
```
Offer Acceptance → Welcome Email → Document Collection → Pre-boarding Checklist
```

#### Phase 2: Day 1 Welcome
```
First Day → Orientation Session → Initial Setup → Welcome Kit Distribution
```

#### Phase 3: Compliance Gate (GATEKEEPER)
```
Document Upload → OCR Verification → Admin Review → Compliance Approval
                                                        ↓
                                            GATE: Must Pass to Proceed
```

#### Phase 4: IT Fulfillment (Triggered by Compliance Approval)
```
Compliance Approved → IT Ticket Creation → Resource Provisioning → Photo Documentation
                                                                        ↓
Email Setup → VPN Access → Access Card → Hardware Assignment → Software Installation
```

#### Phase 5: Induction & Activation
```
IT Setup Complete → Training Module Assignment → Department Introduction → Role Activation
```

#### Phase 6: Monitoring & Support
```
30-Day Check-in → Performance Tracking → Feedback Collection → Onboarding Completion
```

### 3. Daily Attendance Flow

#### Standard Attendance Marking
```
Employee Arrives → Open Attendance App → Camera Activation → Face Recognition
                                                                    ↓
GPS Validation → Time Window Check → Fraud Detection → Attendance Recorded
```

#### Late Attendance Flow
```
Late Arrival → Attendance Marked → Flagged for Review → Manager Notification
                                                              ↓
Manager Review → Approval/Rejection → Employee Notification → Record Update
```

#### WFH Request Flow
```
Employee → Submit WFH Request → Manager Review → Approval/Rejection → Calendar Update
```

### 4. Leave Management Flow

#### Leave Request Process
```
Employee → Check Balance → Submit Request → Manager Review → HR Review (if required)
                                              ↓                    ↓
                                        Approval/Rejection → Balance Update → Notification
```

#### Leave Balance Calculation
```
Annual Allocation → Monthly Accrual → Leave Taken → Carry Forward → Balance Update
```

### 5. Payroll Processing Flow

#### Monthly Payroll Cycle
```
Month End → Attendance Data Collection → Salary Structure Retrieval → Calculation
                                                                          ↓
Earnings Calculation → Deductions Calculation → Net Salary → Payroll Record Creation
                                                                          ↓
HR Review → HR Manager Approval → Payslip Generation → Distribution → Payment Marking
```

### 6. Asset Management Flow

#### Asset Request Process
```
Employee → Request Assets → Manager Approval → HR Approval → Assets Team Assignment
                                                                      ↓
Asset Allocation → Photo Documentation → Fulfillment → Employee Acknowledgment
```

#### Asset Complaint Process
```
Employee → Report Issue → Assets Team Assignment → Investigation → Resolution
                                                                      ↓
Photo Documentation → Resolution Notes → Employee Notification → Case Closure
```
## Data Flow Between Modules

### 1. Cross-Module Data Dependencies

#### Employee Master Data Flow
```
User Registration → Employee Profile → Onboarding → Attendance → Leave → Payroll → Assets
                                          ↓              ↓         ↓        ↓         ↓
                                    IT Provisioning  Face Data  Balance  Salary   Assignments
```

#### Attendance → Payroll Integration
```
Daily Attendance → Monthly Aggregation → Working Days Calculation → Payroll Input
                                                                        ↓
Overtime Hours → Leave Days → Pro-rated Salary → Final Payroll Calculation
```

#### Leave → Attendance Integration
```
Approved Leave → Attendance Exemption → Working Days Adjustment → Payroll Impact
```

#### Onboarding → Asset Integration
```
Compliance Approval → IT Ticket Creation → Asset Assignment → Employee Acknowledgment
```

### 2. Real-time Data Synchronization

#### Notification Flow
```
Event Trigger → Notification Service → Multi-channel Delivery → Acknowledgment Tracking
                                            ↓
                                    Email + In-App + SMS (optional)
```

#### Audit Trail Flow
```
User Action → Service Layer → Audit Log Creation → Security Analysis → Alert Generation
```

## User Journeys for All Roles

### 1. Employee Journey

#### Daily Routine
```
Login → Dashboard View → Mark Attendance → Check Notifications → View Schedule
                                                                      ↓
Task Management → Leave Planning → Payslip Access → Asset Requests → Logout
```

#### Monthly Activities
```
Payslip Download → Leave Balance Check → Performance Review → Training Completion
```

#### Occasional Activities
```
Profile Update → Asset Requests → Complaint Submission → Document Upload
```

### 2. Manager Journey

#### Daily Management
```
Login → Team Dashboard → Attendance Review → Approve Late Entries → WFH Approvals
                                                                        ↓
Team Performance → Leave Approvals → Task Assignment → Report Generation
```

#### Weekly Activities
```
Team Analytics → Performance Reviews → Resource Planning → Escalation Handling
```

### 3. HR Journey

#### Recruitment Activities
```
Job Posting → Application Review → Interview Scheduling → Candidate Evaluation
                                                              ↓
Offer Generation → Onboarding Initiation → Document Verification → Compliance Review
```

#### Payroll Activities
```
Salary Structure Setup → Monthly Calculation → Review & Validation → Submission for Approval
```

#### Employee Lifecycle
```
Onboarding Coordination → Performance Tracking → Policy Management → Exit Processing
```

### 4. HR Manager Journey

#### Strategic Activities
```
Policy Formulation → Approval Workflows → Budget Management → Compliance Oversight
```

#### Operational Oversight
```
Payroll Approval → Final Hiring Decisions → Escalation Resolution → Audit Reviews
```

### 5. Assets Team Journey

#### Daily Operations
```
Ticket Assignment → Asset Preparation → Installation & Setup → Photo Documentation
                                                                    ↓
Employee Handover → Acknowledgment Collection → Inventory Update → Case Closure
```

#### Maintenance Activities
```
Complaint Resolution → Hardware Troubleshooting → Software Installation → Replacement Processing
```

### 6. Admin Journey

#### System Administration
```
User Management → Role Assignment → System Configuration → Security Monitoring
                                                              ↓
Audit Log Review → Performance Optimization → Backup Management → Update Deployment
```

### 7. Super Admin Journey

#### Strategic Oversight
```
Capability Management → Security Analysis → System Optimization → Compliance Monitoring
                                                                      ↓
Risk Assessment → Policy Updates → Audit Reviews → Strategic Planning
```

### 8. Candidate Journey

#### Application Process
```
Job Discovery → Application Submission → AI Interview → Status Tracking → Offer Response
```
## API and Integration Flow

### 1. Authentication Flow

#### Login Process
```
POST /auth/login → Credential Validation → JWT Generation → Token Response
                                              ↓
                                    Role-based Permissions → Session Creation
```

#### Token Validation
```
API Request → Token Extraction → JWT Validation → Role Check → Endpoint Access
```

### 2. Core API Endpoints

#### Authentication APIs
```
POST /auth/register          - User registration
POST /auth/login            - User authentication
GET  /auth/me               - Current user info
POST /auth/logout           - Session termination
```

#### Attendance APIs
```
POST /attendance/mark-attendance-comprehensive  - Complete attendance flow
POST /attendance/mark-with-face-recognition    - Face recognition marking
GET  /attendance/my-attendance                 - Personal attendance history
GET  /attendance/team-attendance               - Team attendance (managers)
PUT  /attendance/{id}/approve                  - Approve flagged attendance
```

#### Leave Management APIs
```
POST /leave/request/{employee_id}    - Submit leave request
GET  /leave/employee/{employee_id}   - Leave history
GET  /leave/balances/{employee_id}   - Leave balances
GET  /leave/pending                  - Pending approvals
PUT  /leave/approve/{id}             - Approve leave
PUT  /leave/reject/{id}              - Reject leave
```

#### Payroll APIs
```
POST /payroll/calculate              - Calculate payroll
POST /payroll/approve               - Approve payroll
GET  /payroll/my-payroll            - Personal payroll history
GET  /payroll/my-payslip/{id}       - Download payslip
GET  /payroll/summary/{month}       - Monthly summary
```

#### Asset Management APIs
```
POST /assets/requests               - Create asset request
GET  /assets/requests/pending-manager - Manager pending requests
POST /assets/requests/{id}/approve-manager - Manager approval
POST /assets/requests/{id}/fulfill  - Fulfill request
POST /assets/complaints             - Report complaint
```

#### Onboarding APIs
```
GET  /onboarding/compliance-status/{employee_id} - Compliance status
POST /onboarding/submit-compliance              - Submit for review
POST /onboarding/approve-compliance             - Approve compliance
POST /onboarding/process-it/{ticket_id}         - Process IT setup
```

### 3. External Integration Points

#### Face Recognition Service
```
Image Upload → Face Detection → Feature Extraction → Comparison → Confidence Score
```

#### Email Service Integration
```
Event Trigger → Template Selection → Content Generation → Email Delivery → Status Tracking
```

#### File Upload Service
```
File Selection → Validation → Storage → URL Generation → Database Reference
```

### 4. Data Validation Flow

#### Request Validation
```
API Request → Schema Validation → Business Rule Check → Database Validation → Response
```

#### Response Formatting
```
Service Response → Data Serialization → Schema Compliance → Client Response
```
## Database-Level Flow

### 1. Core Database Schema

#### User & Authentication Tables
```sql
users (id, email, hashed_password, role, is_active)
    ↓
employees (id, user_id, name, department, position, hire_date)
    ↓
employee_documents (id, employee_id, document_type, file_path, is_verified)
```

#### Attendance & Time Tracking
```sql
attendance (id, employee_id, date, check_in_time, check_out_time, status, photo_path)
    ↓
wfh_requests (id, employee_id, date, status, approved_by, reason)
    ↓
shift_assignments (id, employee_id, shift_type, effective_date)
```

#### Leave Management
```sql
leave_requests (id, employee_id, start_date, end_date, leave_type, status, reason)
    ↓
leave_balances (id, employee_id, leave_type, allocated, used, balance)
    ↓
holidays (id, date, name, is_optional, applicable_locations)
```

#### Payroll System
```sql
salary_structures (id, employee_id, basic_salary, hra, allowances, effective_date)
    ↓
payroll (id, employee_id, month, gross_salary, deductions, net_salary, status)
    ↓
payroll_components (id, payroll_id, component_type, amount, is_earning)
```

#### Asset Management
```sql
assets (id, asset_type, serial_number, status, assigned_to, purchase_date)
    ↓
asset_requests (id, employee_id, request_type, requested_assets, status)
    ↓
asset_assignments (id, request_id, asset_id, assigned_date, condition)
    ↓
asset_complaints (id, employee_id, asset_id, complaint_type, status, resolution)
```

#### Recruitment & Onboarding
```sql
jobs (id, title, description, department, status, posted_date)
    ↓
applications (id, job_id, candidate_name, candidate_email, status, ai_fit_score)
    ↓
ai_interviews (id, application_id, status, overall_score, emotional_tone)
    ↓
onboarding_approval (id, employee_id, approval_stage, status, approved_at)
    ↓
infrastructure_requests (id, employee_id, request_type, status, assigned_to)
```

### 2. Database Relationships

#### Primary Relationships
```
User (1) → Employee (1)
Employee (1) → Attendance (N)
Employee (1) → Leave Requests (N)
Employee (1) → Payroll Records (N)
Employee (1) → Asset Assignments (N)
Job (1) → Applications (N)
Application (1) → AI Interview (1)
```

#### Cross-Module Relationships
```
Employee → Onboarding Approval → Infrastructure Requests
Asset Request → Asset Assignments → Assets
Leave Request → Leave Balance Updates
Attendance → Payroll Calculations
```

### 3. Data Integrity & Constraints

#### Foreign Key Constraints
```sql
-- Ensure referential integrity
ALTER TABLE employees ADD CONSTRAINT fk_employee_user 
    FOREIGN KEY (user_id) REFERENCES users(id);

ALTER TABLE attendance ADD CONSTRAINT fk_attendance_employee 
    FOREIGN KEY (employee_id) REFERENCES employees(id);
```

#### Business Logic Constraints
```sql
-- Prevent duplicate attendance on same date
ALTER TABLE attendance ADD CONSTRAINT unique_employee_date 
    UNIQUE (employee_id, date);

-- Ensure positive salary amounts
ALTER TABLE salary_structures ADD CONSTRAINT positive_basic_salary 
    CHECK (basic_salary > 0);
```

### 4. Database Performance Optimization

#### Indexing Strategy
```sql
-- Performance indexes
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_payroll_month ON payroll(month);
CREATE INDEX idx_applications_job_status ON applications(job_id, status);
```

#### Query Optimization
```sql
-- Optimized attendance query
SELECT a.*, e.name 
FROM attendance a 
JOIN employees e ON a.employee_id = e.id 
WHERE a.date BETWEEN ? AND ? 
    AND a.status = 'present'
ORDER BY a.date DESC;
```
## Security & Authentication

### 1. Authentication Mechanism

#### JWT Token Structure
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "employee",
  "exp": 1640995200,
  "iat": 1640908800
}
```

#### Token Lifecycle
```
Login → Token Generation (24h expiry) → API Requests → Token Validation → Auto Refresh
```

### 2. Role-Based Access Control (RBAC)

#### Permission Validation
```python
@require_roles(['admin', 'hr'])
async def sensitive_endpoint(current_user: User = Depends(get_current_user)):
    # Only admin and HR can access
    pass
```

#### Frontend Route Protection
```javascript
<RoleGuard allowedRoles={['admin', 'hr', 'manager']}>
    <AdminDashboard />
</RoleGuard>
```

### 3. Security Features

#### Password Security
- Minimum 8 characters with special characters and numbers
- Bcrypt hashing with salt rounds
- Password history prevention
- Account lockout after failed attempts

#### Data Protection
- SQL injection prevention through parameterized queries
- XSS protection with input sanitization
- CSRF protection with token validation
- File upload validation and virus scanning

#### Audit Logging
```python
# All sensitive actions logged
audit_log = AuditLog(
    user_id=current_user.id,
    action="payroll_calculation",
    resource_type="payroll",
    resource_id=payroll_id,
    ip_address=request.client.host,
    timestamp=datetime.utcnow()
)
```

### 4. Privacy & Compliance

#### Data Anonymization
- Personal data encryption at rest
- Sensitive field masking in logs
- GDPR compliance for data deletion
- Role-based data access restrictions

#### Biometric Data Protection
- Face recognition data encrypted
- Temporary storage with automatic cleanup
- Consent-based biometric enrollment
- Secure transmission protocols

## Deployment & Configuration

### 1. Environment Setup

#### Backend Configuration
```python
# Database Configuration
DATABASE_URL = "postgresql://user:password@localhost/hr_system"
SECRET_KEY = "your-secret-key-here"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

# File Upload Configuration
UPLOAD_DIR = "uploads"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Face Recognition Configuration
FACE_RECOGNITION_THRESHOLD = 0.6
```

#### Frontend Configuration
```javascript
// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Feature Flags
const FEATURES = {
  faceRecognition: true,
  aiInterview: true,
  biometricAttendance: true
};
```

### 2. Database Setup

#### Initial Migration
```sql
-- Create database
CREATE DATABASE hr_system;

-- Run migrations
python -m alembic upgrade head

-- Create initial admin user
INSERT INTO users (email, hashed_password, role) 
VALUES ('admin@company.com', '$2b$12$...', 'super_admin');
```

### 3. Production Deployment

#### Docker Configuration
```dockerfile
# Backend Dockerfile
FROM python:3.9
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location /api/ {
        proxy_pass http://backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }
}
```

### 4. Monitoring & Maintenance

#### Health Checks
```python
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "database": "connected",
        "services": "operational"
    }
```

#### Backup Strategy
```bash
# Daily database backup
pg_dump hr_system > backup_$(date +%Y%m%d).sql

# File system backup
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

---

## Conclusion

This comprehensive HR Management System provides a complete solution for modern organizations, covering the entire employee lifecycle from recruitment to retirement. The system's modular architecture, robust security, and scalable design make it suitable for organizations of all sizes.

Key strengths:
- **Complete Functionality**: All HR processes covered end-to-end
- **AI Integration**: Intelligent automation for efficiency
- **Security First**: Enterprise-grade security and compliance
- **Scalable Architecture**: Microservices-based design
- **User Experience**: Role-based interfaces for optimal usability
- **Audit & Compliance**: Complete audit trails and regulatory compliance

The system is production-ready and can be deployed in various environments with appropriate configuration and customization based on organizational needs.