import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

const TOKEN_WARN_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

const fmt = (iso) =>
  new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

/**
 * Health of the Meta sync for one workspace, most urgent first:
 * failed last run > token expired/expiring > never synced > healthy.
 * `now` is passed in so render stays pure.
 */
function syncHealth(client, now) {
  const tokenMs = client.metaTokenExpiresAt ? new Date(client.metaTokenExpiresAt).getTime() : null;
  const daysLeft = tokenMs === null ? null : Math.floor((tokenMs - now) / DAY_MS);

  if (client.lastSyncError) {
    return {
      tone: 'alert',
      label: 'Meta sync failed',
      detail: `${client.lastSyncAttemptAt ? `${fmt(client.lastSyncAttemptAt)}: ` : ''}${client.lastSyncError}`
    };
  }
  if (daysLeft !== null && daysLeft < 0) {
    return { tone: 'alert', label: 'Meta token expired', detail: 'Replace META_ACCESS_TOKEN in Vercel.' };
  }
  if (daysLeft !== null && daysLeft <= TOKEN_WARN_DAYS) {
    return {
      tone: 'caution',
      label: `Token expires in ${daysLeft}d`,
      detail: `Meta access token expires ${fmt(client.metaTokenExpiresAt)}. Replace META_ACCESS_TOKEN in Vercel.`
    };
  }
  if (!client.lastSyncedAt) {
    return { tone: 'neutral', label: 'Meta sync pending', detail: 'No successful sync yet.' };
  }
  const fx =
    client.adAccountCurrency && client.adAccountCurrency !== client.currency && client.fxRate
      ? ` Spend converted ${client.adAccountCurrency}->${client.currency} at ${Number(client.fxRate).toFixed(2)}.`
      : '';
  return {
    tone: 'healthy',
    label: `Meta sync ${fmt(client.lastSyncedAt)}`,
    detail: `Last successful sync ${fmt(client.lastSyncedAt)}.${fx}`
  };
}

const TONE_CLASS = {
  healthy: 'bg-[#F1F5F9] border-[#E2E8F0] text-[#334155]',
  neutral: 'bg-[#F1F5F9] border-[#E2E8F0] text-[#334155]',
  caution: 'bg-amber-50 border-amber-200 text-amber-800',
  alert: 'bg-red-50 border-red-200 text-red-700'
};

/** Header chip + "Sync now" button for admins (remote mode only). */
export default function SyncStatus({ client, onSynced, showToast }) {
  const [running, setRunning] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const health = syncHealth(client, now);

  const syncNow = async () => {
    setRunning(true);
    try {
      const { data } = await supabase.auth.getSession();
      const resp = await fetch(`/api/sync-meta?workspaceId=${encodeURIComponent(client.id)}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session?.access_token || ''}` }
      });
      const body = await resp.json().catch(() => ({}));
      const result = body.results?.[0];
      if (resp.ok && result?.ok) {
        const n = (result.updated || 0) + (result.inserted || 0);
        showToast?.(`Meta sync complete: ${n} ${n === 1 ? 'ad' : 'ads'} updated.`);
      } else {
        showToast?.(`Meta sync failed: ${result?.error || body.error || `HTTP ${resp.status}`}`, 'alert');
      }
    } catch (err) {
      showToast?.(`Meta sync failed: ${err.message}`, 'alert');
    } finally {
      await onSynced?.();
      setNow(Date.now());
      setRunning(false);
    }
  };

  return (
    <span className="hidden lg:inline-flex items-center gap-1">
      <span
        className={`inline-flex items-center px-2.5 py-1 rounded-md border font-mono text-[11px] tabular-nums max-w-[220px] truncate ${TONE_CLASS[health.tone]}`}
        title={health.detail}
      >
        {health.label}
      </span>
      {client.metaAccountId && (
        <button
          onClick={syncNow}
          disabled={running}
          className="p-1.5 rounded-md border border-[#E5E7EB] bg-white text-[#475569] hover:text-[#0F172A] disabled:opacity-60 cursor-pointer disabled:cursor-wait"
          title="Sync this workspace from Meta now"
          aria-label="Sync now"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${running ? 'animate-spin' : ''}`} strokeWidth={1.75} />
        </button>
      )}
    </span>
  );
}
