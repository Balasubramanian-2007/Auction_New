import { useEffect, useState } from 'react';
import { getMyWatchlist } from '../../api/auctions';
import AuctionCard from '../../components/AuctionCard/AuctionCard';

export default function Watchlist() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getMyWatchlist()
      .then(({ data }) => { if (!cancelled) setAuctions(data.data || []); })
      .catch(() => { if (!cancelled) setError('Could not load your watchlist right now.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="page container">
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Watchlist</h1>
          <p className="page-header__subtitle">Lots you're keeping an eye on.</p>
        </div>
      </div>

      {error && <div className="state-banner state-banner--error">{error}</div>}
      {loading && <p className="state-loading">Loading…</p>}

      {!loading && !error && auctions.length === 0 && (
        <div className="empty-state">
          <p className="empty-state__title">Your watchlist is empty</p>
          <p>Open a public auction and tap "Watch" to track it here.</p>
        </div>
      )}

      {!loading && auctions.length > 0 && (
        <div className="card-grid">
          {auctions.map((a) => (
            <AuctionCard key={a.auction_id} auction={a} />
          ))}
        </div>
      )}
    </div>
  );
}
