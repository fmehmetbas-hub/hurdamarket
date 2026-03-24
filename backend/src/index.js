require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const jwt        = require('jsonwebtoken');
const routes     = require('./routes');
const { errorHandler } = require('./utils/errors');
const logger     = require('./utils/logger');
const { initSentry, Sentry } = require('./utils/sentry');
const { getClient: getRedis } = require('./utils/cache');
const db         = require('./db');
const fs         = require('fs');
const path       = require('path');

// Logs klasörü
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

const app    = express();
const server = http.createServer(app);

// Sentry — express middleware'den ÖNCE init edilmeli
initSentry(app);

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
});

// ── Middleware ────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));

// Stripe webhook için raw body — diğer route'lardan ÖNCE
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10mb' }));

// Request logger
app.use((req, _, next) => {
  logger.debug(`${req.method} ${req.path}`);
  next();
});

// Rate limiting
app.use('/api/auth/send-otp', rateLimit({
  windowMs: 60 * 1000, max: 3,
  message: { error: '1 dakikada en fazla 3 OTP isteği yapabilirsiniz.' },
}));
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 300 }));

// ── Routes ────────────────────────────────────────
app.use('/api', routes);

// 404
app.use((req, res) => res.status(404).json({ error: 'Endpoint bulunamadı.' }));

// Sentry error handler — errorHandler'dan ÖNCE
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// Merkezi hata yönetimi
app.use(errorHandler);

// ── Socket.io ─────────────────────────────────────
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Kimlik doğrulama gerekli.'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch {
    next(new Error('Geçersiz token.'));
  }
});

io.on('connection', (socket) => {
  logger.debug(`Socket bağlandı: ${socket.userId}`);

  socket.on('join_offer', (offerId) => socket.join(`offer:${offerId}`));

  socket.on('send_message', async ({ offerId, content }) => {
    try {
      if (!content?.trim()) return;
      const { rows: access } = await db.query(
        `SELECT o.id FROM offers o JOIN listings l ON l.id=o.listing_id
         WHERE o.id=$1 AND (o.buyer_id=$2 OR l.user_id=$2)`,
        [offerId, socket.userId]
      );
      if (!access.length) return;
      const { rows: msg } = await db.query(
        'INSERT INTO messages (offer_id, sender_id, content) VALUES ($1,$2,$3) RETURNING *',
        [offerId, socket.userId, content.trim()]
      );
      io.to(`offer:${offerId}`).emit('new_message', msg[0]);
    } catch (err) {
      logger.error(`Socket mesaj hatası: ${err.message}`);
    }
  });

  socket.on('disconnect', () => logger.debug(`Socket ayrıldı: ${socket.userId}`));
});

// ── Başlat ────────────────────────────────────────
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  logger.info(`HurdaMarket API → http://localhost:${PORT}`);

  // Redis bağlantısını başlat
  try {
    await getRedis();
  } catch (err) {
    logger.warn(`Redis başlatılamadı (opsiyonel): ${err.message}`);
  }
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled rejection: ${err.message}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM alındı, sunucu kapatılıyor...');
  server.close(() => process.exit(0));
});
