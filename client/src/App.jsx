import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import api from './api/index.js';
import Login from './pages/Login.jsx';
import PhonePage from './pages/PhonePage.jsx';
import AdminUsers from './pages/admin/Users.jsx';
import AdminSpaces from './pages/admin/Spaces.jsx';

// ─── Auth Context ─────────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sipConfig, setSipConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data);
      if (data.space) {
        setSipConfig({
          extension: data.space.extension,
          sipPassword: data.space.sipPassword,
          pbxWssUrl: data.space.pbxWssUrl,
        });
      }
    } catch {
      setUser(null);
      setSipConfig(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const login = useCallback((userData) => {
    setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors on logout
    } finally {
      setUser(null);
      setSipConfig(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, sipConfig, loading, login, logout, refetchMe: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Protected Route ──────────────────────────────────────────────────────────
function RequireAuth({ children, requiredRole }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="card text-center max-w-sm">
          <div className="text-4xl mb-3">🚫</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Access Denied</h2>
          <p className="text-slate-400 text-sm">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Protected — any authenticated user */}
          <Route
            path="/"
            element={
              <RequireAuth>
                <PhonePage />
              </RequireAuth>
            }
          />

          {/* Protected — admin only */}
          <Route
            path="/admin/users"
            element={
              <RequireAuth requiredRole="admin">
                <AdminUsers />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/spaces"
            element={
              <RequireAuth requiredRole="admin">
                <AdminSpaces />
              </RequireAuth>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
