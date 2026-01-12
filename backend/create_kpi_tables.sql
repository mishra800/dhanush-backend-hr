-- KPI and Performance Enhancement Tables
-- Run this script to add advanced performance tracking capabilities

BEGIN;

-- ============================================
-- KPI TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS kpis (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_value FLOAT NOT NULL,
    current_value FLOAT DEFAULT 0.0,
    unit VARCHAR(50) NOT NULL, -- e.g., 'percentage', 'count', 'hours', 'score'
    weight FLOAT DEFAULT 1.0, -- Weight in overall performance calculation
    due_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
    progress_percentage FLOAT DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_kpis_employee_id ON kpis(employee_id);
CREATE INDEX IF NOT EXISTS idx_kpis_status ON kpis(status);
CREATE INDEX IF NOT EXISTS idx_kpis_due_date ON kpis(due_date);

-- ============================================
-- KPI PROGRESS TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS kpi_progress (
    id SERIAL PRIMARY KEY,
    kpi_id INTEGER REFERENCES kpis(id) ON DELETE CASCADE,
    previous_value FLOAT,
    new_value FLOAT,
    progress_notes TEXT,
    updated_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kpi_progress_kpi_id ON kpi_progress(kpi_id);
CREATE INDEX IF NOT EXISTS idx_kpi_progress_updated_at ON kpi_progress(updated_at);

-- ============================================
-- PERFORMANCE PERIODS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS performance_periods (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL, -- e.g., 'Q1 2024', 'Annual 2024'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    period_type VARCHAR(50) NOT NULL CHECK (period_type IN ('quarterly', 'annual', 'monthly', 'custom')),
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_performance_periods_active ON performance_periods(is_active);
CREATE INDEX IF NOT EXISTS idx_performance_periods_dates ON performance_periods(start_date, end_date);

-- ============================================
-- PERFORMANCE CALIBRATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS performance_calibration (
    id SERIAL PRIMARY KEY,
    period_id INTEGER REFERENCES performance_periods(id),
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    manager_rating FLOAT,
    calibrated_rating FLOAT,
    calibration_notes TEXT,
    calibrated_by INTEGER REFERENCES users(id),
    calibrated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_performance_calibration_period ON performance_calibration(period_id);
CREATE INDEX IF NOT EXISTS idx_performance_calibration_employee ON performance_calibration(employee_id);

-- ============================================
-- PEER FEEDBACK TABLE (for 360 reviews)
-- ============================================
CREATE TABLE IF NOT EXISTS peer_feedback (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    reviewer_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    review_period_id INTEGER REFERENCES performance_periods(id),
    collaboration_rating INTEGER CHECK (collaboration_rating BETWEEN 1 AND 5),
    communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
    reliability_rating INTEGER CHECK (reliability_rating BETWEEN 1 AND 5),
    innovation_rating INTEGER CHECK (innovation_rating BETWEEN 1 AND 5),
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    strengths TEXT,
    improvement_areas TEXT,
    additional_comments TEXT,
    is_anonymous BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_peer_feedback_employee ON peer_feedback(employee_id);
CREATE INDEX IF NOT EXISTS idx_peer_feedback_reviewer ON peer_feedback(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_peer_feedback_period ON peer_feedback(review_period_id);

-- ============================================
-- PERFORMANCE IMPROVEMENT PLANS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS performance_improvement_plans (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    manager_id INTEGER REFERENCES employees(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled', 'extended')),
    success_criteria TEXT,
    support_provided TEXT,
    progress_notes TEXT,
    final_outcome TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pip_employee ON performance_improvement_plans(employee_id);
CREATE INDEX IF NOT EXISTS idx_pip_manager ON performance_improvement_plans(manager_id);
CREATE INDEX IF NOT EXISTS idx_pip_status ON performance_improvement_plans(status);

-- ============================================
-- PERFORMANCE ANALYTICS CACHE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS performance_analytics_cache (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    period_id INTEGER REFERENCES performance_periods(id),
    analytics_data JSONB NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_perf_analytics_employee ON performance_analytics_cache(employee_id);
CREATE INDEX IF NOT EXISTS idx_perf_analytics_period ON performance_analytics_cache(period_id);
CREATE INDEX IF NOT EXISTS idx_perf_analytics_expires ON performance_analytics_cache(expires_at);

-- ============================================
-- INSERT SAMPLE DATA
-- ============================================

-- Insert current performance period
INSERT INTO performance_periods (name, start_date, end_date, period_type, is_active)
VALUES ('Q1 2024', '2024-01-01', '2024-03-31', 'quarterly', TRUE)
ON CONFLICT DO NOTHING;

-- Insert sample KPIs for existing employees
INSERT INTO kpis (employee_id, title, description, target_value, current_value, unit, weight, due_date, created_by)
SELECT 
    e.id,
    'Code Quality Score',
    'Maintain code quality score above target through code reviews and best practices',
    85.0,
    RANDOM() * 20 + 70, -- Random current value between 70-90
    'percentage',
    1.0,
    '2024-03-31'::timestamp,
    1
FROM employees e
WHERE e.id <= 5 -- First 5 employees
ON CONFLICT DO NOTHING;

INSERT INTO kpis (employee_id, title, description, target_value, current_value, unit, weight, due_date, created_by)
SELECT 
    e.id,
    'Project Delivery Rate',
    'Deliver assigned projects on time and within scope',
    100.0,
    RANDOM() * 30 + 70, -- Random current value between 70-100
    'percentage',
    1.5, -- Higher weight
    '2024-03-31'::timestamp,
    1
FROM employees e
WHERE e.id <= 5
ON CONFLICT DO NOTHING;

INSERT INTO kpis (employee_id, title, description, target_value, current_value, unit, weight, due_date, created_by)
SELECT 
    e.id,
    'Team Collaboration Score',
    'Maintain high collaboration and communication with team members',
    4.0,
    RANDOM() * 1.5 + 3.0, -- Random current value between 3.0-4.5
    'rating',
    1.0,
    '2024-03-31'::timestamp,
    1
FROM employees e
WHERE e.id <= 5
ON CONFLICT DO NOTHING;

-- Update KPI progress percentages based on current vs target values
UPDATE kpis 
SET progress_percentage = LEAST(100.0, (current_value / target_value) * 100)
WHERE target_value > 0;

-- Update KPI status based on progress
UPDATE kpis 
SET status = CASE 
    WHEN progress_percentage >= 100 THEN 'completed'
    WHEN progress_percentage >= 80 THEN 'active'
    ELSE 'active'
END;

COMMIT;

-- ============================================
-- PERFORMANCE CALCULATION FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION calculate_employee_performance_score(emp_id INTEGER, period_start DATE DEFAULT CURRENT_DATE - INTERVAL '12 months')
RETURNS TABLE (
    employee_id INTEGER,
    overall_score NUMERIC,
    kpi_score NUMERIC,
    goal_score NUMERIC,
    review_score NUMERIC,
    attendance_score NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH kpi_metrics AS (
        SELECT 
            k.employee_id,
            AVG(k.progress_percentage) as avg_kpi_progress,
            COUNT(*) as total_kpis,
            COUNT(*) FILTER (WHERE k.status = 'completed') as completed_kpis
        FROM kpis k
        WHERE k.employee_id = emp_id 
        AND k.created_at >= period_start
        GROUP BY k.employee_id
    ),
    goal_metrics AS (
        SELECT 
            g.employee_id,
            COUNT(*) as total_goals,
            COUNT(*) FILTER (WHERE g.status = 'completed') as completed_goals
        FROM goals g
        WHERE g.employee_id = emp_id 
        AND g.created_at >= period_start
        GROUP BY g.employee_id
    ),
    review_metrics AS (
        SELECT 
            pr.employee_id,
            AVG(pr.rating) as avg_rating
        FROM performance_reviews pr
        WHERE pr.employee_id = emp_id 
        AND pr.review_date >= period_start
        GROUP BY pr.employee_id
    ),
    attendance_metrics AS (
        SELECT 
            a.employee_id,
            COUNT(*) FILTER (WHERE a.status = 'present') * 100.0 / COUNT(*) as attendance_rate
        FROM attendance a
        WHERE a.employee_id = emp_id 
        AND a.date >= period_start
        GROUP BY a.employee_id
    )
    SELECT 
        emp_id,
        COALESCE(
            (COALESCE(km.avg_kpi_progress, 0) * 0.35) +
            (COALESCE(gm.completed_goals * 100.0 / NULLIF(gm.total_goals, 0), 0) * 0.25) +
            (COALESCE(rm.avg_rating * 20, 0) * 0.25) +
            (COALESCE(am.attendance_rate, 0) * 0.15),
            0
        )::NUMERIC(5,2) as overall_score,
        COALESCE(km.avg_kpi_progress, 0)::NUMERIC(5,2) as kpi_score,
        COALESCE(gm.completed_goals * 100.0 / NULLIF(gm.total_goals, 0), 0)::NUMERIC(5,2) as goal_score,
        COALESCE(rm.avg_rating * 20, 0)::NUMERIC(5,2) as review_score,
        COALESCE(am.attendance_rate, 0)::NUMERIC(5,2) as attendance_score
    FROM kpi_metrics km
    FULL OUTER JOIN goal_metrics gm ON km.employee_id = gm.employee_id
    FULL OUTER JOIN review_metrics rm ON COALESCE(km.employee_id, gm.employee_id) = rm.employee_id
    FULL OUTER JOIN attendance_metrics am ON COALESCE(km.employee_id, gm.employee_id, rm.employee_id) = am.employee_id;
END;
$$ LANGUAGE plpgsql;