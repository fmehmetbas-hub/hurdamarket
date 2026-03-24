import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const CAT_COLORS = { 
  demir:      'bg-slate-100 text-slate-600', 
  bakir:      'bg-amber-100 text-amber-700', 
  aluminyum:  'bg-blue-100 text-blue-600', 
  plastik:    'bg-emerald-100 text-emerald-600', 
  elektronik: 'bg-indigo-100 text-indigo-600', 
  kagit:      'bg-orange-100 text-orange-600', 
  cam:        'bg-cyan-100 text-cyan-600', 
  tekstil:    'bg-pink-100 text-pink-600', 
  diger:      'bg-slate-100 text-slate-500' 
};

export default function AdminListings() {
  const [q,       setQ]       = useState('');
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState('');
  const [category,setCat]     = useState('');
  const [page,    setPage]    = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-listings', search, status, category, page],
    queryFn:  () => adminApi.getListings({ q: search, status, category, page, limit: 30 }).then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: ({ id, ...body }) => adminApi.updateListing(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-listings']);
      toast.success('İlan güncellendi.');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Hata oluştu.'),
  });

  const removeListing = (listing) => {
    const note = window.prompt(`"${listing.title}" ilanını kaldırmak üzeresiniz.\nSatıcıya gönderilecek notu girin:`);
    if (note === null) return;
    mutation.mutate({ id: listing.id, status: 'cancelled', admin_note: note });
  };

  const toggleFeatured = (listing) => {
    mutation.mutate({ id: listing.id, is_featured: !listing.is_featured });
  };

  const listings = data?.listings || [];
  const total    = data?.total    || 0;
  const pages    = Math.ceil(total / 30);

  return (
    <div className="min-h-screen bg-[#FBFBFC] pt-[100px] pb-20 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Başlık */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-premium shadow-sm border border-carbon-100">
          <div>
            <h1 className="text-3xl font-black text-carbon-900 tracking-tight">İlan Moderasyonu</h1>
            <p className="text-[10px] text-carbon-400 font-bold uppercase tracking-[0.2em] mt-1">{total} KAYITLI İLAN BULUNUYOR</p>
          </div>
          <Link to="/admin" className="px-6 py-2.5 bg-carbon-50 text-carbon-900 hover:bg-carbon-100 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all">
            ← DASHBOARD
          </Link>
        </div>

        {/* Filtre Barı */}
        <div className="flex flex-col lg:flex-row gap-4 bg-carbon-900 p-6 rounded-premium shadow-xl">
          <div className="flex-1 relative">
            <input
              value={q} 
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setSearch(q); setPage(1); } }}
              placeholder="Başlık veya satıcı adı..."
              className="w-full bg-carbon-800 border-none text-white rounded-2xl px-6 py-3.5 text-sm font-bold placeholder:text-carbon-500 focus:ring-2 focus:ring-nature-500 outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <select 
              value={status} 
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="bg-carbon-800 border-none text-white rounded-2xl px-6 py-3.5 text-xs font-black uppercase tracking-widest cursor-pointer focus:ring-2 focus:ring-nature-500 outline-none"
            >
              <option value="">TÜM DURUMLAR</option>
              <option value="active">AKTİF</option>
              <option value="pending">BEKLEMEDE</option>
              <option value="sold">SATILDI</option>
              <option value="cancelled">KALDIRILDI</option>
            </select>
            <select 
              value={category} 
              onChange={e => { setCat(e.target.value); setPage(1); }}
              className="bg-carbon-800 border-none text-white rounded-2xl px-6 py-3.5 text-xs font-black uppercase tracking-widest cursor-pointer focus:ring-2 focus:ring-nature-500 outline-none"
            >
              <option value="">TÜM KATEGORİLER</option>
              {['demir','bakir','aluminyum','plastik','elektronik','kagit','cam','tekstil','diger'].map(c => (
                <option key={c} value={c}>{c.toUpperCase()}</option>
              ))}
            </select>
            <button 
              onClick={() => { setSearch(q); setPage(1); }}
              className="px-10 py-3.5 bg-nature-500 text-nature-950 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-nature-600 transition-all shadow-lg shadow-nature-500/10"
            >
              FİLTRELE
            </button>
          </div>
        </div>

        {/* Tablo */}
        <div className="bg-white border border-carbon-100 rounded-premium overflow-hidden shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-carbon-50/50 border-b border-carbon-100">
                  {['İlan & Detay', 'Kategori', 'Satıcı', 'Veri', 'Durum', 'Aksiyon'].map(h => (
                    <th key={h} className="px-8 py-5 text-[10px] font-black text-carbon-400 uppercase tracking-[0.15em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-50">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}><td colSpan={6} className="px-8 py-6"><div className="h-12 bg-carbon-50 animate-pulse rounded-xl w-full" /></td></tr>
                  ))
                ) : listings.map((l, i) => {
                  const hasReport = Number(l.report_count) > 0;
                  return (
                    <tr key={l.id} className={`hover:bg-carbon-50/50 transition-colors group ${hasReport ? 'bg-red-50/30' : ''}`}>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-carbon-100 border border-carbon-200 flex-shrink-0 overflow-hidden shadow-sm shadow-inner">
                            {l.cover_photo
                              ? <img src={l.cover_photo} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                              : <div className="w-full h-full flex items-center justify-center text-2xl">♻</div>}
                          </div>
                          <div className="space-y-1">
                            <Link to={`/ilan/${l.id}`} target="_blank" className="text-[14px] font-black text-carbon-900 group-hover:text-nature-600 transition-colors leading-tight block truncate max-w-[200px]">
                              {l.title}
                            </Link>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-carbon-400 uppercase tracking-tight">{l.city}</span>
                               <span className="w-1 h-1 rounded-full bg-carbon-200" />
                               <span className="text-[10px] font-medium text-carbon-300">{formatDistanceToNow(new Date(l.created_at), { addSuffix: true, locale: tr })}</span>
                            </div>
                            {l.is_featured && <span className="inline-block text-[9px] font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-widest">⭐ ÖNE ÇIKAN</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${CAT_COLORS[l.category] || 'bg-slate-50 text-slate-400'}`}>
                          {l.category}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-[13px] font-black text-carbon-900 leading-tight">{l.seller_name}</p>
                        <p className="text-[11px] font-medium text-carbon-400 mt-1">{l.seller_phone}</p>
                      </td>
                      <td className="px-8 py-6 text-center space-y-2">
                        <div className="flex flex-col items-start gap-1">
                           <span className="text-[10px] font-black text-carbon-300 uppercase tracking-widest">TEKLİF: {l.offer_count}</span>
                           {hasReport && <span className="text-[10px] font-black text-red-500 bg-red-100 px-2 py-0.5 rounded uppercase tracking-widest">⚠️ {l.report_count} RAPOR</span>}
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg border
                          ${l.status === 'active' ? 'bg-nature-100 text-nature-600 border-nature-200' : 
                            l.status === 'cancelled' ? 'bg-red-50 text-red-500 border-red-100' : 
                            l.status === 'sold' ? 'bg-carbon-900 text-nature-500 border-carbon-900' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                          {l.status === 'active' ? 'Aktif' : l.status === 'cancelled' ? 'Kaldırıldı' : l.status === 'sold' ? 'Satıldı' : 'Beklemede'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleFeatured(l)}
                            disabled={mutation.isPending}
                            className={`p-2.5 rounded-xl border transition-all ${l.is_featured ? 'bg-amber-50 border-amber-200 text-amber-600 shadow-inner' : 'bg-white border-carbon-100 text-carbon-300 hover:border-amber-400 hover:text-amber-500'}`}
                          >
                            ⭐
                          </button>
                          {l.status === 'active' && (
                            <button
                              onClick={() => removeListing(l)}
                              disabled={mutation.isPending}
                              className="px-4 py-2.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-100/50"
                            >
                              KALDIR
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sayfalama */}
        {pages > 1 && (
          <div className="flex justify-center gap-2 pt-6">
            {[...Array(Math.min(pages, 10))].map((_, i) => (
              <button 
                key={i} 
                onClick={() => setPage(i + 1)} 
                className={`w-10 h-10 rounded-xl text-xs font-black transition-all duration-300 border
                  ${page === i + 1 
                    ? 'bg-carbon-900 text-nature-500 border-carbon-900 shadow-lg' 
                    : 'bg-white text-carbon-400 border-carbon-100 hover:text-carbon-900 hover:border-carbon-400'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
