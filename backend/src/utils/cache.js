const { createClient } = require('redis');
const logger = require('./logger');

let client = null;
let isConnected = false;

const getClient = async () => {
  if (isConnected && client) return client;

  if (!process.env.REDIS_URL) {
    logger.debug('Redis URL tanımlı değil, cache devre dışı.');
    return null;
  }

  client = createClient({ url: process.env.REDIS_URL });

  client.on('error', (err) => {
    logger.error(`Redis hatası: ${err.message}`);
    isConnected = false;
  });

  client.on('connect', () => {
    logger.info('Redis bağlantısı kuruldu.');
    isConnected = true;
  });

  await client.connect();
  return client;
};

/**
 * Cache'den oku. Yoksa fn() çalıştır, sonucu cache'e yaz.
 *
 * @param {string} key   - Cache anahtarı
 * @param {Function} fn  - Cache miss durumunda çalışacak async fonksiyon
 * @param {number} ttl   - Saniye cinsinden yaşam süresi (default: 60)
 */
const cached = async (key, fn, ttl = 60) => {
  try {
    const redis = await getClient();

    if (!redis) return fn(); // Redis yoksa direkt çalıştır

    const cached = await redis.get(key);
    if (cached) {
      logger.debug(`Cache hit: ${key}`);
      return JSON.parse(cached);
    }

    logger.debug(`Cache miss: ${key}`);
    const result = await fn();
    await redis.setEx(key, ttl, JSON.stringify(result));
    return result;
  } catch (err) {
    logger.error(`Cache hatası (${key}): ${err.message}`);
    return fn(); // Hata durumunda cache'siz çalıştır
  }
};

/**
 * Belirli bir prefix ile başlayan tüm key'leri sil.
 * Örnek: invalidate('listings:') → tüm ilan cache'ini temizler
 */
const invalidate = async (prefix) => {
  try {
    const redis = await getClient();
    if (!redis) return;

    const keys = await redis.keys(`${prefix}*`);
    if (keys.length) {
      await redis.del(keys);
      logger.debug(`Cache temizlendi: ${prefix}* (${keys.length} key)`);
    }
  } catch (err) {
    logger.error(`Cache invalidate hatası: ${err.message}`);
  }
};

/**
 * Tek bir key'i sil.
 */
const del = async (key) => {
  try {
    const redis = await getClient();
    if (redis) await redis.del(key);
  } catch (err) {
    logger.error(`Cache del hatası: ${err.message}`);
  }
};

module.exports = { cached, invalidate, del, getClient };
