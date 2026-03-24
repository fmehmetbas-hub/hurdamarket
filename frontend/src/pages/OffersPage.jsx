import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { offersApi, listingsApi } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import ChatPanel from '../components/ChatPanel';
import { useState } from 'react';

const STATUS_MAP = {
  pending:   { label: 'Bekliyor',  cls: 'bg-amber-50 text-amber-600 border-amber-100' },
  accepted:  { label: 'Kabul Edildi', cls: 'bg-nature-100 text-nature-600 border-nature-200' },
  rejected:  { label: 'Reddedildi', cls: 'bg-red-50 text-red-500 border-red-100' },
  cancelled: { label: 'İptal',      cls: 'bg-carbon-50 text-carbon-300 border-carbon-100' },
};

export default function OffersPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeOffer, setActiveOffer] = useState(null);

  const { data: listing } = useQuery({
    queryKey: ['listing', id],
    queryFn:  () => listingsApi.getById(id).then(r => r.data),
  });

  const { data: offers = [], isLoading } = useQuery({
    queryKey: ['offers', id],
    queryFn:  () => offersApi.getForListing(id).then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: ({ offerId, status }) => offersApi.updateStatus(offerId, status),
    onSuccess: (_, { status }) => {
      toast.success(status === 'accepted' ? 'Teklif kabul edildi!' : 'Teklif reddedildi.');
      queryClient.invalidateQueries(['offers', id]);
    },
    onError: () => toast.error('İşlem başarısız.'),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBFBFC] pt-[100px] px-4 space-y-6 max-w-4xl mx-auto">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-white rounded-premium border border-carbon-100 animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBFBFC] pt-[100px] pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        {listing && (
          <div className="mb-10 space-y-2">
            <span className="text-[10px] font-black text-carbon-400 uppercase tracking-[0.2em]">İhaleye Gelen Teklifler</span>
            <h1 className="text-3xl font-black text-carbon-900 tracking-tight leading-tight">{listing.title}</h1>
            <div className="flex items-center gap-3">
               <span className="text-xs font-bold text-carbon-400">📍 {listing.city}</span>
               <span className="w-1 h-1 rounded-full bg-carbon-200" />
               <span className="text-xs font-black text-nature-600">{offers.length} AKTİF TEKLİF</span>
            </div>
          </div>
        )}

        {offers.length === 0 ? (
          <div className="text-center py-24 bg-white/70 backdrop-blur-xl rounded-premium border border-white shadow-premium">
            <p className="text-6xl mb-6 grayscale opacity-20">📭</p>
            <p className="text-carbon-400 font-bold uppercase tracking-widest text-sm">Henüz teklif gelmedi.</p>
          </div>
        ) : (
          <div className={`grid gap-8 ${activeOffer ? 'lg:grid-cols-2' : ''}`}>
            <div className="space-y-4">
              {offers.map(offer => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  isActive={activeOffer?.id === offer.id}
                  onChat={() => setActiveOffer(activeOffer?.id === offer.id ? null : offer)}
                  onAccept={() => mutation.mutate({ offerId: offer.id, status: 'accepted' })}
                  onReject={() => mutation.mutate({ offerId: offer.id, status: 'rejected' })}
                  isPending={mutation.isPending}
                />
              ))}
            </div>

            {activeOffer && (
              <div className="bg-white/90 backdrop-blur-2xl border border-white rounded-premium overflow-hidden sticky top-[100px] h-[600px] shadow-premium flex flex-col animate-in slide-in-from-right-8 duration-500">
                <div className="px-6 py-4 border-b border-carbon-100/50 flex justify-between items-center bg-carbon-50/30">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-carbon-300 uppercase tracking-widest">Canlı Pazarlık</span>
                    <p className="font-black text-sm text-carbon-900">{activeOffer.buyer_name}</p>
                  </div>
                  <button onClick={() => setActiveOffer(null)} className="w-8 h-8 rounded-xl hover:bg-carbon-100 flex items-center justify-center text-carbon-400 transition-colors">×</button>
                </div>
                <div className="flex-1 overflow-hidden">
                   <ChatPanel offerId={activeOffer.id} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function OfferCard({ offer, isActive, onChat, onAccept, onReject, isPending }) {
  const s = STATUS_MAP[offer.status];
  return (
    <div className={`bg-white border transition-all duration-300 rounded-premium p-6 shadow-sm hover:shadow-md
      ${isActive ? 'border-nature-500 shadow-premium scale-[1.02]' : 'border-carbon-100'}`}>
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-carbon-900 text-nature-500 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg">
            {offer.buyer_name?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-black text-carbon-900 leading-tight">{offer.buyer_name}</p>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-nature-600 font-bold text-[11px]">★ {offer.buyer_rating || '5.0'}</span>
               <span className="text-carbon-400 text-[11px] font-medium">· {offer.buyer_reviews || 0} Yorum</span>
            </div>
          </div>
        </div>
        <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg border ${s.cls}`}>{s.label}</span>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="space-y-1">
          <p className="text-[10px] text-carbon-300 font-black uppercase tracking-widest">Teklif</p>
          <p className="text-2xl font-black text-carbon-900 leading-none tracking-tight">{Number(offer.price).toLocaleString('tr-TR')} ₺</p>
        </div>
        {offer.pickup_date && (
          <div className="space-y-1">
            <p className="text-[10px] text-carbon-300 font-black uppercase tracking-widest">Toplama Tarihi</p>
            <p className="text-xs font-bold text-carbon-700">
               {format(new Date(offer.pickup_date), 'd MMMM yyyy', { locale: tr })}
            </p>
          </div>
        )}
      </div>

      {offer.note && (
        <div className="bg-carbon-50/50 rounded-xl px-4 py-3 mb-6 border border-carbon-100/30">
           <p className="text-[11px] text-carbon-500 leading-relaxed font-medium">"{offer.note}"</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onChat}
          className={`flex-1 py-3.5 rounded-2xl text-[11px] font-black border uppercase tracking-widest transition-all
            ${isActive 
              ? 'bg-carbon-900 text-nature-500 border-carbon-900' 
              : 'border-carbon-100 text-carbon-500 hover:border-nature-500/30 hover:text-nature-600'}`}
        >
          {isActive ? 'Kapat' : 'Mesajlaş'}
        </button>

        {offer.status === 'pending' && (
          <>
            <button
              onClick={onReject}
              disabled={isPending}
              className="flex-1 py-3.5 rounded-2xl text-[11px] font-black border border-red-100 text-red-400 hover:bg-red-50 uppercase tracking-widest transition-all disabled:opacity-50"
            >
              Reddet
            </button>
            <button
              onClick={onAccept}
              disabled={isPending}
              className="flex-1 py-3.5 rounded-2xl text-[11px] font-black bg-nature-500 text-nature-950 hover:bg-nature-600 uppercase tracking-widest transition-all shadow-lg shadow-nature-100 disabled:opacity-50 active:scale-95"
            >
              Kabul Et
            </button>
          </>
        )}
      </div>
    </div>
  );
}
