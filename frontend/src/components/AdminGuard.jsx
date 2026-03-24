import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/auth.store';

export default function AdminGuard({ children }) {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) { navigate('/giris'); return; }
    if (user && user.role !== 'admin') { navigate('/'); }
  }, [user, token]);

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: 12 }}>
        <p style={{ fontSize: 36 }}>🔒</p>
        <p style={{ fontSize: 15, color: '#8a9e90' }}>Bu sayfaya erişim yetkiniz yok.</p>
      </div>
    );
  }

  return children;
}
