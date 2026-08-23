const db = require('../../../database/db');

exports.getDiscussions = (req, res, next) => {
  try {
    const { category } = req.query;
    const discussions = db.getDiscussions(category || 'all');
    res.json({ success: true, count: discussions.length, data: discussions });
  } catch (error) {
    next(error);
  }
};

exports.createDiscussion = (req, res, next) => {
  try {
    const { content, category, isAnon, tags, author, dept, avatar } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const newPost = db.createDiscussion({
      content,
      category,
      isAnon,
      tags,
      author,
      dept,
      avatar
    });

    res.status(201).json({ success: true, message: 'Post published successfully', data: newPost });
  } catch (error) {
    next(error);
  }
};

exports.toggleLike = (req, res, next) => {
  try {
    const result = db.toggleLikeDiscussion(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
