// Vercel Serverless Function: pulls Meta Ads data for every workspace with a Meta ad
// account and writes it to Supabase. Triggered by Vercel Cron (see vercel.json).
//
// Per workspace it:
//   1. Reads last-30-day ad-level insights (spend, impressions, outbound clicks, actions).
//   2. Reads each ad's real delivery status and creation time.
//   3. Matches ads to existing ad_creatives rows (by meta_ad_id, else claims a manually
//      created row with the same asset code) so nothing is duplicated, then writes them.
//      Synced ads with no delivery in the window are zeroed instead of keeping old figures.
//   4. Computes spend since the first M-Pesa top-up for an accurate prepaid balance.
//   5. Converts spend from the ad account's currency (e.g. USD) into the workspace currency
//      (e.g. KES) using workspaces.fx_rate_override, else a daily market rate.
//
// Callers: Vercel Cron (Authorization: Bearer CRON_SECRET) or a signed-in admin's
// "Sync now" button (Authorization: Bearer <Supabase access token>, optional
// ?workspaceId=<uuid> to sync one workspace). Each workspace records its outcome in
// last_sync_attempt_at / last_sync_error, and meta_token_expires_at tracks the token.
import { timingSafeEqual } from 'node:crypto';
import { serviceClient, requireAdmin } from './_lib/supabaseAdmin.js';

const GRAPH = 'https://graph.facebook.com/v21.0';
const INSIGHT_FIELDS = 'ad_id,ad_name,spend,impressions,outbound_clicks,actions';
// Click-to-WhatsApp inquiries first, then classic lead events.
const LEAD_ACTION_TYPES = [
  'onsite_conversion.messaging_conversation_started_7d',
  'lead',
  'onsite_conversion.lead_grouped',
  'offsite_conversion.fb_pixel_lead'
];
const PAUSED_STATUSES = new Set([
  'PAUSED',
  'CAMPAIGN_PAUSED',
  'ADSET_PAUSED',
  'PENDING_REVIEW',
  'IN_PROCESS',
  'PENDING_BILLING_INFO',
  'WITH_ISSUES'
]);

const sumAction = (list, type) =>
  (Array.isArray(list) ? list : [])
    .filter((a) => a.action_type === type)
    .reduce((s, a) => s + (Number(a.value) || 0), 0);

function leadsFrom(actions) {
  for (const type of LEAD_ACTION_TYPES) {
    const n = sumAction(actions, type);
    if (n > 0) return n;
  }
  return 0;
}

// Meta effective_status -> app status. Ads missing from the ads listing were deleted/archived.
function mapStatus(effectiveStatus) {
  if (!effectiveStatus) return 'Killed';
  if (effectiveStatus === 'ACTIVE') return 'Active';
  if (PAUSED_STATUSES.has(effectiveStatus)) return 'Paused';
  return 'Killed'; // DISAPPROVED, ARCHIVED, DELETED, ...
}

// "VID_GROUP-MARKUP_V1_A001" -> "A001" (underscore-delimited, so \b cannot be used).
export const assetCodeFrom = (name) =>
  (String(name || '').match(/(?:^|[^A-Za-z0-9])(A\d{3,})(?!\d)/) || [])[1] || null;

async function graphGetAll(path, params, token) {
  const qs = new URLSearchParams({ ...params, limit: '500', access_token: token });
  let url = `${GRAPH}/${path}?${qs}`;
  const rows = [];
  while (url) {
    const resp = await fetch(url);
    const body = await resp.json();
    if (!resp.ok || body.error) {
      throw new Error(body.error?.message || `Meta API HTTP ${resp.status}`);
    }
    rows.push(...(body.data || []));
    url = body.paging?.next || null;
  }
  return rows;
}

const FX_API = 'https://open.er-api.com/v6/latest';
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Rate to turn ad-account money into workspace money (1 `from` = rate `to`).
 * Order: same currency -> 1; admin override; live market rate; last stored rate.
 * Throws rather than silently saving unconverted figures.
 */
export async function resolveFxRate(ws, from, to, fetchImpl = fetch) {
  if (!from || !to || from === to) return { rate: 1, source: 'same-currency' };
  const override = Number(ws.fx_rate_override);
  if (override > 0) return { rate: override, source: 'override' };
  try {
    const resp = await fetchImpl(`${FX_API}/${encodeURIComponent(from)}`);
    const body = await resp.json();
    const rate = Number(body?.rates?.[to]);
    if (resp.ok && body?.result === 'success' && rate > 0) return { rate, source: 'market' };
    throw new Error(`no ${from}->${to} rate in FX response`);
  } catch (err) {
    const last = Number(ws.fx_rate);
    if (last > 0 && ws.ad_account_currency === from) return { rate: last, source: 'last-known' };
    throw new Error(`Cannot convert ${from} to ${to}: ${err.message}. Set workspaces.fx_rate_override.`);
  }
}

