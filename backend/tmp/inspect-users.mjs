import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/hurdamarket'
});

async function checkCols() {
  try {
    await client.connect();
    const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'");
    console.log('--- USERS TABLOSU KOLONLARI ---');
    res.rows.forEach(r => console.log(r.column_name));
    console.log('----------------------------');
  } catch (err) {
    console.error('❌ Hata:', err.message);
  } finally {
    await client.end();
  }
}

checkCols();
