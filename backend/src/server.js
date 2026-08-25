/**
 * CAMPUSHUB REST API SERVER
 * Version 2.0.0 (PostgreSQL / Supabase + Render)
 */

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config/config');
const apiRoutes = require('./routes');
const requestLogger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');
const db = require('../../database/db');

const app = express();

// Initialize DB connection pool
db.getPool();

// Configure CORS for local development and production GitHub Pages
const allowedOrigins = config.FRONTEND_ORIGIN === '*'
  ? true
  : config.FRONTEND_ORIGIN.split(',').map(o => o.trim());

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins === true) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin.endsWith('.github.io') || origin.startsWith('http://localhost') || origin.startsWith('http://127.0.0.1')) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive CORS for student demo platform
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);

// Mount API Endpoints
app.use('/api', apiRoutes);

// Optional: Serve frontend static assets if hosted together
const frontendPath = path.join(__dirname, '..', '..', 'frontend');
app.use(express.static(frontendPath));

// API 404 handler for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: 'API endpoint not found' });
});

// Fallback for SPA routing
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.originalUrl.startsWith('/api')) {
    const indexPath = path.join(frontendPath, 'index.html');
    return res.sendFile(indexPath, (err) => {
      if (err) next();
    });
  }
  next();
});

// Error handling
app.use(errorHandler);

// Start HTTP Server
const server = app.listen(config.PORT, '0.0.0.0', () => {
  console.log(`
🚀 =======================================================
⚡ CAMPUSHUB BACKEND REST API SERVER ONLINE
📍 Local Endpoint:    http://localhost:${config.PORT}/api
🏥 Health Check:      http://localhost:${config.PORT}/api/health
🗄️ Database:          PostgreSQL / Supabase
⚡ Environment:       ${config.NODE_ENV}
=======================================================
  `);
});

module.exports = { app, server };
