import { useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { paymentsApi } from '../services/api';

// ── Komisyon Ödeme Ekranı (Premium Modern) ──────────
export function CommissionPayPage() {
  const { offerId } = useParams();
  const [loading, setLoading] = useState(false);

  const { data: info, isLoading, error } = useQuery({
    queryKey: ['commission-info', offerId],
    queryFn:  () => paymentsApi.getCommissionInfo(offerId).then(r => r.data),
  });

  const handlePay = async () => {
    setLoading(true);
    try {
      const { data } = await paymentsApi.initiateCommission(offerId);
      window.location.href = data.checkout_url;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ödeme sistemi şu an meşgul.');
      setLoading(false);
    }
  };

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen message="İşlem detayları şu an görüntülenemiyor." />;

  return (
    <div className="min-h-screen bg-[#FBFBFC] pt-32 pb-20 px-6">
      <div className="max-w-[520px] mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="bg-white rounded-[40px] shadow-premium border border-carbon-100 p-12 space-y-10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-nature-500 shadow-[0_0_15px_#BCF24A]" />
          
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-carbon-900 rounded-3xl flex items-center justify-center mx-auto mb-6 text-3xl shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
              💳
            </div>
            <h1 className="text-3xl font-black text-carbon-900 tracking-tighter">İşlem Onayı</h1>
            <p className="text-[14px] text-carbon-400 font-bold max-w-[280px] mx-auto leading-relaxed">Güvenli ticaret için platform komisyonunuzu şimdi ödeyin.</p>
          </div>

          {/* İlan özeti */}
          <div className="p-6 bg-carbon-50/50 rounded-3xl border border-carbon-100/50 group">
            <p className="text-[10px] font-black text-carbon-400 uppercase tracking-[0.2em] mb-3">SATIŞ DETAYI</p>
            <div className="space-y-1">
                <p className="text-[17px] font-black text-carbon-900 leading-tight group-hover:text-nature-600 transition-colors">{info.listing_title}</p>
                <div className="flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-nature-500" />
                   <p className="text-[12px] font-black text-carbon-500 uppercase tracking-widest">Satıcı: {info.seller_name}</p>
                </div>
            </div>
          </div>

          {/* Ödeme hesaplaması */}
          <div className="space-y-5 px-2">
            <div className="flex justify-between items-center">
              <span className="font-black text-carbon-400 text-[11px] uppercase tracking-[0.1em]">ANLAŞMA TUTARI</span>
              <span className="font-black text-carbon-900 text-lg">{Number(info.deal_amount).toLocaleString('tr-TR')} ₺</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-black text-carbon-400 text-[11px] uppercase tracking-[0.1em]">HİZMET KOMİSYONU</span>
              <span className="font-black text-nature-600 bg-nature-100/50 px-3 py-1 rounded-lg">%{info.commission_rate}</span>
            </div>
            <div className="h-[2px] bg-carbon-50 w-full" />
            <div className="flex justify-between items-end">
               <span className="font-black text-carbon-900 text-sm tracking-tight mb-1 uppercase">TOPLAM ÖDEME</span>
               <span className="text-4xl font-black text-carbon-900 tracking-tighter">
                 {Number(info.commission).toLocaleString('tr-TR', { minimumFractionDigits: 0 })} ₺
               </span>
            </div>
          </div>

          <button
            onClick={handlePay}
            disabled={loading}
            className={`w-full py-6 rounded-[22px] text-[13px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95
              ${loading 
                ? 'bg-carbon-100 text-carbon-300 cursor-not-allowed' 
                : 'bg-carbon-900 text-nature-500 hover:bg-carbon-950 hover:shadow-carbon-900/20'}`}
          >
            {loading ? 'YÖNLENDİRİLİYOR...' : 'ÖDEMEYİ TAMAMLA'}
          </button>

          <div className="flex items-center justify-center gap-6 opacity-20 grayscale hover:opacity-100 transition-all duration-700">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Ödeme Başarılı Ekranı (Premium Modern) ───────────
export function PaymentSuccessPage() {
  const [params]  = useSearchParams();
  const navigate  = useNavigate();
  const sessionId = params.get('session_id');

  const { data, isLoading } = useQuery({
    queryKey: ['verify-session', sessionId],
    queryFn:  () => paymentsApi.verifySession(sessionId).then(r => r.data),
    enabled:  !!sessionId,
  });

  if (isLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-[#FBFBFC] pt-32 pb-20 px-6 flex items-center justify-center">
      <div className="max-w-[480px] w-full text-center animate-in zoom-in-95 duration-700">
        <div className="bg-white rounded-[40px] shadow-premium border border-carbon-100 p-16 space-y-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-nature-500/5 to-transparent pointer-events-none" />
          
          <div className="relative">
              <div className="w-24 h-24 bg-nature-500 rounded-[32px] flex items-center justify-center mx-auto shadow-[0_20px_40px_rgba(188,242,74,0.4)] animate-bounce duration-[2000ms]">
                <svg className="w-12 h-12 text-carbon-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" />
                </svg>
              </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-black text-carbon-900 tracking-tighter">İşlem Tamam!</h1>
            <p className="text-[15px] text-carbon-400 font-bold leading-relaxed max-w-[320px] mx-auto">
              {data?.type === 'subscription'
                ? 'Premium ayrıcalıklarınız hesabınıza anında tanımlandı. Kazancınızı artırmaya başlayın.'
                : 'İşlem ücretiniz başarıyla alındı. Ticaret süreci başarıyla sonuçlanmıştır.'}
            </p>
          </div>

          {data?.amount_total && (
            <div className="text-4xl font-black text-carbon-900 py-6 bg-carbon-50 rounded-3xl border border-carbon-100/50 tracking-tighter">
              {Number(data.amount_total).toLocaleString('tr-TR')} ₺
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 pt-6">
            <button 
              onClick={() => navigate('/hesabim')} 
              className="px-8 py-5 bg-carbon-900 text-nature-500 hover:bg-carbon-950 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95"
            >
              HESABIMA GİT
            </button>
            <button 
              onClick={() => navigate('/')} 
              className="px-8 py-5 bg-white border border-carbon-100 text-carbon-400 hover:text-carbon-900 hover:border-carbon-900 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all"
            >
              ANA SAYFAYA DÖN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Ödeme İptal Ekranı (Premium Modern) ─────────────
export function PaymentCancelPage() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#FBFBFC] pt-32 pb-20 px-6 flex items-center justify-center font-sans">
      <div className="max-w-[480px] w-full text-center">
        <div className="bg-white rounded-[40px] shadow-premium border border-carbon-100 p-16 space-y-10">
          <div className="w-24 h-24 bg-red-50 text-red-500 rounded-[32px] flex items-center justify-center mx-auto border-2 border-red-100">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl font-black text-carbon-900 tracking-tighter">İşlem İptal Edildi</h1>
            <p className="text-[15px] text-carbon-400 font-bold leading-relaxed px-6">
              Ödeme süreci şu an tamamlanamadı. Herhangi bir tutar tahsil edilmedi. Tekrar denemek isterseniz profilinize gidebilirsiniz.
            </p>
          </div>
          
          <button 
            onClick={() => navigate('/hesabim')} 
            className="w-full py-5 bg-carbon-900 text-white hover:bg-carbon-950 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl active:scale-95"
          >
             PROFİLE GERİ DÖN
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Premium Yükleme Bileşeni ────────────────────────
const LoadingScreen = () => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 animate-pulse">
    <div className="relative">
        <div className="w-16 h-16 border-4 border-carbon-100 border-t-nature-500 rounded-full animate-spin transition-all duration-1000" />
        <div className="absolute inset-0 flex items-center justify-center text-xs">♻️</div>
    </div>
    <div className="space-y-2 text-center">
        <p className="text-[11px] font-black text-carbon-900 uppercase tracking-[0.4em]">VERİLER DOĞRULANIYOR</p>
        <p className="text-[10px] text-carbon-300 font-bold">Lütfen tarayıcınızı kapatmayın...</p>
    </div>
  </div>
);

const ErrorScreen = ({ message }) => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-8 px-10 text-center">
    <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center text-3xl shadow-inner border border-amber-100">⚠️</div>
    <div className="space-y-3">
      <p className="text-[12px] font-black text-carbon-300 uppercase tracking-[0.3em]">BİLGİ</p>
      <p className="text-carbon-900 font-black text-xl tracking-tight max-w-xs">{message}</p>
    </div>
    <button onClick={() => window.location.reload()} className="px-10 py-4 bg-carbon-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-carbon-950 transition-all">SAYFAYI YENİLE</button>
  </div>
);
