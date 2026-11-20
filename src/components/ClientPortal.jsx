import { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp,
  LogOut,
  RefreshCw,
  Wallet,
  MessageSquare,
  CheckCircle2,
  BarChart3,
  Eye,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { computeWorkspaceAnalytics, formatMoney, formatDec } from '../lib/analytics';
import { fetchClientWorkspace, confirmLeadDeposit } from '../lib/dataService';

// Plain-English vocabulary for the executive audience.
const LEAD_STATUS_LABEL = {
  'New Inquiry': { label: 'New inquiry', tone: 'neutral' },
  Quoted: { label: 'Quote sent', tone: 'caution' },
  'Deposit Paid': { label: 'Booked', tone: 'healthy' },
  Completed: { label: 'Trip completed', tone: 'healthy' },
  Lost: { label: 'Not proceeding', tone: 'alert' }
};
const AD_STATUS_LABEL = {
  Active: { label: 'Running', tone: 'healthy' },
  Paused: { label: 'Paused', tone: 'neutral' },
  Killed: { label: 'Stopped', tone: 'neutral' }
};
const isBooked = (stage) => stage === 'Deposit Paid' || stage === 'Completed';

function formatTimestamp(iso) {
  if (!iso) return 'Awaiting first sync';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'Awaiting first sync';
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function KpiCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="card-surface rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
        <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
        {label}
      </div>
      <div className="font-mono text-xl font-semibold text-[#0F172A]">{value}</div>
      <div className="text-xs text-[#64748B]">{sub}</div>
    </div>
  );
}

/**
 * Presentational executive portal. Works for the client's own login (data from
 * Supabase) and for the admin "Preview Client Portal" mode (data from admin state).
 */
