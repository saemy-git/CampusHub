/**
 * CAMPUSHUB DATABASE ADAPTER (DAO & Query Engine)
 * Relational SQLite Data Access Object Layer
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, 'campus_hub.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH = path.join(__dirname, 'seed.sql');

// Initialize SQLite connection
let db;

function getDB() {
  if (!db) {
    const isNew = !fs.existsSync(DB_PATH);
    db = new DatabaseSync(DB_PATH);
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec('PRAGMA foreign_keys = ON;');

    if (isNew) {
      console.log('[DB] Initializing new SQLite schema...');
      initSchema();
      console.log('[DB] Seeding default dataset...');
      seedData();
    } else {
      // Ensure tables exist
      initSchema();
    }
  }
  return db;
}

function initSchema() {
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.exec(schemaSql);
}

function seedData() {
  const seedSql = fs.readFileSync(SEED_PATH, 'utf-8');
  db.exec(seedSql);
}

// -------------------------------------------------------------
// USER OPERATIONS
// -------------------------------------------------------------
function getUser(id = 'user-01') {
  const database = getDB();
  const row = database.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!row) return null;
  return {
    ...row,
    isVerified: Boolean(row.is_verified),
    skills: row.skills ? JSON.parse(row.skills) : [],
    interests: row.interests ? JSON.parse(row.interests) : []
  };
}

function updateUser(id = 'user-01', updates = {}) {
  const database = getDB();
  const current = getUser(id);
  if (!current) return null;

  const name = updates.name !== undefined ? updates.name : current.name;
  const college = updates.college !== undefined ? updates.college : current.college;
  const department = updates.department !== undefined ? updates.department : current.department;
  const year = updates.year !== undefined ? updates.year : current.year;
  const bio = updates.bio !== undefined ? updates.bio : current.bio;
  const skills = updates.skills ? JSON.stringify(updates.skills) : JSON.stringify(current.skills);
  const interests = updates.interests ? JSON.stringify(updates.interests) : JSON.stringify(current.interests);
  const avatar = updates.avatar || current.avatar;
  const xp = updates.xp !== undefined ? updates.xp : current.xp;

  database.prepare(`
    UPDATE users 
    SET name = ?, college = ?, department = ?, year = ?, bio = ?, skills = ?, interests = ?, avatar = ?, xp = ?
    WHERE id = ?
  `).run(name, college, department, year, bio, skills, interests, avatar, xp, id);

  return getUser(id);
}

// -------------------------------------------------------------
// ROADMAP OPERATIONS
// -------------------------------------------------------------
function getRoadmaps() {
  const database = getDB();
  const roadmapsRows = database.prepare('SELECT * FROM roadmaps').all();
  const result = {};

  roadmapsRows.forEach(r => {
    const milestones = database.prepare(`
      SELECT * FROM milestones WHERE roadmap_track = ? ORDER BY milestone_order ASC
    `).all(r.track_key);

    const fullMilestones = milestones.map(m => {
      const tasks = database.prepare('SELECT task_text FROM milestone_tasks WHERE milestone_id = ?').all(m.id);
      return {
        phase: m.phase,
        title: m.title,
        project: m.project,
        tasks: tasks.map(t => t.task_text)
      };
    });

    result[r.track_key] = {
      title: r.title,
      desc: r.description,
      milestones: fullMilestones
    };
  });

  return result;
}

// -------------------------------------------------------------
// TEAMS & SQUADS OPERATIONS
// -------------------------------------------------------------
function getTeams(filterRole = 'all', searchQuery = '') {
  const database = getDB();
  let teams = database.prepare('SELECT * FROM teams ORDER BY created_at DESC').all();

  const fullTeams = teams.map(t => {
    const roles = database.prepare('SELECT role_name FROM team_needed_roles WHERE team_id = ?').all(t.id);
    const members = database.prepare('SELECT name, role, avatar FROM team_members WHERE team_id = ?').all(t.id);

    return {
      id: t.id,
      title: t.title,
      eventType: t.event_type,
      eventName: t.event_name,
      description: t.description,
      teamStatus: t.team_status,
      github: t.github,
      neededRoles: roles.map(r => r.role_name),
      members: members
    };
  });

  return fullTeams.filter(team => {
    const matchesRole = filterRole === 'all' || 
      team.neededRoles.some(r => r.toLowerCase().includes(filterRole.toLowerCase()));
    const matchesSearch = !searchQuery || 
      team.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      team.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.eventName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });
}

function getTeamById(id) {
  const database = getDB();
  const t = database.prepare('SELECT * FROM teams WHERE id = ?').get(id);
  if (!t) return null;

  const roles = database.prepare('SELECT role_name FROM team_needed_roles WHERE team_id = ?').all(t.id);
  const members = database.prepare('SELECT name, role, avatar FROM team_members WHERE team_id = ?').all(t.id);

  return {
    id: t.id,
    title: t.title,
    eventType: t.event_type,
    eventName: t.event_name,
    description: t.description,
    teamStatus: t.team_status,
    github: t.github,
    neededRoles: roles.map(r => r.role_name),
    members: members
  };
}

function createTeam(teamData) {
  const database = getDB();
  const id = teamData.id || `team-${Date.now()}`;
  database.prepare(`
    INSERT INTO teams (id, title, event_type, event_name, description, team_status, github)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    teamData.title,
    teamData.eventType || 'HACKATHON',
    teamData.eventName || 'Campus Hackathon 2026',
    teamData.description || '',
    teamData.teamStatus || '1 / 4 members',
    teamData.github || 'https://github.com/campus-collab'
  );

  if (Array.isArray(teamData.neededRoles)) {
    teamData.neededRoles.forEach(role => {
      database.prepare('INSERT INTO team_needed_roles (team_id, role_name) VALUES (?, ?)').run(id, role);
    });
  }

  if (Array.isArray(teamData.members)) {
    teamData.members.forEach(member => {
      database.prepare('INSERT INTO team_members (team_id, name, role, avatar) VALUES (?, ?, ?, ?)').run(
        id,
        member.name,
        member.role,
        member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
      );
    });
  }

  return getTeamById(id);
}

function applyToTeam(teamId, applicationData) {
  const database = getDB();
  database.prepare(`
    INSERT INTO team_applications (team_id, role_applied, reason, github_portfolio, applicant_name, applicant_email)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    teamId,
    applicationData.roleApplied,
    applicationData.reason,
    applicationData.githubPortfolio || '',
    applicationData.applicantName || 'Arjun Sharma',
    applicationData.applicantEmail || 'arjun.sharma@cgc.edu.in'
  );

  return { success: true, message: 'Application submitted successfully to project lead.' };
}

// -------------------------------------------------------------
// STUDENTS (SMART MATCHING)
// -------------------------------------------------------------
function getStudents(query = '') {
  const database = getDB();
  const rows = database.prepare('SELECT * FROM students').all();
  const students = rows.map(s => ({
    id: s.id,
    name: s.name,
    college: s.college,
    department: s.department,
    skills: JSON.parse(s.skills),
    interests: JSON.parse(s.interests),
    matchScore: s.match_score,
    reason: s.reason,
    avatar: s.avatar
  }));

  if (!query) return students;
  const q = query.toLowerCase();
  return students.filter(s => 
    s.name.toLowerCase().includes(q) || 
    s.skills.some(sk => sk.toLowerCase().includes(q)) || 
    s.department.toLowerCase().includes(q)
  );
}

// -------------------------------------------------------------
// COMMUNITIES
// -------------------------------------------------------------
function getCommunities(category = 'all') {
  const database = getDB();
  let query = 'SELECT * FROM communities';
  let params = [];
  if (category !== 'all') {
    query += ' WHERE category = ?';
    params.push(category);
  }

  const rows = database.prepare(query).all(...params);
  return rows.map(c => ({
    id: c.id,
    name: c.name,
    category: c.category,
    icon: c.icon,
    members: c.members_count,
    online: c.online_count,
    desc: c.description
  }));
}

function getCommunityById(id) {
  const database = getDB();
  const c = database.prepare('SELECT * FROM communities WHERE id = ?').get(id);
  if (!c) return null;
  return {
    id: c.id,
    name: c.name,
    category: c.category,
    icon: c.icon,
    members: c.members_count,
    online: c.online_count,
    desc: c.description
  };
}

// -------------------------------------------------------------
// DISCUSSIONS / FEED POSTS
// -------------------------------------------------------------
function getDiscussions(category = 'all') {
  const database = getDB();
  let query = 'SELECT * FROM discussions ORDER BY created_at DESC';
  let params = [];

  if (category !== 'all') {
    query = 'SELECT * FROM discussions WHERE category = ? ORDER BY created_at DESC';
    params.push(category);
  }

  const rows = database.prepare(query).all(...params);
  return rows.map(p => ({
    id: p.id,
    author: p.author,
    isAnon: Boolean(p.is_anon),
    dept: p.dept,
    time: p.time_ago,
    category: p.category,
    content: p.content,
    tags: p.tags ? JSON.parse(p.tags) : [],
    likes: p.likes,
    isLiked: Boolean(p.is_liked),
    commentsCount: p.comments_count,
    avatar: p.avatar
  }));
}

function createDiscussion(data) {
  const database = getDB();
  const id = `post-${Date.now()}`;
  const isAnon = data.isAnon ? 1 : 0;
  const author = isAnon ? 'Anonymous Builder' : (data.author || 'Arjun Sharma');
  const dept = data.dept || 'Verified Student';
  const timeAgo = 'Just now';
  const category = data.category || 'General';
  const content = data.content;
  const tags = JSON.stringify(data.tags || ['Building', 'Campus']);
  const avatar = data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';

  database.prepare(`
    INSERT INTO discussions (id, author, is_anon, dept, time_ago, category, content, tags, likes, is_liked, comments_count, avatar)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?)
  `).run(id, author, isAnon, dept, timeAgo, category, content, tags, avatar);

  return database.prepare('SELECT * FROM discussions WHERE id = ?').get(id);
}

function toggleLikeDiscussion(id) {
  const database = getDB();
  const post = database.prepare('SELECT * FROM discussions WHERE id = ?').get(id);
  if (!post) return null;

  const newIsLiked = post.is_liked ? 0 : 1;
  const newLikes = newIsLiked ? post.likes + 1 : Math.max(0, post.likes - 1);

  database.prepare('UPDATE discussions SET is_liked = ?, likes = ? WHERE id = ?').run(newIsLiked, newLikes, id);
  return { id, isLiked: Boolean(newIsLiked), likes: newLikes };
}

// -------------------------------------------------------------
// EVENTS & HACKATHONS
// -------------------------------------------------------------
function getEvents(type = 'all') {
  const database = getDB();
  let query = 'SELECT * FROM events ORDER BY created_at DESC';
  let params = [];

  if (type !== 'all') {
    query = 'SELECT * FROM events WHERE event_type = ? ORDER BY created_at DESC';
    params.push(type);
  }

  const rows = database.prepare(query).all(...params);
  return rows.map(e => ({
    id: e.id,
    title: e.title,
    type: e.event_type,
    date: e.event_date,
    time: e.event_time,
    location: e.location,
    desc: e.description,
    prize: e.prize,
    isRegistered: Boolean(e.is_registered),
    img: e.image_url
  }));
}

function registerEvent(id) {
  const database = getDB();
  database.prepare('UPDATE events SET is_registered = 1 WHERE id = ?').run(id);
  const updated = database.prepare('SELECT * FROM events WHERE id = ?').get(id);
  if (!updated) return null;
  return {
    id: updated.id,
    title: updated.title,
    isRegistered: true
  };
}

// -------------------------------------------------------------
// MARKETPLACE PRODUCTS
// -------------------------------------------------------------
function getProducts(category = 'all', searchQuery = '') {
  const database = getDB();
  let query = 'SELECT * FROM products ORDER BY created_at DESC';
  let params = [];

  if (category !== 'all') {
    query = 'SELECT * FROM products WHERE category = ? ORDER BY created_at DESC';
    params.push(category);
  }

  const rows = database.prepare(query).all(...params);
  const products = rows.map(p => ({
    id: p.id,
    title: p.title,
    category: p.category,
    condition: p.condition,
    price: p.price,
    seller: p.seller,
    desc: p.description,
    img: p.image_url
  }));

  if (!searchQuery) return products;
  const q = searchQuery.toLowerCase();
  return products.filter(p => p.title.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q));
}

function createProduct(productData) {
  const database = getDB();
  const id = `prod-${Date.now()}`;
  const price = productData.price.startsWith('₹') ? productData.price : `₹${productData.price}`;
  const img = productData.img || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80';

  database.prepare(`
    INSERT INTO products (id, title, category, condition, price, seller, description, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    productData.title,
    productData.category || 'Other',
    productData.condition || 'Used',
    price,
    productData.seller || 'Arjun Sharma',
    productData.desc || '',
    img
  );

  return database.prepare('SELECT * FROM products WHERE id = ?').get(id);
}

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------
function getNotifications() {
  const database = getDB();
  const rows = database.prepare('SELECT * FROM notifications ORDER BY created_at DESC').all();
  return rows.map(n => ({
    id: n.id,
    icon: n.icon,
    text: n.text_content,
    time: n.time_ago,
    unread: Boolean(n.is_unread)
  }));
}

function markAllNotificationsRead() {
  const database = getDB();
  database.prepare('UPDATE notifications SET is_unread = 0').run();
  return { success: true, message: 'All notifications marked as read.' };
}

// -------------------------------------------------------------
// CHATS & DIRECT MESSAGES
// -------------------------------------------------------------
function getChats() {
  const database = getDB();
  const chats = database.prepare('SELECT * FROM chats ORDER BY updated_at DESC').all();

  return chats.map(c => {
    const messages = database.prepare(`
      SELECT sender, message_text as text FROM chat_messages 
      WHERE chat_id = ? ORDER BY created_at ASC
    `).all(c.id);

    return {
      id: c.id,
      peerName: c.peer_name,
      peerStatus: c.peer_status,
      avatar: c.avatar,
      lastMessage: c.last_message,
      messages: messages
    };
  });
}

function getOrCreateChat(peerName, avatar, peerStatus) {
  const database = getDB();
  let chat = database.prepare('SELECT * FROM chats WHERE LOWER(peer_name) = LOWER(?)').get(peerName);

  if (!chat) {
    const id = `chat-${Date.now()}`;
    const av = avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
    const st = peerStatus || 'Verified Campus Builder';
    const initMsg = 'Connected on CampusHub';

    database.prepare(`
      INSERT INTO chats (id, peer_name, peer_status, avatar, last_message)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, peerName, st, av, initMsg);

    database.prepare(`
      INSERT INTO chat_messages (chat_id, sender, message_text)
      VALUES (?, 'peer', ?)
    `).run(id, `Hey Arjun! Ready to build together.`);

    chat = database.prepare('SELECT * FROM chats WHERE id = ?').get(id);
  }

  const messages = database.prepare('SELECT sender, message_text as text FROM chat_messages WHERE chat_id = ? ORDER BY created_at ASC').all(chat.id);
  return {
    id: chat.id,
    peerName: chat.peer_name,
    peerStatus: chat.peer_status,
    avatar: chat.avatar,
    lastMessage: chat.last_message,
    messages: messages
  };
}

function sendMessage(chatId, sender, messageText) {
  const database = getDB();
  database.prepare(`
    INSERT INTO chat_messages (chat_id, sender, message_text)
    VALUES (?, ?, ?)
  `).run(chatId, sender, messageText);

  database.prepare(`
    UPDATE chats 
    SET last_message = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `).run(messageText, chatId);

  return { success: true, message: 'Message delivered.' };
}

// -------------------------------------------------------------
// RESET / RE-SEED UTILITY
// -------------------------------------------------------------
function resetAndSeed() {
  const database = getDB();
  initSchema();
  seedData();
  return { success: true, message: 'Database reset and re-seeded successfully.' };
}

module.exports = {
  getDB,
  getUser,
  updateUser,
  getRoadmaps,
  getTeams,
  getTeamById,
  createTeam,
  applyToTeam,
  getStudents,
  getCommunities,
  getCommunityById,
  getDiscussions,
  createDiscussion,
  toggleLikeDiscussion,
  getEvents,
  registerEvent,
  getProducts,
  createProduct,
  getNotifications,
  markAllNotificationsRead,
  getChats,
  getOrCreateChat,
  sendMessage,
  resetAndSeed
};
