import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/hurdamarket'
});

async function checkTables() {
  try {
    await client.connect();
    const res = await client.query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname != 'pg_catalog' AND schemaname != 'information_schema'");
    console.log('--- Veritabanındaki Tablolar ---');
    res.rows.forEach(r => console.log(r.tablename));
    console.log('----------------------------');
    
    // Check if table 'users' exists and count users
    const userCount = await client.query("SELECT COUNT(*) FROM users");
    console.log('Toplam Kullanıcı Sayısı:', userCount.rows[0].count);
  } catch (err) {
    console.error('❌ Hata:', err.message);
  } finally {
    await client.end();
  }
}

checkTables();
