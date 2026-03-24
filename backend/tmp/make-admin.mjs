import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/hurdamarket'
});

async function makeAdmin() {
  try {
    await client.connect();
    const res = await client.query(
      "UPDATE users SET role = 'admin' WHERE phone = $1 RETURNING *",
      ['05447685137']
    );
    
    if (res.rowCount > 0) {
      console.log('✅ YETKİ AKTİF: ' + res.rows[0].name + ' artık bir ADMİN.');
    } else {
      console.log('❌ HATA: Bu telefon numarasıyla kayıtlı bir kullanıcı bulunamadı.');
    }
  } catch (err) {
    console.error('❌ VERİTABANI HATASI:', err.message);
  } finally {
    await client.end();
  }
}

makeAdmin();
