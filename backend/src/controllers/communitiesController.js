const db = require('../../../database/db');

exports.getCommunities = async (req, res, next) => {
  try {
    const { category } = req.query;
    const communities = await db.getCommunities(category || 'all');
    res.json({ success: true, count: communities.length, data: communities });
  } catch (error) {
    next(error);
  }
};

exports.getCommunityById = async (req, res, next) => {
  try {
    const community = await db.getCommunityById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community hub not found' });
    }
    res.json({ success: true, data: community });
  } catch (error) {
    next(error);
  }
};
