const express = require('express');
const router = express.Router();
const roadmapsController = require('../controllers/roadmapsController');

router.get('/', roadmapsController.getAllRoadmaps);

module.exports = router;
