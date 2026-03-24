import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/auth.store';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const { login, loading }      = useAuthStore();
  const navigate                = useNavigate();

  // Akıllı Telefon Formatlayıcı
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.startsWith("0")) value = value.substring(1);
    if (value.length > 10) value = value.substring(0, 10);
    
    let formatted = "";
    if (value.length > 0) formatted += "(" + value.substring(0, 3);
    if (value.length >= 3) formatted += ") ";
    if (value.length > 3) formatted += value.substring(3, 6);
    if (value.length >= 6) formatted += " ";
    if (value.length > 6) formatted += value.substring(6, 8);
    if (value.length >= 8) formatted += " ";
    if (value.length > 8) formatted += value.substring(8, 10);
    
    setPhone(value);
  };

  const formattedDisplay = phone ? (phone.length > 0 ? "0 (" + phone.substring(0,3) + (phone.length > 3 ? ") " + phone.substring(3,6) + (phone.length > 6 ? " " + phone.substring(6,8) + (phone.length > 8 ? " " + phone.substring(8,10) : "") : "") : "") : "") : "";

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      if (!phone || !password) return toast.error('Lütfen tüm alanları doldurun.');
      await login(phone, password);
      toast.success('Giriş başarılı!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Giriş yapılamadı.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center pt-[72px] px-6 relative overflow-hidden bg-[#0A0E12]">
      {/* Animated Gradient Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] bg-[#BCF24A]/10 blur-[180px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-[460px] relative z-10 p-8 md:p-10 border border-white/5 bg-[#161B22]/80 backdrop-blur-3xl rounded-[32px] shadow-2xl">
        <div className="text-center mb-10">
           <div className="inline-flex w-16 h-16 rounded-[22px] bg-[#BCF24A] text-[#0A0E12] items-center justify-center text-3xl font-black mb-6 shadow-lg shadow-[#BCF24A]/20">♻</div>
           <h1 className="text-3xl font-bold text-white leading-tight tracking-tight mb-3">Tekrar Hoş Geldiniz</h1>
           <p className="text-gray-400 font-medium text-sm">Gezegen ve cüzdanınız için kazanmaya devam edin.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Telefon Numarası</label>
            <div className="relative group">
               <input
                type="tel"
                value={formattedDisplay}
                onChange={handlePhoneChange}
                placeholder="0 (5XX) XXX XX XX"
                className="w-full bg-[#0D1117] border border-gray-800 text-white px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#BCF24A]/50 focus:border-[#BCF24A] transition-all text-base font-medium placeholder:text-gray-600"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Şifreniz</label>
              <button type="button" className="text-[11px] font-bold text-[#BCF24A] hover:underline uppercase tracking-widest">Şifremi Unuttum</button>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0D1117] border border-gray-800 text-white px-5 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-[#BCF24A]/50 focus:border-[#BCF24A] transition-all text-base font-medium placeholder:text-gray-600"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#BCF24A] hover:bg-[#a8d942] disabled:bg-gray-700 disabled:text-gray-500 text-black font-black py-4 rounded-2xl transition-all shadow-xl shadow-[#BCF24A]/10 active:scale-[0.98] flex items-center justify-center gap-2 text-lg mt-4 group"
          >
            {loading ? <div className="loader !w-6 !h-6 !border-[#0A0E12]" /> : (
              <>
                <span>Giriş Yap</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </>
            )}
          </button>
        </form>

        <div className="relative my-8 text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div>
          <span className="relative bg-[#161B22] px-4 text-xs font-bold text-gray-500 uppercase tracking-widest">VEYA</span>
        </div>

        {/* Social Logins - Professional Look */}
        <div className="grid grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 py-3.5 border border-gray-800 rounded-2xl bg-[#0D1117] hover:bg-gray-800 transition-colors text-white font-bold text-sm">
             <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
             Google
          </button>
          <button className="flex items-center justify-center gap-2 py-3.5 border border-gray-800 rounded-2xl bg-[#0D1117] hover:bg-gray-800 transition-colors text-white font-bold text-sm">
             <img src="https://www.svgrepo.com/show/511330/apple-fill.svg" className="w-5 h-5 invert" alt="Apple" />
             Apple
          </button>
        </div>

        <div className="mt-10 text-center">
          <p className="text-gray-400 text-sm font-medium">
            Henüz bir hesabınız yok mu?{' '}
            <Link to="/kayit" className="text-[#BCF24A] font-bold hover:underline">
              Hemen Kayıt Ol
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
