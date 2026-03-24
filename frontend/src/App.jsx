import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import useAuthStore from './store/auth.store';

import Navbar            from './components/Navbar';
import AdminGuard        from './components/AdminGuard';
import HomePage          from './pages/HomePage';
import ListingDetailPage from './pages/ListingDetailPage';
import LoginPage         from './pages/LoginPage';
import RegisterPage      from './pages/RegisterPage';
import CreateListingPage from './pages/CreateListingPage';
import OffersPage        from './pages/OffersPage';
import ProfilePage       from './pages/ProfilePage';
import MapPage           from './pages/MapPage';
import PremiumPage       from './pages/PremiumPage';
import { CommissionPayPage, PaymentSuccessPage, PaymentCancelPage } from './pages/PaymentPage';
import AdminDashboard    from './pages/admin/AdminDashboard';
import AdminUsers        from './pages/admin/AdminUsers';
import AdminListings     from './pages/admin/AdminListings';
import AdminReports      from './pages/admin/AdminReports';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60000, retry: 1 } },
});

function AppShell() {
  const { token, fetchMe } = useAuthStore();
  useEffect(() => { if (token) fetchMe(); }, [token]);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/"                        element={<HomePage />} />
        <Route path="/harita"                  element={<MapPage />} />
        <Route path="/ilan/:id"                element={<ListingDetailPage />} />
        <Route path="/giris"                   element={<LoginPage />} />
        <Route path="/kayit"                   element={<RegisterPage />} />
        <Route path="/premium"                 element={<PremiumPage />} />
        <Route path="/premium/basarili"        element={<PaymentSuccessPage />} />
        <Route path="/odeme/basarili"          element={<PaymentSuccessPage />} />
        <Route path="/odeme/iptal"             element={<PaymentCancelPage />} />

        {/* Auth required */}
        <Route path="/ilan-ver"                element={<CreateListingPage />} />
        <Route path="/ilan/:id/teklifler"      element={<OffersPage />} />
        <Route path="/hesabim"                 element={<ProfilePage />} />
        <Route path="/odeme/komisyon/:offerId" element={<CommissionPayPage />} />

        {/* Admin */}
        <Route path="/admin"               element={<AdminGuard><AdminDashboard /></AdminGuard>} />
        <Route path="/admin/kullanicilar"  element={<AdminGuard><AdminUsers /></AdminGuard>} />
        <Route path="/admin/ilanlar"       element={<AdminGuard><AdminListings /></AdminGuard>} />
        <Route path="/admin/raporlar"      element={<AdminGuard><AdminReports /></AdminGuard>} />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppShell />
    </QueryClientProvider>
  );
}
