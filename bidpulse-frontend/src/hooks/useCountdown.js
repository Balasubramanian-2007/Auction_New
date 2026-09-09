import { useEffect, useState } from 'react';

function formatRemaining(ms) {
  if (ms <= 0) return null;
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (days > 0) return `${days}d ${pad(hours)}h`;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

// Ticks every second toward a target ISO timestamp. Returns a formatted
// string and whether the target has already passed.
export function useCountdown(targetIso) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetIso) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  if (!targetIso) return { label: null, expired: true };
  const target = new Date(targetIso).getTime();
  const remaining = target - now;
  const expired = remaining <= 0;
  return { label: expired ? null : formatRemaining(remaining), expired };
}
