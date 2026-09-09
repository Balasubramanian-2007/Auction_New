import './statusbadge.css';

const STYLES = {
  UPCOMING: 'status-badge--upcoming',
  LIVE: 'status-badge--live',
  COMPLETED: 'status-badge--completed',
  CANCELLED: 'status-badge--cancelled',
};

export default function StatusBadge({ status }) {
  const className = STYLES[status] || 'status-badge--completed';
  return <span className={`status-badge ${className}`}>{status}</span>;
}
