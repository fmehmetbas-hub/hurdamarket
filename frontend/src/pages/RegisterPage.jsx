import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/auth.store';
import { authApi } from '../services/api';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', password: '', city: 'İstanbul', role: 'seller', otp: ['', '', '', '', '', '']
  });
  const { register } = useAuthStore();
  const navigate = useNavigate();
  
  // 6 haneli OTP için referanslar
  const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  // Akıllı Telefon Formatlayıcı
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.startsWith("0")) value = value.substring(1);
    if (value.length > 10) value = value.substring(0, 10);
    setFormData({ ...formData, phone: value });
  };

  const formattedDisplay = formData.phone ? "0 (" + formData.phone.substring(0,3) + (formData.phone.length > 3 ? ") " + formData.phone.substring(3,6) + (formData.phone.length > 6 ? " " + formData.phone.substring(6,8) + (formData.phone.length > 8 ? " " + formData.phone.substring(8,10) : "") : "") : "") : "";

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.phone || formData.phone.length < 10) return toast.error('Lütfen geçerli bir telefon numarası girin.');
    setLoading(true);
    try {
      await authApi.sendOtp(formData.phone);
      toast.success('Doğrulama kodu gönderildi.');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...formData.otp];
    newOtp[index] = value.substring(value.length - 1);
    setFormData({ ...formData, otp: newOtp });

    // Bir sonraki kutuya odaklan
    if (value && index < 5) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
      otpRefs[index - 1].current.focus();
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (formData.otp.join('').length < 6) return toast.error('Lütfen kodu tam girin.');
    setStep(3);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ ...formData, otp: formData.otp.join('') });
      toast.success('Hesabınız başarıyla oluşturuldu! Hoş geldiniz.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-[72px] px-6 relative overflow-hidden bg-[#0A0E12]">
      {/* Dynamic Background Accents */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-[#BCF24A]/10 blur-[180px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[480px] relative z-10 p-8 md:p-10 border border-white/5 bg-[#161B22]/80 backdrop-blur-3xl rounded-[32px] shadow-2xl">
        <div className="mb-10 text-center">
          <div className="inline-flex w-16 h-16 rounded-[22px] bg-[#BCF24A] text-[#0A0E12] items-center justify-center text-3xl font-black mb-6 shadow-lg shadow-[#BCF24A]/20">♻</div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-3">Hesap Oluştur</h1>
          <p className="text-gray-400 font-medium text-sm">Hemen katılın, hurdanızı kazanca dönüştürün.</p>
          
          {/* Progress Indicator */}
          <div className="flex justify-center gap-3 mt-8">
             {[1,2,3].map(i => (
               <div key={i} className={`h-1.5 w-12 rounded-full transition-all duration-500 ${step >= i ? 'bg-[#BCF24A] shadow-[0_0_10px_rgba(188,242,74,0.4)]' : 'bg-gray-800'}`} />
             ))}
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-6">
             <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Telefon Numarası</label>
                <input
                  type="tel"
                  value={formattedDisplay}
                  onChange={handlePhoneChange}
                  placeholder="0 (5XX) XXX XX XX"
                  className="w-full bg-[#0D1117] border border-gray-800 text-white px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#BCF24A]/50 focus:border-[#BCF24A] transition-all text-lg font-medium placeholder:text-gray-600"
                />
             </div>
             
             <div className="p-4 bg-[#BCF24A]/5 rounded-2xl border border-[#BCF24A]/10 flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-[#BCF24A]/10 flex items-center justify-center text-[#BCF24A]">🛡</div>
                <p className="text-[10px] text-gray-400 leading-tight font-bold uppercase tracking-wider">Güvenliğiniz için gerçek bir telefon numarası gereklidir.</p>
             </div>

             <button
              disabled={loading}
              className="w-full bg-[#BCF24A] hover:bg-[#a8d942] disabled:bg-gray-700 disabled:text-gray-500 text-black font-black py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] text-lg group flex justify-center items-center gap-2"
             >
                {loading ? <div className="loader !w-6 !h-6 !border-[#0A0E12]" /> : (
                  <>
                    <span>Doğrulama Kodu Gönder</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
             </button>
             <p className="text-center text-gray-400 text-sm font-medium">Zaten üye misiniz? <Link to="/giris" className="text-[#BCF24A] font-bold hover:underline">Giriş Yap</Link></p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-8 animate-in fade-in slide-in-from-right-6 duration-500">
             <div className="space-y-6 text-center">
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">Doğrulama Kodunu Girin</p>
                <div className="flex justify-between gap-2">
                  {formData.otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={otpRefs[idx]}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleKeyDown(idx, e)}
                      className="w-12 h-16 bg-[#0D1117] border border-gray-800 text-white text-center text-2xl font-black rounded-xl outline-none focus:border-[#BCF24A] focus:ring-2 focus:ring-[#BCF24A]/30 transition-all"
                    />
                  ))}
                </div>
                <button type="button" onClick={() => setStep(1)} className="text-[11px] text-gray-500 font-bold uppercase tracking-widest hover:text-white transition-colors underline decoration-[#BCF24A]/40 underline-offset-4">Numara Hatalı mı? Değiştir</button>
             </div>
             <button
              className="w-full bg-[#BCF24A] text-black font-black py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] text-lg"
             >
                Kodu Onayla
             </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleRegister} className="space-y-5 animate-in fade-in slide-in-from-right-6 duration-500">
             <div className="space-y-4">
                <div className="space-y-1.5">
                   <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Ad Soyad</label>
                   <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Adınız ve Soyadınız"
                    className="w-full bg-[#0D1117] border border-gray-800 text-white px-5 py-4 rounded-2xl outline-none focus:border-[#BCF24A] transition-all text-base placeholder:text-gray-700"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Şehir</label>
                   <select
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-[#0D1117] border border-gray-800 text-white px-5 py-4 rounded-2xl outline-none focus:border-[#BCF24A] transition-all text-base font-bold appearance-none"
                   >
                     {['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Konya'].map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <div className="space-y-1.5">
                   <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Şifre Belirleyin</label>
                   <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Minimum 6 karakter"
                    className="w-full bg-[#0D1117] border border-gray-800 text-white px-5 py-4 rounded-2xl outline-none focus:border-[#BCF24A] transition-all text-base placeholder:text-gray-700"
                   />
                </div>
             </div>

             <button
              disabled={loading}
              className="w-full bg-[#BCF24A] hover:bg-[#a8d942] disabled:bg-gray-700 disabled:text-gray-500 text-black font-black py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] text-lg mt-4"
             >
                {loading ? <div className="loader !w-6 !h-6 !border-[#0A0E12]" /> : 'Kaydı Tamamla'}
             </button>
             <p className="text-[10px] text-gray-500 text-center uppercase tracking-widest leading-relaxed">
               Kaydolarak <span className="text-gray-400 underline cursor-pointer">Kullanım Koşullarını</span> ve <span className="text-gray-400 underline cursor-pointer">KVKK Aydınlatma Metnini</span> kabul etmiş sayılırsınız.
             </p>
          </form>
        )}
      </div>
    </div>
  );
}
