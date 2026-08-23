const express = require('express');
const router = express.Router();
const teamsController = require('../controllers/teamsController');

router.get('/', teamsController.getTeams);
router.post('/', teamsController.createTeam);
router.get('/:id', teamsController.getTeamById);
router.post('/:id/apply', teamsController.applyToTeam);

module.exports = router;
