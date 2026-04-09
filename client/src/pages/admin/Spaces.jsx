import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/index.js';

const EMPTY_FORM = {
  userId: '',
  extension: '',
  sipPassword: '',
  pbxWssUrl: '',
};

function Modal({ title, children, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="card max-w-lg w-full shadow-2xl animate-slide-up">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SpaceForm({ form, onChange, users, error, submitting, onSubmit, onCancel, isEdit }) {
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-3">
      {error && (
        <div className="p-3 bg-red-900/40 border border-red-700/50 rounded-lg text-red-300 text-sm animate-fade-in">
          {error}
        </div>
      )}

      <div>
        <label className="label" htmlFor="space-user">Assigned User</label>
        <select
          id="space-user"
          name="userId"
          value={form.userId}
          onChange={onChange}
          className="input-field"
          required
        >
          <option value="" className="bg-slate-800">— Select a user —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id} className="bg-slate-800">
              {u.login} ({u.role})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="space-ext">Extension</label>
        <input
          id="space-ext"
          name="extension"
          type="text"
          value={form.extension}
          onChange={onChange}
          placeholder="e.g. 1001"
          className="input-field font-mono"
          required
        />
      </div>

      <div>
        <label className="label" htmlFor="space-pass">SIP Password</label>
        <input
          id="space-pass"
          name="sipPassword"
          type="password"
          value={form.sipPassword}
          onChange={onChange}
          placeholder={isEdit ? 'Leave blank to keep current' : 'SIP password'}
          className="input-field"
          autoComplete="new-password"
        />
      </div>

      <div>
        <label className="label" htmlFor="space-wss">PBX WSS URL</label>
        <input
          id="space-wss"
          name="pbxWssUrl"
          type="url"
          value={form.pbxWssUrl}
          onChange={onChange}
          placeholder="wss://pbx.example.com:8089/ws"
          className="input-field font-mono text-sm"
          required
        />
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving…
            </>
          ) : (
            isEdit ? 'Save Changes' : 'Create Space'
          )}
        </button>
      </div>
    </form>
  );
}

export default function AdminSpaces() {
  const [spaces, setSpaces] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [editError, setEditError] = useState('');
  const [editing, setEditing] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [spacesRes, usersRes] = await Promise.all([
        api.get('/admin/spaces'),
        api.get('/admin/users'),
      ]);
      setSpaces(Array.isArray(spacesRes.data) ? spacesRes.data : spacesRes.data.spaces ?? []);
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data.users ?? []);
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const validateForm = (form, isEdit) => {
    if (!form.userId) return 'Please select a user.';
    if (!form.extension.trim()) return 'Extension is required.';
    if (!isEdit && !form.sipPassword) return 'SIP password is required.';
    if (!form.pbxWssUrl.trim()) return 'PBX WSS URL is required.';
    if (!form.pbxWssUrl.startsWith('wss://') && !form.pbxWssUrl.startsWith('ws://')) {
      return 'PBX WSS URL must start with wss:// or ws://';
    }
    return null;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    const err = validateForm(createForm, false);
    if (err) { setCreateError(err); return; }

    setCreating(true);
    setCreateError('');
    try {
      await api.post('/admin/spaces', createForm);
      setShowCreate(false);
      setCreateForm(EMPTY_FORM);
      fetchAll();
    } catch (err) {
      setCreateError(err.response?.data?.error ?? 'Failed to create space.');
    } finally {
      setCreating(false);
    }
  };

  const openEdit = (space) => {
    setEditTarget(space);
    setEditForm({
      userId: space.userId ?? '',
      extension: space.extension ?? '',
      sipPassword: '',
      pbxWssUrl: space.pbxWssUrl ?? '',
    });
    setEditError('');
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    const err = validateForm(editForm, true);
    if (err) { setEditError(err); return; }

    setEditing(true);
    setEditError('');
    try {
      const payload = { ...editForm };
      if (!payload.sipPassword) delete payload.sipPassword;
      await api.put(`/admin/spaces/${editTarget.id}`, payload);
      setEditTarget(null);
      fetchAll();
    } catch (err) {
      setEditError(err.response?.data?.error ?? 'Failed to update space.');
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async (space) => {
    if (!window.confirm(`Delete space for extension ${space.extension}? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/spaces/${space.id}`);
      fetchAll();
    } catch (err) {
      setError(err.response?.data?.error ?? 'Failed to delete space.');
    }
  };

  const getUserLogin = (userId) => users.find((u) => String(u.id) === String(userId))?.login ?? '—';

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Create modal */}
      {showCreate && (
        <Modal title="Create SIP Space" onClose={() => { setShowCreate(false); setCreateForm(EMPTY_FORM); setCreateError(''); }}>
          <SpaceForm
            form={createForm}
            onChange={(e) => { setCreateForm((p) => ({ ...p, [e.target.name]: e.target.value })); setCreateError(''); }}
            users={users}
            error={createError}
            submitting={creating}
            onSubmit={handleCreate}
            onCancel={() => { setShowCreate(false); setCreateForm(EMPTY_FORM); setCreateError(''); }}
            isEdit={false}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editTarget && (
        <Modal title={`Edit Space — Ext. ${editTarget.extension}`} onClose={() => setEditTarget(null)}>
          <SpaceForm
            form={editForm}
            onChange={(e) => { setEditForm((p) => ({ ...p, [e.target.name]: e.target.value })); setEditError(''); }}
            users={users}
            error={editError}
            submitting={editing}
            onSubmit={handleEdit}
            onCancel={() => setEditTarget(null)}
            isEdit={true}
          />
        </Modal>
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
          <h1 className="text-lg font-bold text-white flex-1">SIP Space Management</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary text-xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            New Space
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {error && (
          <div className="p-3 bg-red-900/40 border border-red-700/50 rounded-lg text-red-300 text-sm">
            {error}
          </div>
        )}

        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-700">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
              SIP Spaces ({spaces.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : spaces.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-500 text-sm">No SIP spaces configured yet.</p>
              <button onClick={() => setShowCreate(true)} className="btn-primary text-xs mt-3">
                Create first space
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/50">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Extension</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Assigned User</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider hidden md:table-cell">PBX WSS URL</th>
                    <th className="text-right px-4 py-2.5 text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {spaces.map((space) => (
                    <tr key={space.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-white">{space.extension}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-slate-300">
                          {getUserLogin(space.userId)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="text-slate-400 font-mono text-xs truncate max-w-xs block">
                          {space.pbxWssUrl}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => openEdit(space)}
                            className="btn-secondary text-xs px-2 py-1"
                            title="Edit space"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(space)}
                            className="btn-danger text-xs px-2 py-1"
                            title="Delete space"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                            Delete
                          </button>
                        </div>
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
