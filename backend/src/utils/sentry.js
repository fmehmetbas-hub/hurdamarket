const Sentry = require('@sentry/node');
// const { nodeProfilingIntegration } = require('@sentry/profiling-node'); -- Node 24 uyumluluk sorunu için kapatıldı
const logger = require('./logger');

const initSentry = (app) => {
  if (!process.env.SENTRY_DSN) {
    logger.debug('Sentry DSN tanımlı değil, monitoring devre dışı.');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      // nodeProfilingIntegration(), -- Devre dışı bırakıldı
    ],
    tracesSampleRate:   process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
    // profilesSampleRate: 0.1,
    beforeSend(event) {
      // Hassas verileri filtrele
      if (event.request?.data?.password) delete event.request.data.password;
      if (event.request?.data?.otp)      delete event.request.data.otp;
      return event;
    },
  });

  logger.info('Sentry başlatıldı.');
  return Sentry;
};

const captureError = (err, context = {}) => {
  if (!process.env.SENTRY_DSN) return;
  Sentry.withScope(scope => {
    Object.entries(context).forEach(([k, v]) => scope.setTag(k, v));
    Sentry.captureException(err);
  });
};

module.exports = { initSentry, captureError, Sentry };
