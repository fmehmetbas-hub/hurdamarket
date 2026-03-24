import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, ScrollView, Image, Dimensions
} from 'react-native';
import { useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listingsApi } from '../../src/services/api';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

const C = { 
  onyx: '#0A0E12',    // Deep Onyx
  lime: '#BCF24A',    // Electric Lime
  marble: '#FBFBFC',  // Premium Background
  carbon: '#1F2937', 
  gray: '#9CA3AF', 
  border: '#F3F4F6',
  white: '#FFFFFF',
  text: '#111827'
};

const CATS = [
  { value: '',         label: 'Tümü',      emoji: '🌍' },
  { value: 'demir',    label: 'Demir',     emoji: '🔩' },
  { value: 'bakir',    label: 'Bakır',     emoji: '🔋' },
  { value: 'aluminyum',label: 'Alüm.',     emoji: '🥤' },
  { value: 'plastik',  label: 'Plastik',   emoji: '♻️' },
  { value: 'elektronik',label:'Elekt.',    emoji: '💻' },
  { value: 'kagit',    label: 'Kağıt',     emoji: '📦' },
];

export default function HomeScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const [q,      setQ]      = useState('');
  const [search, setSearch] = useState('');
  const [cat,    setCat]    = useState('');
  const [sort,   setSort]   = useState('newest');
  const [page,   setPage]   = useState(1);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['listings', search, cat, sort, page],
    queryFn:  () => listingsApi.getAll({ q: search, category: cat, sort, page, limit: 20 }).then(r => r.data),
  });

  const listings = data?.listings || [];

  const renderItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={s.card}
      onPress={() => router.push(`/ilan/${item.id}`)}
      activeOpacity={0.9}
    >
      <View style={s.cardImgContainer}>
        {item.cover_photo
          ? <Image source={{ uri: item.cover_photo }} style={s.cardImg} />
          : <View style={s.cardImgPlaceholder}><Text style={{ fontSize: 40 }}>♻️</Text></View>}
        <View style={s.priceBadge}>
          <Text style={s.priceText}>TEKLİFE AÇIK</Text>
        </View>
      </View>
      <View style={s.cardContent}>
        <Text style={s.cardCategory}>{item.category?.toUpperCase()}</Text>
        <Text style={s.cardTitle} numberOfLines={2}>{item.title}</Text>
        <View style={s.cardFooter}>
          <Text style={s.cardLocation}>📍 {item.city}</Text>
          {Number(item.offer_count) > 0 && (
            <View style={s.hotBadge}>
              <Text style={s.hotText}>{item.offer_count} teklif</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  ), []);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header Area */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.logoMini}>
             <Text style={{ fontSize: 18 }}>♻️</Text>
          </View>
          <Text style={s.logoTitle}>HurdaMarket</Text>
        </View>
        <TouchableOpacity style={s.notifBtn} onPress={() => router.push('/bildirimler')}>
          <Text style={{ fontSize: 20 }}>🔔</Text>
          <View style={s.notifDot} />
        </TouchableOpacity>
      </View>

      {/* Modern Search */}
      <View style={s.searchSection}>
        <View style={s.searchBar}>
          <Text style={{ fontSize: 18, color: C.gray }}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Ne arıyorsunuz?"
            placeholderTextColor={C.gray}
            value={q}
            onChangeText={setQ}
            onSubmitEditing={() => { setSearch(q); setPage(1); }}
            returnKeyType="search"
          />
        </View>
      </View>

      {/* Premium Categories */}
      <View style={{ height: 60, marginBottom: 12 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, alignItems: 'center', gap: 10 }}
        >
          {CATS.map(c => (
            <TouchableOpacity
              key={c.value}
              style={[s.catPill, cat === c.value && s.catPillActive]}
              onPress={() => { setCat(c.value); setPage(1); }}
            >
              <Text style={{ fontSize: 13 }}>{c.emoji}</Text>
              <Text style={[s.catPillTxt, cat === c.value && s.catPillTxtActive]}>
                {c.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Feed */}
      <FlatList
        data={listings}
        renderItem={renderItem}
        keyExtractor={i => i.id}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 20, gap: 14 }}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={C.onyx} />}
        onEndReached={() => { if (data?.pages && page < data.pages) setPage(p => p + 1); }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={() => (
          <View style={s.listHeader}>
            <Text style={s.listTitle}>Keşfet</Text>
            <View style={s.listSep} />
            <Text style={s.listStats}>{data?.total ?? 0} ilan listelendi</Text>
          </View>
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <View style={s.emptyState}>
              <Text style={{ fontSize: 60, marginBottom: 15 }}>🔎</Text>
              <Text style={s.emptyTitle}>Henüz İlan Yok</Text>
              <Text style={s.emptySub}>Aradığınız kriterlerde ilan bulamadık.</Text>
            </View>
          )
        }
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.marble },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  headerLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMini:       { width: 40, height: 40, backgroundColor: C.onyx, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoTitle:      { fontSize: 18, fontWeight: '900', color: C.onyx, letterSpacing: -0.5 },
  notifBtn:       { width: 44, height: 44, backgroundColor: C.white, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  notifDot:       { position: 'absolute', top: 12, right: 12, width: 8, height: 8, backgroundColor: C.lime, borderRadius: 4, borderWidth: 2, borderColor: C.white },
  
  searchSection:  { paddingHorizontal: 20, marginBottom: 15 },
  searchBar:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: C.border, shadowColor: C.onyx, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  searchInput:    { flex: 1, marginLeft: 10, fontSize: 15, fontWeight: '700', color: C.onyx },
  
  catPill:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.border },
  catPillActive:  { backgroundColor: C.onyx, borderColor: C.onyx },
  catPillTxt:     { fontSize: 12, fontWeight: '800', color: C.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  catPillTxtActive: { color: C.white },
  
  listHeader:     { paddingHorizontal: 20, marginBottom: 15, flexDirection: 'row', alignItems: 'center', gap: 10 },
  listTitle:      { fontSize: 24, fontWeight: '900', color: C.onyx, letterSpacing: -1 },
  listSep:        { flex: 1, height: 1, backgroundColor: C.border },
  listStats:      { fontSize: 11, fontWeight: '800', color: C.gray, textTransform: 'uppercase' },

  card:           { width: COLUMN_WIDTH, backgroundColor: C.white, borderRadius: 24, overflow: 'hidden', marginBottom: 10, borderWeight: 1, borderColor: C.border, shadowColor: C.onyx, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 15, elevation: 5 },
  cardImgContainer:{ width: '100%', aspectRatio: 1, backgroundColor: '#F3F4F6' },
  cardImg:        { width: '100%', height: '100%' },
  cardImgPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  priceBadge:     { position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(10, 14, 18, 0.8)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  priceText:      { color: C.lime, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  
  cardContent:    { padding: 14, gap: 4 },
  cardCategory:   { fontSize: 9, fontWeight: '900', color: C.gray, letterSpacing: 1 },
  cardTitle:      { fontSize: 13, fontWeight: '800', color: C.onyx, lineHeight: 18, minHeight: 36 },
  cardFooter:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  cardLocation:   { fontSize: 11, color: C.gray, fontWeight: '600' },
  hotBadge:       { backgroundColor: C.marble, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  hotText:        { fontSize: 10, fontWeight: '900', color: C.onyx, textTransform: 'uppercase' },
  
  emptyState:     { alignItems: 'center', justifyContent: 'center', paddingTop: 100, paddingHorizontal: 40 },
  emptyTitle:     { fontSize: 20, fontWeight: '900', color: C.onyx, marginBottom: 8 },
  emptySub:       { fontSize: 14, color: C.gray, textAlign: 'center', lineHeight: 20 },
});

