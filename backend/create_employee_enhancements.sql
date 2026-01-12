-- Employee Management System Enhancements
-- Additional tables for comprehensive employee management

-- ============================================
-- 1. EMPLOYEE LIFECYCLE EVENTS TABLE
-- ============================================
CREATE TABLE employee_lifecycle_events (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL, -- promotion, transfer, department_change, role_change, exit, rehire
    effective_date DATE NOT NULL,
    previous_data JSON, -- Store previous values (department, position, salary, etc.)
    new_data JSON, -- Store new values
    reason TEXT,
    approved_by INTEGER REFERENCES users(id),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' -- pending, approved, rejected, completed
);

CREATE INDEX idx_lifecycle_employee_id ON employee_lifecycle_events(employee_id);
CREATE INDEX idx_lifecycle_event_type ON employee_lifecycle_events(event_type);
CREATE INDEX idx_lifecycle_effective_date ON employee_lifecycle_events(effective_date);

-- ============================================
-- 2. EMPLOYEE HIERARCHY TABLE
-- ============================================
CREATE TABLE employee_hierarchy (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    manager_id INTEGER REFERENCES employees(id) ON DELETE SET NULL,
    level INTEGER DEFAULT 1, -- Organizational level (1 = top level)
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hierarchy_employee_id ON employee_hierarchy(employee_id);
CREATE INDEX idx_hierarchy_manager_id ON employee_hierarchy(manager_id);
CREATE INDEX idx_hierarchy_level ON employee_hierarchy(level);

-- ============================================
-- 3. EMPLOYEE SKILLS MATRIX TABLE
-- ============================================
CREATE TABLE skills (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(50), -- technical, soft_skills, domain_knowledge, etc.
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employee_skills (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    skill_id INTEGER REFERENCES skills(id) ON DELETE CASCADE,
    proficiency INTEGER CHECK (proficiency >= 1 AND proficiency <= 10), -- 1-10 scale
    certified BOOLEAN DEFAULT FALSE,
    certification_date DATE,
    certification_body VARCHAR(100),
    last_assessed DATE,
    assessed_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, skill_id)
);

CREATE INDEX idx_employee_skills_employee_id ON employee_skills(employee_id);
CREATE INDEX idx_employee_skills_skill_id ON employee_skills(skill_id);
CREATE INDEX idx_employee_skills_proficiency ON employee_skills(proficiency);

-- ============================================
-- 4. EMPLOYEE CONTRACTS TABLE
-- ============================================
CREATE TABLE employee_contracts (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    contract_type VARCHAR(50) NOT NULL, -- permanent, contract, intern, consultant
    start_date DATE NOT NULL,
    end_date DATE,
    probation_period INTEGER, -- in months
    notice_period INTEGER, -- in days
    contract_document_url VARCHAR(500),
    salary_details JSON, -- Store salary structure
    benefits JSON, -- Store benefits information
    terms_conditions TEXT,
    status VARCHAR(20) DEFAULT 'active', -- active, expired, terminated, renewed
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contracts_employee_id ON employee_contracts(employee_id);
CREATE INDEX idx_contracts_status ON employee_contracts(status);
CREATE INDEX idx_contracts_type ON employee_contracts(contract_type);

-- ============================================
-- 5. EMPLOYEE EXIT PROCESS TABLE
-- ============================================
CREATE TABLE employee_exits (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    exit_type VARCHAR(50) NOT NULL, -- resignation, termination, retirement, layoff
    last_working_date DATE,
    notice_date DATE,
    reason TEXT,
    exit_interview_completed BOOLEAN DEFAULT FALSE,
    exit_interview_notes TEXT,
    clearance_status JSON, -- Track clearance from different departments
    final_settlement_amount DECIMAL(10,2),
    final_settlement_date DATE,
    rehire_eligible BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES users(id),
    hr_approved_by INTEGER REFERENCES users(id),
    manager_approved_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'initiated' -- initiated, in_progress, completed
);

CREATE INDEX idx_exits_employee_id ON employee_exits(employee_id);
CREATE INDEX idx_exits_status ON employee_exits(status);
CREATE INDEX idx_exits_last_working_date ON employee_exits(last_working_date);

-- ============================================
-- 6. BULK IMPORT LOGS TABLE
-- ============================================
CREATE TABLE bulk_import_logs (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    total_records INTEGER NOT NULL,
    successful_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    error_details JSON, -- Store validation errors
    imported_by INTEGER REFERENCES users(id),
    import_type VARCHAR(50), -- employees, skills, contracts, etc.
    status VARCHAR(20) DEFAULT 'processing', -- processing, completed, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE INDEX idx_bulk_import_status ON bulk_import_logs(status);
CREATE INDEX idx_bulk_import_type ON bulk_import_logs(import_type);

-- ============================================
-- 7. EMPLOYEE ANALYTICS CACHE TABLE
-- ============================================
CREATE TABLE employee_analytics_cache (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value JSON NOT NULL,
    department VARCHAR(100),
    date_range VARCHAR(50), -- monthly, quarterly, yearly
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    UNIQUE(metric_name, department, date_range)
);

CREATE INDEX idx_analytics_cache_metric ON employee_analytics_cache(metric_name);
CREATE INDEX idx_analytics_cache_expires ON employee_analytics_cache(expires_at);

-- ============================================
-- 8. ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================

-- Add manager relationship to employees table
ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id INTEGER REFERENCES employees(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employee_code VARCHAR(20) UNIQUE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_location VARCHAR(100);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type VARCHAR(50) DEFAULT 'full_time';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS probation_end_date DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS confirmation_date DATE;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_employee_code ON employees(employee_code);
CREATE INDEX IF NOT EXISTS idx_employees_employment_type ON employees(employment_type);

-- ============================================
-- 9. INSERT DEFAULT SKILLS
-- ============================================
INSERT INTO skills (name, category, description) VALUES
-- Technical Skills
('Python', 'technical', 'Python programming language'),
('JavaScript', 'technical', 'JavaScript programming language'),
('React', 'technical', 'React.js framework'),
('Node.js', 'technical', 'Node.js runtime environment'),
('SQL', 'technical', 'Structured Query Language'),
('PostgreSQL', 'technical', 'PostgreSQL database management'),
('FastAPI', 'technical', 'FastAPI web framework'),
('Git', 'technical', 'Version control system'),
('Docker', 'technical', 'Containerization platform'),
('AWS', 'technical', 'Amazon Web Services'),

-- Soft Skills
('Communication', 'soft_skills', 'Verbal and written communication'),
('Leadership', 'soft_skills', 'Team leadership and management'),
('Problem Solving', 'soft_skills', 'Analytical and critical thinking'),
('Time Management', 'soft_skills', 'Efficient time and task management'),
('Teamwork', 'soft_skills', 'Collaborative work skills'),
('Adaptability', 'soft_skills', 'Flexibility and change management'),
('Creativity', 'soft_skills', 'Creative thinking and innovation'),
('Negotiation', 'soft_skills', 'Negotiation and conflict resolution'),

-- Domain Knowledge
('HR Management', 'domain_knowledge', 'Human resources management'),
('Project Management', 'domain_knowledge', 'Project planning and execution'),
('Financial Analysis', 'domain_knowledge', 'Financial planning and analysis'),
('Marketing', 'domain_knowledge', 'Marketing and brand management'),
('Sales', 'domain_knowledge', 'Sales and customer relationship'),
('Operations', 'domain_knowledge', 'Operations and process management'),
('Quality Assurance', 'domain_knowledge', 'Quality control and testing'),
('Data Analysis', 'domain_knowledge', 'Data analysis and interpretation')

ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 10. CREATE VIEWS FOR COMMON QUERIES
-- ============================================

-- Employee Directory View
CREATE OR REPLACE VIEW employee_directory AS
SELECT 
    e.id,
    e.employee_code,
    e.first_name,
    e.last_name,
    e.first_name || ' ' || e.last_name as full_name,
    e.department,
    e.position,
    e.phone,
    u.email,
    e.work_location,
    e.employment_type,
    m.first_name || ' ' || m.last_name as manager_name,
    e.profile_image_url,
    u.is_active,
    e.date_of_joining,
    e.wfh_status
FROM employees e
LEFT JOIN users u ON e.user_id = u.id
LEFT JOIN employees m ON e.manager_id = m.id;

-- Employee Skills Summary View
CREATE OR REPLACE VIEW employee_skills_summary AS
SELECT 
    e.id as employee_id,
    e.first_name || ' ' || e.last_name as employee_name,
    e.department,
    COUNT(es.id) as total_skills,
    AVG(es.proficiency) as avg_proficiency,
    COUNT(CASE WHEN es.certified = true THEN 1 END) as certified_skills
FROM employees e
LEFT JOIN employee_skills es ON e.id = es.employee_id
GROUP BY e.id, e.first_name, e.last_name, e.department;

-- Department Hierarchy View
CREATE OR REPLACE VIEW department_hierarchy AS
SELECT 
    e.department,
    COUNT(*) as total_employees,
    COUNT(CASE WHEN e.manager_id IS NULL THEN 1 END) as department_heads,
    AVG(EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.date_of_joining))) as avg_tenure_years
FROM employees e
WHERE e.department IS NOT NULL
GROUP BY e.department;

COMMIT;