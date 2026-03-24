const db = require('../db');
const { catchAsync } = require('../utils/errors');

const getNotifications = catchAsync(async (req, res) => {
  const { rows } = await db.query(
    'SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50',
    [req.user.id]
  );
  res.json({ notifications: rows, unread_count: rows.filter(n => !n.is_read).length });
});

const markAllRead = catchAsync(async (req, res) => {
  await db.query('UPDATE notifications SET is_read=true WHERE user_id=$1 AND is_read=false', [req.user.id]);
  res.json({ message: 'Tüm bildirimler okundu.' });
});

const markRead = catchAsync(async (req, res) => {
  await db.query('UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2', [req.params.id, req.user.id]);
  res.json({ message: 'Bildirim okundu.' });
});

const registerPushToken = catchAsync(async (req, res) => {
  const { token, platform } = req.body;
  if (!token) return res.status(400).json({ error: 'Token gerekli.' });
  await db.query(
    `INSERT INTO push_tokens (user_id, token, platform)
     VALUES ($1,$2,$3)
     ON CONFLICT (token) DO UPDATE SET user_id=$1, platform=$3, updated_at=NOW()`,
    [req.user.id, token, platform || 'unknown']
  );
  res.json({ message: 'Push token kaydedildi.' });
});

const sendPushToUser = async (userId, title, body, data = {}) => {
  try {
    const { rows } = await db.query('SELECT token FROM push_tokens WHERE user_id=$1', [userId]);
    if (!rows.length) return;
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(rows.map(r => ({ to: r.token, sound: 'default', title, body, data, badge: 1 }))),
    });
  } catch (err) {
    console.error('Push bildirimi gönderilemedi:', err.message);
  }
};

const createNotification = async (userId, type, title, body = '', data = {}) => {
  try {
    await db.query(
      'INSERT INTO notifications (user_id, type, title, body, data) VALUES ($1,$2,$3,$4,$5)',
      [userId, type, title, body, JSON.stringify(data)]
    );
    await sendPushToUser(userId, title, body, data);
  } catch (err) {
    console.error('Bildirim oluşturulamadı:', err.message);
  }
};

module.exports = { getNotifications, markAllRead, markRead, registerPushToken, createNotification, sendPushToUser };
