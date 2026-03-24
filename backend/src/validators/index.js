const { body, validationResult } = require('express-validator');

/**
 * Validation hatalarını kontrol eden middleware.
 * Her validator zincirinin sonuna eklenir.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(e => e.msg);
    return res.status(400).json({ error: messages[0], errors: messages });
  }
  next();
};

// ── Auth validatörleri ────────────────────────────
const sendOtpRules = [
  body('phone')
    .trim()
    .notEmpty().withMessage('Telefon numarası gerekli.')
    .matches(/^05\d{9}$/).withMessage('Geçerli bir Türkiye cep numarası girin (05XX XXX XX XX).'),
];

const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Ad soyad gerekli.')
    .isLength({ min: 2, max: 100 }).withMessage('Ad soyad 2-100 karakter arasında olmalı.'),

  body('phone')
    .trim()
    .matches(/^05\d{9}$/).withMessage('Geçerli telefon numarası girin.'),

  body('email')
    .optional({ nullable: true })
    .isEmail().withMessage('Geçerli bir e-posta adresi girin.')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı.')
    .isLength({ max: 128 }).withMessage('Şifre çok uzun.'),

  body('role')
    .optional()
    .isIn(['seller', 'buyer', 'both']).withMessage('Geçersiz hesap türü.'),

  body('city')
    .optional()
    .isLength({ max: 80 }).withMessage('Şehir adı çok uzun.'),

  body('otp')
    .trim()
    .matches(/^\d{6}$/).withMessage('OTP 6 haneli bir sayı olmalı.'),
];

const loginRules = [
  body('phone')
    .trim()
    .matches(/^05\d{9}$/).withMessage('Geçerli telefon numarası girin.'),
  body('password')
    .notEmpty().withMessage('Şifre gerekli.'),
];

// ── Listing validatörleri ─────────────────────────
const createListingRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Başlık gerekli.')
    .isLength({ min: 5, max: 200 }).withMessage('Başlık 5-200 karakter arasında olmalı.'),

  body('category')
    .notEmpty().withMessage('Kategori gerekli.')
    .isIn(['demir','bakir','aluminyum','plastik','elektronik','kagit','cam','tekstil','diger'])
    .withMessage('Geçersiz kategori.'),

  body('city')
    .trim()
    .notEmpty().withMessage('Şehir gerekli.')
    .isLength({ max: 80 }).withMessage('Şehir adı çok uzun.'),

  body('weight_kg')
    .optional({ nullable: true })
    .isFloat({ min: 0.1, max: 999999 }).withMessage('Ağırlık 0.1 ile 999999 kg arasında olmalı.'),

  body('description')
    .optional()
    .isLength({ max: 5000 }).withMessage('Açıklama en fazla 5000 karakter olabilir.'),

  body('lat')
    .optional({ nullable: true })
    .isFloat({ min: -90, max: 90 }).withMessage('Geçersiz enlem.'),

  body('lng')
    .optional({ nullable: true })
    .isFloat({ min: -180, max: 180 }).withMessage('Geçersiz boylam.'),
];

const updateListingRules = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 200 }).withMessage('Başlık 5-200 karakter arasında olmalı.'),

  body('status')
    .optional()
    .isIn(['active','pending','sold','cancelled']).withMessage('Geçersiz durum.'),
];

// ── Offer validatörleri ───────────────────────────
const createOfferRules = [
  body('price')
    .notEmpty().withMessage('Fiyat gerekli.')
    .isFloat({ min: 1, max: 99999999 }).withMessage('Fiyat 1 ile 99.999.999 ₺ arasında olmalı.'),

  body('pickup_date')
    .optional({ nullable: true })
    .isDate().withMessage('Geçerli bir tarih girin.')
    .custom(val => {
      if (val && new Date(val) < new Date()) throw new Error('Toplama tarihi geçmişte olamaz.');
      return true;
    }),

  body('note')
    .optional()
    .isLength({ max: 1000 }).withMessage('Not en fazla 1000 karakter olabilir.'),
];

const updateOfferRules = [
  body('status')
    .notEmpty().withMessage('Durum gerekli.')
    .isIn(['accepted','rejected','cancelled']).withMessage('Geçersiz durum.'),
];

// ── Review validatörleri ──────────────────────────
const createReviewRules = [
  body('score')
    .notEmpty().withMessage('Puan gerekli.')
    .isInt({ min: 1, max: 5 }).withMessage('Puan 1-5 arasında olmalı.'),
  body('comment')
    .optional()
    .isLength({ max: 1000 }).withMessage('Yorum en fazla 1000 karakter olabilir.'),
];

module.exports = {
  validate,
  sendOtpRules,
  registerRules,
  loginRules,
  createListingRules,
  updateListingRules,
  createOfferRules,
  updateOfferRules,
  createReviewRules,
};
