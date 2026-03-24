import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import useAuthStore from '../../src/store/authStore';
import { authApi } from '../../src/services/api';

const C = { 
  onyx: '#0A0E12',    // Deep Onyx
  lime: '#BCF24A',    // Electric Lime
  marble: '#FBFBFC',  // Premium Background
  carbon: '#1F2937', 
  gray: '#9CA3AF', 
  border: '#E5E7EB',
  white: '#FFFFFF',
  red: '#EF4444'
};

// ── Giriş ─────────────────────────────────────────
export function LoginScreen() {
  const router = useRouter();
  const { login, loading } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [pass,  setPass]  = useState('');

  const handleLogin = async () => {
    if (!phone || !pass) { Toast.show({ type: 'error', text1: 'Lütfen tüm alanları doldurun.' }); return; }
    try {
      await login(phone, pass);
      router.replace('/(tabs)');
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.error || 'Giriş yapılamadı.' });
    }
  };

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.center} keyboardShouldPersistTaps="handled">
        <View style={s.logoContainer}>
           <Text style={s.logoText}>♻️</Text>
        </View>
        <Text style={s.title}>Hoş Geldiniz</Text>
        <Text style={s.sub}>Gezegen için bir adım daha atın</Text>

        <View style={s.form}>
          <View style={s.fg}>
            <Text style={s.lbl}>TELEFON NUMARASI</Text>
            <TextInput
              style={s.input} placeholder="05XX XXX XX XX"
              placeholderTextColor={C.gray} keyboardType="phone-pad"
              value={phone} onChangeText={setPhone}
            />
          </View>
          <View style={s.fg}>
            <Text style={s.lbl}>ŞİFRENİZ</Text>
            <TextInput
              style={s.input} placeholder="••••••••"
              placeholderTextColor={C.gray} secureTextEntry
              value={pass} onChangeText={setPass}
            />
          </View>
          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin} disabled={loading}
          >
            {loading
              ? <ActivityIndicator color={C.lime} />
              : <Text style={s.btnTxt}>GİRİŞ YAP</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/kayit')} style={{ marginTop: 10 }}>
          <Text style={s.link}>Hesabınız yok mu? <Text style={{ color: C.onyx, fontWeight: '900' }}>Yeni Hesap Oluştur</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Kayıt ─────────────────────────────────────────
export function RegisterScreen() {
  const router = useRouter();
  const { register, loading } = useAuthStore();
  const [step, setStep]   = useState(0);
  const [phone, setPhone] = useState('');
  const [otp,   setOtp]   = useState('');
  const [name,  setName]  = useState('');
  const [pass,  setPass]  = useState('');
  const [city,  setCity]  = useState('');
  const [role,  setRole]  = useState('seller');
  const [sending, setSending] = useState(false);

  const sendOtp = async () => {
    if (!/^05\d{9}$/.test(phone)) { Toast.show({ type: 'error', text1: 'Lütfen geçerli bir telefon girin.' }); return; }
    setSending(true);
    try {
      await authApi.sendOtp(phone);
      Toast.show({ type: 'success', text1: 'Doğrulama kodu gönderildi!' });
      setStep(1);
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.error || 'Kod gönderilemedi.' });
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = () => {
    if (otp.length !== 6) { Toast.show({ type: 'error', text1: 'Lütfen 6 haneli kodu girin.' }); return; }
    setStep(2);
  };

  const handleRegister = async () => {
    if (!name || !pass || !city) { Toast.show({ type: 'error', text1: 'Lütfen tüm alanları doldurun.' }); return; }
    try {
      await register({ name, phone, password: pass, city, role, otp });
      router.replace('/(tabs)');
    } catch (err) {
      Toast.show({ type: 'error', text1: err.response?.data?.error || 'Kayıt işlemi başarısız.' });
    }
  };

  const steps = ['Telefon', 'Onay', 'Profil'];

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.center} keyboardShouldPersistTaps="handled">
        <View style={s.logoContainer}>
           <Text style={s.logoText}>♻️</Text>
        </View>
        <Text style={s.title}>Kayıt Olun</Text>
        <Text style={s.sub}>Hızlıca topluluğumuza katılın</Text>

        <View style={s.stepRow}>
          {steps.map((st, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[s.stepDot, i <= step && s.stepDotOn]}>
                <Text style={[s.stepNum, i <= step && { color: C.onyx }]}>
                  {i < step ? '✓' : i + 1}
                </Text>
              </View>
              {i < steps.length - 1 && <View style={[s.stepLine, i < step && s.stepLineOn]} />}
            </View>
          ))}
        </View>

        <View style={s.form}>
          {step === 0 && (
            <>
              <View style={s.fg}>
                <Text style={s.lbl}>TELEFON NUMARANIZ</Text>
                <TextInput
                  style={s.input} placeholder="05XX XXX XX XX"
                  placeholderTextColor={C.gray} keyboardType="phone-pad"
                  value={phone} onChangeText={setPhone}
                />
              </View>
              <TouchableOpacity
                style={[s.btn, sending && s.btnDisabled]}
                onPress={sendOtp} disabled={sending}
              >
                {sending ? <ActivityIndicator color={C.lime} /> : <Text style={s.btnTxt}>KOD GÖNDER</Text>}
              </TouchableOpacity>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={{ textAlign: 'center', color: C.gray, marginBottom: 20, fontSize: 13, fontWeight: '600' }}>
                <Text style={{ color: C.onyx, fontWeight: '900' }}>{phone}</Text> hattınıza gelen kodu girin
              </Text>
              <View style={s.fg}>
                <Text style={s.lbl}>DOĞRULAMA KODU</Text>
                <TextInput
                  style={[s.input, { fontSize: 24, textAlign: 'center', letterSpacing: 10, fontWeight: '900' }]}
                  placeholder="000000" placeholderTextColor={C.gray}
                  keyboardType="number-pad" maxLength={6}
                  value={otp} onChangeText={setOtp}
                />
              </View>
              <TouchableOpacity style={s.btn} onPress={verifyOtp}>
                <Text style={s.btnTxt}>DEVAM ET</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep(0)} style={{ marginTop: 15, alignSelf: 'center' }}>
                <Text style={{ color: C.gray, fontSize: 12, fontWeight: '800' }}>NUMARAYI DEĞİŞTİR</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 2 && (
            <>
              <View style={s.fg}>
                <Text style={s.lbl}>AD SOYAD</Text>
                <TextInput
                  style={s.input} placeholder="İsim Soyisim"
                  placeholderTextColor={C.gray} value={name} onChangeText={setName}
                />
              </View>
              <View style={s.fg}>
                <Text style={s.lbl}>GÜVENLİ ŞİFRE</Text>
                <TextInput
                  style={s.input} placeholder="••••••••"
                  placeholderTextColor={C.gray} secureTextEntry
                  value={pass} onChangeText={setPass}
                />
              </View>
              <View style={s.fg}>
                <Text style={s.lbl}>ŞEHİR</Text>
                <TextInput
                  style={s.input} placeholder="Bulunduğunuz Şehir"
                  placeholderTextColor={C.gray} value={city} onChangeText={setCity}
                />
              </View>
              <View style={s.fg}>
                <Text style={s.lbl}>HESAP TİPİ</Text>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {[['seller','🏭 Satıcı'],['buyer','🚛 Alıcı']].map(([v, l]) => (
                    <TouchableOpacity
                      key={v}
                      style={[s.roleCard, role === v && s.roleCardOn]}
                      onPress={() => setRole(v)}
                    >
                      <Text style={{ fontSize: 12, fontWeight: '900', color: role === v ? C.onyx : C.gray, letterSpacing: 1 }}>{l.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <TouchableOpacity
                style={[s.btn, loading && s.btnDisabled]}
                onPress={handleRegister} disabled={loading}
              >
                {loading ? <ActivityIndicator color={C.lime} /> : <Text style={s.btnTxt}>HESABI OLUŞTUR</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity onPress={() => router.push('/(auth)/giris')} style={{ marginTop: 10 }}>
          <Text style={s.link}>Zaten üye misiniz? <Text style={{ color: C.onyx, fontWeight: '900' }}>Giriş Yapın</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  flex:       { flex: 1, backgroundColor: C.marble },
  center:     { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: C.onyx,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: C.onyx,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10
  },
  logoText:   { fontSize: 40 },
  title:      { fontSize: 32, fontWeight: '900', color: C.onyx, marginBottom: 8, letterSpacing: -1 },
  sub:        { fontSize: 14, color: C.gray, marginBottom: 40, fontWeight: '600' },
  form:       { width: '100%', marginBottom: 20 },
  fg:         { marginBottom: 20 },
  lbl:        { fontSize: 10, fontWeight: '900', color: C.gray, marginBottom: 8, letterSpacing: 2, paddingLeft: 4 },
  input:      { 
    backgroundColor: C.white, 
    borderWidth: 1, 
    borderColor: C.border, 
    borderRadius: 16, 
    paddingHorizontal: 16, 
    paddingVertical: 14, 
    fontSize: 16, 
    color: C.onyx,
    fontWeight: '700'
  },
  btn:        { 
    backgroundColor: C.onyx, 
    borderRadius: 18, 
    paddingVertical: 18, 
    alignItems: 'center', 
    marginTop: 10,
    shadowColor: C.onyx,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8
  },
  btnDisabled:{ opacity: 0.7 },
  btnTxt:     { color: C.lime, fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  link:       { fontSize: 13, color: C.gray, fontWeight: '600' },
  
  stepRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 40 },
  stepDot:    { width: 34, height: 34, borderRadius: 12, borderWidth: 2, borderColor: C.border, alignItems: 'center', justifyContent: 'center', backgroundColor: C.white },
  stepDotOn:  { backgroundColor: C.lime, borderColor: C.lime },
  stepNum:    { fontSize: 14, fontWeight: '900', color: C.gray },
  stepLine:   { width: 30, height: 3, backgroundColor: C.border, marginHorizontal: 6, borderRadius: 2 },
  stepLineOn: { backgroundColor: C.lime },
  
  roleCard:   { flex: 1, padding: 16, borderRadius: 16, borderWidth: 2, borderColor: C.border, alignItems: 'center', backgroundColor: C.white },
  roleCardOn: { borderColor: C.onyx, backgroundColor: C.white },
});

