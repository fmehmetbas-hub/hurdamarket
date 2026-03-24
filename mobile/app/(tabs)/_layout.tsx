import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../src/services/api';
import useAuthStore from '../../src/store/authStore';

const COLORS = { g: '#1a6b3c', gray: '#8a9e90', bg: '#fff', border: '#dde8df' };

function TabIcon({ emoji, label, focused, badge }) {
  return (
    <View style={styles.tabIcon}>
      <View style={{ position: 'relative' }}>
        <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
        {badge > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeTxt}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

export default function TabsLayout() {
  const { user } = useAuthStore();

  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationsApi.getAll().then(r => r.data),
    enabled:  !!user,
    refetchInterval: 30000,
  });

  const unread = notifData?.unread_count || 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle:  styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Ana Sayfa" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="harita"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" label="Harita" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="ilan-ver"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={styles.addBtn}>
              <Text style={{ fontSize: 24, color: '#fff' }}>+</Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="bildirimler"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔔" label="Bildirim" focused={focused} badge={unread} />
          ),
        }}
      />
      <Tabs.Screen
        name="hesabim"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Hesabım" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.bg,
    borderTopColor:  COLORS.border,
    borderTopWidth:  1,
    height:          64,
    paddingBottom:   8,
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    color: COLORS.gray,
    marginTop: 2,
  },
  tabLabelActive: {
    color: COLORS.g,
    fontWeight: '600',
  },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.g,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: COLORS.g,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  badge: {
    position: 'absolute',
    top: -4, right: -6,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    minWidth: 16, height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeTxt: {
    color: '#fff', fontSize: 9, fontWeight: '700',
  },
});
