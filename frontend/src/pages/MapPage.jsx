import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listingsApi } from '../services/api';
import useGeolocation from '../hooks/useGeolocation';

const CAT_COLORS = {
  demir:     '#6b7280',
  bakir:     '#d97706',
  aluminyum: '#3b82f6',
  plastik:   '#10b981',
  elektronik:'#8b5cf6',
  kagit:     '#f59e0b',
  cam:       '#06b6d4',
  tekstil:   '#ec4899',
  diger:     '#6b7280',
};

const CATEGORIES = [
  { value: '', label: 'Tümü' },
  { value: 'demir', label: 'Demir' },
  { value: 'bakir', label: 'Bakır' },
  { value: 'aluminyum', label: 'Alüminyum' },
  { value: 'plastik', label: 'Plastik' },
  { value: 'elektronik', label: 'Elektronik' },
  { value: 'kagit', label: 'Kağıt' },
  { value: 'cam', label: 'Cam' },
  { value: 'tekstil', label: 'Tekstil' },
];

export default function MapPage() {
  const mapRef      = useRef(null);
  const leafletRef  = useRef(null);
  const markersRef  = useRef([]);
  const navigate    = useNavigate();
  const { coords, loading: geoLoading, retry } = useGeolocation();
  const [category, setCategory] = useState('');
  const [radius,   setRadius]   = useState(50);
  const [selected, setSelected] = useState(null);

  const { data: mapListings = [], refetch } = useQuery({
    queryKey: ['map-listings', category, coords, radius],
    queryFn:  () => listingsApi.getForMap({
      category,
      ...(coords ? { lat: coords.lat, lng: coords.lng, radius } : {}),
    }).then(r => r.data),
  });

  // Leaflet haritayı başlat
  useEffect(() => {
    if (leafletRef.current) return;

    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      center: [39.1, 35.6], // Türkiye merkezi
      zoom:   6,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    leafletRef.current = map;

    return () => {
      map.remove();
      leafletRef.current = null;
    };
  }, []);

  // Kullanıcı konumu gelince haritayı oraya götür
  useEffect(() => {
    if (!coords || !leafletRef.current) return;
    const L = window.L;
    leafletRef.current.setView([coords.lat, coords.lng], 11);

    // Kullanıcı konumu marker
    L.circleMarker([coords.lat, coords.lng], {
      radius: 8, fillColor: '#1a6b3c', fillOpacity: 1,
      color: '#fff', weight: 3,
    }).addTo(leafletRef.current).bindPopup('Konumunuz');
  }, [coords]);

  // İlanları haritaya ekle
  useEffect(() => {
    const L = window.L;
    if (!L || !leafletRef.current) return;

    // Eski marker'ları temizle
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    mapListings.forEach(listing => {
      if (!listing.lat || !listing.lng) return;

      const color = CAT_COLORS[listing.category] || '#6b7280';

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          background:${color}; color:#fff; border:2px solid #fff;
          border-radius:50% 50% 50% 0; transform:rotate(-45deg);
          width:28px; height:28px; display:flex; align-items:center; justify-content:center;
          box-shadow:0 2px 8px rgba(0,0,0,.25); cursor:pointer;
        ">
          <span style="transform:rotate(45deg); font-size:11px; font-weight:700;">
            ${listing.category.slice(0,2).toUpperCase()}
          </span>
        </div>`,
        iconSize:   [28, 28],
        iconAnchor: [14, 28],
        popupAnchor:[0, -28],
      });

      const marker = L.marker([listing.lat, listing.lng], { icon })
        .addTo(leafletRef.current)
        .on('click', () => setSelected(listing));

      markersRef.current.push(marker);
    });
  }, [mapListings]);

  return (
    <div className="h-screen flex flex-col pt-[72px] bg-[#FBFBFC]">
      {/* Leaflet Assets */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      
      {/* Kontrol Barı */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-carbon-100/50 px-6 py-4 flex flex-wrap items-center gap-6 z-10 shadow-sm">
        {/* Kategoriler */}
        <div className="flex-1 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`whitespace-nowrap px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 active:scale-95 border
                ${category === c.value
                  ? 'bg-carbon-900 text-nature-500 border-carbon-900 shadow-lg'
                  : 'bg-white text-carbon-400 border-carbon-100 hover:border-nature-500/30'}`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Yarıçap & Konum */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-carbon-50 px-4 py-2 rounded-2xl border border-carbon-100 shadow-inner-soft">
            <span className="text-[10px] text-carbon-400 font-black uppercase tracking-widest">Mesafe</span>
            <select
              value={radius}
              onChange={e => setRadius(Number(e.target.value))}
              className="bg-transparent text-xs font-black text-carbon-900 outline-none cursor-pointer"
            >
              {[10, 25, 50, 100, 200].map(r => <option key={r} value={r}>{r} km</option>)}
            </select>
          </div>

          <button
            onClick={retry}
            disabled={geoLoading}
            className={`px-5 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg transition-all active:scale-95
              ${coords 
                ? 'bg-nature-100 text-nature-600 border border-nature-200' 
                : 'bg-carbon-900 text-nature-500 border border-carbon-900'}`}
          >
            {geoLoading ? '...' : coords ? 'Konumum' : 'Konum Bul'}
          </button>
          
          <div className="hidden lg:flex flex-col items-end">
             <span className="text-[10px] text-carbon-300 font-black uppercase tracking-widest">Sonuç</span>
             <span className="text-xs font-black text-carbon-900">{mapListings.length} İLAN</span>
          </div>
        </div>
      </div>

      {/* Harita + Yan Panel */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Harita Alanı */}
        <div ref={mapRef} className="flex-1 z-0 grayscale-[0.2] contrast-[1.1] brightness-[0.95]" />

        {/* Seçili İlan Kartı (Yandan Kayar) */}
        {selected && (
          <div className="absolute top-6 right-6 bottom-6 w-full max-w-[320px] z-[1000] animate-in slide-in-from-right-8 duration-500">
            <div className="bg-white/90 backdrop-blur-2xl h-full rounded-premium border border-white shadow-premium flex flex-col overflow-hidden">
              <div className="p-4 border-b border-carbon-100/50 flex justify-between items-center bg-carbon-50/30">
                <span className="text-[10px] font-black text-carbon-400 uppercase tracking-[0.2em]">İLAN DETAYI</span>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-xl hover:bg-carbon-100 flex items-center justify-center text-carbon-400 transition-colors">×</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {selected.cover_photo ? (
                  <div className="aspect-video rounded-2xl overflow-hidden shadow-lg border border-carbon-100">
                    <img src={selected.cover_photo} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="aspect-video rounded-2xl bg-carbon-50 flex items-center justify-center text-4xl grayscale opacity-30 border border-dashed border-carbon-200">♻</div>
                )}

                <div>
                  <span className="inline-block text-[9px] font-black text-nature-600 bg-nature-100 px-3 py-1 rounded-lg uppercase tracking-widest mb-3">
                    {selected.category}
                  </span>
                  <h3 className="text-lg font-black text-carbon-900 leading-tight mb-3">{selected.title}</h3>
                  
                  <div className="space-y-2">
                    <p className="text-[12px] font-bold text-carbon-400 flex items-center gap-2">
                       <span className="text-nature-500">📍</span> {selected.city}
                    </p>
                    {selected.weight_kg && (
                      <p className="text-[12px] font-bold text-carbon-400 flex items-center gap-2">
                        <span className="text-nature-500">⚖</span> {selected.weight_kg} kg
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-carbon-100/50">
                   <p className="text-xs text-carbon-500 leading-relaxed line-clamp-4">
                     {selected.description || "Açıklama belirtilmemiş."}
                   </p>
                </div>
              </div>

              <div className="p-6 bg-carbon-50/50">
                <button
                  onClick={() => navigate(`/ilan/${selected.id}`)}
                  className="w-full bg-carbon-900 hover:bg-carbon-950 text-nature-500 py-4 rounded-2xl font-black text-sm tracking-widest uppercase transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 group"
                >
                  <span>İlanı İncele</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
