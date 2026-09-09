import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getAllPendingRequests, getPendingRequestsForAuction, updateParticipantStatus } from '../../api/auctions';

export default function Requests() {
  const { id } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyUser, setBusyUser] = useState(null);

  const load = () => {
    setLoading(true);
    const fetcher = id ? getPendingRequestsForAuction(id) : getAllPendingRequests();
    fetcher
      .then(({ data }) => setRows(data.data || []))
      .catch(() => setError('Could not load requests right now.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  const handleDecision = async (target_user_id, status, field = 'bid') => {
    const actionKey = `${target_user_id}-${field}`;
    setBusyUser(actionKey);
    try {
      await updateParticipantStatus(id, target_user_id, status, field);
      load();
    } catch {
      setError('Could not update that request.');
    } finally {
      setBusyUser(null);
    }
  };

  return (
    <div className="page container">
      <div className="page-header">
        <div>
          <h1 className="page-header__title">{id ? 'Join & Watch requests' : 'All pending requests'}</h1>
          <p className="page-header__subtitle">
            {id ? 'Approve or decline buyers to bid or watch this auction independently.' : 'Pending requests across every auction you\'ve created.'}
          </p>
        </div>
      </div>

      {error && <div className="state-banner state-banner--error">{error}</div>}
      {loading && <p className="state-loading">Loading…</p>}

      {!loading && rows.length === 0 && !error && (
        <div className="empty-state">
          <p className="empty-state__title">No pending requests</p>
        </div>
      )}

      {!loading && rows.length > 0 && (
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Bid Request</th>
              <th>Watch Request</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isBidPending = r.approval_status === 'PENDING';
              const isWatchPending = r.watch_status === 'PENDING';
              const bidBusy = busyUser === `${r.user_id}-bid`;
              const watchBusy = busyUser === `${r.user_id}-watch`;

              return (
                <tr key={r.user_id}>
                  <td>{r.username} <span className="field-hint">({r.user_id})</span></td>
                  <td>
                    {id && isBidPending ? (
                      <div className="action-row">
                        <button
                          className="btn btn--primary btn--sm"
                          disabled={bidBusy}
                          onClick={() => handleDecision(r.user_id, 'APPROVED', 'bid')}
                        >
                          Approve Bid
                        </button>
                        <button
                          className="btn btn--ghost btn--sm"
                          disabled={bidBusy}
                          onClick={() => handleDecision(r.user_id, 'REJECTED', 'bid')}
                        >
                          Decline Bid
                        </button>
                      </div>
                    ) : (
                      <span>{r.approval_status || '-'}</span>
                    )}
                  </td>
                  <td>
                    {id && isWatchPending ? (
                      <div className="action-row">
                        <button
                          className="btn btn--primary btn--sm"
                          disabled={watchBusy}
                          onClick={() => handleDecision(r.user_id, 'APPROVED', 'watch')}
                        >
                          Approve Watch
                        </button>
                        <button
                          className="btn btn--ghost btn--sm"
                          disabled={watchBusy}
                          onClick={() => handleDecision(r.user_id, 'REJECTED', 'watch')}
                        >
                          Decline Watch
                        </button>
                      </div>
                    ) : (
                      <span>{r.watch_status || '-'}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {!id && rows.length > 0 && (
        <p className="field-hint" style={{ marginTop: 16 }}>
          To approve or decline, open the request from the specific auction's page.
        </p>
      )}
    </div>
  );
}
