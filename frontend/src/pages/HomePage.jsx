import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listingsApi } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const CATEGORIES = [
  { value: '',          label: 'Tümü'       },
  { value: 'demir',     label: 'Demir'      },
  { value: 'bakir',     label: 'Bakır'      },
  { value: 'aluminyum', label: 'Alüminyum'  },
  { value: 'plastik',   label: 'Plastik'    },
  { value: 'elektronik',label: 'Elektronik' },
  { value: 'kagit',     label: 'Kağıt'      },
  { value: 'cam',       label: 'Cam'        },
  { value: 'tekstil',   label: 'Tekstil'    },
  { value: 'diger',     label: 'Diğer'      },
];

export default function HomePage() {
  const [filters, setFilters] = useState({ q: '', category: '', city: '', page: 1 });
  const [search, setSearch]   = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['listings', filters],
    queryFn:  () => listingsApi.getAll(filters).then(r => r.data),
    keepPreviousData: true,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters(f => ({ ...f, q: search, page: 1 }));
  };

  return (
    <div className="min-h-screen pt-[72px] bg-[#FBFBFC]">
      {/* Hero Section */}
      <div className="relative overflow-hidden py-24 md:py-32 px-6 bg-[#FBFBFC]">
        {/* Decorative Background Accents */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-nature-100/30 blur-[150px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-slate-200/40 blur-[140px] rounded-full pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-nature-100 rounded-full mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
             <span className="w-2 h-2 rounded-full bg-nature-600 animate-pulse" />
             <span className="text-[10px] font-black text-nature-600 uppercase tracking-widest">Yeni Nesil Geri Dönüşüm</span>
          </div>
          
          <h1 className="text-5xl md:text-[90px] font-black mb-8 tracking-tighter text-carbon-900 leading-[0.9] md:leading-[0.85]">
             Hurdan <span className="text-nature-600">Değer</span> Kazansın
          </h1>
          <p className="text-lg md:text-xl text-carbon-400 mb-12 max-w-2xl mx-auto font-medium leading-relaxed tracking-tight px-4">
            Hurdalarınızı en doğru fiyatla, güvenilir alıcılarla buluşturun. Pazar yerinde kurumsal ve hızlı ticaret deneyimi.
          </p>
          
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto p-2.5 bg-white/70 backdrop-blur-3xl rounded-[32px] border border-white shadow-premium">
            <div className="flex-1 flex items-center px-6">
              <span className="text-carbon-300 text-xl mr-3">🔍</span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Ne arıyorsunuz? (bakır, demir...)"
                className="w-full bg-transparent py-4 text-carbon-900 text-base placeholder-carbon-200 outline-none font-bold"
              />
            </div>
            <button
              type="submit"
              className="bg-carbon-900 text-nature-500 hover:bg-carbon-950 font-black px-10 py-4 rounded-[24px] transition-all shadow-xl shadow-carbon-900/10 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
            >
              Hemen Ara
            </button>
          </form>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1440px] mx-auto px-6 py-12">
        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-8 mb-12 custom-scrollbar border-b border-carbon-100/50">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setFilters(f => ({ ...f, category: c.value, page: 1 }))}
              className={`whitespace-nowrap px-6 py-2.5 rounded-2xl text-[12px] font-bold uppercase tracking-widest transition-all duration-300 active:scale-95 border
                ${filters.category === c.value
                  ? 'bg-carbon-900 text-nature-500 border-carbon-900 shadow-lg'
                  : 'bg-white text-carbon-400 border-carbon-100 hover:border-nature-500/30 hover:text-carbon-900 shadow-sm'}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Listings Header */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-carbon-900 tracking-tight">Güncel İlanlar</h2>
            <p className="text-[10px] text-carbon-400 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-nature-500" />
               Şu an {data?.total ?? '0'} aktif ilan mevcut
            </p>
          </div>
          
          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border border-carbon-100 shadow-sm">
             <span className="text-[9px] text-carbon-300 font-black uppercase tracking-widest pl-3">Sırala</span>
             <select
              onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
              className="bg-carbon-50 text-[11px] font-bold text-carbon-900 rounded-[14px] px-4 py-2.5 outline-none border-none cursor-pointer hover:bg-carbon-100 transition-colors"
             >
              <option value="newest">En Yeni</option>
              <option value="popular">Popüler</option>
              <option value="oldest">Eski</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-premium h-[450px] animate-pulse border border-carbon-100" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {data?.listings?.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ListingCard({ listing }) {
  return (
    <Link to={`/ilan/${listing.id}`} className="group block h-full">
      <div className="bg-white rounded-premium overflow-hidden border border-white hover:border-nature-100 transition-all duration-500 hover:shadow-premium shadow-sm flex flex-col h-full active:scale-[0.98]">
        {/* Image wrapper */}
        <div className="aspect-square bg-carbon-50 overflow-hidden relative border-b border-carbon-50">
          {listing.cover_photo ? (
            <img
              src={listing.cover_photo}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-carbon-100 text-6xl">
               ♻
            </div>
          )}
          
          <div className="absolute top-4 left-4">
            <span className="text-[9px] uppercase tracking-widest font-black bg-carbon-900 text-nature-500 px-3 py-1.5 rounded-lg shadow-lg">
               {listing.category}
            </span>
          </div>
        </div>

        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-3">
             <span className="text-[10px] text-carbon-300 font-bold uppercase tracking-widest flex items-center gap-1.5">
               <span className="text-nature-500">📍</span> {listing.city}
             </span>
          </div>
          
          <h3 className="font-bold text-lg text-carbon-900 mb-6 line-clamp-2 leading-tight group-hover:text-nature-600 transition-colors">
            {listing.title}
          </h3>
          
          <div className="mt-auto pt-5 border-t border-carbon-50 flex justify-between items-center">
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] text-carbon-300 uppercase font-bold tracking-widest">Ağırlık</span>
              <span className="text-sm text-carbon-900 font-black">{listing.weight_kg ? `${listing.weight_kg} kg` : '--'}</span>
            </div>
            <div className="text-right flex flex-col gap-0.5">
              <span className="text-[9px] text-carbon-300 uppercase font-bold tracking-widest">Tarih</span>
              <span className="text-[11px] font-bold text-carbon-400">
                {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true, locale: tr })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
