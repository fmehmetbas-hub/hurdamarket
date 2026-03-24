require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const migrationFiles = [
  'schema.sql',
  'migration_faz3.sql',
  'migration_faz4.sql',
  'migration_faz5.sql',
];

async function migrate() {
  console.log('--- HurdaMarket Migration Başlatılıyor ---');
  
  for (const fileName of migrationFiles) {
    const filePath = path.join(__dirname, '../database', fileName);
    if (!fs.existsSync(filePath)) {
      console.error(`Hata: ${fileName} bulunamadı!`);
      continue;
    }

    console.log(`Uygulanıyor: ${fileName}...`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    try {
      await pool.query(sql);
      console.log(`✅ ${fileName} başarıyla uygulandı.`);
    } catch (err) {
      console.error(`❌ ${fileName} uygulanırken hata oluştu:`, err.message);
      // Hata olsa da devam et (IF NOT EXISTS kullanıldığı için)
    }
  }

  await pool.end();
  console.log('--- Migration Tamamlandı ---');
}

migrate().catch(err => {
  console.error('Migration başarısız:', err);
  process.exit(1);
});
