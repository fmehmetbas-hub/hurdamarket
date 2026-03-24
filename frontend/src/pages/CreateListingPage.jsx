import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { listingsApi } from '../services/api';

const CATEGORIES = [
  { value: 'demir',     label: 'Demir',       icon: '🔩' },
  { value: 'bakir',     label: 'Bakır',        icon: '🔋' },
  { value: 'aluminyum', label: 'Alüminyum',    icon: '🥤' },
  { value: 'plastik',   label: 'Plastik',      icon: '♻' },
  { value: 'elektronik',label: 'Elektronik',   icon: '💻' },
  { value: 'kagit',     label: 'Kağıt/Karton', icon: '📦' },
  { value: 'cam',       label: 'Cam',          icon: '🪟' },
  { value: 'tekstil',   label: 'Tekstil',      icon: '👕' },
  { value: 'diger',     label: 'Diğer',        icon: '🗂' },
];

const CITIES = [
  'Adana','Ankara','Antalya','Bursa','Denizli','Diyarbakır','Eskişehir',
  'Gaziantep','İstanbul','İzmir','Kayseri','Kocaeli','Konya','Malatya',
  'Mersin','Samsun','Trabzon','Van','Diğer'
];

export default function CreateListingPage() {
  const navigate  = useNavigate();
  const [photos, setPhotos]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCat, setSelectedCat] = useState('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  const onDrop = useCallback((accepted) => {
    if (photos.length + accepted.length > 8) {
      toast.error('En fazla 8 fotoğraf ekleyebilirsiniz.');
      return;
    }
    const newPhotos = accepted.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos(prev => [...prev, ...newPhotos]);
  }, [photos]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 8,
  });

  const removePhoto = (i) => {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[i].preview);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const onSubmit = async (data) => {
    if (!selectedCat) { toast.error('Kategori seçiniz.'); return; }
    if (!photos.length) { toast.error('En az 1 fotoğraf ekleyin.'); return; }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('title',       data.title);
      fd.append('category',    selectedCat);
      fd.append('city',        data.city);
      fd.append('district',    data.district || '');
      fd.append('description', data.description || '');
      fd.append('weight_kg',   data.weight_kg || '');
      photos.forEach(p => fd.append('photos', p.file));

      const { data: listing } = await listingsApi.create(fd);
      toast.success('İlanınız yayınlandı!');
      navigate(`/ilan/${listing.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'İlan oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBFBFC] pt-[100px] pb-20 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-10 text-center">
           <span className="text-nature-600 font-bold tracking-widest text-[11px] uppercase bg-nature-100 px-4 py-1.5 rounded-full mb-4 inline-block">HIZLI İLAN</span>
           <h1 className="text-4xl font-black text-carbon-900 tracking-tight">Yeni İlan Oluştur</h1>
           <p className="text-carbon-400 font-medium mt-2">Hurdalarınızı doğru fiyata güvenle satın.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white/70 backdrop-blur-xl p-8 md:p-12 rounded-premium border border-white shadow-premium">
          
          {/* Kategori Seçimi */}
          <div>
            <label className="text-[11px] font-bold text-carbon-500 uppercase tracking-widest pl-4 block mb-4">Hurda Kategorisi</label>
            <div className="grid grid-cols-3 gap-3">
              {CATEGORIES.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedCat(c.value)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 group
                    ${selectedCat === c.value
                      ? 'bg-carbon-900 border-carbon-900 text-nature-500 shadow-lg scale-[1.02]'
                      : 'bg-carbon-50 border-carbon-100 text-carbon-400 hover:border-nature-500/30 hover:bg-white'}`}
                >
                  <span className={`text-2xl transition-transform group-hover:scale-110 ${selectedCat === c.value ? 'filter-none' : 'grayscale opacity-70'}`}>{c.icon}</span>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${selectedCat === c.value ? 'text-nature-500' : 'text-carbon-500'}`}>{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* İlan Başlığı */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-carbon-500 uppercase tracking-widest pl-4">İlan Başlığı</label>
            <input
              {...register('title', { required: 'Başlık gerekli', minLength: { value: 5, message: 'En az 5 karakter' } })}
              placeholder="Örn: 200 kg Karışık Bakır Kablo"
              className="w-full bg-carbon-50 border border-carbon-100 text-carbon-900 px-5 py-3.5 rounded-2xl outline-none focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500/30 transition-all text-base font-medium shadow-inner-soft"
            />
            {errors.title && <p className="text-red-500 text-[10px] font-bold mt-1 pl-4 uppercase">{errors.title.message}</p>}
          </div>

          {/* Miktar + Şehir */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-carbon-500 uppercase tracking-widest pl-4">Ağırlık (kg)</label>
              <input
                type="number"
                step="0.1"
                {...register('weight_kg', { min: { value: 0.1, message: 'Geçersiz değer' } })}
                placeholder="Örn: 150"
                className="w-full bg-carbon-50 border border-carbon-100 text-carbon-900 px-5 py-3.5 rounded-2xl outline-none focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500/30 transition-all text-base font-medium shadow-inner-soft"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-carbon-500 uppercase tracking-widest pl-4">Şehir</label>
              <select
                {...register('city', { required: 'Şehir seçiniz' })}
                className="w-full bg-carbon-50 border border-carbon-100 text-carbon-900 px-5 py-3.5 rounded-2xl outline-none focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500/30 transition-all text-base font-bold shadow-inner-soft"
              >
                <option value="">İl Seçiniz...</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* İlçe + Açıklama */}
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-carbon-500 uppercase tracking-widest pl-4">İlçe</label>
              <input
                {...register('district')}
                placeholder="Örn: Bornova"
                className="w-full bg-carbon-50 border border-carbon-100 text-carbon-900 px-5 py-3.5 rounded-2xl outline-none focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500/30 transition-all text-base font-medium shadow-inner-soft"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-carbon-500 uppercase tracking-widest pl-4">Detaylı Açıklama</label>
              <textarea
                {...register('description')}
                rows={4}
                placeholder="Hurdaların durumu, saflık oranı vb. detayları yazın..."
                className="w-full bg-carbon-50 border border-carbon-100 text-carbon-900 px-5 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-nature-500/10 focus:border-nature-500/30 transition-all text-base font-medium resize-none shadow-inner-soft"
              />
            </div>
          </div>

          {/* Fotoğraf Yükleme */}
          <div>
            <label className="text-[11px] font-bold text-carbon-500 uppercase tracking-widest pl-4 mb-4 block">Fotoğraflar ({photos.length}/8)</label>

            {photos.length > 0 && (
              <div className="grid grid-cols-4 gap-3 mb-6">
                {photos.map((p, i) => (
                  <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-carbon-50 ring-1 ring-carbon-100 group shadow-sm">
                    <img src={p.preview} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    {i === 0 && (
                      <span className="absolute top-2 left-2 text-[9px] bg-carbon-900 text-nature-500 px-2 py-1 rounded-lg font-bold tracking-widest uppercase">KAPAK</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute top-2 right-2 w-7 h-7 bg-white/90 text-red-500 rounded-xl flex items-center justify-center text-sm hover:bg-white hover:scale-105 transition-all shadow-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {photos.length < 8 && (
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300
                  ${isDragActive ? 'border-nature-500 bg-nature-50/50 scale-[0.99]' : 'border-carbon-100 bg-carbon-50/30 hover:border-nature-500/30 hover:bg-white'}`}
              >
                <input {...getInputProps()} />
                <div className="mb-4 inline-flex w-12 h-12 rounded-2xl bg-carbon-900 text-nature-500 items-center justify-center text-2xl shadow-lg">📷</div>
                <p className="text-sm font-bold text-carbon-700">Fotoğrafları buraya sürükleyin</p>
                <p className="text-[10px] text-carbon-400 mt-2 font-medium tracking-wide uppercase">Veya tıklayarak seçin (Max 8 fotoğraf)</p>
              </div>
            )}
          </div>

          {/* Yayınla Butonu */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-carbon-900 hover:bg-carbon-950 disabled:bg-carbon-200 text-nature-500 py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-carbon-900/10 active:scale-[0.99] flex items-center justify-center gap-3 group"
          >
            {loading ? <div className="loader !w-6 !h-6 !border-[3px]" /> : (
              <>
                <span>İlanı Yayınla</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
