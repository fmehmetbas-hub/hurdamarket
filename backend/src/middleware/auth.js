const jwt = require('jsonwebtoken');
const db  = require('../db');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Giriş yapmanız gerekiyor.' });
    }

    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await db.query(
      'SELECT id, name, phone, email, role, city, rating FROM users WHERE id=$1 AND is_active=true',
      [decoded.userId]
    );

    if (!rows.length) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token.' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header && header.startsWith('Bearer ')) {
      const token   = header.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const { rows } = await db.query(
        'SELECT id, name, phone, role FROM users WHERE id=$1 AND is_active=true',
        [decoded.userId]
      );
      if (rows.length) req.user = rows[0];
    }
  } catch (_) {}
  next();
};

module.exports = { authenticate, optionalAuth };
