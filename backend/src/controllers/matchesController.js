const db = require('../../../database/db');

exports.getMatches = (req, res, next) => {
  try {
    const { q } = req.query;
    const students = db.getStudents(q || '');
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    next(error);
  }
};
