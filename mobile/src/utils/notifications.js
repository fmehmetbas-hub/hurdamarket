import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { notificationsApi } from '../services/api';

// Bildirim görünümü (uygulama açıkken)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

/**
 * Push token al ve backend'e kaydet.
 * Uygulama ilk açıldığında ve giriş yapıldığında çağrılır.
 */
export const registerForPushNotifications = async () => {
  if (!Device.isDevice) {
    console.log('Push bildirimler sadece fiziksel cihazda çalışır.');
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push bildirim izni reddedildi.');
    return null;
  }

  // Android için kanal oluştur
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'HurdaMarket',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#1a6b3c',
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  // Backend'e kaydet
  try {
    await notificationsApi.registerPushToken(token, Platform.OS);
  } catch (err) {
    console.error('Push token kaydedilemedi:', err.message);
  }

  return token;
};

/**
 * Bildirime tıklandığında ilgili sayfaya yönlendir.
 * router ile kullan.
 */
export const getNotificationRedirectPath = (notification) => {
  const data = notification?.request?.content?.data;
  if (!data) return null;

  switch (data.type) {
    case 'new_offer':
    case 'offer_accepted':
    case 'offer_rejected':
      return data.listing_id ? `/ilan/${data.listing_id}` : '/hesabim';
    case 'new_message':
      return data.offer_id ? `/mesajlar/${data.offer_id}` : '/hesabim';
    default:
      return '/bildirimler';
  }
};
