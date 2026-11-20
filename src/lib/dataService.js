// Supabase persistence layer. Translates between database rows (snake_case,
// fractional rates) and the in-app workspace object shape (camelCase,
// percentage rates) used by the Admin Command Center and Client Portal.
import { supabase } from './supabase';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const num = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
// DB stores 0.16 / 0.50; UI works in 16 / 50.
const toPct = (v) => Math.round(num(v) * 10000) / 100;
const fromPct = (v) => num(v) / 100;

// Lead status: DB vocabulary <-> admin CRM vocabulary.
const STATUS_TO_UI = { New: 'New Inquiry' };
const STATUS_TO_DB = { 'New Inquiry': 'New' };

// ---------------------------------------------------------------------------
// Row -> app object
// ---------------------------------------------------------------------------

function workspaceFromRows(ws, creatives = [], leads = [], topups = []) {
  const ops = ws.ops_state || {};
  const extra = ops.economicsExtra || {};
  const aov = num(ws.aov);
  return {
    id: ws.id,
    name: ws.name,
    metaAccountId: ws.meta_ad_account_id || '',
    website: ws.domain ? (ws.domain.startsWith('http') ? ws.domain : `https://${ws.domain}`) : '',
    domain: ws.domain || '',
    coreOffer: ws.offer_name || '',
    currency: ws.currency || 'KES',
    currentPhase: ws.phase || 'Phase 1: Track Money',
    lastSyncedAt: ws.last_synced_at,
    // Synced creative spend is Meta's last_30d window; analytics aligns leads to it.
    spendWindowDays: ws.last_synced_at ? 30 : 0,
    // Spend since the first M-Pesa top-up (null until the sync has computed it).
    prepaidSpend: ws.prepaid_spend ?? null,
    prepaidSpendSince: ws.prepaid_spend_since ?? null,
    economics: {
      dailyRate: num(extra.dailyRate, aov),
      avgTripDays: num(extra.avgTripDays, 1),
      avgOrderValue: aov,
      grossMarginPct: toPct(ws.gross_margin),
      dailyBudget: num(ws.daily_budget),
      vatRate: toPct(ws.vat_rate ?? 0.16),
      targetCpl: num(ws.target_cpl),
      closeRatePct: toPct(ws.close_rate),
      depositPct: toPct(ws.deposit_pct),
      fleetUnits: num(extra.fleetUnits, 1),
      fleetMaxMonthlyBookings: num(ws.fleet_cap_monthly)
    },
    topUps: topups.map((t) => ({
      id: t.id,
      date: (t.created_at || '').slice(0, 10),
      method: 'M-Pesa Prepaid',
      grossAmount: num(t.gross_amount),
      vatDeducted: num(t.vat_deducted),
      netAdSpend: num(t.net_ad_spend),
      note: t.reference || ''
    })),
    creatives: creatives.map((c) => ({
      id: c.id,
      metaAdId: c.meta_ad_id || '',
      assetId: c.asset_code || '',
      adName: c.name || '',
      bucket: c.bucket || '20% Variation',
      status: c.status || 'Active',
      launchDate: c.launched_at,
      spend: num(c.spend),
      impressions: num(c.impressions),
      threeSecPlays: num(c.three_sec_views),
      outboundClicks: num(c.outbound_clicks),
      leads: num(c.leads),
      updatedAt: c.updated_at
    })),
    leads: leads.map((l) => ({
      id: l.id,
      createdAt: l.created_at,
      name: l.client_name || '',
      phone: l.phone_e164 || '',
      email: l.email || '',
      fbclid: l.fbclid || '',
      assetId: l.asset_code || '',
      icebreaker: l.icebreaker || '',
      responseMins: num(l.response_mins),
      quoteValue: num(l.quote_amount),
      addonsValue: num(l.addons_amount),
      stage: STATUS_TO_UI[l.status] || l.status || 'New Inquiry',
      depositPaid: num(l.deposit_amount),
      capiExported: Boolean(l.capi_exported)
    })),
    qaChecklist: ops.qaChecklist || {},
    sprintChecklist: ops.sprintChecklist || {},
    streakDays: num(ops.streakDays),
    ruleOf100Logs: ops.ruleOf100Logs || []
  };
}

// ---------------------------------------------------------------------------
// App object -> rows
// ---------------------------------------------------------------------------

