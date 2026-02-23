import { useCallback, useEffect, useState } from 'react';
import api from '../api/http';
import AuthContext from './auth-context';

function getStoredUser() {
  const raw = localStorage.getItem('rct_user');
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('rct_token') || '');
  const [user, setUser] = useState(() => getStoredUser());
  const [loading, setLoading] = useState(true);

  const persistAuth = useCallback((nextToken, nextUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem('rct_token', nextToken);
    localStorage.setItem('rct_user', JSON.stringify(nextUser));
  }, []);

  const clearAuth = useCallback(() => {
    setToken('');
    setUser(null);
    localStorage.removeItem('rct_token');
    localStorage.removeItem('rct_user');
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get('/auth/me');
      persistAuth(token, data.user);
    } catch {
      clearAuth();
    } finally {
      setLoading(false);
    }
  }, [token, persistAuth, clearAuth]);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(
    async ({ email, password }) => {
      const { data } = await api.post('/auth/login', { email, password });
      persistAuth(data.token, data.user);
      return data.user;
    },
    [persistAuth],
  );

  const register = useCallback(
    async ({ name, email, password }) => {
      const { data } = await api.post('/auth/register', { name, email, password });
      persistAuth(data.token, data.user);
      return data.user;
    },
    [persistAuth],
  );

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

