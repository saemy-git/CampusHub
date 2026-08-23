const express = require('express');
const router = express.Router();
const matchesController = require('../controllers/matchesController');

router.get('/', matchesController.getMatches);

module.exports = router;
