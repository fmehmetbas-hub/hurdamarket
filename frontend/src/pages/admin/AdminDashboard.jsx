import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { adminApi } from '../../services/api';
import useAuthStore from '../../store/auth.store';
import { useEffect } from 'react';

const StatCard = ({ label, value, sub, colorClass = "text-nature-500" }) => (
  <div className="bg-white rounded-[32px] border border-carbon-100 p-8 shadow-premium hover:shadow-2xl transition-all duration-500 group">
    <div className="space-y-4">
      <div className="flex justify-between items-start">
         <p className="text-[10px] font-black text-carbon-300 uppercase tracking-[0.2em]">{label}</p>
         <div className="w-6 h-6 rounded-lg bg-carbon-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px]">↗️</span>
         </div>
      </div>
      <p className="text-4xl font-black text-carbon-900 tracking-tighter leading-none">{value ?? '—'}</p>
    </div>
    {sub && (
      <div className="mt-6 pt-6 border-t border-carbon-50">
        <p className={`text-[11px] font-black uppercase tracking-widest ${colorClass}`}>{sub}</p>
      </div>
    )}
  </div>
);

const MiniBar = ({ data = [], colorClass = "bg-nature-500" }) => {
  const max = Math.max(...data.map(d => Number(d.count)), 1);
  return (
    <div className="flex items-end gap-1.5 h-20 w-full px-2">
      {data.slice(-24).map((d, i) => (
        <div 
          key={i} 
          title={`${d.day}: ${d.count}`} 
          className={`flex-1 ${colorClass} rounded-t-lg transition-all duration-700 hover:brightness-125`}
          style={{ height: `${Math.max(4, (Number(d.count) / max) * 80)}px`, opacity: 0.3 + (i / 24) * 0.7 }} 
        />
      ))}
    </div>
  );
};