function workspaceToRow(c) {
  const ec = c.economics || {};
  return {
    name: c.name,
    domain: String(c.website || c.domain || '').replace(/^https?:\/\//, '').replace(/\/$/, '') || null,
    meta_ad_account_id: String(c.metaAccountId || '').replace(/^act_/, '') || null,
    currency: c.currency || 'KES',
    daily_budget: num(ec.dailyBudget),
    vat_rate: fromPct(ec.vatRate ?? 16),
    offer_name: c.coreOffer || null,
    aov: num(ec.avgOrderValue),
    gross_margin: fromPct(ec.grossMarginPct),
    target_cpl: num(ec.targetCpl),
    close_rate: fromPct(ec.closeRatePct),
    deposit_pct: fromPct(ec.depositPct),
    phase: c.currentPhase || null,
    fleet_cap_monthly: num(ec.fleetMaxMonthlyBookings),
    ops_state: {
      qaChecklist: c.qaChecklist || {},
      sprintChecklist: c.sprintChecklist || {},
      streakDays: num(c.streakDays),
      ruleOf100Logs: c.ruleOf100Logs || [],
      economicsExtra: {
        dailyRate: num(ec.dailyRate),
        avgTripDays: num(ec.avgTripDays, 1),
        fleetUnits: num(ec.fleetUnits, 1)
      }
    }
  };
}

const creativeToRow = (wsId, a) => ({
  id: a.id,
  workspace_id: wsId,
  meta_ad_id: a.metaAdId || null,
  asset_code: a.assetId || null,
  name: a.adName || null,
  bucket: a.bucket || null,
  status: a.status || 'Active',
  launched_at: a.launchDate || new Date().toISOString(),
  spend: num(a.spend),
  impressions: Math.round(num(a.impressions)),
  three_sec_views: Math.round(num(a.threeSecPlays)),
  outbound_clicks: Math.round(num(a.outboundClicks)),
  leads: Math.round(num(a.leads))
});

const leadToRow = (wsId, l) => ({
  id: l.id,
  workspace_id: wsId,
  client_name: l.name || null,
  phone_e164: l.phone || null,
  email: l.email || null,
  fbclid: l.fbclid || null,
  icebreaker: l.icebreaker || null,
  asset_code: l.assetId || null,
  response_mins: num(l.responseMins),
  quote_amount: num(l.quoteValue),
  addons_amount: num(l.addonsValue),
  deposit_amount: num(l.depositPaid),
  status: STATUS_TO_DB[l.stage] || l.stage || 'New',
  capi_exported: Boolean(l.capiExported),
  created_at: l.createdAt || new Date().toISOString()
});

const topupToRow = (wsId, t) => ({
  id: t.id,
  workspace_id: wsId,
  gross_amount: num(t.grossAmount),
  reference: t.note || null,
  created_at: t.date ? new Date(t.date).toISOString() : new Date().toISOString()
});

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

const COLLECTIONS = [
  { key: 'creatives', table: 'ad_creatives', toRow: creativeToRow, order: 'launched_at' },
  { key: 'leads', table: 'leads', toRow: leadToRow, order: 'created_at' },
  { key: 'topUps', table: 'mpesa_topups', toRow: topupToRow, order: 'created_at' }
];

async function fetchChildren(table, order, workspaceId) {
  let q = supabase.from(table).select('*').order(order, { ascending: false });
  if (workspaceId) q = q.eq('workspace_id', workspaceId);
  return unwrap(await q);
}

async function loadBundles(workspacesPromise, workspaceId) {
  const [workspaces, creatives, leads, topups] = await Promise.all([
    workspacesPromise,
    fetchChildren('ad_creatives', 'launched_at', workspaceId),
    fetchChildren('leads', 'created_at', workspaceId),
    fetchChildren('mpesa_topups', 'created_at', workspaceId)
  ]);
  const by = (rows, id) => rows.filter((r) => r.workspace_id === id);
  return workspaces.map((ws) =>
    workspaceFromRows(ws, by(creatives, ws.id), by(leads, ws.id), by(topups, ws.id))
  );
}

/** Admin: load every workspace with its children (full columns, admin-only under RLS). */
export async function fetchWorkspaces() {
  const wq = supabase.from('workspaces').select('*').order('created_at', { ascending: true });
  return loadBundles(wq.then(unwrap));
}

/**
 * Client: load the caller's own workspace. Clients cannot read the workspaces table
 * directly; client_workspace() returns only the client-safe columns.
 */
export async function fetchClientWorkspace(workspaceId) {
  const rows = supabase.rpc('client_workspace').then(unwrap);
  const [ws] = await loadBundles(rows, workspaceId);
  return ws || null;
}

/** Give any locally created child item a UUID so it can be persisted as-is. */
export function ensureUuids(client) {
  const fix = (arr) =>
    (arr || []).map((item) => (UUID_RE.test(String(item.id)) ? item : { ...item, id: crypto.randomUUID() }));
  return { ...client, creatives: fix(client.creatives), leads: fix(client.leads), topUps: fix(client.topUps) };
}

/** Persist the difference between two versions of the same workspace object. */
export async function persistClientDiff(prev, next) {
  const tasks = [];
  const prevWs = JSON.stringify(workspaceToRow(prev));
  const nextWsRow = workspaceToRow(next);
  if (prevWs !== JSON.stringify(nextWsRow)) {
    tasks.push(supabase.from('workspaces').update(nextWsRow).eq('id', next.id).then(unwrap));
  }

  for (const { key, table, toRow } of COLLECTIONS) {
    const before = new Map((prev[key] || []).map((x) => [x.id, JSON.stringify(toRow(prev.id, x))]));
    const after = (next[key] || []).map((x) => toRow(next.id, x));
    const afterIds = new Set(after.map((r) => r.id));

    const changed = after.filter((r) => before.get(r.id) !== JSON.stringify(r));
    if (key === 'creatives') changed.forEach((r) => (r.updated_at = new Date().toISOString()));
    const removed = [...before.keys()].filter((id) => !afterIds.has(id));

    if (changed.length) tasks.push(supabase.from(table).upsert(changed, { onConflict: 'id' }).then(unwrap));
    if (removed.length) tasks.push(supabase.from(table).delete().in('id', removed).then(unwrap));
  }
  await Promise.all(tasks);
}

/** Insert a brand-new workspace plus any seeded child rows; returns the hydrated object. */
export async function createWorkspace(client) {
  const [row] = unwrap(await supabase.from('workspaces').insert(workspaceToRow(client)).select());
  const created = ensureUuids({ ...client, id: row.id, lastSyncedAt: row.last_synced_at });
  await persistClientDiff({ ...created, creatives: [], leads: [], topUps: [] }, created);
  return created;
}

export async function deleteWorkspace(id) {
  unwrap(await supabase.from('workspaces').delete().eq('id', id));
}

/** Client-portal action: mark a lead as deposit paid. */
export async function confirmLeadDeposit(leadId, depositAmount) {
  unwrap(
    await supabase
      .from('leads')
      .update({ status: 'Deposit Paid', deposit_amount: num(depositAmount) })
      .eq('id', leadId)
  );
}
