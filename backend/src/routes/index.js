const express   = require('express');
const router    = express.Router();
const multer    = require('multer');
const { authenticate, optionalAuth } = require('../middleware/auth');
const auth      = require('../controllers/auth.controller');
const listings  = require('../controllers/listings.controller');
const offers    = require('../controllers/offers.controller');
const messages  = require('../controllers/messages.controller');
const favorites = require('../controllers/favorites.controller');
const notifs    = require('../controllers/notifications.controller');

const {
  validate,
  sendOtpRules, registerRules, loginRules,
  createListingRules, updateListingRules,
  createOfferRules, updateOfferRules,
} = require('../validators');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => cb(null, file.mimetype.startsWith('image/')),
});

// ── Auth ──────────────────────────────────────────
router.post  ('/auth/send-otp', sendOtpRules,  validate, auth.sendOtp);
router.post  ('/auth/register', registerRules, validate, auth.register);
router.post  ('/auth/login',    loginRules,    validate, auth.login);
router.get   ('/auth/me',       authenticate,            auth.me);
router.patch ('/auth/me',       authenticate,            auth.updateMe);

// ── Listings ──────────────────────────────────────
// IMPORTANT: /listings/map must be before /listings/:id (static before dynamic)
router.get   ('/listings',          optionalAuth,                                                        listings.getListings);
router.get   ('/listings/map',      optionalAuth,                                                        listings.getListingsForMap);
router.get   ('/listings/mine',     authenticate,                                                        listings.getMyListings);
router.get   ('/listings/:id',      optionalAuth,                                                        listings.getListing);
router.post  ('/listings',          authenticate, createListingRules, validate, upload.array('photos', 8), listings.createListing);
router.put   ('/listings/:id',      authenticate, updateListingRules, validate,                          listings.updateListing);
router.delete('/listings/:id',      authenticate,                                                        listings.deleteListing);

// ── Offers ────────────────────────────────────────
// IMPORTANT: /offers/my must be before /offers/:id (static before dynamic)
router.get   ('/offers/my',           authenticate,                              offers.getMyOffers);
router.post  ('/listings/:id/offers', authenticate, createOfferRules, validate,  offers.createOffer);
router.get   ('/listings/:id/offers', authenticate,                              offers.getOffersForListing);
router.patch ('/offers/:id',          authenticate, updateOfferRules, validate,  offers.updateOffer);

// ── Messages ──────────────────────────────────────
router.get   ('/messages/:offerId', authenticate, messages.getMessages);

// ── Favorites ─────────────────────────────────────
// IMPORTANT: /favorites/check/:id must be before /favorites/:id
router.get   ('/favorites',                  authenticate, favorites.getFavorites);
router.get   ('/favorites/check/:listingId', authenticate, favorites.checkFavorite);
router.post  ('/favorites/:listingId',       authenticate, favorites.toggleFavorite);

// ── Notifications ─────────────────────────────────
// IMPORTANT: /notifications/read-all must be before /notifications/:id
router.get   ('/notifications',          authenticate, notifs.getNotifications);
router.patch ('/notifications/read-all', authenticate, notifs.markAllRead);
router.patch ('/notifications/:id/read', authenticate, notifs.markRead);
router.post  ('/notifications/push-token', authenticate, notifs.registerPushToken);

// ── Health ────────────────────────────────────────
router.get('/health', (_, res) => res.json({ status: 'ok', ts: new Date() }));

module.exports = router;

// ── Admin ─────────────────────────────────────────
const admin        = require('../controllers/admin.controller');
const { requireAdmin } = require('../middleware/admin');

router.get   ('/admin/stats',          authenticate, requireAdmin, admin.getStats);
router.get   ('/admin/users',          authenticate, requireAdmin, admin.getUsers);
router.patch ('/admin/users/:id',      authenticate, requireAdmin, admin.updateUser);
router.get   ('/admin/listings',       authenticate, requireAdmin, admin.getListings);
router.patch ('/admin/listings/:id',   authenticate, requireAdmin, admin.updateListing);
router.get   ('/admin/reports',        authenticate, requireAdmin, admin.getReports);
router.patch ('/admin/reports/:id',    authenticate, requireAdmin, admin.updateReport);
router.post  ('/reports',              authenticate,              admin.createReport);

// ── Payments ──────────────────────────────────────
const payments = require('../controllers/payments.controller');

// Stripe webhook — raw body şart, JSON parse OLMAMALI
router.post('/payments/webhook',
  express.raw({ type: 'application/json' }),
  payments.webhook
);

// Ödeme route'ları
router.get  ('/payments/plans',                    payments.getPlans);
router.get  ('/payments/history',          authenticate, payments.getPaymentHistory);
router.get  ('/payments/subscription',     authenticate, payments.getSubscription);
router.get  ('/payments/commission-info/:offerId', authenticate, payments.getCommissionInfo);
router.post ('/payments/commission/:offerId',      authenticate, payments.initiateCommission);
router.post ('/payments/subscribe',        authenticate, payments.subscribe);
router.delete('/payments/subscription',   authenticate, payments.cancelSubscription);
router.get  ('/payments/verify-session/:sessionId', authenticate, payments.verifySession);
