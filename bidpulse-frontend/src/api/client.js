import axios from 'axios';

const AUTH_BASE = import.meta.env.VITE_AUTH_API_URL;
const BID_BASE = import.meta.env.VITE_BID_API_URL;

function createClient(baseURL) {
  const instance = axios.create({ baseURL });

  instance.interceptors.request.use((config) => {
    const token = localStorage.getItem('bidpulse_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      // Only a bare 401 (no token at all) or a 403 whose message says the
      // token itself is bad forces a hard logout. A 403 from isAdmin/verifyAdmin
      // on a valid session (e.g. a regular user hitting an admin-only route)
      // must NOT log the user out — it's a permissions error, not a session one.
      const serverMessage = (error.response?.data?.message || error.response?.data?.error || '').toLowerCase();
      const isBadSession = status === 401 || (status === 403 && (serverMessage.includes('token') || serverMessage.includes('session')));
      if (isBadSession) {
        localStorage.removeItem('bidpulse_token');
        localStorage.removeItem('bidpulse_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?expired=1';
        }
      }
      return Promise.reject(error);
    }
  );

  return instance;
}

// AuthService — port 4000 — /auth/* routes
export const authApi = createClient(`${AUTH_BASE}/auth`);

// BidService — port 3000 — /api/v1/* routes
export const bidApi = createClient(`${BID_BASE}/api/v1`);

export { AUTH_BASE, BID_BASE };
