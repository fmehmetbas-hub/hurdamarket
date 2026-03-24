import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/hurdamarket'
});

async function findUser() {
  try {
    await client.connect();
    const res = await client.query("SELECT name, phone, role FROM users LIMIT 10");
    console.log('--- Kayıtlı Kullanıcılar ---');
    res.rows.forEach(r => console.log(`${r.name} | ${r.phone} | ${r.role}`));
    console.log('----------------------------');
  } catch (err) {
    console.error('❌ Hata:', err.message);
  } finally {
    await client.end();
  }
}

findUser();
