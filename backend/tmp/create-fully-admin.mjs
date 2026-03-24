import pg from 'pg';
import bcrypt from 'bcryptjs';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/hurdamarket'
});

async function forceAdmin() {
  try {
    await client.connect();
    const phone = '05447685137';
    
    // Hash a placeholder password (though OTP is main method)
    const hash = await bcrypt.hash('admin123', 10);
    
    await client.query("DELETE FROM users WHERE phone = $1", [phone]);
    
    const query = `
      INSERT INTO users (name, phone, role, is_verified, is_active, is_premium, password_hash, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;
    const values = ['Faruk Admin', phone, 'admin', true, true, true, hash];
    
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
