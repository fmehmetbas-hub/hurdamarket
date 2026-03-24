import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/hurdamarket'
});

async function forceCreateAdmin() {
  try {
    await client.connect();
    
    // Telefon numaranızı kontrol et (belki farklı bir formatla var?)
    const phone = '05447685137';
    
    // Var olanı sil ve GERÇEK bir admin olarak yeniden yarat
    await client.query("DELETE FROM users WHERE phone = $1", [phone]);
    
    const query = `
      INSERT INTO users (name, phone, role, verified, created_at)
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;
    const values = ['Faruk Admin', phone, 'admin', true];
    
    const res = await client.query(query, values);
    console.log('✅ HESABINIZ MANUEL OLUŞTURULDU: ' + res.rows[0].name);
    console.log('🔐 YETKİ: ' + res.rows[0].role);
    console.log('----------------------------------------------------');
    console.log('Şimdi tarayıcıdan giriş yapmayı tekrar deneyin (Artık OTP isterseniz 183025 kodunu veya en son geleni kullanmanız yeterli olacaktır).');
    
  } catch (err) {
    console.error('❌ Hata:', err.message);
  } finally {
    await client.end();
  }
}

forceCreateAdmin();
