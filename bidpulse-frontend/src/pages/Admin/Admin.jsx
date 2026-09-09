import { useEffect, useState } from 'react';
import { adminGetAllAuctions, adminChangeAuctionStatus } from '../../api/auctions';
import { lookupUserEmails } from '../../api/adminAuth';
import StatusBadge from '../../components/StatusBadge/StatusBadge';

const STATUS_OPTIONS = ['LIVE', 'COMPLETED', 'CANCELLED'];

export default function Admin() {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState('');

  const load = () => {
    setLoading(true);
    adminGetAllAuctions()
      .then(({ data }) => setAuctions(data.data || []))
      .catch(() => setError('Could not load auctions right now.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleStatusChange = async (auctionId, status) => {
    setBusyId(auctionId);
    try {
      await adminChangeAuctionStatus(auctionId, status);
      load();
    } catch {
      setError('Could not update that auction\'s status.');
    } finally {
      setBusyId(null);
    }
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    setLookupError('');
    setLookupResult(null);
    if (!lookupId.trim()) return;
    try {
      const { data } = await lookupUserEmails([lookupId.trim()]);
      setLookupResult(data.data || []);
    } catch (err) {
      setLookupError(err.response?.data?.message || 'Could not look up that user.');
    }
  };

  return (
    <div className="page container">
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Admin panel</h1>
          <p className="page-header__subtitle">Every auction on the platform.</p>
        </div>
      </div>

      <div className="admin-lookup">
        <form onSubmit={handleLookup} className="admin-lookup__form">
          <input
            placeholder="User ID to look up (e.g. a bidder)"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
          />
          <button type="submit" className="btn btn--ghost btn--sm">Find email</button>
        </form>
        {lookupError && <p className="field-hint field-hint--error">{lookupError}</p>}
        {lookupResult && (
          lookupResult.length > 0
            ? <p className="field-hint">{lookupResult[0].user_id} → {lookupResult[0].email}</p>
            : <p className="field-hint">No matching user found.</p>
        )}
      </div>

      {error && <div className="state-banner state-banner--error">{error}</div>}
      {loading && <p className="state-loading">Loading…</p>}

      {!loading && auctions.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th><th>Seller</th><th>Status</th><th>High bid</th><th>Bids</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {auctions.map((a) => (
              <tr key={a.auction_id}>
                <td>{a.title}</td>
                <td>{a.initiator_id}</td>
                <td><StatusBadge status={a.actual_status} /></td>
                <td>{a.high_bid ? `$${Number(a.high_bid).toLocaleString()}` : '-'}</td>
                <td>{a.total_bids}</td>
                <td className="action-row">
                  {STATUS_OPTIONS.map((status) => (
                    <button
                      key={status}
                      className={`btn btn--sm ${status === 'CANCELLED' ? 'btn--danger' : 'btn--ghost'}`}
                      disabled={busyId === a.auction_id || a.actual_status === status}
                      onClick={() => handleStatusChange(a.auction_id, status)}
                    >
                      {status === 'CANCELLED' ? 'Cancel' : `Set ${status}`}
                    </button>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
