import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
  ScrollView, Image, ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Callout, PROVIDER_GOOGLE } from 'react-native-maps';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { listingsApi } from '../../src/services/api';

const { width, height } = Dimensions.get('window');
const C = { g: '#1a6b3c', glt: '#e8f5ed', bg: '#f7f9f7', wh: '#fff', br: '#dde8df', tx: '#111', tx3: '#8a9e90' };

const CAT_COLORS = {
  demir:'#6b7280', bakir:'#d97706', aluminyum:'#3b82f6',
  plastik:'#10b981', elektronik:'#8b5cf6', kagit:'#f59e0b',
  cam:'#06b6d4', tekstil:'#ec4899', diger:'#6b7280',
};

const CATS = [
  { value:'', label:'Tümü' }, { value:'demir', label:'Demir' },
  { value:'bakir', label:'Bakır' }, { value:'plastik', label:'Plastik' },
  { value:'elektronik', label:'Elekt.' }, { value:'aluminyum', label:'Alüm.' },
];

const TURKEY = { latitude: 39.1, longitude: 35.6, latitudeDelta: 10, longitudeDelta: 10 };

export default function MapScreen() {
  const router     = useRouter();
  const insets     = useSafeAreaInsets();
  const mapRef     = useRef(null);
  const [cat, setCat]         = useState('');
  const [radius, setRadius]   = useState(100);
  const [userLoc, setUserLoc] = useState(null);
  const [selected, setSelected] = useState(null);
  const [locLoading, setLocLoading] = useState(false);

  const { data: mapListings = [], isLoading } = useQuery({
    queryKey: ['map-listings', cat, userLoc, radius],
    queryFn:  () => listingsApi.getForMap({
      category: cat || undefined,
      ...(userLoc ? { lat: userLoc.latitude, lng: userLoc.longitude, radius } : {}),
    }).then(r => r.data),
  });

  const locateMe = async () => {
    setLocLoading(true);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { setLocLoading(false); return; }

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setUserLoc(loc.coords);
    mapRef.current?.animateToRegion({
      latitude:      loc.coords.latitude,
      longitude:     loc.coords.longitude,
      latitudeDelta: 0.5,
      longitudeDelta:0.5,
    }, 800);
    setLocLoading(false);
  };

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Harita */}
      <MapView
        ref={mapRef}
        style={s.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={TURKEY}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {mapListings.map(l => (
          <Marker
            key={l.id}
            coordinate={{ latitude: Number(l.lat), longitude: Number(l.lng) }}
            onPress={() => setSelected(l)}
          >
            <View style={[s.pin, { backgroundColor: CAT_COLORS[l.category] || C.g }]}>
              <Text style={s.pinTxt}>{l.category?.slice(0, 2).toUpperCase()}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Kategori filtresi - üstte */}
      <View style={[s.topBar, { top: insets.top + 10 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 12 }}>
          {CATS.map(c => (
            <TouchableOpacity
              key={c.value}
              style={[s.catPill, cat === c.value && s.catPillOn]}
              onPress={() => setCat(c.value)}
            >
              <Text style={[s.catTxt, cat === c.value && { color: '#fff' }]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Konum butonu */}
      <TouchableOpacity
        style={[s.locBtn, { bottom: insets.bottom + (selected ? 240 : 100) }]}
        onPress={locateMe}
        disabled={locLoading}
      >
        {locLoading
          ? <ActivityIndicator color={C.g} size="small" />
          : <Text style={{ fontSize: 20 }}>📍</Text>}
      </TouchableOpacity>

      {/* İlan sayısı */}
      <View style={[s.cntBadge, { top: insets.top + 62 }]}>
        <Text style={s.cntTxt}>{mapListings.length} ilan</Text>
      </View>

      {/* Seçili ilan kartı - altta */}
      {selected && (
        <View style={[s.bottomCard, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.bottomCardInner}>
            <View style={s.bcThumb}>
              {selected.cover_photo
                ? <Image source={{ uri: selected.cover_photo }} style={{ width: '100%', height: '100%' }} />
                : <Text style={{ fontSize: 28 }}>♻</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <View style={[s.catBadge, { backgroundColor: `${CAT_COLORS[selected.category]}22` }]}>
                <Text style={[s.catBadgeTxt, { color: CAT_COLORS[selected.category] }]}>
                  {selected.category}
                </Text>
              </View>
              <Text style={s.bcTitle} numberOfLines={2}>{selected.title}</Text>
              <Text style={s.bcMeta}>📍 {selected.city} · ⚖ {selected.weight_kg} kg</Text>
            </View>
            <TouchableOpacity onPress={() => setSelected(null)} style={s.closeBtn}>
              <Text style={{ color: C.tx3, fontSize: 20 }}>×</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={s.viewBtn}
            onPress={() => { setSelected(null); router.push(`/ilan/${selected.id}`); }}
          >
            <Text style={s.viewBtnTxt}>İlanı Görüntüle</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  map:       { width, height },
  topBar:    { position: 'absolute', left: 0, right: 0 },
  catPill:   { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#ffffffee', borderWidth: 1.5, borderColor: C.br },
  catPillOn: { backgroundColor: C.g, borderColor: C.g },
  catTxt:    { fontSize: 13, fontWeight: '500', color: '#333' },
  locBtn:    { position: 'absolute', right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: C.wh, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  cntBadge:  { position: 'absolute', right: 16, backgroundColor: C.wh, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cntTxt:    { fontSize: 12, color: C.tx3 },
  pin:       { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  pinTxt:    { color: '#fff', fontSize: 10, fontWeight: '700' },
  bottomCard:{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: C.wh, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  bottomCardInner: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  bcThumb:   { width: 72, height: 72, borderRadius: 12, backgroundColor: C.glt, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  catBadge:  { alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, marginBottom: 4 },
  catBadgeTxt: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  bcTitle:   { fontSize: 14, fontWeight: '700', color: C.tx, lineHeight: 18, marginBottom: 4 },
  bcMeta:    { fontSize: 12, color: C.tx3 },
  closeBtn:  { padding: 4 },
  viewBtn:   { backgroundColor: C.g, borderRadius: 12, padding: 13, alignItems: 'center' },
  viewBtnTxt:{ color: '#fff', fontWeight: '700', fontSize: 15 },
});
