const db = require('../db');

// GET /api/messages/:offerId  — sohbet geçmişi
const getMessages = async (req, res) => {
  try {
    const { offerId } = req.params;

    // Kullanıcı bu teklife dahil mi?
    const { rows: access } = await db.query(
      `SELECT o.id FROM offers o
       JOIN listings l ON l.id = o.listing_id
       WHERE o.id=$1 AND (o.buyer_id=$2 OR l.user_id=$2)`,
      [offerId, req.user.id]
    );
    if (!access.length) return res.status(403).json({ error: 'Yetkiniz yok.' });

    const { rows } = await db.query(
      `SELECT m.*, u.name AS sender_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.offer_id=$1
       ORDER BY m.sent_at ASC`,
      [offerId]
    );

    // Okunmamış mesajları okundu işaretle
    await db.query(
      'UPDATE messages SET is_read=true WHERE offer_id=$1 AND sender_id != $2',
      [offerId, req.user.id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Mesajlar yüklenemedi.' });
  }
};

module.exports = { getMessages };