export function ClientPortalView({ client, onConfirmDeposit, onSignOut, onRefresh, previewBanner }) {
  const [pendingId, setPendingId] = useState(null);
  const a = useMemo(() => computeWorkspaceAnalytics(client), [client]);
  const cur = client.currency || 'KES';
  const vatRate = Number(client.economics?.vatRate) || 16;
  const depositPct = Number(client.economics?.depositPct) || 0;

  const spendInclVat = a.actualOutlayInclVat;
  // Synced data is a rolling window; leads/bookings are aligned to it in computeWorkspaceAnalytics.
  const period = a.windowDays ? `last ${a.windowDays} days` : 'to date';
  const costPerInquiry = a.totalActualLeads > 0 ? spendInclVat / a.totalActualLeads : 0;
  const profitPerShilling = spendInclVat > 0 ? a.actualGrossProfit / spendInclVat : 0;
  const revenuePerShilling = spendInclVat > 0 ? a.actualGrossRevenue / spendInclVat : 0;
  const runwayDays = Math.max(0, a.daysRunwayLeft);
  const runwayTone = runwayDays < 5 ? 'alert' : runwayDays < 10 ? 'caution' : 'healthy';

  const leads = [...(client.leads || [])].sort(
    (x, y) => new Date(y.createdAt || 0) - new Date(x.createdAt || 0)
  );
  const ads = [...(client.creatives || [])].sort((x, y) => {
    const rank = { Active: 0, Paused: 1, Killed: 2 };
    return (rank[x.status] ?? 3) - (rank[y.status] ?? 3);
  });

  const handleConfirm = async (lead) => {
    const quote = (Number(lead.quoteValue) || 0) + (Number(lead.addonsValue) || 0);
    const amount =
      Number(lead.depositPaid) > 0
        ? Number(lead.depositPaid)
        : Math.round(quote > 0 ? quote * (depositPct / 100) : a.depositPerBooking);
    setPendingId(lead.id);
    try {
      await onConfirmDeposit?.(lead, amount);
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#0F172A]">
      {previewBanner && (
        <div className="bg-[#0F172A] text-white">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3 text-xs">
            <span className="inline-flex items-center gap-2">
              <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
              {previewBanner.label}
            </span>
            <button
              onClick={previewBanner.onExit}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.75} />
              Back to Command Center
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-[#E5E7EB]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-md bg-[#0F172A] flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4 text-white" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold leading-tight truncate">{client.name}</h1>
              <div className="text-xs text-[#64748B] truncate">
                {(client.domain || client.website || '').replace(/^https?:\/\//, '')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] text-[11px] text-[#334155]">
              Auto-synced
              <span className="font-mono">{formatTimestamp(client.lastSyncedAt)}</span>
            </span>
            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-1.5 rounded-lg border border-[#E5E7EB] bg-white text-[#475569] hover:text-[#0F172A] cursor-pointer"
                aria-label="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
              </button>
            )}
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:border-slate-300 text-xs font-medium text-[#334155] cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                Sign Out
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ROI summary + runway */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 card-surface rounded-xl p-5 space-y-3">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Return on your advertising, {period}
            </div>
            {spendInclVat > 0 ? (
              <>
                <p className="text-lg leading-snug text-[#0F172A]">
                  Your ads have generated{' '}
                  <span className="font-mono font-semibold">{formatMoney(a.actualGrossRevenue, cur)}</span>{' '}
                  in revenue from{' '}
                  <span className="font-mono font-semibold">{a.closedBookings}</span> confirmed{' '}
                  {a.closedBookings === 1 ? 'booking' : 'bookings'}.
                </p>
                <p className="text-sm text-[#475569]">
                  For every <span className="font-mono">{cur} 1</span> spent on ads (including {vatRate}% VAT),
                  your business earned{' '}
                  <span className="font-mono font-semibold text-[#0F172A]">
                    {cur} {formatDec(profitPerShilling, 2)}
                  </span>{' '}
                  in profit and{' '}
                  <span className="font-mono font-semibold text-[#0F172A]">
                    {cur} {formatDec(revenuePerShilling, 2)}
                  </span>{' '}
                  in revenue.
                </p>
              </>
            ) : (
              <p className="text-sm text-[#475569]">
                Your campaigns are getting started. Results will appear here once ads begin running.
              </p>
            )}
          </div>

          <div className="card-surface rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <Wallet className="w-3.5 h-3.5" strokeWidth={1.75} />
                M-Pesa Ad Balance
              </div>
              <StatusBadge tone={runwayTone}>
                {runwayTone === 'alert' ? 'Top up soon' : runwayTone === 'caution' ? 'Plan a top up' : 'Healthy'}
              </StatusBadge>
            </div>
            <div className="font-mono text-2xl font-semibold">
              {formatDec(runwayDays, 1)} <span className="text-sm font-medium text-[#64748B]">days left</span>
            </div>
            <div className="text-xs text-[#64748B]">
              Remaining balance{' '}
              <span className="font-mono text-[#0F172A]">
                {formatMoney(Math.max(0, a.remainingNetBalance), cur)}
              </span>{' '}
              after {vatRate}% VAT, at{' '}
              <span className="font-mono">{formatMoney(client.economics?.dailyBudget, cur)}</span> per day.
            </div>
          </div>
        </section>

        {/* KPI cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            icon={BarChart3}
            label="Total Ad Spend"
            value={formatMoney(spendInclVat, cur)}
            sub={`Including ${vatRate}% VAT, ${period}`}
          />
          <KpiCard
            icon={MessageSquare}
            label="WhatsApp Inquiries"
            value={a.totalActualLeads}
            sub={
              a.totalActualLeads > 0
                ? `${formatMoney(costPerInquiry, cur)} per inquiry, ${period}`
                : `No inquiries ${period}`
            }
          />
          <KpiCard
            icon={CheckCircle2}
            label="Confirmed Bookings"
            value={a.closedBookings}
            sub={`${formatMoney(a.totalDepositsCollected, cur)} in deposits received, ${period}`}
          />
          <KpiCard
            icon={TrendingUp}
            label="Revenue Generated"
            value={formatMoney(a.actualGrossRevenue, cur)}
            sub={`From bookings on inquiries received ${period}`}
          />
        </section>

        {/* Inquiries & bookings */}
        <section className="card-surface rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#E5E7EB]">
            <h2 className="text-sm font-semibold">Inquiries and Bookings</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Confirm a deposit as soon as payment lands. Your results update instantly.
            </p>
          </div>
          {leads.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-[#64748B]">No inquiries recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-[#F7F8FA] text-[#64748B] text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="text-left font-semibold px-5 py-2.5">Date</th>
                    <th className="text-left font-semibold px-3 py-2.5">Customer</th>
                    <th className="text-left font-semibold px-3 py-2.5">Phone</th>
                    <th className="text-left font-semibold px-3 py-2.5">Ad</th>
                    <th className="text-right font-semibold px-3 py-2.5">Quote</th>
                    <th className="text-right font-semibold px-3 py-2.5">Deposit</th>
                    <th className="text-left font-semibold px-3 py-2.5">Status</th>
                    <th className="text-right font-semibold px-5 py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {leads.map((lead) => {
                    const st = LEAD_STATUS_LABEL[lead.stage] || { label: lead.stage, tone: 'neutral' };
                    const booked = isBooked(lead.stage);
                    const quote = (Number(lead.quoteValue) || 0) + (Number(lead.addonsValue) || 0);
                    return (
                      <tr key={lead.id} className="hover:bg-[#F7F8FA]">
                        <td className="px-5 py-3 font-mono text-[#475569] whitespace-nowrap">
                          {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('en-GB') : '-'}
                        </td>
                        <td className="px-3 py-3 font-medium text-[#0F172A]">{lead.name || 'Unnamed'}</td>
                        <td className="px-3 py-3 font-mono text-[#475569] whitespace-nowrap">{lead.phone || '-'}</td>
                        <td className="px-3 py-3 font-mono text-[#475569]">{lead.assetId || '-'}</td>
                        <td className="px-3 py-3 font-mono text-right whitespace-nowrap">
                          {quote > 0 ? formatMoney(quote, cur) : '-'}
                        </td>
                        <td className="px-3 py-3 font-mono text-right whitespace-nowrap">
                          {Number(lead.depositPaid) > 0 ? formatMoney(lead.depositPaid, cur) : '-'}
                        </td>
                        <td className="px-3 py-3">
                          <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                        </td>
                        <td className="px-5 py-3 text-right">
                          {booked ? (
                            <span className="text-[11px] text-[#065F46] font-medium">Confirmed</span>
                          ) : lead.stage === 'Lost' ? (
                            <span className="text-[11px] text-[#64748B]">-</span>
                          ) : (
                            <button
                              onClick={() => handleConfirm(lead)}
                              disabled={pendingId === lead.id}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0F172A] hover:bg-slate-800 disabled:opacity-60 text-white text-[11px] font-medium cursor-pointer whitespace-nowrap"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                              {pendingId === lead.id ? 'Saving' : 'Confirm Deposit'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Active ads */}
        <section className="space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Your Ads</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              Cost per inquiry includes {vatRate}% VAT.
            </p>
          </div>
          {ads.length === 0 ? (
            <div className="card-surface rounded-xl px-5 py-8 text-center text-xs text-[#64748B]">
              No ads synced yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {ads.map((ad) => {
                const st = AD_STATUS_LABEL[ad.status] || { label: ad.status, tone: 'neutral' };
                const spend = (Number(ad.spend) || 0) * (1 + vatRate / 100);
                const inquiries = Number(ad.leads) || 0;
                return (
                  <div key={ad.id} className="card-surface rounded-xl p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-xs text-[#64748B]">{ad.assetId || '-'}</div>
                        <div className="text-sm font-medium text-[#0F172A] truncate" title={ad.adName}>
                          {ad.adName || 'Untitled ad'}
                        </div>
                      </div>
                      <StatusBadge tone={st.tone}>{st.label}</StatusBadge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#F1F5F9]">
                      <div>
                        <div className="text-[11px] text-[#64748B]">Inquiries</div>
                        <div className="font-mono text-sm font-semibold">{inquiries}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[#64748B]">Cost / Inquiry</div>
                        <div className="font-mono text-sm font-semibold">
                          {inquiries > 0 ? formatMoney(spend / inquiries, cur) : '-'}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <footer className="pt-2 pb-6 text-center text-[11px] text-[#64748B]">
          Figures are calculated from your synced ad account and confirmed bookings.
        </footer>
      </main>
    </div>
  );
}

/** Data container for a signed-in client: loads and updates only their workspace (RLS-enforced). */
export default function ClientPortal({ workspaceId, onSignOut }) {
  const [client, setClient] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  const load = async () => {
    if (!workspaceId) {
      setStatus('unassigned');
      return;
    }
    try {
      const ws = await fetchClientWorkspace(workspaceId);
      setClient(ws || null);
      setStatus(ws ? 'ready' : 'unassigned');
    } catch (err) {
      setError(err.message || 'Unable to load your workspace.');
      setStatus('error');
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const handleConfirmDeposit = async (lead, amount) => {
    const previous = client;
    // Optimistic update so ROI recalculates immediately.
    setClient((c) => ({
      ...c,
      leads: c.leads.map((l) => (l.id === lead.id ? { ...l, stage: 'Deposit Paid', depositPaid: amount } : l))
    }));
    try {
      await confirmLeadDeposit(lead.id, amount);
    } catch (err) {
      setClient(previous);
      setError(err.message || 'Could not confirm deposit.');
    }
  };

  if (status !== 'ready' || !client) {
    const message =
      status === 'loading'
        ? 'Loading your dashboard'
        : status === 'unassigned'
          ? 'Your account is not linked to a workspace yet. Please contact your account manager.'
          : error;
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6">
        <div className="card-surface rounded-xl p-6 w-full max-w-md text-center space-y-4">
          <p className="text-sm text-[#334155]">{message}</p>
          {status !== 'loading' && onSignOut && (
            <button
              onClick={onSignOut}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-[#334155] cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
              Sign Out
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-xs text-[#991B1B] shadow-md">
          <AlertTriangle className="w-4 h-4" strokeWidth={1.75} />
          {error}
          <button onClick={() => setError('')} className="ml-2 underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}
      <ClientPortalView
        client={client}
        onConfirmDeposit={handleConfirmDeposit}
        onSignOut={onSignOut}
        onRefresh={load}
      />
    </>
  );
}
