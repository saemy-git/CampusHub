-- CAMPUSHUB DATABASE SCHEMA (PostgreSQL / Supabase)
-- Version 2.0.0

-- USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    college TEXT NOT NULL,
    department TEXT NOT NULL,
    year TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    is_verified INTEGER DEFAULT 1,
    bio TEXT,
    skills JSONB DEFAULT '[]'::jsonb,
    interests JSONB DEFAULT '[]'::jsonb,
    avatar TEXT,
    xp INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- EMAIL OTPS TABLE (Secure Authentication)
CREATE TABLE IF NOT EXISTS email_otps (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at BIGINT NOT NULL,
    attempts INTEGER DEFAULT 0,
    created_at BIGINT NOT NULL,
    last_sent_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);

-- ROADMAPS TABLE
CREATE TABLE IF NOT EXISTS roadmaps (
    track_key TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL
);

-- ROADMAP MILESTONES
CREATE TABLE IF NOT EXISTS milestones (
    id SERIAL PRIMARY KEY,
    roadmap_track TEXT NOT NULL REFERENCES roadmaps(track_key) ON DELETE CASCADE,
    phase TEXT NOT NULL,
    title TEXT NOT NULL,
    project TEXT NOT NULL,
    milestone_order INTEGER DEFAULT 1
);

-- MILESTONE TASKS
CREATE TABLE IF NOT EXISTS milestone_tasks (
    id SERIAL PRIMARY KEY,
    milestone_id INTEGER NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    task_text TEXT NOT NULL,
    is_completed INTEGER DEFAULT 1
);

-- TEAMS TABLE
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_name TEXT NOT NULL,
    description TEXT NOT NULL,
    team_status TEXT NOT NULL,
    github TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- TEAM NEEDED ROLES
CREATE TABLE IF NOT EXISTS team_needed_roles (
    id SERIAL PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role_name TEXT NOT NULL
);

-- TEAM MEMBERS
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar TEXT
);

-- TEAM SQUAD APPLICATIONS
CREATE TABLE IF NOT EXISTS team_applications (
    id SERIAL PRIMARY KEY,
    team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    role_applied TEXT NOT NULL,
    reason TEXT NOT NULL,
    github_portfolio TEXT,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- SMART MATCH STUDENTS
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    college TEXT NOT NULL,
    department TEXT NOT NULL,
    skills JSONB NOT NULL,
    interests JSONB NOT NULL,
    match_score INTEGER NOT NULL,
    reason TEXT NOT NULL,
    avatar TEXT
);

-- COMMUNITIES
CREATE TABLE IF NOT EXISTS communities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    icon TEXT NOT NULL,
    members_count TEXT NOT NULL,
    online_count TEXT NOT NULL,
    description TEXT NOT NULL
);

-- DISCUSSIONS / FEED POSTS
CREATE TABLE IF NOT EXISTS discussions (
    id TEXT PRIMARY KEY,
    author TEXT NOT NULL,
    is_anon INTEGER DEFAULT 0,
    dept TEXT NOT NULL,
    time_ago TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    tags JSONB DEFAULT '[]'::jsonb,
    likes INTEGER DEFAULT 0,
    is_liked INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- EVENTS & HACKATHONS
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_date TEXT NOT NULL,
    event_time TEXT NOT NULL,
    location TEXT NOT NULL,
    description TEXT NOT NULL,
    prize TEXT NOT NULL,
    is_registered INTEGER DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- MARKETPLACE PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    condition TEXT NOT NULL,
    price TEXT NOT NULL,
    seller TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    icon TEXT NOT NULL,
    text_content TEXT NOT NULL,
    time_ago TEXT NOT NULL,
    is_unread INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- CHATS
CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    peer_name TEXT NOT NULL,
    peer_status TEXT NOT NULL,
    avatar TEXT,
    last_message TEXT,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    chat_id TEXT NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    sender TEXT NOT NULL,
    message_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
