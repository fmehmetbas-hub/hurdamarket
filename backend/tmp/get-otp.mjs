import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:postgres@localhost:5432/hurdamarket'
});

async function getLastOTP() {
  try {
    await client.connect();
    const res = await client.query("SELECT phone, code FROM otp_codes ORDER BY created_at DESC LIMIT 1");
    if (res.rowCount > 0) {
      console.log('--- Güncel Doğrulama Kodu ---');
      console.log('Telefon:', res.rows[0].phone);
      console.log('KOD:', res.rows[0].code);
    } else {
      console.log('❌ Henüz herhangi bir doğrulama kodu üretilmedi.');
    }
  } catch (err) {
    console.error('❌ Hata:', err.message);
  } finally {
    await client.end();
  }
}

getLastOTP();
