import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import VerifyOtp from './pages/Auth/VerifyOtp';
import AppShell from './components/AppShell/AppShell';
import BrowseAuctions from './pages/BrowseAuctions/BrowseAuctions';
import CreateAuction from './pages/CreateAuction/CreateAuction';
import AuctionDetail from './pages/AuctionDetail/AuctionDetail';
import MyAuctions from './pages/MyAuctions/MyAuctions';
import Watchlist from './pages/Watchlist/Watchlist';
import Requests from './pages/Requests/Requests';
import Admin from './pages/Admin/Admin';
import Placeholder from './pages/Placeholder/Placeholder';
import { ProtectedRoute, AdminRoute, GuestOnlyRoute } from './routes/guards';

export default function App() {
  return (
    <Routes>
      {/* Public marketing page */}
      <Route path="/" element={<Landing />} />

      {/* Guest-only auth pages */}
      <Route element={<GuestOnlyRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />
      </Route>

      {/* Authenticated app */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/auctions" element={<BrowseAuctions />} />
          <Route path="/auctions/create" element={<CreateAuction />} />
          <Route path="/auctions/:id" element={<AuctionDetail />} />
          <Route path="/my-auctions" element={<MyAuctions />} />
          <Route path="/my-auctions/:id/requests" element={<Requests />} />
          <Route path="/watchlist" element={<Watchlist />} />
          <Route path="/requests" element={<Requests />} />
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<Admin />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Placeholder title="Page not found" description="That page doesn't exist." />} />
    </Routes>
  );
}
