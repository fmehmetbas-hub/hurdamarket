/**
 * Jest test setup.
 * Her test dosyası çalışmadan önce bu dosya yüklenir.
 * Test veritabanı: hurdamarket_test (ayrı bir DB, prod'a dokunmaz)
 */
process.env.NODE_ENV    = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://localhost:5432/hurdamarket_test';
process.env.JWT_SECRET  = 'test-secret-key-minimum-32-chars-long!!';
process.env.JWT_EXPIRES_IN = '1h';

const db = require('../db');

// Her test bittiğinde bağlantıyı kapat
afterAll(async () => {
  await db.pool.end();
});
