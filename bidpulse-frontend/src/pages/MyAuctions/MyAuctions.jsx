import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyAuctions } from '../../api/auctions';
import AuctionCard from '../../components/AuctionCard/AuctionCard';

export default function MyAuctions() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getMyAuctions()
      .then(({ data }) => { if (!cancelled) setAuctions(data.data || []); })
      .catch(() => { if (!cancelled) setError('Could not load your auctions right now.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="page container">
      <div className="page-header">
        <div>
          <h1 className="page-header__title">My auctions</h1>
          <p className="page-header__subtitle">Everything you've listed, public and private.</p>
        </div>
        <Link to="/auctions/create" className="btn btn--primary btn--sm">Sell an item</Link>
      </div>

      {error && <div className="state-banner state-banner--error">{error}</div>}
      {loading && <p className="state-loading">Loading…</p>}

      {!loading && !error && auctions.length === 0 && (
        <div className="empty-state">
          <p className="empty-state__title">You haven't listed anything yet</p>
          <p>Create your first auction to start selling.</p>
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
