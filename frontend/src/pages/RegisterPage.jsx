import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/auth.store';
import { authApi } from '../services/api';
import { toast } from 'react-hot-toast';

export default function RegisterPage() {
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', password: '', city: 'İstanbul', role: 'seller', otp: ''
  });
  const { register } = useAuthStore();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.phone) return toast.error('Telefon numarası gerekli.');
    setLoading(true);
    try {
      await authApi.sendOtp(formData.phone);
      toast.success('Doğrulama kodu gönderildi (Test Modu: 123456)');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.otp) return toast.error('Doğrulama kodunu girin.');
    setLoading(true);
    try {
      await register(formData);
      toast.success('Kayıt başarılı! Hoş geldiniz.');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-[72px] px-6 relative overflow-hidden bg-[#FBFBFC]">
      {/* Premium Background Accents */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-nature-100/30 blur-[150px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-slate-200/40 blur-[140px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[480px] relative z-10 p-10 md:p-12 border border-white/60 bg-white/70 backdrop-blur-2xl rounded-premium shadow-premium">
        <div className="mb-10 text-center">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-carbon-900 text-nature-500 items-center justify-center text-3xl font-black mb-5 shadow-xl shadow-carbon-900/10 active:scale-95 transition-all -rotate-3">♻</div>
          <h1 className="text-3xl font-black text-carbon-900 tracking-tight mb-2">Hesap Oluştur</h1>
          <div className="flex justify-center gap-2 mt-4">
             <div className={`h-1.5 w-10 rounded-full transition-all duration-500 ${step >= 1 ? 'bg-nature-500' : 'bg-carbon-200'}`} />
             <div className={`h-1.5 w-10 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-nature-500' : 'bg-carbon-200'}`} />
             <div className={`h-1.5 w-10 rounded-full transition-all duration-500 ${step >= 3 ? 'bg-nature-500' : 'bg-carbon-200'}`} />
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="space-y-5">
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-carbon-500 uppercase tracking-widest pl-4">Telefon Numarası</label>
                   <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="0 (5XX) XXX XX XX"
                    className="w-full bg-carbon-50 border border-carbon-100 text-carbon-900 px-5 py-3.5 rounded-2xl outline-none focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500/30 transition-all text-base font-medium shadow-inner-soft"
                   />
                </div>
                <div className="p-4 bg-nature-50/50 rounded-2xl border border-nature-100/50 flex gap-4 items-center">
                   <div className="text-2xl filter grayscale opacity-40">🛡</div>
                   <p className="text-[10px] text-carbon-500 leading-tight font-bold uppercase tracking-tight">Güvenliğiniz için SMS doğrulaması zorunludur.</p>
                </div>
             </div>
             <button
              disabled={loading}
              className="w-full bg-carbon-900 hover:bg-carbon-950 disabled:bg-carbon-300 text-nature-500 font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] text-base group flex justify-center items-center gap-2"
             >
                {loading ? <div className="loader !w-5 !h-5 !border-[3px]" /> : (
                  <>
                    <span>Kodu Gönder</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
             </button>
             <p className="text-center text-carbon-400 text-sm font-medium">Hesabınız var mı? <Link to="/giris" className="text-carbon-900 font-bold hover:text-nature-600 border-b-2 border-nature-500/40">Giriş Yap</Link></p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={e => { e.preventDefault(); setStep(3); }} className="space-y-8 animate-in fade-in slide-in-from-right-6 duration-500">
             <div className="space-y-6 text-center">
                <p className="text-carbon-400 font-bold uppercase tracking-widest text-[10px]">Doğrulama Kodunu Girin</p>
                <input
                  type="text"
                  maxLength={6}
                  value={formData.otp}
                  onChange={e => setFormData({ ...formData, otp: e.target.value })}
                  placeholder="------"
                  className="w-full bg-carbon-50 border border-carbon-100 text-carbon-900 text-center text-4xl font-black py-5 tracking-[0.4em] rounded-2xl outline-none focus:ring-4 focus:ring-nature-500/10 transition-all shadow-inner-soft placeholder:text-carbon-200"
                />
                <button type="button" onClick={() => setStep(1)} className="text-[10px] text-carbon-400 font-bold uppercase tracking-widest hover:text-carbon-900 transition-colors">Numarayı Değiştir</button>
             </div>
             <button
              className="w-full bg-carbon-900 hover:bg-carbon-950 text-nature-500 font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] text-base"
             >
                Kodu Onayla
             </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleRegister} className="space-y-5 animate-in fade-in slide-in-from-right-6 duration-500">
             <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-carbon-500 uppercase tracking-widest pl-4">Ad Soyad</label>
                   <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Örn: Ali Yılmaz"
                    className="w-full bg-carbon-50 border border-carbon-100 text-carbon-900 px-5 py-3 rounded-2xl outline-none focus:border-nature-500/30 transition-all text-base shadow-inner-soft"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-carbon-500 uppercase tracking-widest pl-4">E-posta</label>
                   <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ali@ornek.com"
                    className="w-full bg-carbon-50 border border-carbon-100 text-carbon-900 px-5 py-3 rounded-2xl outline-none focus:border-nature-500/30 transition-all text-base shadow-inner-soft"
                   />
                </div>
             </div>

             <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-carbon-500 uppercase tracking-widest pl-4">Şifre Belirleyin</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full bg-carbon-50 border border-carbon-100 text-carbon-900 px-5 py-3 rounded-2xl outline-none focus:border-nature-500/30 transition-all text-base shadow-inner-soft"
                />
             </div>

             <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-carbon-500 uppercase tracking-widest pl-4">Şehir</label>
                <select
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full bg-carbon-50 border border-carbon-100 text-carbon-900 px-5 py-3 rounded-2xl outline-none focus:border-nature-500/30 transition-all text-base font-bold"
                >
                  <option value="İstanbul">İstanbul</option>
                  <option value="Ankara">Ankara</option>
                  <option value="İzmir">İzmir</option>
                  <option value="Bursa">Bursa</option>
                </select>
             </div>

             <button
              disabled={loading}
              className="w-full bg-carbon-900 hover:bg-carbon-950 disabled:bg-carbon-300 text-nature-500 font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] text-base group flex justify-center items-center"
             >
                {loading ? <div className="loader !w-5 !h-5 !border-[3px]" /> : 'Kaydı Tamamla'}
             </button>
          </form>
        )}
      </div>
    </div>
  );
}
