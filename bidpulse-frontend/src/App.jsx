import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing/Landing';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import VerifyOtp from './pages/Auth/VerifyOtp';
import AppShell from './components/AppShell/AppShell';
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
          <Route
            path="/auctions"
            element={<Placeholder title="Browse auctions" description="Public auction listings will render here next — pulling from GET /auctions/public with live status and countdowns." />}
          />
          <Route
            path="/auctions/create"
            element={<Placeholder title="Sell an item" description="The create-auction form (title, description, price, schedule, photo/video) goes here next." />}
          />
          <Route
            path="/auctions/:id"
            element={<Placeholder title="Auction detail" description="Live bidding, bid history, watchlist toggle, and join requests for this lot will render here." />}
          />
          <Route
            path="/my-auctions"
            element={<Placeholder title="My auctions" description="Auctions you've created, pulling from GET /auctions/mine." />}
          />
          <Route
            path="/watchlist"
            element={<Placeholder title="Watchlist" description="Auctions you're tracking, pulling from GET /watchlist/mine." />}
          />
          <Route
            path="/requests"
            element={<Placeholder title="Join requests" description="Pending buyer requests across all auctions you've created." />}
          />
          <Route element={<AdminRoute />}>
            <Route
              path="/admin"
              element={<Placeholder title="Admin panel" description="Every auction on the platform, with status controls and bidder email lookup." />}
            />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Placeholder title="Page not found" description="That page doesn't exist." />} />
    </Routes>
  );
}
