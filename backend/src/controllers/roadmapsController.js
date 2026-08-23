const db = require('../../../database/db');

exports.getAllRoadmaps = (req, res, next) => {
  try {
    const roadmaps = db.getRoadmaps();
    res.json({ success: true, data: roadmaps });
  } catch (error) {
    next(error);
  }
};
