-- ============================================
-- ENGAGEMENT SYSTEM DATABASE TABLES
-- ============================================

-- Pulse Surveys Table
CREATE TABLE IF NOT EXISTS pulse_surveys (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    mood VARCHAR(50) NOT NULL CHECK (mood IN ('terrible', 'bad', 'okay', 'good', 'amazing')),
    comment TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pulse_surveys_employee_id ON pulse_surveys(employee_id);
CREATE INDEX IF NOT EXISTS idx_pulse_surveys_submitted_at ON pulse_surveys(submitted_at);

-- Recognition System Table
CREATE TABLE IF NOT EXISTS recognitions (
    id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    badge VARCHAR(50) NOT NULL CHECK (badge IN ('star', 'team', 'innovator', 'goal', 'helpful', 'gogetter', 'creative', 'greatwork')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recognitions_sender_id ON recognitions(sender_id);
CREATE INDEX IF NOT EXISTS idx_recognitions_recipient_id ON recognitions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_recognitions_created_at ON recognitions(created_at);

-- Anonymous Feedback Table
CREATE TABLE IF NOT EXISTS anonymous_feedback (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('general', 'workplace', 'management', 'benefits', 'culture', 'suggestion')),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    votes INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived'))
);

CREATE INDEX IF NOT EXISTS idx_anonymous_feedback_category ON anonymous_feedback(category);
CREATE INDEX IF NOT EXISTS idx_anonymous_feedback_submitted_at ON anonymous_feedback(submitted_at);

-- Wellness Check-ins Table
CREATE TABLE IF NOT EXISTS wellness_checkins (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 10),
    notes TEXT,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wellness_checkins_employee_id ON wellness_checkins(employee_id);
CREATE INDEX IF NOT EXISTS idx_wellness_checkins_submitted_at ON wellness_checkins(submitted_at);

-- Photo Albums Table
CREATE TABLE IF NOT EXISTS photo_albums (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_photo_albums_created_by ON photo_albums(created_by);
CREATE INDEX IF NOT EXISTS idx_photo_albums_created_at ON photo_albums(created_at);

-- Photo Gallery Table
CREATE TABLE IF NOT EXISTS photo_gallery (
    id SERIAL PRIMARY KEY,
    album_id INTEGER REFERENCES photo_albums(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_photo_gallery_album_id ON photo_gallery(album_id);
CREATE INDEX IF NOT EXISTS idx_photo_gallery_uploaded_by ON photo_gallery(uploaded_by);

-- Game Scores Table
CREATE TABLE IF NOT EXISTS game_scores (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    game_type VARCHAR(50) NOT NULL CHECK (game_type IN ('trivia', 'wordscramble', 'quickmath', 'memory')),
    score INTEGER NOT NULL CHECK (score >= 0),
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_game_scores_employee_id ON game_scores(employee_id);
CREATE INDEX IF NOT EXISTS idx_game_scores_game_type ON game_scores(game_type);
CREATE INDEX IF NOT EXISTS idx_game_scores_played_at ON game_scores(played_at);

-- Engagement Notifications Table
CREATE TABLE IF NOT EXISTS engagement_notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('recognition', 'activity', 'pulse', 'wellness', 'feedback', 'general')),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_engagement_notifications_user_id ON engagement_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_engagement_notifications_is_read ON engagement_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_engagement_notifications_created_at ON engagement_notifications(created_at);

-- Team Activities Table
CREATE TABLE IF NOT EXISTS team_activities (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN ('virtual', 'physical', 'hybrid')),
    scheduled_date TIMESTAMP NOT NULL,
    max_participants INTEGER,
    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_team_activities_scheduled_date ON team_activities(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_team_activities_created_by ON team_activities(created_by);
CREATE INDEX IF NOT EXISTS idx_team_activities_is_active ON team_activities(is_active);

-- Activity Participants Table
CREATE TABLE IF NOT EXISTS activity_participants (
    id SERIAL PRIMARY KEY,
    activity_id INTEGER REFERENCES team_activities(id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(activity_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_activity_participants_activity_id ON activity_participants(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_participants_employee_id ON activity_participants(employee_id);

-- ============================================
-- SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample photo albums (only if they don't exist)
INSERT INTO photo_albums (title, description, created_by) 
SELECT 'Team Outing - Goa', 'Photos from our amazing team outing to Goa', 1
WHERE NOT EXISTS (SELECT 1 FROM photo_albums WHERE title = 'Team Outing - Goa');

INSERT INTO photo_albums (title, description, created_by) 
SELECT 'Diwali Celebration', 'Diwali celebration photos from the office', 1
WHERE NOT EXISTS (SELECT 1 FROM photo_albums WHERE title = 'Diwali Celebration');

INSERT INTO photo_albums (title, description, created_by) 
SELECT 'Annual Day 2024', 'Annual day celebration and awards ceremony', 1
WHERE NOT EXISTS (SELECT 1 FROM photo_albums WHERE title = 'Annual Day 2024');

-- Insert sample team activities
INSERT INTO team_activities (title, description, activity_type, scheduled_date, max_participants, created_by) 
SELECT 'Virtual Coffee Chat', 'Casual virtual coffee session for team bonding', 'virtual', CURRENT_TIMESTAMP + INTERVAL '7 days', 15, 1
WHERE NOT EXISTS (SELECT 1 FROM team_activities WHERE title = 'Virtual Coffee Chat');

INSERT INTO team_activities (title, description, activity_type, scheduled_date, max_participants, created_by) 
SELECT 'Team Lunch', 'Monthly team lunch at the office cafeteria', 'physical', CURRENT_TIMESTAMP + INTERVAL '14 days', 20, 1
WHERE NOT EXISTS (SELECT 1 FROM team_activities WHERE title = 'Team Lunch');

INSERT INTO team_activities (title, description, activity_type, scheduled_date, max_participants, created_by) 
SELECT 'Game Night', 'Virtual game night with online multiplayer games', 'virtual', CURRENT_TIMESTAMP + INTERVAL '21 days', 25, 1
WHERE NOT EXISTS (SELECT 1 FROM team_activities WHERE title = 'Game Night');

-- Insert sample anonymous feedback
INSERT INTO anonymous_feedback (text, category) 
SELECT 'The new office space is great, but we could use more meeting rooms.', 'workplace'
WHERE NOT EXISTS (SELECT 1 FROM anonymous_feedback WHERE text LIKE '%new office space%');

INSERT INTO anonymous_feedback (text, category) 
SELECT 'Would love to see more professional development opportunities.', 'suggestion'
WHERE NOT EXISTS (SELECT 1 FROM anonymous_feedback WHERE text LIKE '%professional development%');

INSERT INTO anonymous_feedback (text, category) 
SELECT 'The management team is very supportive and approachable.', 'management'
WHERE NOT EXISTS (SELECT 1 FROM anonymous_feedback WHERE text LIKE '%management team is very supportive%');

COMMIT;