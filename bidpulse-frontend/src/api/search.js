import { authApi } from './client';

export const searchUsers = (q) =>
  authApi.get('/search-users', { params: { q } });
