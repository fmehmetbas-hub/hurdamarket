import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const STATUS_TABS = [
  { value: 'pending',   label: 'BEKLEYEN',   color: 'text-amber-500 border-amber-500 bg-amber-50',     icon: '⏳' },
  { value: 'reviewed',  label: 'İNCELENDİ',  color: 'text-blue-500 border-blue-500 bg-blue-50',       icon: '🔍' },
  { value: 'resolved',  label: 'ÇÖZÜLDÜ',   color: 'text-nature-600 border-nature-600 bg-nature-50', icon: '✅' },
  { value: 'dismissed', label: 'REDDEDİLDİ', color: 'text-carbon-400 border-carbon-400 bg-carbon-50', icon: '❌' },
];

export default function AdminReports() {
  const [status, setStatus] = useState('pending');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', status],
    queryFn:  () => adminApi.getReports({ status }).then(r => r.data),
  });

  const mutation = useMutation({
    mutationFn: ({ id, ...body }) => adminApi.updateReport(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-reports']);
      toast.success('Rapor güncellendi.');
    },
    onError: () => toast.error('Hata oluştu.'),
  });

  const handle = (report, newStatus) => {
    const note = window.prompt(`Not eklemek ister misiniz?`);
    if (note === null) return;
    mutation.mutate({ id: report.id, status: newStatus, admin_note: note });
  };

  const reports = data?.reports || [];

  return (
    <div className="min-h-screen bg-[#FBFBFC] pt-[100px] pb-20 px-6 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Başlık */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-premium shadow-sm border border-carbon-100">
          <div>
            <h1 className="text-3xl font-black text-carbon-900 tracking-tight italic">Şikayet Yönetimi</h1>
            <p className="text-[10px] text-carbon-400 font-bold uppercase tracking-[0.2em] mt-1">{data?.total || 0} AKTİF RAPOR BULUNUYOR</p>
          </div>
          <Link to="/admin" className="px-6 py-2.5 bg-carbon-900 text-nature-500 hover:bg-carbon-800 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg shadow-carbon-950/20">
            ← DASHBOARD
          </Link>
        </div>

        {/* Tab Menü */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATUS_TABS.map(t => (
            <button
              key={t.value}
              onClick={() => setStatus(t.value)}
              className={`px-4 py-4 rounded-2xl text-[10px] font-black tracking-widest transition-all border flex flex-col items-center gap-2 group
                ${status === t.value 
                  ? 'bg-carbon-900 border-carbon-900 text-nature-500 shadow-xl scale-[1.02]' 
                  : 'bg-white border-carbon-100 text-carbon-400 hover:border-carbon-900 hover:text-carbon-900'}`}
            >
              <span className="text-xl group-hover:scale-125 transition-transform">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Rapor Listesi */}
        <div className="space-y-4">
          {isLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-48 bg-white/50 border border-carbon-100 rounded-premium animate-pulse" />
            ))
          ) : reports.length === 0 ? (
            <div className="bg-white p-20 rounded-premium border border-dashed border-carbon-200 text-center space-y-4">
              <div className="text-5xl opacity-25">✨</div>
              <p className="text-carbon-400 font-black uppercase tracking-widest text-xs">BU KATEGORİDE RAPOR BULUNMUYOR</p>
            </div>
          ) : (
            reports.map(r => (
              <div 
                key={r.id} 
                className={`bg-white rounded-premium p-8 border hover:shadow-premium transition-all relative overflow-hidden group
                  ${r.status === 'pending' ? 'border-amber-200 shadow-sm' : 'border-carbon-100 shadow-sm'}`}
              >
                {r.status === 'pending' && <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-400" />}
                
                <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-red-50 text-red-500 border border-red-100 rounded-lg">
                        {r.reason}
                      </span>
                      <span className="text-[10px] font-bold text-carbon-300 uppercase tracking-tight">
                        {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: tr })}
                      </span>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Raporlanan İlan / Kullanıcı */}
                      <div className="p-4 bg-carbon-50 rounded-2xl border border-carbon-100/50">
                        <p className="text-[9px] font-black text-carbon-400 uppercase tracking-widest mb-2">ŞİKAYET EDİLEN</p>
                        {r.listing_title ? (
                          <Link to={`/ilan/${r.listing_id}`} target="_blank" className="text-xs font-black text-carbon-900 hover:text-nature-600 transition-all flex items-center gap-2">
                             🖼️ {r.listing_title} <span className="text-[10px]">↗</span>
                          </Link>
                        ) : (
                          <p className="text-xs font-black text-carbon-900 flex items-center gap-2">👤 {r.reported_user_name}</p>
                        )}
                      </div>

                      {/* Şikayet Eden */}
                      <div className="p-4 bg-carbon-50 rounded-2xl border border-carbon-100/50">
                        <p className="text-[9px] font-black text-carbon-400 uppercase tracking-widest mb-2">ŞİKAYET EDEN</p>
                        <p className="text-xs font-black text-carbon-900">{r.reporter_name}</p>
                        <p className="text-[10px] font-medium text-carbon-400 mt-0.5">{r.reporter_phone}</p>
                      </div>
                    </div>

                    {r.description && (
                      <div className="p-5 bg-white border border-carbon-100 rounded-2xl italic text-[13px] text-carbon-600 leading-relaxed group-hover:bg-carbon-50/50 transition-all font-serif">
                        "{r.description}"
                      </div>
                    )}

                    {r.admin_note && (
                      <div className="p-5 bg-nature-50 border border-nature-100 rounded-2xl text-[12px] text-nature-700 font-medium">
                        <span className="font-black uppercase tracking-widest text-[9px] block mb-1">ADMİN NOTU:</span>
                        {r.admin_note}
                      </div>
                    )}
                  </div>

                  {/* Aksiyonlar */}
                  <div className="flex md:flex-col gap-2 w-full md:w-[180px]">
                    {r.status === 'pending' && (
                       <button onClick={() => handle(r, 'reviewed')} className="flex-1 px-4 py-3 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-blue-100">
                         İncelemeye Al
                       </button>
                    )}
                    {(r.status === 'pending' || r.status === 'reviewed') && (
                      <>
                        <button onClick={() => handle(r, 'resolved')} className="flex-1 px-4 py-3 bg-nature-500 text-nature-950 hover:bg-nature-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-nature-500/10">
                          Çözüldü
                        </button>
                        <button onClick={() => handle(r, 'dismissed')} className="flex-1 px-4 py-3 bg-carbon-50 text-carbon-400 hover:bg-red-50 hover:text-red-500 hover:border-red-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-carbon-100">
                          Reddet
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