export default function AdminDashboard() {
  const { user } = useAuthStore();
  const navigate  = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'admin') navigate('/');
  }, [user]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn:  () => adminApi.getStats().then(r => r.data),
    refetchInterval: 30000,
  });

  const s = data?.stats || {};

  return (
    <div className="min-h-screen bg-[#FBFBFC] pt-32 pb-24 px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Kontrol Paneli Header */}
        <div className="bg-carbon-900 rounded-[40px] p-10 md:p-12 flex flex-col md:flex-row justify-between items-center gap-10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-nature-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          <div className="space-y-3 z-10 text-center md:text-left">
            <h1 className="text-4xl font-black text-white tracking-tighter">Komuta <span className="text-nature-500">Merkezi</span></h1>
            <p className="text-[11px] text-carbon-400 font-bold uppercase tracking-[0.3em] inline-flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-nature-500 animate-pulse" />
               OPERASYONEL YÖNETİM PANELİ
            </p>
          </div>
          <div className="flex flex-wrap gap-4 z-10 justify-center">
            <Link to="/admin/ilanlar" className="px-10 py-5 bg-carbon-800 text-white hover:bg-carbon-700 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-xl">İLANLAR</Link>
            <Link to="/admin/kullanicilar" className="px-10 py-5 bg-carbon-800 text-white hover:bg-carbon-700 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-xl">ÜYELER</Link>
            <Link to="/admin/raporlar" className="px-10 py-5 bg-nature-500 text-carbon-900 hover:bg-nature-600 rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all shadow-2xl relative flex items-center gap-3">
              RAPORLAR
              {Number(s.pending_reports) > 0 && (
                <span className="bg-carbon-900 text-nature-500 rounded-lg px-2 py-0.5 text-[10px] font-black">
                  {s.pending_reports}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Global Metrikler */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8">
          <StatCard label="TOPLAM KULLANICI" value={Number(s.total_users || 0).toLocaleString('tr-TR')} sub={`+${s.new_users_7d || 0} YENİ ÜYE`} />
          <StatCard label="AKTİF İLANLAR" value={Number(s.active_listings || 0).toLocaleString('tr-TR')} sub={`+${s.new_listings_7d || 0} BU HAFTA`} />
          <StatCard label="BİTEN İŞLEMLER" value={Number(s.total_deals || 0).toLocaleString('tr-TR')} sub={`${s.new_offers_7d || 0} AKTİF TEKLİF`} />
          <StatCard label="MATERYAL DÖNÜŞÜM" value={`${Math.round((s.total_weight_recycled || 0) / 1000)} T`} sub="GERİ KAZANIM" colorClass="text-nature-500" />
          <StatCard label="GÜVENLİK ANALİZİ" value={s.pending_reports || 0} sub="BEKLEYEN RAPOR" colorClass={Number(s.pending_reports) > 0 ? 'text-red-500' : 'text-nature-500'} />
        </div>

        {/* Analitik Trend Grafikleri */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {[
            { title: "Kullanıcı Büyüme Trendi", sub: "Son 30 Günlük Kayıt Verisi", data: data?.dailySignups, color: "bg-carbon-900" },
            { title: "İlan Akış Analizi", sub: "Günlük Yeni İlan Girişleri", data: data?.dailyListings, color: "bg-nature-500" }
          ].map((chart, idx) => (
            <div key={idx} className="bg-white border border-carbon-100 p-10 rounded-[40px] shadow-premium space-y-10 group">
               <div className="flex justify-between items-end">
                  <div className="space-y-2">
                    <h3 className="text-[12px] font-black text-carbon-900 uppercase tracking-[0.2em]">{chart.title}</h3>
                    <p className="text-[11px] text-carbon-300 font-bold uppercase italic">{chart.sub}</p>
                  </div>
                  <span className="text-2xl opacity-10 group-hover:opacity-100 transition-opacity">📊</span>
               </div>
               <div className="flex items-end bg-carbon-50/30 rounded-3xl p-6 border border-carbon-50">
                 <MiniBar data={chart.data || []} colorClass={chart.color} />
               </div>
            </div>
          ))}
        </div>

        {/* Kategorik Performans Tablosu */}
        <div className="bg-white border border-carbon-100 rounded-[40px] overflow-hidden shadow-premium">
          <div className="p-10 border-b border-carbon-50 flex justify-between items-center bg-white">
            <div className="space-y-1">
                <h3 className="text-[12px] font-black text-carbon-900 uppercase tracking-[0.2em]">Pazar Payı ve Kategori Analizi</h3>
                <p className="text-[11px] text-carbon-300 font-bold uppercase">Materyal Bazlı Performans Verileri</p>
            </div>
            <div className="px-4 py-2 bg-nature-100 rounded-full">
                <span className="text-[10px] font-black text-nature-600 uppercase tracking-widest animate-pulse italic">Canlı Veri</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-carbon-50/30 border-b border-carbon-50">
                  {['Materyal', 'Aktif Stok', 'Biten Satış', 'Ortalama Birim', 'Genel Toplam'].map(h => (
                    <th key={h} className="px-10 py-6 text-[10px] font-black text-carbon-400 uppercase tracking-[0.2em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-50">
                {(data?.categories || []).map((c, i) => (
                  <tr key={c.category} className="hover:bg-carbon-50/50 transition-all duration-500 group">
                    <td className="px-10 py-6 text-[14px] font-black text-carbon-900 group-hover:text-nature-600 transition-colors uppercase tracking-tight">{c.category}</td>
                    <td className="px-10 py-6 text-[14px] font-bold text-nature-600">{c.active_count}</td>
                    <td className="px-10 py-6 text-[14px] font-bold text-carbon-900">{c.sold_count}</td>
                    <td className="px-10 py-6 text-[14px] font-bold text-carbon-400">{c.avg_weight ? `${c.avg_weight} KG` : '—'}</td>
                    <td className="px-10 py-6 text-[14px] font-black text-carbon-900">{c.total_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

