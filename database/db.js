/**
 * CAMPUSHUB DATABASE ADAPTER (PostgreSQL & Supabase DAO Layer)
 * Version 2.0.0
 */

const fs = require('fs');
const path = require('path');
let pg;
try {
  pg = require('pg');
} catch (e) {
  try {
    pg = require('../backend/node_modules/pg');
  } catch (err) {
    throw new Error("Could not find 'pg' package. Please run 'npm install pg' or 'npm --prefix backend install pg'.");
  }
}
const { Pool } = pg;

const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const SEED_PATH = path.join(__dirname, 'seed.sql');

let pool = null;

/**
 * Initialize and get PostgreSQL Connection Pool
 */
function getPool() {
  if (!pool) {
    let connectionString = process.env.DATABASE_URL;

    // Fallback attempt to read config if available
    try {
      const config = require('../backend/src/config/config');
      if (!connectionString && config.DATABASE_URL) {
        connectionString = config.DATABASE_URL;
      }
    } catch (e) {
      // Ignore if config not found in current path
    }

    if (!connectionString) {
      console.warn('⚠️ [DB Warning] DATABASE_URL is not set. Database operations will fail until configured.');
    }

    const isProduction = process.env.NODE_ENV === 'production';
    const isSupabase = connectionString && (connectionString.includes('supabase.co') || connectionString.includes('pooler.supabase.com'));

    pool = new Pool({
      connectionString: connectionString || undefined,
      ssl: (isProduction || isSupabase || (connectionString && connectionString.includes('sslmode=require')))
        ? { rejectUnauthorized: false }
        : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000
    });

    pool.on('error', (err) => {
      console.error('❌ [DB Error] Unexpected idle client error:', err.message);
    });
  }
  return pool;
}

const getDB = getPool;

/**
 * Safe JSON parser for arrays/objects
 */
function parseJsonField(val) {
  if (val === null || val === undefined) return [];
  if (Array.isArray(val) || typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return [];
  }
}

/**
 * Database schema initialization
 */
async function initSchema() {
  const client = getPool();
  if (!fs.existsSync(SCHEMA_PATH)) return;
  const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  await client.query(schemaSql);
}

/**
 * Database seed execution
 */
async function seedData() {
  const client = getPool();
  if (!fs.existsSync(SEED_PATH)) return;
  const seedSql = fs.readFileSync(SEED_PATH, 'utf-8');
  await client.query(seedSql);
}

// -------------------------------------------------------------
// USER OPERATIONS
// -------------------------------------------------------------
async function getUser(id = 'user-01') {
  const client = getPool();
  const res = await client.query('SELECT * FROM users WHERE id = $1', [id]);
  const row = res.rows[0];
  if (!row) return null;
  return {
    ...row,
    isVerified: Boolean(row.is_verified),
    skills: parseJsonField(row.skills),
    interests: parseJsonField(row.interests)
  };
}

async function getUserByEmail(email) {
  if (!email) return null;
  const client = getPool();
  const res = await client.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email.trim()]);
  const row = res.rows[0];
  if (!row) return null;
  return {
    ...row,
    isVerified: Boolean(row.is_verified),
    skills: parseJsonField(row.skills),
    interests: parseJsonField(row.interests)
  };
}

async function updateUser(id = 'user-01', updates = {}) {
  const current = await getUser(id);
  if (!current) return null;

  const name = updates.name !== undefined ? updates.name : current.name;
  const college = updates.college !== undefined ? updates.college : current.college;
  const department = updates.department !== undefined ? updates.department : current.department;
  const year = updates.year !== undefined ? updates.year : current.year;
  const bio = updates.bio !== undefined ? updates.bio : current.bio;
  const skills = JSON.stringify(updates.skills !== undefined ? updates.skills : current.skills);
  const interests = JSON.stringify(updates.interests !== undefined ? updates.interests : current.interests);
  const avatar = updates.avatar || current.avatar;
  const xp = updates.xp !== undefined ? updates.xp : current.xp;
  const isVerified = updates.isVerified !== undefined ? (updates.isVerified ? 1 : 0) : (current.isVerified ? 1 : 0);

  const client = getPool();
  await client.query(`
    UPDATE users 
    SET name = $1, college = $2, department = $3, year = $4, bio = $5, 
        skills = $6::jsonb, interests = $7::jsonb, avatar = $8, xp = $9, 
        is_verified = $10, updated_at = CURRENT_TIMESTAMP
    WHERE id = $11
  `, [name, college, department, year, bio, skills, interests, avatar, xp, isVerified, id]);

  return await getUser(id);
}

