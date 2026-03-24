import { useState } from 'react';

const CITIES = [
  'Adana','Ankara','Antalya','Bursa','Denizli','Diyarbakır','Eskişehir',
  'Gaziantep','İstanbul','İzmir','Kayseri','Kocaeli','Konya','Malatya',
  'Mersin','Samsun','Trabzon','Van',
];

const CATS = [
  { value: '', label: 'Tümü' },
  { value: 'demir', label: '🔩 Demir' },
  { value: 'bakir', label: '🔋 Bakır' },
  { value: 'aluminyum', label: '🥤 Alüm.' },
  { value: 'plastik', label: '♻ Plastik' },
  { value: 'elektronik', label: '💻 Elekt.' },
  { value: 'kagit', label: '📦 Kağıt' },
  { value: 'cam', label: '🪟 Cam' },
  { value: 'tekstil', label: '👕 Tekstil' },
];

const SORTS = [
  { value: 'newest',   label: 'En Yeni' },
  { value: 'popular',  label: 'En Popüler' },
  { value: 'weight',   label: 'En Ağır' },
  { value: 'distance', label: 'En Yakın' },
];

export default function AdvancedSearch({ onSearch, onClose }) {
  const [form, setForm] = useState({
    q: '', category: '', city: '', weight_min: '', weight_max: '',
    sort: 'newest', radius: '', use_location: false,
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = {};
    Object.entries(form).forEach(([k, v]) => { if (v !== '' && v !== false) params[k] = v; });
    onSearch(params);
    onClose?.();
  };

  const reset = () => setForm({
    q: '', category: '', city: '', weight_min: '', weight_max: '',
    sort: 'newest', radius: '', use_location: false,
  });

  const inputClass = "w-full bg-white border border-carbon-100 rounded-xl px-4 py-2.5 text-sm font-bold text-carbon-900 placeholder:text-carbon-300 focus:ring-2 focus:ring-nature-500 outline-none transition-all";
  const labelClass = "block text-[10px] font-black text-carbon-400 uppercase tracking-widest mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-col gap-6">

        {/* Metin arama */}
        <div>
          <label className={labelClass}>Kelime Filtrele</label>
          <input
            value={form.q}
            onChange={e => set('q', e.target.value)}
            placeholder="Başlık veya açıklama..."
            className={inputClass}
          />
        </div>

        {/* Kategori */}
        <div>
          <label className={labelClass}>Materyal Türü</label>
          <div className="grid grid-cols-3 gap-2">
            {CATS.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => set('category', c.value)}
                className={`px-2 py-3 rounded-xl text-[11px] font-bold transition-all border
                  ${form.category === c.value 
                    ? 'bg-carbon-900 border-carbon-900 text-nature-500 shadow-lg' 
                    : 'bg-white border-carbon-100 text-carbon-500 hover:border-carbon-400'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Konum & Şehir */}
        <div className="grid grid-cols-2 gap-4">
          <div>
             <label className={labelClass}>Konum</label>
             <select value={form.city} onChange={e => set('city', e.target.value)} className={inputClass}>
               <option value="">TÜRKİYE</option>
               {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
          <div>
             <label className={labelClass}>Yarıçap (KM)</label>
             <select value={form.radius} onChange={e => set('radius', e.target.value)} className={inputClass}>
               <option value="">TÜMÜ</option>
               <option value="10">10 KM</option>
               <option value="25">25 KM</option>
               <option value="50">50 KM</option>
               <option value="100">100 KM</option>
             </select>
          </div>
        </div>

        {/* Ağırlık aralığı */}
        <div>
          <label className={labelClass}>Ağırlık Kapasitesi (KG)</label>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              value={form.weight_min}
              onChange={e => set('weight_min', e.target.value)}
              placeholder="Min"
              className={inputClass}
            />
            <input
              type="number"
              value={form.weight_max}
              onChange={e => set('weight_max', e.target.value)}
              placeholder="Max"
              className={inputClass}
            />
          </div>
        </div>

        {/* Sıralama */}
        <div>
          <label className={labelClass}>Sıralama Modu</label>
          <div className="grid grid-cols-2 gap-2">
            {SORTS.map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => set('sort', s.value)}
                className={`py-3 rounded-xl text-[11px] font-bold transition-all border
                  ${form.sort === s.value 
                    ? 'bg-carbon-900 border-carbon-900 text-nature-500 shadow-lg' 
                    : 'bg-white border-carbon-100 text-carbon-600 hover:border-carbon-400'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Butonlar */}
        <div className="flex gap-3 pt-6 border-t border-carbon-50">
          <button
            type="button"
            onClick={reset}
            className="flex-1 py-3.5 bg-carbon-50 text-carbon-400 hover:bg-carbon-100 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all"
          >
            TEMİZLE
          </button>
          <button
            type="submit"
            className="flex-[2] py-3.5 bg-nature-500 text-nature-950 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-nature-600 transition-all shadow-xl shadow-nature-500/10"
          >
            SONUÇLARI GÖSTER
          </button>
        </div>
      </div>
    </form>
  );
}
