const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');

router.get('/', notificationsController.getNotifications);
router.post('/read-all', notificationsController.markAllAsRead);

module.exports = router;