async function createOrUpdateUser(userData = {}) {
  const email = (userData.email || '').toLowerCase().trim();
  if (!email) throw new Error('Email is required');

  const existing = await getUserByEmail(email);
  if (existing) {
    return await updateUser(existing.id, userData);
  } else {
    const id = userData.id || `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const name = userData.name || email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const college = userData.college || 'CGC Landran';
    const department = userData.department || 'Computer Science Engineering';
    const year = userData.year || '3rd Year';
    const bio = userData.bio || 'Passionate student builder on CampusHub.';
    const skills = JSON.stringify(userData.skills || ['Python', 'React.js', 'FastAPI']);
    const interests = JSON.stringify(userData.interests || ['AI / ML', 'Fullstack', 'Hackathons']);
    const avatar = userData.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`;
    const isVerified = userData.isVerified !== undefined ? (userData.isVerified ? 1 : 0) : 1;
    const xp = userData.xp || 2450;

    const client = getPool();
    await client.query(`
      INSERT INTO users (id, name, college, department, year, email, is_verified, bio, skills, interests, avatar, xp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11, $12)
    `, [id, name, college, department, year, email, isVerified, bio, skills, interests, avatar, xp]);

    return await getUser(id);
  }
}

// -------------------------------------------------------------
// EMAIL OTP OPERATIONS
// -------------------------------------------------------------
async function saveEmailOtp(email, otpHash, expiresAt, lastSentAt = Date.now()) {
  const client = getPool();
  const normalizedEmail = email.toLowerCase().trim();
  
  // Invalidate previous OTPs
  await client.query('DELETE FROM email_otps WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);

  const createdAt = Date.now();
  await client.query(`
    INSERT INTO email_otps (email, otp_hash, expires_at, attempts, created_at, last_sent_at)
    VALUES ($1, $2, $3, 0, $4, $5)
  `, [normalizedEmail, otpHash, expiresAt, createdAt, lastSentAt]);
}

async function getActiveOtp(email) {
  if (!email) return null;
  const client = getPool();
  const normalizedEmail = email.toLowerCase().trim();
  const res = await client.query('SELECT * FROM email_otps WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
  return res.rows[0] || null;
}

async function incrementOtpAttempts(email) {
  if (!email) return;
  const client = getPool();
  const normalizedEmail = email.toLowerCase().trim();
  await client.query('UPDATE email_otps SET attempts = attempts + 1 WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
}

async function deleteEmailOtp(email) {
  if (!email) return;
  const client = getPool();
  const normalizedEmail = email.toLowerCase().trim();
  await client.query('DELETE FROM email_otps WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
}

// -------------------------------------------------------------
// ROADMAP OPERATIONS
// -------------------------------------------------------------
async function getRoadmaps() {
  const client = getPool();
  const roadmapsRes = await client.query('SELECT * FROM roadmaps');
  const result = {};

  for (const r of roadmapsRes.rows) {
    const milestonesRes = await client.query(`
      SELECT * FROM milestones WHERE roadmap_track = $1 ORDER BY milestone_order ASC
    `, [r.track_key]);

    const fullMilestones = [];
    for (const m of milestonesRes.rows) {
      const tasksRes = await client.query('SELECT task_text FROM milestone_tasks WHERE milestone_id = $1', [m.id]);
      fullMilestones.push({
        phase: m.phase,
        title: m.title,
        project: m.project,
        tasks: tasksRes.rows.map(t => t.task_text)
      });
    }

    result[r.track_key] = {
      title: r.title,
      desc: r.description,
      milestones: fullMilestones
    };
  }

  return result;
}

// -------------------------------------------------------------
// TEAMS & SQUADS OPERATIONS
// -------------------------------------------------------------
async function getTeams(filterRole = 'all', searchQuery = '') {
  const client = getPool();
  const teamsRes = await client.query('SELECT * FROM teams ORDER BY created_at DESC');

  const fullTeams = [];
  for (const t of teamsRes.rows) {
    const rolesRes = await client.query('SELECT role_name FROM team_needed_roles WHERE team_id = $1', [t.id]);
    const membersRes = await client.query('SELECT name, role, avatar FROM team_members WHERE team_id = $1', [t.id]);

    fullTeams.push({
      id: t.id,
      title: t.title,
      eventType: t.event_type,
      eventName: t.event_name,
      description: t.description,
      teamStatus: t.team_status,
      github: t.github,
      neededRoles: rolesRes.rows.map(r => r.role_name),
      members: membersRes.rows
    });
  }

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

async function getTeamById(id) {
  const client = getPool();
  const res = await client.query('SELECT * FROM teams WHERE id = $1', [id]);
  const t = res.rows[0];
  if (!t) return null;

  const rolesRes = await client.query('SELECT role_name FROM team_needed_roles WHERE team_id = $1', [t.id]);
  const membersRes = await client.query('SELECT name, role, avatar FROM team_members WHERE team_id = $1', [t.id]);

  return {
    id: t.id,
    title: t.title,
    eventType: t.event_type,
    eventName: t.event_name,
    description: t.description,
    teamStatus: t.team_status,
    github: t.github,
    neededRoles: rolesRes.rows.map(r => r.role_name),
    members: membersRes.rows
  };
}

async function createTeam(teamData) {
  const client = getPool();
  const id = teamData.id || `team-${Date.now()}`;
  await client.query(`
    INSERT INTO teams (id, title, event_type, event_name, description, team_status, github)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [
    id,
    teamData.title,
    teamData.eventType || 'HACKATHON',
    teamData.eventName || 'Campus Hackathon 2026',
    teamData.description || '',
    teamData.teamStatus || '1 / 4 members',
    teamData.github || 'https://github.com/campus-collab'
  ]);

  if (Array.isArray(teamData.neededRoles)) {
    for (const role of teamData.neededRoles) {
      await client.query('INSERT INTO team_needed_roles (team_id, role_name) VALUES ($1, $2)', [id, role]);
    }
  }

  if (Array.isArray(teamData.members)) {
    for (const member of teamData.members) {
      await client.query('INSERT INTO team_members (team_id, name, role, avatar) VALUES ($1, $2, $3, $4)', [
        id,
        member.name,
        member.role,
        member.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
      ]);
    }
  }

  return await getTeamById(id);
}

async function applyToTeam(teamId, applicationData) {
  const client = getPool();
  await client.query(`
    INSERT INTO team_applications (team_id, role_applied, reason, github_portfolio, applicant_name, applicant_email)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [
    teamId,
    applicationData.roleApplied,
    applicationData.reason,
    applicationData.githubPortfolio || '',
    applicationData.applicantName || 'Arjun Sharma',
    applicationData.applicantEmail || 'arjun.sharma@cgc.edu.in'
  ]);

  return { success: true, message: 'Application submitted successfully to project lead.' };
}

// -------------------------------------------------------------
// STUDENTS (SMART MATCHING)
// -------------------------------------------------------------
async function getStudents(query = '') {
  const client = getPool();
  const res = await client.query('SELECT * FROM students');
  const students = res.rows.map(s => ({
    id: s.id,
    name: s.name,
    college: s.college,
    department: s.department,
    skills: parseJsonField(s.skills),
    interests: parseJsonField(s.interests),
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
async function getCommunities(category = 'all') {
  const client = getPool();
  let res;
  if (category !== 'all') {
    res = await client.query('SELECT * FROM communities WHERE category = $1', [category]);
  } else {
    res = await client.query('SELECT * FROM communities');
  }

  return res.rows.map(c => ({
    id: c.id,
    name: c.name,
    category: c.category,
    icon: c.icon,
    members: c.members_count,
    online: c.online_count,
    desc: c.description
  }));
}

async function getCommunityById(id) {
  const client = getPool();
  const res = await client.query('SELECT * FROM communities WHERE id = $1', [id]);
  const c = res.rows[0];
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
async function getDiscussions(category = 'all') {
  const client = getPool();
  let res;
  if (category !== 'all') {
    res = await client.query('SELECT * FROM discussions WHERE category = $1 ORDER BY created_at DESC', [category]);
  } else {
    res = await client.query('SELECT * FROM discussions ORDER BY created_at DESC');
  }

  return res.rows.map(p => ({
    id: p.id,
    author: p.author,
    isAnon: Boolean(p.is_anon),
    dept: p.dept,
    time: p.time_ago,
    category: p.category,
    content: p.content,
    tags: parseJsonField(p.tags),
    likes: p.likes,
    isLiked: Boolean(p.is_liked),
    commentsCount: p.comments_count,
    avatar: p.avatar
  }));
}

async function createDiscussion(data) {
  const client = getPool();
  const id = `post-${Date.now()}`;
  const isAnon = data.isAnon ? 1 : 0;
  const author = isAnon ? 'Anonymous Builder' : (data.author || 'Arjun Sharma');
  const dept = data.dept || 'Verified Student';
  const timeAgo = 'Just now';
  const category = data.category || 'General';
  const content = data.content;
  const tags = JSON.stringify(data.tags || ['Building', 'Campus']);
  const avatar = data.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';

  await client.query(`
    INSERT INTO discussions (id, author, is_anon, dept, time_ago, category, content, tags, likes, is_liked, comments_count, avatar)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, 0, 0, 0, $9)
  `, [id, author, isAnon, dept, timeAgo, category, content, tags, avatar]);

  const res = await client.query('SELECT * FROM discussions WHERE id = $1', [id]);
  const p = res.rows[0];
  if (!p) return null;
  return {
    id: p.id,
    author: p.author,
    isAnon: Boolean(p.is_anon),
    dept: p.dept,
    time: p.time_ago,
    category: p.category,
    content: p.content,
    tags: parseJsonField(p.tags),
    likes: p.likes,
    isLiked: Boolean(p.is_liked),
    commentsCount: p.comments_count,
    avatar: p.avatar
  };
}

async function toggleLikeDiscussion(id) {
  const client = getPool();
  const res = await client.query('SELECT * FROM discussions WHERE id = $1', [id]);
  const post = res.rows[0];
  if (!post) return null;

  const newIsLiked = post.is_liked ? 0 : 1;
  const newLikes = newIsLiked ? post.likes + 1 : Math.max(0, post.likes - 1);

  await client.query('UPDATE discussions SET is_liked = $1, likes = $2 WHERE id = $3', [newIsLiked, newLikes, id]);
  return { id, isLiked: Boolean(newIsLiked), likes: newLikes };
}

// -------------------------------------------------------------
// EVENTS & HACKATHONS
// -------------------------------------------------------------
async function getEvents(type = 'all') {
  const client = getPool();
  let res;
  if (type !== 'all') {
    res = await client.query('SELECT * FROM events WHERE event_type = $1 ORDER BY created_at DESC', [type]);
  } else {
    res = await client.query('SELECT * FROM events ORDER BY created_at DESC');
  }

  return res.rows.map(e => ({
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

async function registerEvent(id) {
  const client = getPool();
  await client.query('UPDATE events SET is_registered = 1 WHERE id = $1', [id]);
  const res = await client.query('SELECT * FROM events WHERE id = $1', [id]);
  const updated = res.rows[0];
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
async function getProducts(category = 'all', searchQuery = '') {
  const client = getPool();
  let res;
  if (category !== 'all') {
    res = await client.query('SELECT * FROM products WHERE category = $1 ORDER BY created_at DESC', [category]);
  } else {
    res = await client.query('SELECT * FROM products ORDER BY created_at DESC');
  }

  const products = res.rows.map(p => ({
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

async function createProduct(productData) {
  const client = getPool();
  const id = `prod-${Date.now()}`;
  const price = productData.price.startsWith('₹') ? productData.price : `₹${productData.price}`;
  const img = productData.img || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80';

  await client.query(`
    INSERT INTO products (id, title, category, condition, price, seller, description, image_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
  `, [
    id,
    productData.title,
    productData.category || 'Other',
    productData.condition || 'Used',
    price,
    productData.seller || 'Arjun Sharma',
    productData.desc || '',
    img
  ]);

  const res = await client.query('SELECT * FROM products WHERE id = $1', [id]);
  const p = res.rows[0];
  if (!p) return null;
  return {
    id: p.id,
    title: p.title,
    category: p.category,
    condition: p.condition,
    price: p.price,
    seller: p.seller,
    desc: p.description,
    img: p.image_url
  };
}

// -------------------------------------------------------------
// NOTIFICATIONS
// -------------------------------------------------------------
async function getNotifications() {
  const client = getPool();
  const res = await client.query('SELECT * FROM notifications ORDER BY created_at DESC');
  return res.rows.map(n => ({
    id: n.id,
    icon: n.icon,
    text: n.text_content,
    time: n.time_ago,
    unread: Boolean(n.is_unread)
  }));
}

async function markAllNotificationsRead() {
  const client = getPool();
  await client.query('UPDATE notifications SET is_unread = 0');
  return { success: true, message: 'All notifications marked as read.' };
}

// -------------------------------------------------------------
// CHATS & DIRECT MESSAGES
// -------------------------------------------------------------
async function getChats() {
  const client = getPool();
  const chatsRes = await client.query('SELECT * FROM chats ORDER BY updated_at DESC');

  const chats = [];
  for (const c of chatsRes.rows) {
    const msgRes = await client.query(`
      SELECT sender, message_text as text FROM chat_messages 
      WHERE chat_id = $1 ORDER BY created_at ASC
    `, [c.id]);

    chats.push({
      id: c.id,
      peerName: c.peer_name,
      peerStatus: c.peer_status,
      avatar: c.avatar,
      lastMessage: c.last_message,
      messages: msgRes.rows
    });
  }

  return chats;
}

async function getOrCreateChat(peerName, avatar, peerStatus) {
  const client = getPool();
  let res = await client.query('SELECT * FROM chats WHERE LOWER(peer_name) = LOWER($1)', [peerName]);
  let chat = res.rows[0];

  if (!chat) {
    const id = `chat-${Date.now()}`;
    const av = avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
    const st = peerStatus || 'Verified Campus Builder';
    const initMsg = 'Connected on CampusHub';

    await client.query(`
      INSERT INTO chats (id, peer_name, peer_status, avatar, last_message)
      VALUES ($1, $2, $3, $4, $5)
    `, [id, peerName, st, av, initMsg]);

    await client.query(`
      INSERT INTO chat_messages (chat_id, sender, message_text)
      VALUES ($1, 'peer', $2)
    `, [id, 'Hey Arjun! Ready to build together.']);

    res = await client.query('SELECT * FROM chats WHERE id = $1', [id]);
    chat = res.rows[0];
  }

  const msgRes = await client.query('SELECT sender, message_text as text FROM chat_messages WHERE chat_id = $1 ORDER BY created_at ASC', [chat.id]);
  return {
    id: chat.id,
    peerName: chat.peer_name,
    peerStatus: chat.peer_status,
    avatar: chat.avatar,
    lastMessage: chat.last_message,
    messages: msgRes.rows
  };
}

async function sendMessage(chatId, sender, messageText) {
  const client = getPool();
  await client.query(`
    INSERT INTO chat_messages (chat_id, sender, message_text)
    VALUES ($1, $2, $3)
  `, [chatId, sender, messageText]);

  await client.query(`
    UPDATE chats 
    SET last_message = $1, updated_at = CURRENT_TIMESTAMP 
    WHERE id = $2
  `, [messageText, chatId]);

  return { success: true, message: 'Message delivered.' };
}

// -------------------------------------------------------------
// RESET / RE-SEED UTILITY
// -------------------------------------------------------------
async function resetAndSeed() {
  await initSchema();
  await seedData();
  return { success: true, message: 'Database reset and re-seeded successfully.' };
}

module.exports = {
  getDB,
  getPool,
  initSchema,
  seedData,
  getUser,
  getUserByEmail,
  updateUser,
  createOrUpdateUser,
  saveEmailOtp,
  getActiveOtp,
  incrementOtpAttempts,
  deleteEmailOtp,
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
