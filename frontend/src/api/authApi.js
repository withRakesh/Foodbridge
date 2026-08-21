import axiosInstance from './axiosInstance';

// POST /api/auth/register
// Body: { name, email, password, role }
// role must be one of: 'restaurant' | 'ngo' | 'volunteer'
// (Admin accounts aren't self-registered — created directly in the DB.)
export const registerUser = (payload) =>
  axiosInstance.post('/auth/register', payload).then((res) => res.data);

// POST /api/auth/login
// Body: { email, password }
export const loginUser = (payload) =>
  axiosInstance.post('/auth/login', payload).then((res) => res.data);

// GET /api/auth/me — returns the current user from the token.
// Note: backend marks this a "temporary test route" — fine to keep using
// it for a session-restore check on app load, but flag if it disappears.
export const fetchCurrentUser = () =>
  axiosInstance.get('/auth/me').then((res) => res.data);
