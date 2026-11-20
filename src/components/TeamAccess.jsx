import { useEffect, useState } from 'react';
import { UserPlus, KeyRound, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import StatusBadge from './StatusBadge';

async function callAdminApi(payload) {
  const { data } = await supabase.auth.getSession();
  const resp = await fetch('/api/admin-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session?.access_token || ''}`
    },
    body: JSON.stringify(payload)
  });
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(body.error || `Request failed (${resp.status})`);
  return body;
}

const selectCls =
  'bg-white border border-[#E5E7EB] rounded-md px-2 py-1 text-xs font-medium text-[#0F172A] cursor-pointer disabled:cursor-not-allowed disabled:bg-[#F7F8FA] disabled:text-[#64748B]';
const inputCls =
  'w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-[#0F172A]';

/** Admin view: invite users, set role and workspace, send password resets, remove access. */
export default function TeamAccess({ workspaces, currentUserId, showToast }) {
  const [users, setUsers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [form, setForm] = useState({ email: '', fullName: '', role: 'client', workspaceId: '' });

  const load = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, workspace_id, created_at')
      .order('created_at', { ascending: true });
    if (error) {
      setStatus('error');
      showToast(`Could not load users: ${error.message}`, 'alert');
      return;
    }
    setUsers(data || []);
    setStatus('ready');
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateProfile = async (user, patch) => {
    const next = { ...patch };
    if (next.role === 'admin') next.workspace_id = null;
    const previous = users;
    setUsers((list) => list.map((u) => (u.id === user.id ? { ...u, ...next } : u)));
    const { error } = await supabase.from('profiles').update(next).eq('id', user.id);
    if (error) {
      setUsers(previous);
      showToast(`Update failed: ${error.message}`, 'alert');
    } else {
      showToast(`Updated access for ${user.email}.`);
    }
  };

  const sendReset = async (user) => {
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin
    });
    if (error) showToast(`Could not send reset: ${error.message}`, 'alert');
    else showToast(`Password reset link sent to ${user.email}.`);
  };

  const removeUser = async (user) => {
    try {
      await callAdminApi({ action: 'delete', userId: user.id });
      setUsers((list) => list.filter((u) => u.id !== user.id));
      showToast(`Removed ${user.email}.`);
    } catch (err) {
      showToast(err.message, 'alert');
    } finally {
      setConfirmRemove(null);
    }
  };

  const invite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      await callAdminApi({ action: 'invite', ...form, workspaceId: form.role === 'client' ? form.workspaceId : null });
      showToast(`Invitation sent to ${form.email}.`);
      setForm({ email: '', fullName: '', role: 'client', workspaceId: '' });
      load();
    } catch (err) {
      showToast(err.message, 'alert');
    } finally {
      setInviting(false);
    }
  };

  const wsName = (id) => workspaces.find((w) => w.id === id)?.name;

  return (
    <div className="space-y-6">
      <form onSubmit={invite} className="card-surface rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[#0F172A]">Invite a user</h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            They receive an email link to set a password. Clients only ever see their own workspace.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="email"
            required
            placeholder="name@company.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={inputCls}
            aria-label="Email"
          />
          <input
            type="text"
            placeholder="Full name"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className={inputCls}
            aria-label="Full name"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className={inputCls}
            aria-label="Role"
          >
            <option value="client">Client (portal only)</option>
            <option value="admin">Admin (full access)</option>
          </select>
          <select
            value={form.workspaceId}
            onChange={(e) => setForm({ ...form, workspaceId: e.target.value })}
            disabled={form.role !== 'client'}
            required={form.role === 'client'}
            className={inputCls}
            aria-label="Workspace"
          >
            <option value="">{form.role === 'client' ? 'Select workspace' : 'All workspaces'}</option>
            {workspaces.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={inviting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-medium cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" strokeWidth={1.75} />
            {inviting ? 'Sending invite' : 'Send invite'}
          </button>
        </div>
      </form>

      <div className="card-surface rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
          <h2 className="text-sm font-semibold text-[#0F172A]">Users</h2>
          <button
            onClick={load}
            className="inline-flex items-center gap-1 text-[11px] text-[#64748B] hover:text-[#0F172A] cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" strokeWidth={1.75} />
            Refresh
          </button>
        </div>
        {status === 'loading' ? (
          <div className="px-5 py-8 text-center text-xs text-[#64748B]">Loading users</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#F7F8FA] text-[#64748B] text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="text-left font-semibold px-5 py-2.5">User</th>
                  <th className="text-left font-semibold px-3 py-2.5">Role</th>
                  <th className="text-left font-semibold px-3 py-2.5">Workspace</th>
                  <th className="text-right font-semibold px-5 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {users.map((u) => {
                  const isSelf = u.id === currentUserId;
                  return (
                    <tr key={u.id} className="hover:bg-[#F7F8FA]">
                      <td className="px-5 py-3">
                        <div className="font-medium text-[#0F172A]">
                          {u.full_name || 'Unnamed'} {isSelf && <span className="text-[#64748B]">(you)</span>}
                        </div>
                        <div className="font-mono text-[11px] text-[#64748B]">{u.email}</div>
                      </td>
                      <td className="px-3 py-3">
                        <select
                          value={u.role}
                          disabled={isSelf}
                          title={isSelf ? 'You cannot change your own role' : undefined}
                          onChange={(e) => updateProfile(u, { role: e.target.value })}
                          className={selectCls}
                        >
                          <option value="client">Client</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-3 py-3">
                        {u.role === 'admin' ? (
                          <span className="text-[#64748B]">All workspaces</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <select
                              value={u.workspace_id || ''}
                              onChange={(e) => updateProfile(u, { workspace_id: e.target.value || null })}
                              className={selectCls}
                            >
                              <option value="">Not linked</option>
                              {workspaces.map((w) => (
                                <option key={w.id} value={w.id}>
                                  {w.name}
                                </option>
                              ))}
                            </select>
                            {!wsName(u.workspace_id) && <StatusBadge tone="caution">No access</StatusBadge>}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <button
                          onClick={() => sendReset(u)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#E5E7EB] hover:border-[#0F172A] text-[11px] font-medium text-[#0F172A] mr-1.5 cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" strokeWidth={1.75} />
                          Reset password
                        </button>
                        {!isSelf &&
                          (confirmRemove === u.id ? (
                            <>
                              <button
                                onClick={() => removeUser(u)}
                                className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#991B1B] text-white text-[11px] font-medium mr-1 cursor-pointer"
                              >
                                Confirm remove
                              </button>
                              <button
                                onClick={() => setConfirmRemove(null)}
                                className="px-2 py-1 text-[11px] text-[#64748B] cursor-pointer"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setConfirmRemove(u.id)}
                              className="p-1 text-[#64748B] hover:text-[#991B1B] cursor-pointer align-middle"
                              aria-label={`Remove ${u.email}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                            </button>
                          ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
