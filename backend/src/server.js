/**
 * CAMPUSHUB REST API SERVER
 * Version 1.0.0
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

// Initialize DB connection & tables
db.getDB();

// Middlewares
app.use(cors({
  origin: config.FRONTEND_ORIGIN === '*' ? true : config.FRONTEND_ORIGIN,
  credentials: true
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
🗄️ Database:          SQLite 3 (database/campus_hub.db)
⚡ Environment:       ${config.NODE_ENV}
=======================================================
  `);
});

module.exports = { app, server };
