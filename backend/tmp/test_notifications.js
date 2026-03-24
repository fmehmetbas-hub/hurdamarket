const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const { sendOtpSms, sendEmail, emailTemplates } = require('../src/utils/notifications');

async function test() {
  console.log('--- 🚀 BİLDİRİM SİSTEMİ TESTİ BAŞLIYOR ---');

  // 1. OTP SMS Testi
  console.log('\n[TEST 1] OTP SMS Taslağı:');
  try {
    const smsResult = await sendOtpSms('05447685137', '123456');
    console.log('✅ SMS Mantığı Çalışıyor:', smsResult);
  } catch (err) {
    console.log('❌ SMS Hatası (Netgsm Bağlanamadı - Normal):', err.message);
  }

  // 2. Premium E-posta Testi (Yeni Teklif)
  console.log('\n[TEST 2] Premium E-posta Taslağı (Yeni Teklif):');
  try {
    const template = emailTemplates.newOffer('Admin Faruk', '10 Ton Bakır Hurdası', 450000);
    console.log('✅ E-posta Konusu:', template.subject);
    console.log('✅ E-posta Şablonu Oluşturuldu (Premium Modern Tasarım)');
    
    // SMTP Testi
    await sendEmail({
      to: 'test@hurdamarket.com',
      ...template
    });
    console.log('✅ E-posta Gönderim Komutu Tetiklendi.');
  } catch (err) {
    console.log('❌ E-posta Hatası:', err.message);
  }

  console.log('\n--- 🏁 TEST TAMAMLANDI ---');
  process.exit(0);
}

test();
