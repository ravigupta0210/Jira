const db = require('../config/database');
const { generateId } = require('../utils/helpers');

const getNotifications = (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM notifications
      WHERE user_id = ?
    `;

    const params = [req.userId];

    if (unreadOnly === 'true') {
      query += ' AND is_read = 0';
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const notifications = db.prepare(query).all(...params);

    const { total } = db.prepare(`
      SELECT COUNT(*) as total FROM notifications WHERE user_id = ?
    `).get(req.userId);

    const { unread } = db.prepare(`
      SELECT COUNT(*) as unread FROM notifications WHERE user_id = ? AND is_read = 0
    `).get(req.userId);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount: unread,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
};

const markAsRead = (req, res) => {
  try {
    const { id } = req.params;

    db.prepare(`
      UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?
    `).run(id, req.userId);

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read'
    });
  }
};

const markAllAsRead = (req, res) => {
  try {
    db.prepare(`
      UPDATE notifications SET is_read = 1 WHERE user_id = ?
    `).run(req.userId);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notifications as read'
    });
  }
};

const deleteNotification = (req, res) => {
  try {
    const { id } = req.params;

    db.prepare(`
      DELETE FROM notifications WHERE id = ? AND user_id = ?
    `).run(id, req.userId);

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notification'
    });
  }
};

const clearAll = (req, res) => {
  try {
    db.prepare(`
      DELETE FROM notifications WHERE user_id = ?
    `).run(req.userId);

    res.json({
      success: true,
      message: 'All notifications cleared'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing notifications'
    });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAll
};
