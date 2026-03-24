const https    = require('https');
const nodemailer = require('nodemailer');
const logger   = require('./logger');

// ── SMS — Netgsm ──────────────────────────────────
/**
 * Netgsm HTTP API ile SMS gönderir.
 * .env içinde NETGSM_USERCODE, NETGSM_PASSWORD, NETGSM_MSGHEADER tanımlı olmalı.
 */
const sendSms = (phone, message) => {
  return new Promise((resolve, reject) => {
    if (process.env.NODE_ENV !== 'production') {
      // Geliştirme ortamında gerçek SMS göndermez, loglara yazar
      logger.info(`[SMS-DEV] ${phone} → ${message}`);
      return resolve({ success: true, dev: true });
    }

    const params = new URLSearchParams({
      usercode:  process.env.NETGSM_USERCODE,
      password:  process.env.NETGSM_PASSWORD,
      gsmno:     phone.replace(/\s/g, ''),
      message:   message,
      msgheader: process.env.NETGSM_MSGHEADER,
    });

    const url = `https://api.netgsm.com.tr/sms/send/get/?${params.toString()}`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const lines = data.trim().split('\n');
        const code = lines[0];
        if (code === '00' || code === '01' || code === '02') {
          logger.info(`SMS başarıyla gönderildi: ${phone} | Netgsm ID: ${lines[1] || 'N/A'}`);
          resolve({ success: true, code });
        } else {
          logger.error(`SMS hatası: ${phone} → kod: ${code}`);
          reject(new Error(`Netgsm hata kodu: ${code}`));
        }
      });
    }).on('error', (err) => {
      logger.error(`SMS bağlantı hatası: ${err.message}`);
      reject(err);
    });
  });
};

const sendOtpSms = async (phone, code) => {
  const message = `HurdaMarket Doğrulama Kodunuz: ${code}\nGiriş yapmak için bu kodu kullanın.`;
  return sendSms(phone, message);
};

// ── E-posta — Nodemailer (Premium Modern) ──────────
const createTransporter = () => nodemailer.createTransport({
  host: process.env.SMTP_HOST     || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const emailTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Helvetica', Arial, sans-serif; background: #FBFBFC; margin: 0; padding: 40px 10px; }
    .card { max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
    .header { background: #0A0E12; padding: 40px; text-align: center; }
    .logo { color: #BCF24A; font-size: 24px; font-weight: 900; letter-spacing: -1px; }
    .body { padding: 40px; }
    h2 { color: #0A0E12; font-size: 24px; font-weight: 900; margin: 0 0 20px; letter-spacing: -0.5px; }
    p { color: #6B7280; font-size: 16px; line-height: 1.8; margin-bottom: 24px; }
    .btn { display: inline-block; background: #0A0E12; color: #BCF24A !important; padding: 18px 36px;
           border-radius: 16px; text-decoration: none; font-weight: 900; font-size: 14px; letter-spacing: 1px; }
    .footer { padding: 30px; text-align: center; color: #9CA3AF; font-size: 12px; font-weight: 600; }
    .sep { border-top: 1px solid #F3F4F6; margin: 0 40px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">♻️ HURDAMARKET</div>
    </div>
    <div class="body">
      <h2>${title}</h2>
      ${content}
    </div>
    <div class="sep"></div>
    <div class="footer">
      Sürdürülebilir bir gelecek için birlikte çalışıyoruz.<br>
      HurdaMarket Teknoloji A.Ş. · Türkiye
    </div>
  </div>
</body>
</html>`;

const sendEmail = async ({ to, subject, title, html }) => {
  if (!process.env.SMTP_USER || process.env.NODE_ENV !== 'production') {
    logger.info(`[EMAIL-DEV] ${to} → ${subject}`);
    if (process.env.NODE_ENV !== 'production') return;
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"HurdaMarket" <${process.env.SMTP_USER}>`,
      to, subject,
      html: emailTemplate(title, html),
    });
    logger.info(`E-posta başarıyla gönderildi: ${to}`);
  } catch (err) {
    logger.error(`E-posta gönderim hatası: ${err.message}`);
  }
};

// Hazır e-posta şablonları (Premium Dil)
const emailTemplates = {
  newOffer: (sellerName, listingTitle, price) => ({
    subject: `Önemli: ${listingTitle} İlanına Yeni Teklif`,
    title:   'Harika bir haber!',
    html:    `<p>Merhaba ${sellerName},</p>
              <p><strong>${listingTitle}</strong> başlıklı ilanınız için <strong>${Number(price).toLocaleString('tr-TR')} ₺</strong> değerinde yeni bir teklif aldınız.</p>
              <p>Teklifi değerlendirmek ve satış sürecini başlatmak için aşağıdaki butona tıklayabilirsiniz.</p>
              <a class="btn" href="${process.env.FRONTEND_URL}/hesabim">TEKLİFİ GÖRÜNTÜLE</a>`,
  }),

  offerAccepted: (buyerName, listingTitle, pickupDate) => ({
    subject: `Tebrikler: Teklifiniz Kabul Edildi!`,
    title:   'Teklifiniz onaylandı!',
    html:    `<p>Merhaba ${buyerName},</p>
              <p><strong>${listingTitle}</strong> için ilettiğiniz teklif satıcı tarafından kabul edildi.</p>
              ${pickupDate ? `<p>Belirlenen toplama tarihi: <strong>${pickupDate}</strong></p>` : ''}
              <p>Ödeme ve lojistik detayları için satıcı ile iletişime geçebilirsiniz.</p>
              <a class="btn" href="${process.env.FRONTEND_URL}/hesabim">DETAYLARI İNCELE</a>`,
  }),

  offerRejected: (buyerName, listingTitle) => ({
    subject: `Teklif Güncellemesi: ${listingTitle}`,
    title:   'Teklifiniz reddedildi.',
    html:    `<p>Merhaba ${buyerName},</p>
              <p><strong>${listingTitle}</strong> ilanına verdiğiniz teklif ne yazık ki uygun bulunmadı.</p>
              <p>Üzülmeyin, HurdaMarket üzerindeki binlerce güncel ilanı inceleyerek yeni fırsatlar yakalayabilirsiniz.</p>
              <a class="btn" href="${process.env.FRONTEND_URL}">İLANLARI KEŞFET</a>`,
  }),

  newMessage: (recipientName, senderName) => ({
    subject: `Yeni Mesaj: ${senderName}`,
    title:   'Yeni bir mesajınız var!',
    html:    `<p>Merhaba ${recipientName},</p>
              <div style="background: #F3F4F6; padding: 20px; border-radius: 12px; margin-bottom: 24px;">
                <p style="margin: 0; color: #0A0E12; font-weight: 700;">${senderName} size bir mesaj gönderdi.</p>
              </div>
              <a class="btn" href="${process.env.FRONTEND_URL}/hesabim">MESAJI OKU</a>`,
  }),
};


module.exports = { sendSms, sendOtpSms, sendEmail, emailTemplates };
