const db = require('../../../database/db');

exports.getAllRoadmaps = async (req, res, next) => {
  try {
    const roadmaps = await db.getRoadmaps();
    res.json({ success: true, data: roadmaps });
  } catch (error) {
    next(error);
  }
};
