const db = require('../../../database/db');

exports.getEvents = async (req, res, next) => {
  try {
    const { type } = req.query;
    const events = await db.getEvents(type || 'all');
    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    next(error);
  }
};

exports.registerEvent = async (req, res, next) => {
  try {
    const result = await db.registerEvent(req.params.id);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    res.json({ success: true, message: 'Successfully registered for event', data: result });
  } catch (error) {
    next(error);
  }
};
