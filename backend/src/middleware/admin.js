const { AppError } = require('../utils/errors');

/**
 * authenticate middleware'den sonra kullanılır.
 * Sadece role='admin' olan kullanıcılar geçebilir.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AppError('Giriş yapmanız gerekiyor.', 401));
  }
  if (req.user.role !== 'admin') {
    return next(new AppError('Bu sayfaya erişim yetkiniz yok.', 403));
  }
  next();
};

module.exports = { requireAdmin };
