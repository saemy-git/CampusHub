const db = require('../../../database/db');

exports.getEvents = (req, res, next) => {
  try {
    const { type } = req.query;
    const events = db.getEvents(type || 'all');
    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    next(error);
  }
};

exports.registerEvent = (req, res, next) => {
  try {
    const result = db.registerEvent(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, message: 'Successfully registered for event', data: result });
  } catch (error) {
    next(error);
  }
};
