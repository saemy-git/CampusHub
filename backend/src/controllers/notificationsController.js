const db = require('../../../database/db');

exports.getNotifications = (req, res, next) => {
  try {
    const notifications = db.getNotifications();
    const unreadCount = notifications.filter(n => n.unread).length;
    res.json({ success: true, unreadCount, data: notifications });
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = (req, res, next) => {
  try {
    const result = db.markAllNotificationsRead();
    res.json(result);
  } catch (error) {
    next(error);
  }
};
