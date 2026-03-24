import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { notificationsApi } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

const TYPE_ICONS = {
  new_offer:      '💰',
  offer_accepted: '✅',
  offer_rejected: '❌',
  new_message:    '💬',
  system:         'ℹ️',
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const navigate    = useNavigate();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn:  () => notificationsApi.getAll().then(r => r.data),
    refetchInterval: 30000,
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess:  () => queryClient.invalidateQueries(['notifications']),
  });

  const unread = data?.unread_count || 0;
  const notifs = data?.notifications || [];

  const handleClick = (n) => {
    if (!n.is_read) {
      notificationsApi.markRead(n.id).then(() =>
        queryClient.invalidateQueries(['notifications'])
      );
    }
    if (n.data?.listing_id) navigate(`/ilan/${n.data.listing_id}`);
    setOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 8px', borderRadius: 8, fontSize: 20, lineHeight: 1 }}
      >
        🔔
        {unread > 0 && (
          <span style={{ position: 'absolute', top: 2, right: 2, background: '#dc2626', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          <div style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 320, background: '#fff', borderRadius: 14, border: '1px solid #dde8df', boxShadow: '0 8px 32px rgba(0,0,0,.12)', zIndex: 50, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #dde8df', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Bildirimler</span>
              {unread > 0 && (
                <button onClick={() => markAll.mutate()} style={{ fontSize: 12, color: '#1a6b3c', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Tümünü okundu işaretle
                </button>
              )}
            </div>
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {notifs.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#8a9e90', fontSize: 13 }}>Henüz bildirim yok.</div>
              ) : (
                notifs.map(n => (
                  <div key={n.id} onClick={() => handleClick(n)} style={{ padding: '12px 16px', cursor: 'pointer', background: n.is_read ? 'transparent' : '#f0faf4', borderBottom: '1px solid #f0f4f0', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>{TYPE_ICONS[n.type] || 'ℹ️'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: n.is_read ? 400 : 600, color: '#111' }}>{n.title}</p>
                      {n.body && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#4a5c50', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.body}</p>}
                      <p style={{ margin: '3px 0 0', fontSize: 11, color: '#8a9e90' }}>{formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: tr })}</p>
                    </div>
                    {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a6b3c', flexShrink: 0, marginTop: 4 }} />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
