import { Link } from 'react-router-dom';
import StatusBadge from '../StatusBadge/StatusBadge';
import { useCountdown } from '../../hooks/useCountdown';
import './auctioncard.css';

export default function AuctionCard({ auction }) {
  const status = auction.actual_status || auction.status;
  const targetTime = status === 'UPCOMING' ? auction.start_time : auction.end_time;
  const { label, expired } = useCountdown(status === 'COMPLETED' || status === 'CANCELLED' ? null : targetTime);

  return (
    <Link to={`/auctions/${auction.auction_id}`} className="auction-card">
      <div className="auction-card__image" aria-hidden="true" />
      <div className="auction-card__body">
        <div className="auction-card__top">
          <StatusBadge status={status} />
          {label && !expired && (
            <span className="auction-card__timer">
              {status === 'UPCOMING' ? 'Starts in ' : 'Ends in '}{label}
            </span>
          )}
        </div>
        <h3 className="auction-card__title">{auction.title}</h3>
        <p className="auction-card__desc">{auction.description}</p>
        <div className="auction-card__bottom">
          <div>
            <p className="auction-card__label">{auction.high_bid ? 'Current bid' : 'Opening price'}</p>
            <p className="auction-card__price">${Number(auction.high_bid || auction.starting_price).toLocaleString()}</p>
          </div>
          {auction.auction_type === 'PVT' && <span className="auction-card__private">Private</span>}
        </div>
      </div>
    </Link>
  );
}
