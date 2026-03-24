import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { listingsApi, offersApi, favoritesApi } from '../services/api';
import useAuthStore from '../store/auth.store';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function ListingDetailPage() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const queryClient   = useQueryClient();
  const { user }      = useAuthStore();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showOffer, setShowOffer] = useState(false);

  const { data: listing, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn:  () => listingsApi.getById(id).then(r => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const offerMutation = useMutation({
    mutationFn: (data) => offersApi.create(id, data),
    onSuccess: () => {
      toast.success('Teklifiniz gönderildi!');
      reset();
      setShowOffer(false);
      queryClient.invalidateQueries(['listing', id]);
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Teklif gönderilemedi.');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="h-96 bg-gray-100 rounded-2xl animate-pulse mb-6" />
        <div className="h-8 bg-gray-100 rounded animate-pulse w-2/3 mb-4" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
      </div>
    );
  }

  if (!listing) return <div className="text-center py-20 text-gray-400">İlan bulunamadı.</div>;

  const isOwner = user?.id === listing.user_id;
  const photos  = listing.photos || [];
  const mainPhoto = photos[photoIdx]?.url;

  return (
    <div className="min-h-screen bg-[#FBFBFC] pt-[100px] pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 bg-white/70 backdrop-blur-xl p-8 md:p-12 rounded-premium border border-white shadow-premium">
          
          {/* Fotoğraflar */}
          <div className="space-y-4">
            <div className="aspect-[4/5] rounded-premium overflow-hidden bg-carbon-50 shadow-inner-soft group border border-carbon-100/50">
              {mainPhoto ? (
                <img src={mainPhoto} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-carbon-200">
                  <span className="text-6xl mb-4">♻</span>
                  <p className="text-xs font-bold uppercase tracking-widest">Fotoğraf Yok</p>
                </div>
              )}
            </div>
            {photos.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {photos.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => setPhotoIdx(i)}
                    className={`w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 transition-all p-0.5
                      ${i === photoIdx ? 'border-nature-500 shadow-lg scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                  >
                    <img src={p.url} alt="" className="w-full h-full object-cover rounded-[14px]" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detaylar & Aksiyonlar */}
          <div className="flex flex-col">
            <div className="mb-6">
              <span className="inline-block text-[10px] font-black text-nature-600 bg-nature-100 px-3 py-1.5 rounded-lg uppercase tracking-widest mb-4">
                {listing.category}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-carbon-900 leading-tight tracking-tight mb-4">{listing.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-[12px] font-bold text-carbon-400 uppercase tracking-wide">
                <span className="flex items-center gap-1.5"><span className="text-nature-500">📍</span> {listing.city}{listing.district ? ` / ${listing.district}` : ''}</span>
                {listing.weight_kg && <span className="flex items-center gap-1.5"><span className="text-nature-500">⚖</span> {listing.weight_kg} kg</span>}
                <span className="flex items-center gap-1.5"><span className="text-nature-500">🕒</span> {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true, locale: tr })}</span>
              </div>
            </div>

            <div className="border-t border-carbon-100/50 pt-6 mb-8">
              <p className="text-carbon-600 leading-relaxed text-base font-medium">
                {listing.description || "Bu ilan için açıklama belirtilmemiş."}
              </p>
            </div>

            {/* Satıcı Bilgisi */}
            <div className="bg-carbon-50/50 rounded-premium p-6 mb-8 border border-carbon-100/50">
              <p className="text-[10px] font-bold text-carbon-400 uppercase tracking-widest mb-4">İlan Sahibi</p>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-carbon-900 text-nature-500 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                  {listing.seller_name?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-lg text-carbon-900">{listing.seller_name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-nature-600 font-bold text-sm">★ {listing.seller_rating || '5.0'}</span>
                    <span className="text-carbon-400 text-xs font-medium">· {listing.seller_reviews || 0} Değerlendirme</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Aksiyon Butonları */}
            <div className="mt-auto">
              {!isOwner && listing.status === 'active' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {!showOffer ? (
                    <button
                      onClick={() => user ? setShowOffer(true) : navigate('/giris')}
                      className="w-full bg-carbon-900 hover:bg-carbon-950 text-nature-500 py-5 rounded-premium font-black text-lg transition-all shadow-xl shadow-carbon-900/10 active:scale-[0.98] flex items-center justify-center gap-3 group"
                    >
                      <span>Teklif Ver</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </button>
                  ) : (
                    <form onSubmit={handleSubmit(d => offerMutation.mutate(d))} className="space-y-4 bg-white p-6 rounded-premium border border-carbon-100 shadow-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-carbon-500 uppercase tracking-widest pl-3">Teklif (₺)</label>
                          <input
                            type="number"
                            step="0.01"
                            {...register('price', { required: true, min: 1 })}
                            placeholder="Örn: 500"
                            className="w-full bg-carbon-50 border border-carbon-100 text-carbon-900 px-4 py-3 rounded-2xl outline-none focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500/30 transition-all font-bold placeholder:font-medium"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-carbon-500 uppercase tracking-widest pl-3">Pickup Tarihi</label>
                          <input
                            type="date"
                            {...register('pickup_date')}
                            className="w-full bg-carbon-50 border border-carbon-100 text-carbon-900 px-4 py-3 rounded-2xl outline-none focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500/30 transition-all font-bold"
                          />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-carbon-500 uppercase tracking-widest pl-3">Bize Notun</label>
                        <textarea
                          {...register('note')}
                          rows={2}
                          placeholder="Ek bilgi ekleyin..."
                          className="w-full bg-carbon-50 border border-carbon-100 text-carbon-900 px-4 py-3 rounded-2xl outline-none focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500/30 transition-all text-sm font-medium resize-none shadow-inner-soft"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          type="submit"
                          disabled={offerMutation.isPending}
                          className="flex-1 bg-carbon-900 text-nature-500 py-4 rounded-2xl font-black hover:bg-carbon-950 transition active:scale-95 disabled:opacity-60"
                        >
                          {offerMutation.isPending ? 'Gönderiliyor...' : 'Teklifi Gönder'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowOffer(false)}
                          className="px-6 border border-carbon-100 text-carbon-500 font-bold rounded-2xl hover:bg-carbon-50 transition"
                        >
                          Vazgeç
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {isOwner && (
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => navigate(`/ilan/${id}/duzenle`)}
                    className="flex-1 border-2 border-carbon-900 text-carbon-900 py-4 rounded-premium font-black text-base hover:bg-carbon-50 transition active:scale-95"
                  >
                    İlanı Düzenle
                  </button>
                  <button
                    onClick={() => navigate(`/ilan/${id}/teklifler`)}
                    className="flex-1 bg-carbon-900 text-nature-500 py-5 rounded-premium font-black text-base hover:bg-carbon-950 transition shadow-xl active:scale-95"
                  >
                    Teklifleri Gör
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
