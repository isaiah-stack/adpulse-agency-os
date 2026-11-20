// Vercel Serverless Function: admin-only user management actions that need the
// Supabase service-role key (creating and deleting auth users). Listing users and
// changing role/workspace are done from the browser under the admin RLS policies.
//
// POST /api/admin-users
//   Authorization: Bearer <caller's Supabase access token>
//   { "action": "invite", "email", "fullName", "role": "admin"|"client", "workspaceId" }
//   { "action": "delete", "userId" }
import { serviceClient, requireAdmin } from './_lib/supabaseAdmin.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const db = serviceClient();
  if (!db) return res.status(500).json({ error: 'Supabase service credentials are not configured.' });

  const caller = await requireAdmin(db, req);
  if (!caller) return res.status(403).json({ error: 'Admin access required.' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

  if (body.action === 'invite') {
    const email = String(body.email || '').trim().toLowerCase();
    const fullName = String(body.fullName || '').trim().slice(0, 120);
    const role = body.role === 'admin' ? 'admin' : 'client';
    const workspaceId = body.workspaceId ? String(body.workspaceId) : null;
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
    if (workspaceId && !UUID_RE.test(workspaceId)) return res.status(400).json({ error: 'Invalid workspace.' });
    if (role === 'client' && !workspaceId) {
      return res.status(400).json({ error: 'Client users must be linked to a workspace.' });
    }

    const origin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : undefined);
    const { data, error } = await db.auth.admin.inviteUserByEmail(email, {
      data: { full_name: fullName },
      redirectTo: origin
    });
    if (error) {
      const exists = /already|registered|exists/i.test(error.message);
      return res.status(exists ? 409 : 400).json({
        error: exists ? 'A user with this email already exists.' : error.message
      });
    }

    const { error: profileError } = await db.from('profiles').upsert(
      { id: data.user.id, email, full_name: fullName, role, workspace_id: role === 'client' ? workspaceId : null },
      { onConflict: 'id' }
    );
    if (profileError) return res.status(500).json({ error: profileError.message });
    return res.status(200).json({ ok: true, userId: data.user.id });
  }

  if (body.action === 'delete') {
    const userId = String(body.userId || '');
    if (!UUID_RE.test(userId)) return res.status(400).json({ error: 'Invalid user.' });
    if (userId === caller.id) return res.status(400).json({ error: 'You cannot remove your own account.' });
    const { error } = await db.auth.admin.deleteUser(userId); // profile row cascades
    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(400).json({ error: 'Unknown action.' });
}
