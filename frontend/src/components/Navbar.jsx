import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/auth.store';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate         = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] bg-white/80 backdrop-blur-xl border-b border-carbon-100/50 h-[76px]">
      <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-3 no-underline group">
          <div className="w-10 h-10 rounded-xl bg-carbon-900 flex items-center justify-center shadow-lg shadow-carbon-900/10 group-hover:scale-105 transition-transform">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke="#bcf24a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 22V12" stroke="#bcf24a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12L20 7" stroke="#bcf24a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12L4 7" stroke="#bcf24a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-2xl font-black text-carbon-900 tracking-tighter">HurdaMarket</span>
        </Link>

        <div className="flex items-center gap-4 lg:gap-8">
          <Link to="/harita" className="hidden sm:block text-carbon-500 hover:text-carbon-900 font-bold text-sm transition-colors no-underline uppercase tracking-widest">
            Harita
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <NotificationBell />
              <Link to="/ilan-ver" className="flex items-center gap-2 bg-carbon-900 text-nature-500 hover:bg-carbon-950 px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg active:scale-95 no-underline border-b-2 border-nature-500/30">
                <span className="text-xl leading-none">+</span> İLAN VER
              </Link>
              
              <div className="pl-4 lg:pl-6 border-l border-carbon-100">
                <button
                  onClick={() => navigate('/hesabim')}
                  className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer p-1.5 rounded-full hover:bg-carbon-50 transition-all text-carbon-900 font-bold"
                >
                  <div className="w-9 h-9 rounded-full bg-carbon-900 text-nature-500 flex items-center justify-center font-bold text-sm border-2 border-nature-500/20 shadow-md">
                    {user.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="hidden md:block text-carbon-600 text-[13px] uppercase tracking-wide">Hesabım</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 lg:gap-8">
              <Link to="/giris" className="text-carbon-600 hover:text-carbon-900 font-bold text-sm transition-colors no-underline uppercase tracking-widest">
                Giriş Yap
              </Link>
              <Link to="/kayit" className="bg-carbon-900 text-nature-500 hover:bg-carbon-950 px-8 py-3.5 rounded-full text-sm font-bold transition-all shadow-xl active:scale-95 no-underline border-b-2 border-nature-500/30 tracking-widest uppercase">
                KAYIT OL
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
