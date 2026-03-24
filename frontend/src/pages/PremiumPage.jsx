import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { paymentsApi } from '../services/api';
import useAuthStore from '../store/auth.store';

const FEATURE_LABELS = {
  max_offers_per_month: { label: 'Aylık Maksimum Teklif', fmt: (v) => v === -1 ? 'Sınırsız' : `${v} Teklif / Ay` },
  featured_listings:    { label: 'Öne Çıkarılan İlan',  fmt: (v) => v === 0 ? 'Yok' : `${v} İlan / Ay` },
  priority_support:     { label: '7/24 Öncelikli Destek', fmt: (v) => v ? 'Aktif' : '—' },
  advanced_filters:     { label: 'Gelişmiş Pazar Analizi', fmt: (v) => v ? 'Aktif' : '—' },
};

export default function PremiumPage() {
  const { user }   = useAuthStore();
  const navigate   = useNavigate();
  const [interval, setInterval] = useState('month');
  const [loading,  setLoading]  = useState(null);

  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn:  () => paymentsApi.getPlans().then(r => r.data),
  });

  const { data: activeSub } = useQuery({
    queryKey: ['subscription'],
    queryFn:  () => paymentsApi.getSubscription().then(r => r.data),
    enabled:  !!user,
  });

  const cancelMutation = useMutation({
    mutationFn: () => paymentsApi.cancelSubscription(),
    onSuccess: (res) => {
      toast.success(res.data.message);
      window.location.reload();
    },
    onError: () => toast.error('İşlem sırasında bir hata oluştu.'),
  });

  const handleSubscribe = async (plan) => {
    if (!user) { navigate('/giris'); return; }
    if (plan.slug === 'basic') return;
    setLoading(plan.slug);
    try {
      const { data } = await paymentsApi.subscribe(plan.slug, interval);
      window.location.href = data.checkout_url;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Ödeme sistemi şu an meşgul.');
      setLoading(null);
    }
  };

  const paidPlans = plans.filter(p => p.slug !== 'basic');
  const freePlan  = plans.find(p => p.slug === 'basic');

  return (
    <div className="min-h-screen bg-[#FBFBFC] pt-32 pb-24 px-6 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        
        {/* Hero Section */}
        <div className="text-center mb-20 relative">
          <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-nature-500/10 blur-[100px] rounded-full -z-10" />
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-white border border-carbon-100 rounded-full mb-8 shadow-sm">
             <span className="w-2.5 h-2.5 rounded-full bg-nature-500 shadow-[0_0_10px_#BCF24A]" />
             <span className="text-[10px] font-black text-carbon-900 uppercase tracking-[0.2em]">Sınırsız Ticaret Başlıyor</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-carbon-900 tracking-[-0.04em] leading-[0.95] mb-8">
            İşini <span className="text-nature-500 underline decoration-carbon-900/5 underline-offset-[10px]">Premium</span><br/> Standartlarla Büyüt
          </h1>
          <p className="text-carbon-400 font-bold max-w-2xl mx-auto text-lg md:text-xl leading-relaxed">
            Hurdalarınızı en yüksek fiyatla, en hızlı şekilde ve markanıza yakışır ayrıcalıklarla nakite çevirin.
          </p>
        </div>

        {/* Active Subscription Banner */}
        {activeSub && (
          <div className="mb-16 bg-carbon-900 border border-carbon-800 rounded-[32px] p-8 flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-nature-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="z-10">
              <p className="text-nature-500 font-black text-2xl tracking-tight mb-2 uppercase">
                {activeSub.plan_name} Üyeliğiniz Aktif 🚀
              </p>
              <div className="flex items-center gap-4 text-carbon-400 text-sm font-bold">
                 <span>Bitiş: {new Date(activeSub.current_period_end).toLocaleDateString('tr-TR')}</span>
                 <span className="w-1 h-1 rounded-full bg-carbon-700" />
                 <span>{activeSub.cancel_at_period_end ? 'Otomatik Yenileme Kapalı' : 'Otomatik Yenilenecek'}</span>
              </div>
            </div>
            {!activeSub.cancel_at_period_end && (
              <button
                onClick={() => { if (window.confirm('Aboneliğinizi iptal etmek istediğinize emin misiniz? Avantajlarınız dönem sonuna kadar devam edecektir.')) cancelMutation.mutate(); }}
                className="z-10 px-8 py-4 border border-carbon-700 text-carbon-400 hover:text-red-500 hover:border-red-500/50 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all backdrop-blur-sm"
              >
                Aboneliği Durdur
              </button>
            )}
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex justify-center mb-16">
          <div className="bg-white p-2 rounded-[24px] border border-carbon-100 shadow-premium flex items-center">
            {[{ v: 'month', l: 'AYLIK' }, { v: 'year', l: 'YILLIK' }].map(opt => (
              <button
                key={opt.v}
                onClick={() => setInterval(opt.v)}
                className={`px-12 py-4 rounded-[18px] text-[11px] font-black uppercase tracking-[0.2em] transition-all duration-500
                  ${interval === opt.v 
                    ? 'bg-carbon-900 text-nature-500 shadow-2xl' 
                    : 'text-carbon-400 hover:text-carbon-900'}`}
              >
                {opt.l} 
                {opt.v === 'year' && <span className="ml-3 bg-nature-500 text-carbon-900 px-2 py-1 rounded-lg text-[9px] font-black leading-none">-17%</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-2 gap-10 mb-24 max-w-5xl mx-auto items-end">
          {paidPlans.map((plan, i) => {
            const price    = interval === 'year' ? plan.price_yearly / 12 : plan.price_monthly;
            const features = plan.features || {};
            const isActive = activeSub?.plan_slug === plan.slug;
            const isPop    = i === paidPlans.length - 1;

            return (
              <div key={plan.id} className={`rounded-[40px] p-12 flex flex-col relative transition-all duration-700 group
                ${isPop 
                  ? 'bg-carbon-900 border-none shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] lg:min-h-[640px]' 
                  : 'bg-white border border-carbon-100 shadow-premium hover:border-carbon-200 lg:min-h-[580px]'}`}>
                
                {isPop && (
                  <div className="absolute top-[-20px] left-1/2 -translate-x-1/2 bg-nature-500 text-carbon-900 text-[10px] font-black px-8 py-2.5 rounded-full shadow-[0_10px_20px_rgba(188,242,74,0.3)] tracking-[0.2em] leading-none z-20">
                    EN ÇOK TERCİH EDİLEN
                  </div>
                )}

                <div className="mb-10 text-center lg:text-left">
                  <h3 className={`text-4xl font-black tracking-tighter mb-6 ${isPop ? 'text-white' : 'text-carbon-900'}`}>{plan.name}</h3>
                  <div className="flex items-baseline gap-2 justify-center lg:justify-start">
                    <span className={`text-7xl font-black tracking-tighter ${isPop ? 'text-nature-500' : 'text-carbon-900'}`}>
                      {price.toLocaleString('tr-TR')} ₺
                    </span>
                    <span className={`text-[12px] font-black uppercase tracking-[0.2em] ${isPop ? 'text-carbon-500' : 'text-carbon-300'}`}>/ay</span>
                  </div>
                </div>

                <div className={`h-[1px] w-full mb-10 ${isPop ? 'bg-carbon-800' : 'bg-carbon-50'}`} />

                <ul className="space-y-6 mb-12 flex-1">
                  {Object.entries(FEATURE_LABELS).map(([key, { label, fmt }]) => {
                    if (!(key in features)) return null;
                    const val    = features[key];
                    const active = val !== false && val !== 0;
                    return (
                      <li key={key} className="flex items-center gap-4">
                        <div className={`w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
                          ${active 
                            ? (isPop ? 'bg-nature-500 text-carbon-900' : 'bg-nature-100 text-nature-600') 
                            : (isPop ? 'bg-carbon-800 text-carbon-600' : 'bg-carbon-50 text-carbon-200')}`}>
                          {active ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7"/></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M6 18L18 6M6 6l12 12"/></svg>
                          )}
                        </div>
                        <span className={`text-[14px] font-bold tracking-tight transition-colors ${active ? (isPop ? 'text-white' : 'text-carbon-900') : (isPop ? 'text-carbon-600 line-through' : 'text-carbon-300 line-through')}`}>
                          {label}: <span className={active ? (isPop ? 'text-nature-500' : 'text-nature-500') : ''}>{fmt(val)}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isActive || loading === plan.slug}
                  className={`w-full py-6 rounded-2xl font-black text-[12px] tracking-[0.2em] uppercase transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 group
                    ${isActive 
                      ? 'bg-carbon-800 text-carbon-600 cursor-not-allowed' 
                      : (isPop 
                           ? 'bg-nature-500 text-carbon-900 hover:shadow-[0_20px_40px_-5px_rgba(188,242,74,0.4)]' 
                           : 'bg-carbon-900 text-nature-500 hover:bg-carbon-950')}`}
                >
                  {loading === plan.slug ? 'İŞLEM YAPILIYOR...' : isActive ? 'BU SİZİN PLANINIZ' : 'ŞİMDİ YÜKSELT'}
                  {!isActive && <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>}
                </button>
              </div>
            );
          })}
        </div>

        {/* Free Plan Badge */}
        {freePlan && (
          <div className="text-center mb-32">
            <div className="inline-block bg-white border border-carbon-100 px-10 py-5 rounded-[24px] shadow-sm">
                <p className="text-carbon-400 font-bold text-sm">
                Veya <span className="text-carbon-900 font-black tracking-tight">{freePlan.name}</span> ile devam edebilirsiniz.
                Aylık <span className="text-nature-500 font-black">+{freePlan.features?.max_offers_per_month}</span> ücretsiz teklif hakkı.
                </p>
            </div>
          </div>
        )}

        {/* FAQ Area */}
        <div className="pt-24 border-t border-carbon-100">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-carbon-900 tracking-tighter mb-4">Merak Edilenler</h2>
            <p className="text-carbon-400 font-bold">Premium üyelik hakkında bilmeniz gereken her şey.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              ['Üyeliği ne zaman iptal edebilirim?', 'Dilediğiniz an tek tıkla iptal edebilirsiniz. Ödeme yaptığınız dönemin sonuna kadar tüm haklarınız korunur.'],
              ['Hangi ödeme yöntemleri geçerli?', 'Güvenli Iyzico/Stripe altyapısı ile tüm kredi ve banka kartlarıyla 3D Secure güvencesiyle ödeme yapabilirsiniz.'],
              ['Yıllık üyelik neden daha avantajlı?', 'Yıllık planı seçtiğinizde toplam tutar üzerinden yaklaşık 2 ayın bedavaya geldiği %17 oranında net indirim kazanırsınız.'],
              ['Ekip olarak kullanabilir miyiz?', 'Kurumsal çözümlerimiz ve çoklu kullanıcı erişimi için doğrudan destek ekibimizle iletişime geçebilirsiniz.'],
            ].map(([q, a]) => (
              <div key={q} className="bg-white border border-carbon-100 p-10 rounded-[32px] shadow-sm hover:shadow-md transition-shadow">
                <p className="font-black text-carbon-900 text-xl mb-4 tracking-tight">{q}</p>
                <p className="text-carbon-500 font-semibold text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
