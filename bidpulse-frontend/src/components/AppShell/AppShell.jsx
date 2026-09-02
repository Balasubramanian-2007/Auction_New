import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './appshell.css';

export default function AppShell() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="shell">
      <header className="shell-header">
        <div className="container shell-header__row">
          <NavLink to="/auctions" className="shell-wordmark">BidPulse</NavLink>
          <nav className="shell-nav">
            <NavLink to="/auctions" className="shell-nav__link" end>Browse</NavLink>
            <NavLink to="/my-auctions" className="shell-nav__link">My Auctions</NavLink>
            <NavLink to="/watchlist" className="shell-nav__link">Watchlist</NavLink>
            <NavLink to="/requests" className="shell-nav__link">Requests</NavLink>
            {isAdmin && <NavLink to="/admin" className="shell-nav__link shell-nav__link--admin">Admin</NavLink>}
          </nav>
          <div className="shell-account">
            <NavLink to="/auctions/create" className="btn btn--primary shell-account__cta">Sell an item</NavLink>
            <div className="shell-account__menu">
              <span className="shell-account__name">{user?.username || user?.user_id}</span>
              <button type="button" className="shell-account__logout" onClick={handleLogout}>Log out</button>
            </div>
          </div>
        </div>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}
