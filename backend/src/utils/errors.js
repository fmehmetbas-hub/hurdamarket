/**
 * Uygulama genelinde kullanılan özel hata sınıfı.
 * throw new AppError('Mesaj', 400) → otomatik JSON yanıt döner.
 */
class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // Beklenen hata (kullanıcı hatası vb.)
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Express error middleware — tüm hataları bu fonksiyon yakalar.
 * src/index.js'e app.use(errorHandler) olarak eklenir.
 */
const errorHandler = (err, req, res, next) => {
  // AppError değilse (beklenmedik sunucu hatası) logla
  if (!err.isOperational) {
    console.error('KRİTİK HATA:', err);
  }

  // PostgreSQL unique constraint ihlali (ör: aynı telefon)
  if (err.code === '23505') {
    return res.status(409).json({ error: 'Bu kayıt zaten mevcut.' });
  }

  // PostgreSQL foreign key ihlali
  if (err.code === '23503') {
    return res.status(400).json({ error: 'İlgili kayıt bulunamadı.' });
  }

  // JWT hataları
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Geçersiz token.' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Oturum süresi doldu, tekrar giriş yapın.' });
  }

  // Multer dosya boyutu hatası
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Dosya boyutu 10 MB\'ı aşamaz.' });
  }

  const statusCode = err.statusCode || 500;
  const message    = err.isOperational
    ? err.message
    : 'Sunucu hatası. Lütfen tekrar deneyin.';

  res.status(statusCode).json({ error: message });
};

/**
 * Async route'ları try/catch'e gerek kalmadan sarmalamak için.
 * Kullanım: router.get('/path', catchAsync(async (req, res) => { ... }))
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { AppError, errorHandler, catchAsync };
