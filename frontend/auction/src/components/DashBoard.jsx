import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);

  // Static auction listings
  const activeAuctions = [
    {
      id: 'AUC-101',
      title: 'Vintage Chronograph Watch (1972)',
      currentBid: '$12,400',
      bidsCount: 18,
      timeLeft: '02h 15m',
      status: 'Live'
    },
    {
      id: 'AUC-102',
      title: 'Signed First Edition Classic Novel',
      currentBid: '$3,850',
      bidsCount: 9,
      timeLeft: '05h 40m',
      status: 'Live'
    },
    {
      id: 'AUC-103',
      title: 'Rare Cyberpunk Digital Asset #08',
      currentBid: '$45,000',
      bidsCount: 34,
      timeLeft: '12h 05m',
      status: 'Hot'
    },
    {
      id: 'AUC-104',
      title: 'Retro Gaming Console Console Prototype',
      currentBid: '$8,900',
      bidsCount: 12,
      timeLeft: '1 day left',
      status: 'Upcoming'
    }
  ];

  return (
    <div className="dashboard-container" style={{ maxWidth: '900px' }}>
      <div className="dashboard-card">
        {/* Profile Header */}
        <div className="dashboard-header">
          <div>
            <h2 style={{ margin: 0 }}>Auction Hub</h2>
            <p style={{ color: 'var(--text-muted)', margin: '0.2rem 0 0 0', fontSize: '0.85rem' }}>
              Logged in as <strong style={{ color: 'var(--accent-gold)' }}>{user?.username || 'Premier_Bidder'}</strong> ({user?.user_id || 'USR-8009'})
            </p>
          </div>
          <button onClick={logout} className="btn btn-logout">Logout</button>
        </div>

        {/* Live Auctions Section */}
        <div className="auctions-section">
          <h3 style={{ margin: '0 0 1.2rem 0', textTransform: 'uppercase', fontSize: '0.9rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            Current Live Auctions
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.2rem' }}>
            {activeAuctions.map((item) => (
              <div 
                key={item.id} 
                style={{
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '1.2rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 600 }}>{item.id}</span>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      background: item.status === 'Hot' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(197, 160, 89, 0.2)',
                      color: item.status === 'Hot' ? '#fca5a5' : 'var(--accent-gold)'
                    }}>
                      {item.status}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-main)', lineHeight: '1.3' }}>
                    {item.title}
                  </h4>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Current Bid:</span>
                    <strong style={{ color: '#fff' }}>{item.currentBid}</strong>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.2rem', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Time Left:</span>
                    <span style={{ color: '#86efac' }}>{item.timeLeft}</span>
                  </div>
                </div>

                <button 
                  className="btn btn-primary" 
                  style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }}
                  onClick={() => {}}
                >
                  Place Bid
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;