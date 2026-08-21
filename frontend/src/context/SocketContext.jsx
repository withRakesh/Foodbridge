import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

// Same convention as axiosInstance.js — VITE_API_URL points at
// http://localhost:5000/api, so strip the /api suffix to get the
// Socket.io server's own base URL.
const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const TOKEN_KEY = 'fb_token';

// Holds one live Socket.io connection for the whole app, authenticated the
// same way the backend expects: a JWT in `auth.token` on connect (see
// server.js's io.use(...) middleware). Connects once the user is logged
// in, disconnects on logout — components just read `socket` and add their
// own socket.on(...)/socket.off(...) listeners in a useEffect.
export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setSocket(null);
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    const newSocket = io(SOCKET_URL, { auth: { token } });
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

// Returns the current socket instance, or null if not connected yet /
// not logged in. Consumers should guard with `if (!socket) return;`
// inside their effects.
export function useSocket() {
  return useContext(SocketContext);
}
