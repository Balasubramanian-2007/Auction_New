import { useEffect, useState } from 'react';
import { getPublicAuctions } from '../../api/auctions';
import AuctionCard from '../../components/AuctionCard/AuctionCard';

export default function BrowseAuctions() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPublicAuctions()
      .then(({ data }) => {
        if (!cancelled) setAuctions(data.data || []);
      })
      .catch(() => {
        if (!cancelled) setError('Could not load auctions right now.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="page container">
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Browse auctions</h1>
          <p className="page-header__subtitle">Public lots open for bidding right now.</p>
        </div>
      </div>

      {error && <div className="state-banner state-banner--error">{error}</div>}
      {loading && <p className="state-loading">Loading auctions…</p>}

      {!loading && !error && auctions.length === 0 && (
        <div className="empty-state">
          <p className="empty-state__title">No public auctions yet</p>
          <p>Be the first to list something — use "Sell an item" above.</p>
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
