const db = require('../../../database/db');

exports.getChats = async (req, res, next) => {
  try {
    const chats = await db.getChats();
    res.json({ success: true, count: chats.length, data: chats });
  } catch (error) {
    next(error);
  }
};

exports.openOrCreateChat = async (req, res, next) => {
  try {
    const { peerName, avatar, peerStatus } = req.body;
    if (!peerName) {
      return res.status(400).json({ success: false, message: 'peerName is required' });
    }
    const chat = await db.getOrCreateChat(peerName, avatar, peerStatus);
    res.json({ success: true, data: chat });
  } catch (error) {
    next(error);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { text, sender } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Message text is required' });
    }
    const result = await db.sendMessage(chatId, sender || 'me', text);
    res.json({ success: true, message: 'Message sent', data: result });
  } catch (error) {
    next(error);
  }
};
