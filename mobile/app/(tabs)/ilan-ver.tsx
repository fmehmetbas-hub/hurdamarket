import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Image, Alert, ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { listingsApi } from '../../src/services/api';
import useAuthStore from '../../src/store/authStore';

const C = { g: '#1a6b3c', glt: '#e8f5ed', bg: '#f7f9f7', wh: '#fff', br: '#dde8df', tx: '#111', tx2: '#4a5c50', tx3: '#8a9e90', red: '#dc2626' };

const CATS = [
  { value: 'demir',    label: 'Demir',    emoji: '🔩' },
  { value: 'bakir',    label: 'Bakır',    emoji: '🔋' },
  { value: 'aluminyum',label: 'Alüminyum',emoji: '🥤' },
  { value: 'plastik',  label: 'Plastik',  emoji: '♻' },
  { value: 'elektronik',label:'Elektronik',emoji:'💻' },
  { value: 'kagit',    label: 'Kağıt',    emoji: '📦' },
  { value: 'cam',      label: 'Cam',      emoji: '🪟' },
  { value: 'tekstil',  label: 'Tekstil',  emoji: '👕' },
  { value: 'diger',    label: 'Diğer',    emoji: '🗂' },
];

const CITIES = ['İstanbul','Ankara','İzmir','Bursa','Antalya','Adana','Konya','Gaziantep','Mersin','Samsun'];

