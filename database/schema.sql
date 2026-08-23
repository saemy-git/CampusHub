-- CAMPUSHUB DATABASE SCHEMA (SQLite / Relational SQL)
-- Version 1.0.0

PRAGMA foreign_keys = ON;

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
    skills TEXT, -- Stored as JSON array or comma-separated list
    interests TEXT, -- Stored as JSON array
    avatar TEXT,
    xp INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ROADMAPS TABLE
CREATE TABLE IF NOT EXISTS roadmaps (
    track_key TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL
);

-- ROADMAP MILESTONES
CREATE TABLE IF NOT EXISTS milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    roadmap_track TEXT NOT NULL,
    phase TEXT NOT NULL,
    title TEXT NOT NULL,
    project TEXT NOT NULL,
    milestone_order INTEGER DEFAULT 1,
    FOREIGN KEY (roadmap_track) REFERENCES roadmaps(track_key) ON DELETE CASCADE
);

-- MILESTONE TASKS
CREATE TABLE IF NOT EXISTS milestone_tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    milestone_id INTEGER NOT NULL,
    task_text TEXT NOT NULL,
    is_completed INTEGER DEFAULT 1,
    FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TEAM NEEDED ROLES
CREATE TABLE IF NOT EXISTS team_needed_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id TEXT NOT NULL,
    role_name TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- TEAM MEMBERS
CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    avatar TEXT,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- TEAM SQUAD APPLICATIONS
CREATE TABLE IF NOT EXISTS team_applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id TEXT NOT NULL,
    role_applied TEXT NOT NULL,
    reason TEXT NOT NULL,
    github_portfolio TEXT,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);

-- SMART MATCH STUDENTS
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    college TEXT NOT NULL,
    department TEXT NOT NULL,
    skills TEXT NOT NULL, -- JSON array
    interests TEXT NOT NULL, -- JSON array
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
    tags TEXT, -- JSON array
    likes INTEGER DEFAULT 0,
    is_liked INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    icon TEXT NOT NULL,
    text_content TEXT NOT NULL,
    time_ago TEXT NOT NULL,
    is_unread INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CHATS
CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    peer_name TEXT NOT NULL,
    peer_status TEXT NOT NULL,
    avatar TEXT,
    last_message TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chat_id TEXT NOT NULL,
    sender TEXT NOT NULL, -- 'me' or 'peer'
    message_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE
);
