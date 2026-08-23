const express = require('express');
const router = express.Router();
const discussionsController = require('../controllers/discussionsController');

router.get('/', discussionsController.getDiscussions);
router.post('/', discussionsController.createDiscussion);
router.post('/:id/like', discussionsController.toggleLike);

module.exports = router;
