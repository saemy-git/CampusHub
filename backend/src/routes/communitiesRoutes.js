const express = require('express');
const router = express.Router();
const communitiesController = require('../controllers/communitiesController');

router.get('/', communitiesController.getCommunities);
router.get('/:id', communitiesController.getCommunityById);

module.exports = router;
