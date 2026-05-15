import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('mus_token');
    if (!token) { setLoading(false); return; }
    authAPI.me()
      .then(r => setUser(r.data))
      .catch(() => localStorage.removeItem('mus_token'))
      .finally(() => setLoading(false));
  }, []);

  const login  = (token, userData) => { localStorage.setItem('mus_token', token); setUser(userData); };
  const logout = () => { localStorage.removeItem('mus_token'); setUser(null); };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);