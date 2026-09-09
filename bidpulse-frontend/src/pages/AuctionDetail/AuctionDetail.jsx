import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getAuctionById,
  getAuctionBidLog,
  getMyParticipation,
  placeBid,
  requestToJoin,
  requestToWatch,
  toggleWatchlist,
  getMyWatchlist,
  endAuctionManually,
  submitShipmentProof,
  getShipmentProof,
} from '../../api/auctions';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useCountdown } from '../../hooks/useCountdown';
import StatusBadge from '../../components/StatusBadge/StatusBadge';
import './auctiondetail.css';

export default function AuctionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { socket, connected } = useSocket();

  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [participation, setParticipation] = useState(null); // { requested, approval_status }
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [watching, setWatching] = useState(false);

  // Shipment proof states (mandatory post-auction step)
  const [shipmentProof, setShipmentProof] = useState(null);
  const [editingShipment, setEditingShipment] = useState(false);
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shipmentNotes, setShipmentNotes] = useState('');
  const [shipmentPhoto, setShipmentPhoto] = useState(null);
  const [submittingShipment, setSubmittingShipment] = useState(false);
  const [shipmentError, setShipmentError] = useState('');

  const isOwner = auction && user && String(auction.initiator_id) === String(user.user_id);

  const loadAuction = useCallback(() => {
    setLoading(true);
    const calls = [getAuctionById(id), getAuctionBidLog(id)];
    Promise.all(calls)
      .then(([auctionRes, bidsRes]) => {
        setAuction(auctionRes.data.data);
        setBids(bidsRes.data.data || []);
        setError('');
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Could not load this auction.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const loadParticipation = useCallback(() => {
    if (isOwner) return;
    getMyParticipation(id)
      .then(({ data }) => setParticipation(data))
      .catch(() => setParticipation(null));
  }, [id, isOwner]);

  const loadWatchlistStatus = useCallback(() => {
    if (isOwner || !user) return;
    getMyWatchlist()
      .then(({ data }) => {
        const isWatched = (data.data || []).some((item) => String(item.auction_id) === String(id));
        setWatching(isWatched);
      })
      .catch(() => setWatching(false));
  }, [id, isOwner, user]);

  const loadShipmentProof = useCallback(() => {
    if (!user) return;
    getShipmentProof(id)
      .then(({ data }) => {
        setShipmentProof(data);
        if (data.data) {
          setCourierName(data.data.courier_name || '');
          setTrackingNumber(data.data.tracking_number || '');
          setShipmentNotes(data.data.notes || '');
        }
      })
      .catch(() => {});
  }, [id, user]);

  useEffect(() => { loadAuction(); }, [loadAuction]);
  useEffect(() => { loadParticipation(); }, [loadParticipation]);
  useEffect(() => { loadWatchlistStatus(); }, [loadWatchlistStatus]);
  useEffect(() => {
    const s = auction?.actual_status || auction?.status;
    if (s === 'COMPLETED') {
      loadShipmentProof();
    }
  }, [auction, loadShipmentProof]);

  // Live updates: join this auction's room and listen for new high bids.
  // Requires a `join-auction` handler on BidService's socket server.
  useEffect(() => {
    if (!socket || !connected) return undefined;
    socket.emit('join-auction', { auctionId: id });

    const handleNewBid = (payload) => {
      if (String(payload.auction_id) !== String(id)) return;
      setAuction((prev) => (prev ? { ...prev, high_bid: payload.high_bid } : prev));
      setBids((prev) => [
        { bid_id: `live-${Date.now()}`, bidder_id: payload.bidder_id, bid_amount: payload.high_bid, bidstatus: 'ACC', bid_time: payload.timestamp },
        ...prev,
      ]);
    };

    socket.on('NEW_HIGH_BID', handleNewBid);
    return () => socket.off('NEW_HIGH_BID', handleNewBid);
  }, [socket, connected, id]);

  const status = auction?.actual_status || auction?.status;
  const targetTime = status === 'UPCOMING' ? auction?.start_time : auction?.end_time;
  const { label: countdownLabel, expired } = useCountdown(status === 'COMPLETED' || status === 'CANCELLED' ? null : targetTime);

  const isPrivate = auction?.auction_type === 'PVT';
  const isApproved = participation?.approval_status === 'APPROVED';
  const isPending = participation?.requested && participation?.approval_status === 'PENDING';
  const isRejected = participation?.approval_status === 'REJECTED';
  const canBid = status === 'LIVE' && !isOwner && isApproved;

  const watchApproved = participation?.watch_status === 'APPROVED';
  const watchPending = Boolean(participation?.watch_requested && participation?.watch_status === 'PENDING');
  const watchRejected = participation?.watch_status === 'REJECTED';

  const shipmentDeadline = status === 'COMPLETED'
    ? (shipmentProof?.deadline || (auction?.end_time ? new Date(new Date(auction.end_time).getTime() + 3 * 3600 * 1000).toISOString() : null))
    : null;
  const { label: shipmentCountdownLabel, expired: shipmentExpired } = useCountdown(shipmentProof?.data ? null : shipmentDeadline);

  const handleShipmentSubmit = async (e) => {
    e.preventDefault();
    setShipmentError('');
    if (!courierName.trim() || !trackingNumber.trim()) {
      setShipmentError('Courier name and tracking number are required.');
      return;
    }
    setSubmittingShipment(true);
    try {
      const { data } = await submitShipmentProof(id, {
        courier_name: courierName.trim(),
        tracking_number: trackingNumber.trim(),
        notes: shipmentNotes.trim() || undefined,
        receipt_photo_url: shipmentPhoto ? shipmentPhoto.name : (shipmentProof?.data?.receipt_photo_url || undefined),
      });
      setActionMessage(data.message);
      setEditingShipment(false);
      loadShipmentProof();
    } catch (err) {
      setShipmentError(err.response?.data?.message || 'Could not submit shipment proof.');
    } finally {
      setSubmittingShipment(false);
    }
  };

  const handleBid = async (e) => {
    e.preventDefault();
    setActionError('');
    setActionMessage('');
    if (!bidAmount || Number(bidAmount) <= 0) {
      setActionError('Enter a valid bid amount.');
      return;
    }
    setBusy(true);
    try {
      const { data } = await placeBid(id, Number(bidAmount));
      setActionMessage(data.message);
      setBidAmount('');
      loadAuction();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not place that bid.');
    } finally {
      setBusy(false);
    }
  };

  const handleJoinRequest = async () => {
    setBusy(true);
    setActionError('');
    try {
      const { data } = await requestToJoin(id);
      setActionMessage(data.message);
      loadParticipation();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not send join request.');
    } finally {
      setBusy(false);
    }
  };

  const handleWatchRequest = async () => {
    setBusy(true);
    setActionError('');
    try {
      const { data } = await requestToWatch(id);
      setActionMessage(data.message);
      loadParticipation();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not send watch request.');
    } finally {
      setBusy(false);
    }
  };

  const handleWatchlist = async () => {
    setBusy(true);
    setActionError('');
    try {
      const { data } = await toggleWatchlist(id);
      setActionMessage(data.message);
      setWatching((w) => !w);
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not update your watchlist.');
    } finally {
      setBusy(false);
    }
  };

  const handleEndAuction = async () => {
    setBusy(true);
    setActionError('');
    try {
      await endAuctionManually(id);
      loadAuction();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Could not end the auction.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <div className="page container"><p className="state-loading">Loading…</p></div>;
  if (error) return <div className="page container"><div className="state-banner state-banner--error">{error}</div></div>;
  if (!auction) return null;

  return (
    <div className="page container auction-detail">
      <div className="auction-detail__grid">
        <div className="auction-detail__media" aria-hidden="true" />

        <div className="auction-detail__main">
          <div className="auction-detail__top">
            <StatusBadge status={status} />
            {auction.auction_type === 'PVT' && <span className="auction-card__private">Private</span>}
            {countdownLabel && !expired && (
              <span className="auction-detail__countdown">
                {status === 'UPCOMING' ? 'Starts in ' : 'Ends in '}{countdownLabel}
              </span>
            )}
          </div>

          <h1 className="auction-detail__title">{auction.title}</h1>
          <p className="auction-detail__desc">{auction.description}</p>

          <div className="auction-detail__price-row">
            <div>
              <p className="auction-card__label">{auction.high_bid ? 'Current high bid' : 'Opening price'}</p>
              <p className="auction-detail__price">${Number(auction.high_bid || auction.starting_price).toLocaleString()}</p>
            </div>
            <div>
              <p className="auction-card__label">Total bids</p>
              <p className="auction-detail__price auction-detail__price--muted">{auction.total_bids ?? bids.length}</p>
            </div>
          </div>

          {actionMessage && <div className="state-banner state-banner--info">{actionMessage}</div>}
          {actionError && <div className="state-banner state-banner--error">{actionError}</div>}

          {isOwner && (
            <div className="action-row auction-detail__owner-actions">
              {status !== 'COMPLETED' && status !== 'CANCELLED' && (
                <button className="btn btn--danger btn--sm" onClick={handleEndAuction} disabled={busy}>End auction now</button>
              )}
              <Link className="btn btn--ghost btn--sm" to={`/my-auctions/${id}/requests`}>Manage join requests</Link>
            </div>
          )}

          {/* Every auction — public or private — requires seller approval before bidding */}
          {!isOwner && !isApproved && (
            <div className="approval-panel">
              {isRejected ? (
                <>
                  <p className="field-hint field-hint--error">The seller declined your request to bid on this auction.</p>
                  <button className="btn btn--ghost btn--sm" onClick={handleJoinRequest} disabled={busy}>
                    Request again
                  </button>
                </>
              ) : isPending ? (
                <p className="field-hint">Your request to bid is waiting on the seller's approval.</p>
              ) : (
                <>
                  <p className="field-hint">You need the seller's approval before you can bid on this auction.</p>
                  <button className="btn btn--primary btn--sm" onClick={handleJoinRequest} disabled={busy}>
                    Request to bid
                  </button>
                </>
              )}
            </div>
          )}

          {!isOwner && canBid && status === 'LIVE' && (
            <form className="auction-detail__bid-form" onSubmit={handleBid}>
              <input
                type="number"
                min="1"
                placeholder={`More than $${Number(auction.high_bid || auction.starting_price).toLocaleString()}`}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
              <button className="btn btn--primary" type="submit" disabled={busy}>Place bid</button>
            </form>
          )}

          {!isOwner && isApproved && status === 'UPCOMING' && (
            <p className="field-hint">You're approved , bidding opens once this auction goes live.</p>
          )}

          {/* 1. Public auctions: anyone can toggle watchlist */}
          {!isOwner && !isPrivate && (
            <div className="action-row auction-detail__buyer-actions">
              <button className="btn btn--ghost btn--sm" onClick={handleWatchlist} disabled={busy}>
                {watching ? 'Remove from watchlist' : 'Add to watchlist'}
              </button>
            </div>
          )}

          {/* 2. Private auctions: unapproved watcher needs seller approval */}
          {!isOwner && isPrivate && !watchApproved && (
            <div className="approval-panel">
              {watchRejected ? (
                <>
                  <p className="field-hint field-hint--error">The seller declined your request to watch this private auction.</p>
                  <button className="btn btn--ghost btn--sm" onClick={handleWatchRequest} disabled={busy}>
                    Request again
                  </button>
                </>
              ) : watchPending ? (
                <p className="field-hint">Your request to watch is waiting on the seller's approval.</p>
              ) : (
                <>
                  <p className="field-hint">You need the seller's approval before you can watch this private auction.</p>
                  <button className="btn btn--primary btn--sm" onClick={handleWatchRequest} disabled={busy}>
                    Request to watch
                  </button>
                </>
              )}
            </div>
          )}

          {/* 3. Private auctions: approved watcher can toggle watchlist */}
          {!isOwner && isPrivate && watchApproved && (
            <div className="action-row auction-detail__buyer-actions">
              <button className="btn btn--ghost btn--sm" onClick={handleWatchlist} disabled={busy}>
                {watching ? 'Remove from watchlist' : 'Add to watchlist'}
              </button>
            </div>
          )}

          {/* Post-auction Mandatory Shipment Proof Section */}
          {status === 'COMPLETED' && (
            <div className="shipment-panel">
              <div className="shipment-panel__title">
                <span>Shipment & Delivery Proof</span>
                {shipmentProof?.data ? (
                  <span className={`shipment-panel__badge ${shipmentProof.is_late || shipmentProof.data?.is_late ? 'shipment-panel__badge--late' : ''}`}>
                    {shipmentProof.is_late || shipmentProof.data?.is_late ? 'Submitted Late' : 'Proof Verified'}
                  </span>
                ) : (
                  <span className="shipment-panel__badge">Pending Shipment</span>
                )}
              </div>

              {/* Seller View */}
              {isOwner && (
                <>
                  {(!shipmentProof?.data || editingShipment) ? (
                    <form className="shipment-form" onSubmit={handleShipmentSubmit}>
                      <p className="field-hint">
                        {shipmentCountdownLabel && !shipmentExpired ? (
                          <>Time remaining to submit proof: <strong>{shipmentCountdownLabel}</strong> (3-hour post-auction window)</>
                        ) : (
                          <span className="field-hint--error">The 3-hour deadline has expired. Please submit delivery proof immediately.</span>
                        )}
                      </p>

                      {shipmentError && <div className="state-banner state-banner--error">{shipmentError}</div>}

                      <div className="field">
                        <label htmlFor="courier_name">Courier / Carrier *</label>
                        <input
                          id="courier_name"
                          required
                          value={courierName}
                          onChange={(e) => setCourierName(e.target.value)}
                          placeholder="e.g. FedEx, UPS, DHL, India Post"
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="tracking_number">Tracking Number *</label>
                        <input
                          id="tracking_number"
                          required
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                          placeholder="e.g. TRK123456789"
                        />
                      </div>

                      <div className="field">
                        <label htmlFor="shipment_notes">Notes (optional)</label>
                        <textarea
                          id="shipment_notes"
                          value={shipmentNotes}
                          onChange={(e) => setShipmentNotes(e.target.value)}
                          placeholder="Package condition, estimated arrival, or courier comments"
                          rows={2}
                        />
                      </div>

                      <div className="field">
                        <label>Receipt Photo</label>
                        <label className="file-drop">
                          <input type="file" accept="image/*" onChange={(e) => setShipmentPhoto(e.target.files?.[0] || null)} />
                          <span className="file-drop__label">
                            {shipmentPhoto ? shipmentPhoto.name : (shipmentProof?.data?.receipt_photo_url || 'Choose shipment receipt photo')}
                          </span>
                          {(shipmentPhoto || shipmentProof?.data?.receipt_photo_url) && <div className="file-drop__preview">Selected</div>}
                        </label>
                      </div>

                      <div className="action-row">
                        <button className="btn btn--primary btn--sm" type="submit" disabled={submittingShipment}>
                          {submittingShipment ? 'Saving…' : (shipmentProof?.data ? 'Update proof' : 'Submit shipment proof')}
                        </button>
                        {editingShipment && (
                          <button className="btn btn--ghost btn--sm" type="button" onClick={() => setEditingShipment(false)}>
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  ) : (
                    <div>
                      <div className="shipment-info-grid">
                        <div className="shipment-info-item">
                          <span className="shipment-info-item__label">Courier</span>
                          <span className="shipment-info-item__value">{shipmentProof.data.courier_name}</span>
                        </div>
                        <div className="shipment-info-item">
                          <span className="shipment-info-item__label">Tracking #</span>
                          <span className="shipment-info-item__value">{shipmentProof.data.tracking_number}</span>
                        </div>
                        <div className="shipment-info-item">
                          <span className="shipment-info-item__label">Submitted At</span>
                          <span className="shipment-info-item__value">{new Date(shipmentProof.data.submitted_at).toLocaleString()}</span>
                        </div>
                        {shipmentProof.data.receipt_photo_url && (
                          <div className="shipment-info-item">
                            <span className="shipment-info-item__label">Receipt Photo</span>
                            <span className="shipment-info-item__value">{shipmentProof.data.receipt_photo_url}</span>
                          </div>
                        )}
                      </div>
                      {shipmentProof.data.notes && (
                        <p className="field-hint" style={{ marginTop: 10 }}><strong>Notes:</strong> {shipmentProof.data.notes}</p>
                      )}
                      <div style={{ marginTop: 14 }}>
                        <button className="btn btn--ghost btn--sm" onClick={() => setEditingShipment(true)}>
                          Edit shipment details
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Buyer / Public View */}
              {!isOwner && (
                <>
                  {shipmentProof?.data ? (
                    <div>
                      <p className="field-hint">The seller has submitted shipping proof for this item.</p>
                      <div className="shipment-info-grid">
                        <div className="shipment-info-item">
                          <span className="shipment-info-item__label">Courier</span>
                          <span className="shipment-info-item__value">{shipmentProof.data.courier_name}</span>
                        </div>
                        <div className="shipment-info-item">
                          <span className="shipment-info-item__label">Tracking #</span>
                          <span className="shipment-info-item__value">{shipmentProof.data.tracking_number}</span>
                        </div>
                        <div className="shipment-info-item">
                          <span className="shipment-info-item__label">Submitted At</span>
                          <span className="shipment-info-item__value">{new Date(shipmentProof.data.submitted_at).toLocaleString()}</span>
                        </div>
                        {shipmentProof.data.receipt_photo_url && (
                          <div className="shipment-info-item">
                            <span className="shipment-info-item__label">Receipt Photo</span>
                            <span className="shipment-info-item__value">{shipmentProof.data.receipt_photo_url}</span>
                          </div>
                        )}
                      </div>
                      {shipmentProof.data.notes && (
                        <p className="field-hint" style={{ marginTop: 10 }}><strong>Notes:</strong> {shipmentProof.data.notes}</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="field-hint">The seller has not yet submitted shipment proof.</p>
                      {shipmentCountdownLabel && !shipmentExpired ? (
                        <p className="field-hint">Seller submission window: <strong>{shipmentCountdownLabel}</strong> remaining</p>
                      ) : (
                        <p className="field-hint field-hint--error">Shipment proof submission is overdue (seller missed 3-hour window).</p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="auction-detail__bids">
        <h2 className="auction-detail__bids-title">Bid history</h2>
        {bids.length === 0 ? (
          <p className="state-loading">No bids yet ! Be the first.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Bidder</th><th>Amount</th><th>Status</th><th>Time</th></tr>
            </thead>
            <tbody>
              {bids.map((b) => (
                <tr key={b.bid_id}>
                  <td>{b.bidder_id}</td>
                  <td>${Number(b.bid_amount).toLocaleString()}</td>
                  <td>{b.bidstatus === 'ACC' ? 'Accepted' : 'Rejected'}</td>
                  <td>{new Date(b.bid_time).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}