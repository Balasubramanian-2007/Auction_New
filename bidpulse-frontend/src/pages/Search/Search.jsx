import { useState, useEffect } from 'react';
import { searchUsers } from '../../api/search';
import { getSellerRatingsBatch } from '../../api/ratings';
import './search.css';

export default function Search() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setUsers([]);
      setRatings({});
      setSearched(false);
      setLoading(false);
      setError('');
      return;
    }

    setLoading(true);
    setError('');

    const handler = setTimeout(async () => {
      try {
        const { data } = await searchUsers(trimmed);
        const userList = data.data || [];
        setUsers(userList);
        setSearched(true);

        if (userList.length > 0) {
          const ids = userList.map((u) => u.user_id).filter(Boolean);
          if (ids.length > 0) {
            try {
              const ratingsRes = await getSellerRatingsBatch(ids);
              setRatings(ratingsRes.data.data || {});
            } catch {
              // Non-blocking if ratings table/service is empty
              setRatings({});
            }
          }
        } else {
          setRatings({});
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Search failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query]);

  return (
    <div className="page container">
      <div className="page-header">
        <div>
          <h1 className="page-header__title">Search People</h1>
          <p className="page-header__subtitle">Find users, sellers, and view their reputation rating.</p>
        </div>
      </div>

      <div className="search-box">
        <input
          type="text"
          className="search-box__input"
          placeholder="Search by name or email (at least 2 characters)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {error && <div className="state-banner state-banner--error">{error}</div>}
      {loading && <p className="state-loading">Searching…</p>}

      {!loading && searched && users.length === 0 && (
        <div className="empty-state">
          <p className="empty-state__title">No users found</p>
          <p>Try searching with a different name or email address.</p>
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="user-grid">
          {users.map((u) => {
            const rating = ratings[u.user_id];
            const hasRatings = rating && rating.total_ratings > 0;

            return (
              <div key={u.user_id} className="user-card">
                <div className="user-card__header">
                  <div>
                    <h3 className="user-card__name">{u.username || 'Anonymous User'}</h3>
                    <span className="user-card__id">@{u.user_id}</span>
                  </div>
                  <div>
                    {hasRatings ? (
                      <span className="rating-badge rating-badge--positive" title={`Wilson score based on ${rating.positive_count}/${rating.total_ratings} positive ratings`}>
                        ★ {rating.wilson_percentage}% positive ({rating.total_ratings} {rating.total_ratings === 1 ? 'rating' : 'ratings'})
                      </span>
                    ) : (
                      <span className="rating-badge rating-badge--neutral">
                        No ratings yet
                      </span>
                    )}
                  </div>
                </div>
                <div className="user-card__email">
                  {u.email}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
