const db = require('../../../database/db');

exports.getTeams = (req, res, next) => {
  try {
    const { role, search } = req.query;
    const teams = db.getTeams(role || 'all', search || '');
    res.json({ success: true, count: teams.length, data: teams });
  } catch (error) {
    next(error);
  }
};

exports.getTeamById = (req, res, next) => {
  try {
    const team = db.getTeamById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }
    res.json({ success: true, data: team });
  } catch (error) {
    next(error);
  }
};

exports.createTeam = (req, res, next) => {
  try {
    const newTeam = db.createTeam(req.body);
    res.status(201).json({ success: true, message: 'Squad created successfully', data: newTeam });
  } catch (error) {
    next(error);
  }
};

exports.applyToTeam = (req, res, next) => {
  try {
    const result = db.applyToTeam(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
