import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/auth.store';
import { toast } from 'react-hot-toast';

export default function LoginPage() {
  const [phone, setPhone]       = useState('');
  const [password, setPassword] = useState('');
  const { login, loading }      = useAuthStore();
  const navigate                = useNavigate();

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
    <div className="min-h-screen flex items-center justify-center pt-[72px] px-6 relative overflow-hidden bg-[#FBFBFC]">
      {/* Premium Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-nature-100/30 blur-[150px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-slate-200/40 blur-[140px] rounded-full pointer-events-none" />
      
      <div className="w-full max-w-[480px] relative z-10 p-10 md:p-12 border border-white/60 bg-white/70 backdrop-blur-2xl rounded-premium shadow-premium">
        <div className="text-center mb-8">
           <div className="inline-flex w-14 h-14 rounded-2xl bg-carbon-900 text-nature-500 items-center justify-center text-3xl font-black mb-5 shadow-xl shadow-carbon-900/10 active:scale-95 transition-all">♻</div>
           <h1 className="text-3xl font-black text-carbon-900 leading-tight tracking-tight mb-2">Hoş Geldiniz</h1>
           <p className="text-carbon-400 font-semibold tracking-wider text-[11px] uppercase">Gezegen İçin Bir Adım Daha Atın</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-carbon-500 uppercase tracking-widest pl-4">Telefon Numarası</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="0 (5XX) XXX XX XX"
              className="w-full bg-carbon-50 border border-carbon-100 text-carbon-900 px-5 py-3.5 rounded-2xl outline-none focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500/30 focus:bg-white transition-all text-base font-medium shadow-inner-soft"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-carbon-500 uppercase tracking-widest pl-4">Şifreniz</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-carbon-50 border border-carbon-100 text-carbon-900 px-5 py-3.5 rounded-2xl outline-none focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500/30 focus:bg-white transition-all text-base font-medium shadow-inner-soft"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-carbon-900 hover:bg-carbon-950 disabled:bg-carbon-300 text-nature-500 font-bold py-4 rounded-2xl transition-all shadow-lg shadow-carbon-950/20 active:scale-[0.98] flex items-center justify-center gap-2 text-base group"
          >
            {loading ? <div className="loader !w-6 !h-6 !border-[3px]" /> : (
              <>
                <span>Giriş Yap</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-carbon-400 text-sm font-medium">
            Hesabınız yok mu?{' '}
            <Link to="/kayit" className="text-carbon-900 font-bold hover:text-nature-600 transition-colors border-b-2 border-nature-500/40">
              Yeni Hesap Oluştur
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
