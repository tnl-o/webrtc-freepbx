import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../App.jsx';
import api from '../../api/index.js';

const ROLES = ['user', 'admin'];

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="card max-w-sm w-full shadow-2xl animate-slide-up">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-red-900/40 rounded-full flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Confirm Deletion</h3>
            <p className="text-sm text-slate-400 mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="btn-secondary">Cancel</button>
          <button onClick={onConfirm} className="btn-danger">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create form state
  const [form, setForm] = useState({ login: '', password: '', role: 'user' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/users');
      setUsers(Array.isArray(data) ? data : data.users ?? []);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFormError('');
    setFormSuccess('');
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!form.login.trim()) { setFormError('Login is required.'); return; }
    if (!form.password) { setFormError('Password is required.'); return; }
    if (form.password.length < 6) { setFormError('Password must be at least 6 characters.'); return; }

    setSubmitting(true);
    try {
      await api.post('/admin/users', {
        login: form.login.trim(),
        password: form.password,
        role: form.role,
      });
      setForm({ login: '', password: '', role: 'user' });
      setFormSuccess('User created successfully.');
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.error ?? 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to delete user.');
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Confirm dialog */}
      {deleteTarget && (
        <ConfirmDialog
          message={`Delete user "${deleteTarget.login}"? This cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link to="/" className="btn-ghost text-xs px-2 py-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back
          </Link>
          <h1 className="text-lg font-bold text-white">User Management</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Error */}
        {error && (
          <div className="p-3 bg-red-900/40 border border-red-700/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Create user form */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Create New User
          </h2>

          {formError && (
            <div className="mb-3 p-3 bg-red-900/40 border border-red-700/50 rounded-lg text-red-300 text-sm animate-fade-in">
              {formError}
            </div>
          )}
          {formSuccess && (
            <div className="mb-3 p-3 bg-emerald-900/40 border border-emerald-700/50 rounded-lg text-emerald-300 text-sm animate-fade-in">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleCreate} noValidate>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="label" htmlFor="new-login">Username</label>
                <input
                  id="new-login"
                  name="login"
                  type="text"
                  value={form.login}
                  onChange={handleFormChange}
                  placeholder="username"
                  className="input-field"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="label" htmlFor="new-password">Password</label>
                <input
                  id="new-password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleFormChange}
                  placeholder="min. 6 characters"
                  className="input-field"
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="label" htmlFor="new-role">Role</label>
                <select
                  id="new-role"
                  name="role"
                  value={form.role}
                  onChange={handleFormChange}
                  className="input-field"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r} className="bg-slate-800">
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Create User
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Users table */}
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              All Users ({users.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">ID</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Username</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Role</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3 text-slate-500 font-mono text-xs">{u.id}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-slate-100">{u.login}</span>
                        {u.id === currentUser?.id && (
                          <span className="ml-2 text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'text-xs px-2 py-0.5 rounded-full border capitalize',
                            u.role === 'admin'
                              ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                              : 'bg-slate-700 text-slate-400 border-slate-600',
                          ].join(' ')}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => setDeleteTarget(u)}
                          disabled={u.id === currentUser?.id}
                          className="btn-danger text-xs px-2 py-1 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={u.id === currentUser?.id ? 'Cannot delete yourself' : 'Delete user'}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                          </svg>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
