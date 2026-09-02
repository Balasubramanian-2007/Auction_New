import { Link } from 'react-router-dom';
import './landing.css';

export default function Landing() {
  return (
    <div className="landing">
      <header className="landing-header">
        <div className="container landing-header__row">
          <span className="landing-wordmark">BidPulse</span>
          <nav className="landing-nav">
            <Link to="/login" className="landing-nav__link">Log in</Link>
            <Link to="/register" className="landing-nav__cta">Register</Link>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero__grid">
          <div className="hero__text">
            <p className="hero__kicker">A live marketplace for considered bidding</p>
            <h1 className="hero__headline">
              Every lot has a story.<br />Yours starts with the bid.
            </h1>
            <p className="hero__sub">
              BidPulse brings the pace of a real auction room online — live counters,
              verified participants, and a closing bell that means something. List an
              item, open the floor, and watch the price find its true value.
            </p>
            <div className="hero__actions">
              <Link to="/register" className="btn btn--primary">Create an account</Link>
              <Link to="/login" className="btn btn--ghost">I already have one</Link>
            </div>
          </div>
          <div className="hero__visual" aria-hidden="true">
            <div className="lot-card lot-card--back" />
            <div className="lot-card lot-card--front">
              <div className="lot-card__top">
                <span className="lot-card__tag">Lot 042 · Live</span>
                <span className="lot-card__timer">02:14:09</span>
              </div>
              <div className="lot-card__image" />
              <div className="lot-card__bottom">
                <div>
                  <p className="lot-card__label">Current bid</p>
                  <p className="lot-card__price">$4,850</p>
                </div>
                <div className="lot-card__pulse">
                  <span className="lot-card__dot" />
                  9 bidding
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="how">
        <div className="container">
          <h2 className="section-title">How it works</h2>
          <div className="how__grid">
            <div className="how__item">
              <p className="how__index">1</p>
              <h3 className="how__title">Discover a lot</h3>
              <p className="how__body">
                Browse public listings or request entry to a private auction hosted
                by its seller. Every lot shows its opening price and closing time up front.
              </p>
            </div>
            <div className="how__item">
              <p className="how__index">2</p>
              <h3 className="how__title">Bid in real time</h3>
              <p className="how__body">
                Place a bid and watch the floor move — the current high bid updates
                instantly for everyone watching, no refresh required.
              </p>
            </div>
            <div className="how__item">
              <p className="how__index">3</p>
              <h3 className="how__title">Win, or watch and learn</h3>
              <p className="how__body">
                When the clock runs out, the highest bid wins the lot. Add auctions
                to your watchlist to catch the ones that matter before they close.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="roles">
        <div className="container roles__grid">
          <div className="roles__card">
            <h3 className="roles__title">List something</h3>
            <p className="roles__body">
              Any account can open an auction — public or invitation-only. Set your
              opening price, your window, and approve who's allowed to bid.
            </p>
          </div>
          <div className="roles__card">
            <h3 className="roles__title">Bid on something</h3>
            <p className="roles__body">
              The same account that sells can bid on someone else's lot. Track
              favorites on your watchlist and follow every bid as it lands.
            </p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container landing-footer__row">
          <span>BidPulse</span>
          <span className="landing-footer__muted">A live auction marketplace</span>
        </div>
      </footer>
    </div>
  );
}
