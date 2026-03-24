import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as Notifications from 'expo-notifications';
import useAuthStore from '../src/store/authStore';
import { registerForPushNotifications, getNotificationRedirectPath } from '../src/utils/notifications';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, retry: 1 } },
});

// Auth guard — token yoksa giriş sayfasına yönlendir
function AuthGuard({ children }) {
  const { user, token, hydrated } = useAuthStore();
  const segments = useSegments();
  const router   = useRouter();

  useEffect(() => {
    if (!hydrated) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!token && !inAuthGroup) {
      router.replace('/(auth)/giris');
    } else if (token && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [token, hydrated, segments]);

  return children;
}

export default function RootLayout() {
  const { hydrate, user } = useAuthStore();
  const router = useRouter();

  // Token'ı SecureStore'dan yükle
  useEffect(() => {
    hydrate();
  }, []);

  // Push bildirim setup
  useEffect(() => {
    if (!user) return;
    registerForPushNotifications();

    // Bildirime tıklandığında yönlendir
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const path = getNotificationRedirectPath(response.notification);
      if (path) router.push(path);
    });

    // Auth expire handler
    globalThis.__authExpired = () => router.replace('/(auth)/giris');

    return () => sub.remove();
  }, [user]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthGuard>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)"   options={{ headerShown: false }} />
              <Stack.Screen name="(auth)"   options={{ headerShown: false }} />
              <Stack.Screen name="ilan/[id]" options={{ presentation: 'card' }} />
              <Stack.Screen name="mesajlar/[offerId]" options={{ presentation: 'card' }} />
            </Stack>
          </AuthGuard>
          <Toast />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
