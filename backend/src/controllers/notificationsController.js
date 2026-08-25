const db = require('../../../database/db');

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await db.getNotifications();
    const unreadCount = notifications.filter(n => n.unread).length;
    res.json({ success: true, unreadCount, data: notifications });
  } catch (error) {
    next(error);
  }
};

exports.markAllAsRead = async (req, res, next) => {
  try {
    const result = await db.markAllNotificationsRead();
    res.json(result);
  } catch (error) {
    next(error);
  }
};