function isCron(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed: the endpoint is never public
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(String(req.headers.authorization || ''));
  return given.length === expected.length && timingSafeEqual(given, expected);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * When the Meta token stops working: the earlier of the token expiry and Meta's
 * separate data-access expiry (0 means "never" for either). Null when unknown/never.
 * A token may inspect itself, so no app secret is needed.
 */
export async function metaTokenExpiry(token, fetchImpl = fetch) {
  try {
    const qs = new URLSearchParams({ input_token: token, access_token: token });
    const resp = await fetchImpl(`${GRAPH}/debug_token?${qs}`);
    const d = (await resp.json())?.data;
    if (!resp.ok || !d) return null;
    const times = [d.expires_at, d.data_access_expires_at].map(Number).filter((t) => t > 0);
    return times.length ? new Date(Math.min(...times) * 1000).toISOString() : null;
  } catch {
    return null; // expiry is advisory; never block the sync on it
  }
}

export async function syncWorkspace(db, ws, token) {
  const act = `act_${String(ws.meta_ad_account_id).replace(/^act_/, '')}`;
  const now = new Date().toISOString();

  const acctResp = await fetch(`${GRAPH}/${act}?${new URLSearchParams({ fields: 'currency', access_token: token })}`);
  const acctBody = await acctResp.json();
  if (!acctResp.ok || acctBody.error) {
    throw new Error(acctBody.error?.message || `Meta API HTTP ${acctResp.status}`);
  }
  const accountCurrency = acctBody.currency || null;
  const workspaceCurrency = ws.currency || 'KES';
  const fx = await resolveFxRate(ws, accountCurrency, workspaceCurrency);
  const toWs = (amount) => round2((Number(amount) || 0) * fx.rate);

  const [insights, ads, existingRes, firstTopupRes] = await Promise.all([
    graphGetAll(`${act}/insights`, { level: 'ad', date_preset: 'last_30d', fields: INSIGHT_FIELDS }, token),
    graphGetAll(`${act}/ads`, { fields: 'id,name,effective_status,created_time' }, token),
    db.from('ad_creatives').select('id, meta_ad_id, asset_code, name').eq('workspace_id', ws.id),
    db
      .from('mpesa_topups')
      .select('created_at')
      .eq('workspace_id', ws.id)
      .order('created_at', { ascending: true })
      .limit(1)
  ]);
  if (existingRes.error) throw existingRes.error;
  if (firstTopupRes.error) throw firstTopupRes.error;

  const adsById = new Map(ads.map((a) => [a.id, a]));
  const insightsById = new Map(insights.map((r) => [r.ad_id, r]));
  const existing = existingRes.data || [];
  const byMetaId = new Map(existing.filter((r) => r.meta_ad_id).map((r) => [r.meta_ad_id, r]));
  const unclaimed = existing.filter((r) => !r.meta_ad_id);

  // Ads to write: anything that delivered in the window, anything currently live (may not
  // have delivered yet), and every ad already synced (so stale figures get zeroed).
  const targetIds = new Set([
    ...insightsById.keys(),
    ...ads.filter((a) => a.effective_status === 'ACTIVE').map((a) => a.id),
    ...byMetaId.keys()
  ]);

  const updates = [];
  const inserts = [];
  for (const adId of targetIds) {
    const ins = insightsById.get(adId);
    const meta = adsById.get(adId);
    const name = ins?.ad_name || meta?.name || null;
    const fields = {
      meta_ad_id: adId,
      name,
      status: mapStatus(meta?.effective_status),
      spend: toWs(ins?.spend),
      impressions: Number(ins?.impressions) || 0,
      three_sec_views: sumAction(ins?.actions, 'video_view'),
      outbound_clicks: sumAction(ins?.outbound_clicks, 'outbound_click'),
      leads: leadsFrom(ins?.actions),
      updated_at: now,
      ...(meta?.created_time ? { launched_at: new Date(meta.created_time).toISOString() } : {})
    };

    let row = byMetaId.get(adId);
    if (!row) {
      // Claim a manually created creative for the same asset instead of duplicating it.
      const code = assetCodeFrom(name);
      const idx = unclaimed.findIndex(
        (r) => (code && r.asset_code === code) || (name && r.name === name)
      );
      if (idx >= 0) row = unclaimed.splice(idx, 1)[0];
    }

    if (row) updates.push({ id: row.id, fields });
    else inserts.push({ ...fields, workspace_id: ws.id, asset_code: assetCodeFrom(name) });
  }

  // Per-row updates keep untouched columns (asset_code, bucket) intact.
  const results = await Promise.all(
    updates.map(({ id, fields }) => db.from('ad_creatives').update(fields).eq('id', id))
  );
  const failedUpdate = results.find((r) => r.error);
  if (failedUpdate) throw failedUpdate.error;

  if (inserts.length) {
    const { error } = await db
      .from('ad_creatives')
      .upsert(inserts, { onConflict: 'workspace_id,meta_ad_id' });
    if (error) throw error;
  }

  // Spend since the first top-up, for the prepaid M-Pesa balance.
  const wsPatch = {
    last_synced_at: now,
    last_sync_attempt_at: now,
    last_sync_error: null,
    prepaid_spend: null,
    prepaid_spend_since: null,
    ad_account_currency: accountCurrency,
    fx_rate: fx.rate,
    fx_rate_at: now
  };
  const firstTopup = firstTopupRes.data?.[0];
  if (firstTopup) {
    const since = firstTopup.created_at.slice(0, 10);
    const until = now.slice(0, 10);
    const acct = await graphGetAll(
      `${act}/insights`,
      { level: 'account', fields: 'spend', time_range: JSON.stringify({ since, until }) },
      token
    );
    wsPatch.prepaid_spend = toWs(acct.reduce((s, r) => s + (Number(r.spend) || 0), 0));
    wsPatch.prepaid_spend_since = since;
  }
  const { error: wsErr } = await db.from('workspaces').update(wsPatch).eq('id', ws.id);
  if (wsErr) throw wsErr;

  return {
    updated: updates.length,
    inserted: inserts.length,
    prepaidSpend: wsPatch.prepaid_spend,
    currency: { account: accountCurrency, workspace: workspaceCurrency, rate: fx.rate, source: fx.source }
  };
}

export default async function handler(req, res) {
  const db = serviceClient();
  const token = process.env.META_ACCESS_TOKEN;
  if (!db || !token) {
    return res.status(500).json({
      error: 'Missing SUPABASE_URL/VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY or META_ACCESS_TOKEN'
    });
  }
  // Cron secret first (cheap, no network); otherwise require a signed-in admin.
  const cron = isCron(req);
  if (!cron && !(await requireAdmin(db, req))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const onlyId = cron ? null : String(req.query?.workspaceId || '') || null;
  if (onlyId && !UUID_RE.test(onlyId)) return res.status(400).json({ error: 'Invalid workspace.' });

  let query = db
    .from('workspaces')
    .select('id, name, meta_ad_account_id, currency, ad_account_currency, fx_rate, fx_rate_override')
    .not('meta_ad_account_id', 'is', null)
    .neq('meta_ad_account_id', '');
  if (onlyId) query = query.eq('id', onlyId);
  const { data: workspaces, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  if (onlyId && !workspaces.length) {
    return res.status(404).json({ error: 'Workspace not found or has no Meta ad account.' });
  }

  const tokenExpiresAt = await metaTokenExpiry(token);

  const results = [];
  for (const ws of workspaces) {
    const attemptAt = new Date().toISOString();
    try {
      results.push({ workspace: ws.name, ok: true, ...(await syncWorkspace(db, ws, token)) });
    } catch (err) {
      console.error(`sync-meta failed for ${ws.name}:`, err);
      results.push({ workspace: ws.name, ok: false, error: err.message });
      const { error: markErr } = await db
        .from('workspaces')
        .update({ last_sync_attempt_at: attemptAt, last_sync_error: String(err.message).slice(0, 500) })
        .eq('id', ws.id);
      if (markErr) console.error(`could not record sync error for ${ws.name}:`, markErr);
    }
  }

  // Token health is shared by every workspace the token serves.
  if (workspaces.length) {
    const { error: tokErr } = await db
      .from('workspaces')
      .update({ meta_token_expires_at: tokenExpiresAt })
      .in('id', workspaces.map((w) => w.id));
    if (tokErr) console.error('could not record token expiry:', tokErr);
  }

  const failed = results.filter((r) => !r.ok).length;
  return res.status(failed && failed === results.length ? 502 : 200).json({
    syncedAt: new Date().toISOString(),
    trigger: cron ? 'cron' : 'admin',
    tokenExpiresAt,
    workspaces: results.length,
    failed,
    results
  });
}
