const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const roadmapsRoutes = require('./roadmapsRoutes');
const teamsRoutes = require('./teamsRoutes');
const matchesRoutes = require('./matchesRoutes');
const communitiesRoutes = require('./communitiesRoutes');
const discussionsRoutes = require('./discussionsRoutes');
const eventsRoutes = require('./eventsRoutes');
const marketplaceRoutes = require('./marketplaceRoutes');
const notificationsRoutes = require('./notificationsRoutes');
const chatsRoutes = require('./chatsRoutes');

// API Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CampusHub REST API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Subsystem Endpoints
router.use('/auth', authRoutes);
router.use('/user', authRoutes);
router.use('/roadmaps', roadmapsRoutes);
router.use('/teams', teamsRoutes);
router.use('/matches', matchesRoutes);
router.use('/communities', communitiesRoutes);
router.use('/discussions', discussionsRoutes);
router.use('/events', eventsRoutes);
router.use('/products', marketplaceRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/chats', chatsRoutes);

module.exports = router;
