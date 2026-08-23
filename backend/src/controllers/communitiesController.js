const db = require('../../../database/db');

exports.getCommunities = (req, res, next) => {
  try {
    const { category } = req.query;
    const communities = db.getCommunities(category || 'all');
    res.json({ success: true, count: communities.length, data: communities });
  } catch (error) {
    next(error);
  }
};

exports.getCommunityById = (req, res, next) => {
  try {
    const community = db.getCommunityById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community hub not found' });
    }
    res.json({ success: true, data: community });
  } catch (error) {
    next(error);
  }
};
