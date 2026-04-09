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
      <div className="bg-app min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(232,121,249,0.3)', borderTopColor: '#e879f9' }} />
          <p className="text-sm" style={{ color: 'rgba(216,180,254,0.5)' }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <div className="bg-app min-h-screen flex items-center justify-center p-4">
        <div className="glass p-8 text-center max-w-sm animate-fade-in">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(251,113,133,0.12)', border: '1px solid rgba(251,113,133,0.3)' }}>
            <svg className="w-8 h-8" style={{ color: '#fb7185' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h2 className="font-display text-xl font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-sm" style={{ color: 'rgba(216,180,254,0.5)' }}>
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
