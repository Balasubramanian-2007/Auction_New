import { authApi } from './client';

// Admin-only: resolve a list of user IDs to their emails.
export const lookupUserEmails = (ids) => authApi.post('/getUserEmailID', { ids });
