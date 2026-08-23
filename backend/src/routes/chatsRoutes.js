const express = require('express');
const router = express.Router();
const chatsController = require('../controllers/chatsController');

router.get('/', chatsController.getChats);
router.post('/open', chatsController.openOrCreateChat);
router.post('/:chatId/messages', chatsController.sendMessage);

module.exports = router;
