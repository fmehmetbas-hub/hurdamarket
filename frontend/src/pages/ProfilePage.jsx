import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../store/auth.store';
import { listingsApi, offersApi, authApi } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function ProfilePage() {
  const { user, logout, fetchMe } = useAuthStore();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    city: user?.city || '',
    district: user?.district || '',
  });

  const { data: myListings = [] } = useQuery({
    queryKey: ['my-listings'],
    queryFn:  () => listingsApi.getMine().then(r => r.data.listings),
    enabled:  !!user,
  });

  const { data: myOffers = [] } = useQuery({
    queryKey: ['my-offers'],
    queryFn:  () => offersApi.getMine().then(r => r.data),
    enabled:  !!user,
  });

  const updateMutation = useMutation({
    mutationFn: (data) => authApi.updateMe(data),
    onSuccess: () => {
      toast.success('Profil güncellendi.');
      setIsEditing(false);
      fetchMe(); // Zustand store'u güncelle
      queryClient.invalidateQueries(['auth-me']);
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Güncelleme hatası.'),
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const STATUS_THEME = {
    active:    'bg-nature-100 text-nature-600 border-nature-200',
    pending:   'bg-amber-50 text-amber-600 border-amber-100',
    sold:      'bg-carbon-900 text-nature-500 border-carbon-900',
    cancelled: 'bg-carbon-50 text-carbon-300 border-carbon-100',
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#FBFBFC] pt-[120px] pb-20 px-4 font-sans">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Profil Kartı */}
        <div className="bg-white rounded-premium p-8 md:p-12 border border-carbon-100 shadow-premium relative overflow-hidden group">
          {/* Süsleme */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-nature-500/5 rounded-full blur-3xl" />
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-10 relative z-10">
            {/* Avatar */}
            <div className="w-32 h-32 bg-carbon-900 text-nature-500 rounded-[40px] flex items-center justify-center text-5xl font-black shadow-2xl relative group-hover:rotate-6 transition-transform">
              {user.name?.[0]?.toUpperCase()}
              {user.is_premium && (
                 <div className="absolute -top-3 -right-3 w-10 h-10 bg-nature-500 text-nature-950 rounded-full flex items-center justify-center border-4 border-white text-base">💎</div>
              )}
            </div>

            <div className="flex-1 space-y-6 text-center md:text-left">
              {isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-carbon-400 uppercase tracking-widest pl-1">Ad Soyad</label>
                    <input 
                      className="w-full bg-carbon-50 border border-carbon-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-nature-500 outline-none" 
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-carbon-400 uppercase tracking-widest pl-1">E-Posta</label>
                    <input 
                      className="w-full bg-carbon-50 border border-carbon-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-nature-500 outline-none" 
                      value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-carbon-400 uppercase tracking-widest pl-1">Şehir</label>
                    <input 
                      className="w-full bg-carbon-50 border border-carbon-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-nature-500 outline-none" 
                      value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-1.5 text-left">
                    <label className="text-[10px] font-black text-carbon-400 uppercase tracking-widest pl-1">İlçe</label>
                    <input 
                      className="w-full bg-carbon-50 border border-carbon-100 rounded-xl px-4 py-2.5 text-sm font-bold focus:ring-2 focus:ring-nature-500 outline-none" 
                      value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} 
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <h1 className="text-4xl font-black text-carbon-900 tracking-tight italic">{user.name}</h1>
                    <span className="px-4 py-1.5 bg-carbon-900 text-nature-500 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg">
                      {user.role}
                    </span>
                  </div>
                  <div className="flex flex-wrap justify-center md:justify-start gap-4">
                    <p className="text-carbon-400 font-bold text-sm bg-carbon-50 px-3 py-1 rounded-lg">📞 {user.phone}</p>
                    {user.email && <p className="text-carbon-400 font-bold text-sm bg-carbon-50 px-3 py-1 rounded-lg">✉️ {user.email}</p>}
                    <p className="text-carbon-400 font-bold text-sm bg-carbon-50 px-3 py-1 rounded-lg">📍 {user.city} {user.district ? `/ ${user.district}` : ''}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-4">
                {isEditing ? (
                  <>
                    <button onClick={handleSave} disabled={updateMutation.isLoading} className="w-full sm:w-auto px-8 py-3 bg-nature-500 text-nature-950 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-nature-500/20 active:scale-95 transition-all">
                      {updateMutation.isLoading ? 'KAYDEDİLİYOR...' : 'DEĞİŞİKLİKLERİ KAYDET'}
                    </button>
                    <button onClick={() => setIsEditing(false)} className="w-full sm:w-auto px-6 py-3 text-carbon-400 font-black text-xs uppercase tracking-widest hover:text-carbon-900 transition-colors">
                      İPTAL ET
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setIsEditing(true)} className="w-full sm:w-auto px-8 py-3 bg-carbon-900 text-white hover:bg-carbon-800 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-carbon-900/10 active:scale-95 transition-all border border-carbon-900">
                      PROFİLİ DÜZENLE
                    </button>
                    <button onClick={logout} className="w-full sm:w-auto px-6 py-3 border border-red-50 text-red-500 hover:bg-red-50 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">
                      GÜVENLİ ÇIKIŞ
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Skor Matrisi */}
            {!isEditing && (
              <div className="flex flex-row md:flex-col gap-6 md:gap-4 md:border-l md:border-carbon-100 md:pl-10 md:min-w-[140px]">
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black text-carbon-300 uppercase tracking-widest mb-1">DEĞERLENDİRME</p>
                  <p className="text-2xl font-black text-nature-600">★ {user.rating || '5.0'}</p>
                </div>
                <div className="text-center md:text-left">
                  <p className="text-[10px] font-black text-carbon-300 uppercase tracking-widest mb-1">AKTİF İLANLAR</p>
                  <p className="text-2xl font-black text-carbon-900">{myListings.length}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
          {/* İlanlarım Bölümü */}
          <section className="lg:col-span-3 space-y-8">
            <div className="flex justify-between items-end px-2">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-carbon-900 tracking-tight italic">İlanlarım</h2>
                <p className="text-[10px] text-carbon-400 font-bold uppercase tracking-widest">AKTİF PAZAR YERİ LİSTELERİNİZ</p>
              </div>
              <Link to="/ilan-ver" className="text-[11px] font-black text-nature-950 bg-nature-500 px-6 py-3 rounded-xl hover:bg-nature-400 transition-all uppercase tracking-widest shadow-lg shadow-nature-500/10">
                + YENİ İLAN
              </Link>
            </div>

            {myListings.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-premium border border-dashed border-carbon-200 space-y-4">
                <p className="text-carbon-300 font-black uppercase tracking-widest text-xs">Henüz bir ilan paylaşmadınız.</p>
                <Link to="/ilan-ver" className="inline-block text-nature-600 font-black text-[11px] uppercase tracking-widest border-b-2 border-nature-600 pb-1">İLK İLANINI OLUŞTUR →</Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myListings.map(l => (
                  <div key={l.id} className="bg-white border border-carbon-100 hover:border-carbon-900 rounded-2xl p-5 flex gap-6 transition-all group shadow-sm hover:shadow-xl relative overflow-hidden">
                    <div className="w-24 h-24 bg-carbon-50 rounded-2xl overflow-hidden flex-shrink-0 border border-carbon-100/50">
                      {l.cover_photo
                        ? <img src={l.cover_photo} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        : <div className="w-full h-full flex items-center justify-center text-carbon-100 text-3xl">♻️</div>
                      }
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                      <p className="text-lg font-black text-carbon-900 group-hover:text-nature-600 transition-colors truncate tracking-tight">{l.title}</p>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-carbon-400 uppercase tracking-widest px-2 py-0.5 bg-carbon-50 rounded">{l.city}</span>
                        <div className="w-1 h-1 bg-carbon-100 rounded-full" />
                        <span className="text-[10px] font-bold text-carbon-400 uppercase tracking-widest">{l.offer_count} TEKLİF</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end justify-between py-1">
                      <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border-2 ${STATUS_THEME[l.status]}`}>
                        {l.status === 'active' ? 'Aktif' : l.status === 'pending' ? 'Bekliyor' : l.status === 'sold' ? 'Satıldı' : 'İptal'}
                      </span>
                      <Link to={`/ilan/${l.id}/teklifler`} className="text-[10px] font-black text-carbon-900 hover:text-nature-600 uppercase tracking-widest bg-carbon-50 px-4 py-2 rounded-xl transition-all">İncele →</Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Tekliflerim Bölümü */}
          <section className="lg:col-span-2 space-y-8">
            <div className="px-2 space-y-1">
              <h2 className="text-3xl font-black text-carbon-900 tracking-tight italic">Tekliflerim</h2>
              <p className="text-[10px] text-carbon-400 font-bold uppercase tracking-widest">VERİLEN GÜNCEL TEKLİFLER</p>
            </div>

            {myOffers.length === 0 ? (
              <div className="text-center py-20 bg-carbon-50/50 rounded-premium border border-dashed border-carbon-200">
                <p className="text-carbon-300 font-black uppercase tracking-widest text-xs">Henüz bir teklif yok.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myOffers.map(o => (
                  <Link key={o.id} to={`/ilan/${o.listing_id}`} className="block bg-white border border-carbon-100 hover:border-carbon-900 rounded-2xl p-6 transition-all shadow-sm hover:shadow-xl group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <p className="text-base font-black text-carbon-900 group-hover:text-nature-600 transition-colors line-clamp-1 tracking-tight">{o.listing_title}</p>
                        <p className="text-[10px] text-carbon-400 font-bold uppercase tracking-widest">{o.listing_city} • {o.listing_category}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-carbon-900 tracking-tight leading-none">{Number(o.price).toLocaleString('tr-TR')} ₺</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-carbon-50">
                       <span className="text-[10px] font-black text-carbon-300 uppercase tracking-widest">DURUM ANALİZİ</span>
                       <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${
                          o.status === 'accepted'  ? 'bg-nature-500 text-nature-950' :
                          o.status === 'rejected'  ? 'bg-red-50 text-red-500 border border-red-100'   :
                          o.status === 'cancelled' ? 'bg-carbon-50 text-carbon-300' : 'bg-amber-50 text-amber-500 border border-amber-100'
                        }`}>
                          {o.status === 'pending'   ? 'Bekliyor'      :
                           o.status === 'accepted'  ? 'Kabul Edildi'  :
                           o.status === 'rejected'  ? 'Reddedildi'    : 'İptal'}
                       </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