export default function CreateListingScreen() {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [photos, setPhotos]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [selCat, setSelCat]   = useState('demir');

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { title: '', weight_kg: '', city: '', description: '' },
  });

  // Kamera veya galeri seçimi
  const pickImage = () => {
    Alert.alert('Fotoğraf Ekle', 'Kaynak seçin', [
      {
        text: 'Kamera',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') { Alert.alert('Kamera izni gerekli'); return; }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8, aspect: [1, 1], allowsEditing: true,
          });
          if (!result.canceled) addPhoto(result.assets[0]);
        },
      },
      {
        text: 'Galeri',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.8, allowsMultipleSelection: true, selectionLimit: 8 - photos.length,
          });
          if (!result.canceled) result.assets.forEach(addPhoto);
        },
      },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  const addPhoto = (asset) => {
    if (photos.length >= 8) return;
    setPhotos(prev => [...prev, asset]);
  };

  const removePhoto = (i) => setPhotos(prev => prev.filter((_, idx) => idx !== i));

  const onSubmit = async (data) => {
    if (!photos.length) { Toast.show({ type: 'error', text1: 'En az 1 fotoğraf ekleyin.' }); return; }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title',       data.title);
      fd.append('category',    selCat);
      fd.append('city',        data.city);
      fd.append('weight_kg',   data.weight_kg);
      fd.append('description', data.description || '');

      photos.forEach((photo, i) => {
        const uri  = photo.uri;
        const name = `photo_${i}.jpg`;
        const type = photo.mimeType || 'image/jpeg';
        fd.append('photos', { uri, name, type } as any);
      });

      await listingsApi.create(fd);
      Toast.show({ type: 'success', text1: 'İlanınız yayınlandı!' });
      router.back();
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.error || 'Hata oluştu.' });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <View style={s.center}>
        <Text style={{ fontSize: 40, marginBottom: 16 }}>🔒</Text>
        <Text style={{ fontSize: 16, color: C.tx2, marginBottom: 20 }}>İlan vermek için giriş yapın.</Text>
        <TouchableOpacity style={s.btn} onPress={() => router.push('/(auth)/giris')}>
          <Text style={s.btnTxt}>Giriş Yap</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      style={[s.container, { paddingTop: insets.top }]}
      contentContainerStyle={{ paddingBottom: 100 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.header}>
        <Text style={s.headerTit}>Yeni İlan Ver</Text>
      </View>

      {/* Kategori */}
      <View style={s.section}>
        <Text style={s.sectionLbl}>Kategori</Text>
        <View style={s.catGrid}>
          {CATS.map(c => (
            <TouchableOpacity
              key={c.value}
              style={[s.catCard, selCat === c.value && s.catCardOn]}
              onPress={() => setSelCat(c.value)}
            >
              <Text style={{ fontSize: 20 }}>{c.emoji}</Text>
              <Text style={[s.catCardTxt, selCat === c.value && { color: C.g }]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Başlık */}
      <View style={s.section}>
        <Text style={s.sectionLbl}>Başlık</Text>
        <Controller
          control={control}
          name="title"
          rules={{ required: 'Başlık gerekli', minLength: { value: 5, message: 'En az 5 karakter' } }}
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[s.input, errors.title && s.inputErr]}
              placeholder="örn: 200 kg hurda bakır kablo"
              placeholderTextColor={C.tx3}
              value={value} onChangeText={onChange}
            />
          )}
        />
        {errors.title && <Text style={s.errTxt}>{errors.title.message}</Text>}
      </View>

      {/* Ağırlık + Şehir */}
      <View style={[s.section, { flexDirection: 'row', gap: 12 }]}>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionLbl}>Ağırlık (kg)</Text>
          <Controller
            control={control}
            name="weight_kg"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={s.input}
                placeholder="örn: 50"
                placeholderTextColor={C.tx3}
                keyboardType="numeric"
                value={value} onChangeText={onChange}
              />
            )}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionLbl}>Şehir</Text>
          <Controller
            control={control}
            name="city"
            rules={{ required: 'Şehir gerekli' }}
            render={({ field: { onChange, value } }) => (
              <TouchableOpacity
                style={[s.input, { justifyContent: 'center' }, errors.city && s.inputErr]}
                onPress={() => Alert.alert('Şehir Seç', '', CITIES.map(c => ({ text: c, onPress: () => onChange(c) })).concat([{ text: 'İptal', style: 'cancel' }]))}
              >
                <Text style={{ color: value ? C.tx : C.tx3, fontSize: 14 }}>{value || 'Seçin...'}</Text>
              </TouchableOpacity>
            )}
          />
          {errors.city && <Text style={s.errTxt}>{errors.city.message}</Text>}
        </View>
      </View>

      {/* Açıklama */}
      <View style={s.section}>
        <Text style={s.sectionLbl}>Açıklama</Text>
        <Controller
          control={control}
          name="description"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={[s.input, { height: 90, textAlignVertical: 'top', paddingTop: 10 }]}
              placeholder="Hurda hakkında detay verin..."
              placeholderTextColor={C.tx3}
              multiline value={value} onChangeText={onChange}
            />
          )}
        />
      </View>

      {/* Fotoğraflar */}
      <View style={s.section}>
        <Text style={s.sectionLbl}>Fotoğraflar ({photos.length}/8)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
          {photos.map((p, i) => (
            <View key={i} style={s.photoThumb}>
              <Image source={{ uri: p.uri }} style={s.photoImg} />
              {i === 0 && <View style={s.coverBadge}><Text style={s.coverTxt}>Kapak</Text></View>}
              <TouchableOpacity style={s.removeBtn} onPress={() => removePhoto(i)}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
          {photos.length < 8 && (
            <TouchableOpacity style={s.addPhotoBtn} onPress={pickImage}>
              <Text style={{ fontSize: 28, color: C.tx3 }}>📷</Text>
              <Text style={{ fontSize: 11, color: C.tx3, marginTop: 4 }}>Ekle</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Gönder */}
      <View style={{ paddingHorizontal: 16 }}>
        <TouchableOpacity
          style={[s.btn, loading && { opacity: 0.6 }]}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnTxt}>İlanı Yayınla</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header:      { paddingHorizontal: 16, paddingVertical: 16 },
  headerTit:   { fontSize: 22, fontWeight: '800', color: C.tx },
  section:     { paddingHorizontal: 16, marginBottom: 18 },
  sectionLbl:  { fontSize: 13, fontWeight: '600', color: C.tx2, marginBottom: 8 },
  catGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catCard:     { width: '30%', borderRadius: 11, borderWidth: 2, borderColor: C.br, padding: 10, alignItems: 'center', backgroundColor: C.wh },
  catCardOn:   { borderColor: C.g, backgroundColor: C.glt },
  catCardTxt:  { fontSize: 11, fontWeight: '600', color: C.tx2, marginTop: 4 },
  input:       { backgroundColor: C.wh, borderWidth: 1.5, borderColor: C.br, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: C.tx },
  inputErr:    { borderColor: C.red },
  errTxt:      { fontSize: 12, color: C.red, marginTop: 4 },
  photoThumb:  { width: 80, height: 80, borderRadius: 10, marginRight: 8, position: 'relative', overflow: 'hidden' },
  photoImg:    { width: '100%', height: '100%' },
  coverBadge:  { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(26,107,60,.85)', paddingVertical: 2, alignItems: 'center' },
  coverTxt:    { fontSize: 9, fontWeight: '700', color: '#fff' },
  removeBtn:   { position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: 9, backgroundColor: C.red, alignItems: 'center', justifyContent: 'center' },
  addPhotoBtn: { width: 80, height: 80, borderRadius: 10, borderWidth: 2, borderColor: C.br, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: C.wh },
  btn:         { backgroundColor: C.g, borderRadius: 13, paddingVertical: 15, alignItems: 'center' },
  btnTxt:      { color: '#fff', fontSize: 16, fontWeight: '700' },
});
