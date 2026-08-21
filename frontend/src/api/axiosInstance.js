import axios from 'axios';

// Base URL for the FoodBridge backend. Override via VITE_API_URL in a
// .env file for anything other than local dev (backend runs on :5000).
const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({ baseURL });

// Attach the JWT to every outgoing request, if we have one.
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('fb_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend says the token itself is bad (401 — expired, invalid, or
// missing), or says this specific account has been disabled (403, with
// the exact message your authMiddleware sends for that case — NOT every
// 403, since role-mismatch errors from authorize() are also 403 and
// should just show as a normal permission error, not force a logout),
// broadcast an event instead of handling it here directly — this plain
// module has no React state of its own. AuthContext listens for this and
// does the actual logout + redirect.
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;
    const isDisabledAccount = status === 403 && message === 'Your account has been disabled';

    if (status === 401 || isDisabledAccount) {
      window.dispatchEvent(new CustomEvent('fb:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
