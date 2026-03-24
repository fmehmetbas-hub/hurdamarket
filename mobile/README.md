# HurdaMarket Mobil Uygulama

React Native + Expo ile geliştirilmiş iOS/Android uygulaması.

## Kurulum

```bash
# Node.js 18+ gerekli
cd mobile

# Expo CLI
npm install -g expo-cli eas-cli

# Bağımlılıklar
npm install

# app.json içinde API URL'ini güncelle
# "apiUrl": "https://api.hurdamarket.com/api"
```

## Geliştirme

```bash
# Expo Go ile hızlı test (fiziksel cihaz)
npx expo start

# Android emülatör
npx expo start --android

# iOS simülatör (macOS gerekli)
npx expo start --ios
```

## Proje Yapısı

```
mobile/
├── app/
│   ├── _layout.tsx          # Root layout, auth guard, push setup
│   ├── (tabs)/
│   │   ├── _layout.tsx      # Tab bar
│   │   ├── index.tsx        # Ana sayfa - ilan listesi
│   │   ├── harita.tsx       # Harita görünümü
│   │   ├── ilan-ver.tsx     # İlan oluşturma (kamera dahil)
│   │   ├── bildirimler.tsx  # Bildirimler
│   │   └── hesabim.tsx      # Profil
│   ├── (auth)/
│   │   ├── giris.tsx        # Giriş
│   │   └── kayit.tsx        # Kayıt (OTP)
│   ├── ilan/[id].tsx        # İlan detay
│   └── mesajlar/[offerId].tsx # Chat
├── src/
│   ├── services/api.js      # Axios instance
│   ├── store/authStore.js   # Zustand + SecureStore
│   └── utils/notifications.js # Push notification
├── app.json                 # Expo config
└── eas.json                 # Build config
```

## Build & Yayın

```bash
# EAS hesabı oluştur
eas login

# Proje kaydet
eas init

# Test APK (Android)
eas build --platform android --profile preview

# Production build
eas build --platform all --profile production

# App Store / Google Play'e gönder
eas submit --platform all --profile production
```

## Push Bildirimleri

Expo Push Token otomatik olarak backend'e kaydedilir.
Backend `sendPushToUser(userId, title, body, data)` fonksiyonu ile
bildirim gönderir.

## Gereksinimler

- iOS 14+
- Android 6.0+ (API 23+)
- Node.js 18+
- Expo SDK 51
