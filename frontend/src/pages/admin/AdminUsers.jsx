import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const ROLES = ['', 'seller', 'buyer', 'both', 'admin'];

export default function AdminUsers() {
  const [q,       setQ]       = useState('');
  const [role,    setRole]    = useState('');
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, role, page],
    queryFn:  () => adminApi.getUsers({ q: search, role, page, limit: 30 }).then(r => r.data),
    keepPreviousData: true,
  });

  const mutation = useMutation({
    mutationFn: ({ id, ...body }) => adminApi.updateUser(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-users']);
      toast.success('Kullanıcı güncellendi.');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Hata oluştu.'),
  });

  const toggleBan = (user) => {
    if (!window.confirm(`${user.name} kullanıcısını ${user.is_active ? 'askıya almak' : 'aktifleştirmek'} istediğinize emin misiniz?`)) return;
    mutation.mutate({ id: user.id, is_active: !user.is_active });
  };

  const changeRole = (user, newRole) => {
    if (!window.confirm(`${user.name} kullanıcısının rolünü "${newRole}" olarak değiştirmek istiyor musunuz?`)) return;
    mutation.mutate({ id: user.id, role: newRole });
  };

  const users = data?.users || [];
  const total = data?.total || 0;
  const pages = Math.ceil(total / 30);

  return (
    <div className="min-h-screen bg-[#FBFBFC] pt-[100px] pb-20 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Başlık */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-premium shadow-sm border border-carbon-100">
          <div>
            <h1 className="text-3xl font-black text-carbon-900 tracking-tight">Kullanıcı Yönetimi</h1>
            <p className="text-[10px] text-carbon-400 font-bold uppercase tracking-[0.2em] mt-1">{total} KAYITLI ÜYE</p>
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
              placeholder="İsim, telefon veya e-posta..."
              className="w-full bg-carbon-800 border-none text-white rounded-2xl px-6 py-3.5 text-sm font-bold placeholder:text-carbon-500 focus:ring-2 focus:ring-nature-500 outline-none transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <select 
              value={role} 
              onChange={e => { setRole(e.target.value); setPage(1); }}
              className="bg-carbon-800 border-none text-white rounded-2xl px-6 py-3.5 text-xs font-black uppercase tracking-widest cursor-pointer focus:ring-2 focus:ring-nature-500 outline-none min-w-[160px]"
            >
              <option value="">TÜM ROLLER</option>
              <option value="seller">SATICI</option>
              <option value="buyer">ALICI</option>
              <option value="both">HEPSİ</option>
              <option value="admin">ADMİN</option>
            </select>
            <button 
              onClick={() => { setSearch(q); setPage(1); }}
              className="px-12 py-3.5 bg-nature-500 text-nature-950 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-nature-600 transition-all shadow-lg shadow-nature-500/10"
            >
              KULLANICI ARA
            </button>
          </div>
        </div>

        {/* Tablo */}
        <div className="bg-white border border-carbon-100 rounded-premium overflow-hidden shadow-premium">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-carbon-50/50 border-b border-carbon-100">
                  {['Kullanıcı Bilgileri', 'Rol', 'Konum', 'İstatistik', 'Kayıt Tarihi', 'Durum', 'İşlem'].map(h => (
                    <th key={h} className="px-8 py-5 text-[10px] font-black text-carbon-400 uppercase tracking-[0.15em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-carbon-50">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <tr key={i}><td colSpan={7} className="px-8 py-6"><div className="h-10 bg-carbon-50 animate-pulse rounded-xl w-full" /></td></tr>
                  ))
                ) : users.map((u, i) => (
                  <tr key={u.id} className={`hover:bg-carbon-50/50 transition-colors group ${!u.is_active ? 'bg-red-50/20' : ''}`}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-carbon-900 text-nature-500 flex items-center justify-center font-black text-xs shadow-lg group-hover:scale-110 transition-transform">
                          {u.name[0].toUpperCase()}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[14px] font-black text-carbon-900 leading-tight block">{u.name}</p>
                          <p className="text-[11px] font-medium text-carbon-400">{u.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <select
                        defaultValue={u.role}
                        onChange={e => changeRole(u, e.target.value)}
                        className="bg-white border border-carbon-100 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-carbon-600 focus:ring-2 focus:ring-nature-500 outline-none transition-all cursor-pointer"
                      >
                        {ROLES.filter(r => r).map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                      </select>
                    </td>
                    <td className="px-8 py-6 text-[13px] font-bold text-carbon-500 lowercase first-letter:uppercase">{u.city || '—'}</td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-carbon-400 uppercase tracking-tight">İLAN: <span className="text-nature-600 font-black">{u.listing_count}</span></p>
                        <p className="text-[10px] font-black text-carbon-400 uppercase tracking-tight">TEKLİF: <span className={u.offer_count > 0 ? "text-blue-600" : ""}>{u.offer_count}</span></p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-[11px] font-medium text-carbon-400">
                      {formatDistanceToNow(new Date(u.created_at), { addSuffix: true, locale: tr })}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1.5 rounded-lg border
                        ${u.is_active ? 'bg-nature-100 text-nature-600 border-nature-200' : 'bg-red-50 text-red-500 border-red-100'}`}>
                        {u.is_active ? 'Aktif' : 'Askıda'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button
                        onClick={() => toggleBan(u)}
                        disabled={mutation.isPending}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
                          ${u.is_active 
                            ? 'bg-red-50 text-red-500 border-red-100 hover:bg-red-500 hover:text-white' 
                            : 'bg-nature-500 text-nature-950 border-nature-500 hover:bg-nature-600'}`}
                      >
                        {u.is_active ? 'ASKIYA AL' : 'AKTİFLEŞTİR'}
                      </button>
                    </td>
                  </tr>
                ))}
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
