import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/hurdamarket'
});

async function forceAdmin() {
  try {
    await client.connect();
    
    const phone = '05447685137';
    
    // Her ihtimale karşı varsa eskiyi siliyoruz
    await client.query("DELETE FROM users WHERE phone = $1", [phone]);
    
    const query = `
      INSERT INTO users (name, phone, role, is_verified, is_active, is_premium, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *
    `;
    const values = ['Admin Faruk', phone, 'admin', true, true, true];
    
    const res = await client.query(query, values);
    console.log('✅ HESABINIZ BAŞARIYLA OLUŞTURULDU: ' + res.rows[0].name);
    console.log('👑 ROL: ' + res.rows[0].role);
    console.log('----------------------------------------------------');
  } catch (err) {
    console.error('❌ Hata:', err.message);
  } finally {
    await client.end();
  }
}

forceAdmin();
