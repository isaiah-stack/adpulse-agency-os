import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Building2,
  Plus,
  Download,
  Upload,
  Calculator,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  Copy,
  Check,
  Sliders,
  Layers,
  Award,
  Clock,
  FileSpreadsheet,
  RefreshCw,
  X,
  Lock,
  FileCheck2,
  Share2,
  Wallet,
  Car,
  Zap,
  Tag,
  ShieldCheck,
  Menu,
  BarChart3,
  ChevronRight,
  Briefcase,
  FileText,
  Target,
  ArrowUpRight,
  ClipboardList,
  LogOut,
  Eye,
  Users
} from 'lucide-react';
import StatusBadge from './components/StatusBadge';
import { ClientPortalView } from './components/ClientPortal';
import TeamAccess from './components/TeamAccess';
import LocalDataImport from './components/LocalDataImport';
import {
  formatMoney,
  formatDec,
  normalizeKenyaPhoneE164,
  getHoursSince,
  computeWorkspaceAnalytics
} from './lib/analytics';
import {
  fetchWorkspaces,
  persistClientDiff,
  ensureUuids,
  createWorkspace,
  deleteWorkspace,
  importWorkspaces
} from './lib/dataService';

// ============================================================================
// SCHEMA VERSION, STORAGE & DOMAIN CONSTANTS
// ============================================================================

const SCHEMA_VERSION = 3;
const STORAGE_KEY = 'adpulse_agency_os_v3';
// Supabase mode keeps its own small key so it never overwrites local-mode data.
const REMOTE_PREFS_KEY = 'adpulse_agency_os_remote_prefs';
const LOCAL_MIGRATED_KEY = 'adpulse_agency_os_local_migrated_at';

const readJson = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
};

// Workspaces saved by local mode in this browser that have not been imported yet.
function readUnmigratedLocalClients() {
  try {
    if (localStorage.getItem(LOCAL_MIGRATED_KEY)) return [];
  } catch {
    return [];
  }
  const saved = readJson(STORAGE_KEY);
  return saved?.schemaVersion === SCHEMA_VERSION && Array.isArray(saved.clients) ? saved.clients : [];
}

const PHASES = [
  {
    id: 'Phase 1: Track Money',
    short: 'Phase 1: Track Money',
    desc: 'Establish attribution hygiene: Meta Pixel, PostHog UTMs, and WhatsApp logging verified prior to spend.'
  },
  {
    id: 'Phase 2: Buy Data',
    short: 'Phase 2: Buy Data',
    desc: 'Learning allocation: Test modular hooks sequentially and enforce the 4x daily budget kill threshold.'
  },
  {
    id: 'Phase 3: Print & Scale',
    short: 'Phase 3: Print & Scale',
    desc: 'Client-funded scaling: Reinvest deposits via 70/20/10 split while holding LTGP:CAC at or above 3.0:1.'
  }
];

const ICEBREAKER_OPTIONS = [
  'Check 4x4 Availability',
  '3-Day Mara/Amboseli Quote',
  'Airport Transfer / Custom'
];

const LEAD_STAGES = ['New Inquiry', 'Quoted', 'Deposit Paid', 'Completed', 'Lost'];

const SPRINT_PHASES = [
  {
    phase: 'Days 1-2: Tracking & Signal Loop',
    subtitle: 'Verify PostHog + Meta Pixel firing and establish Offline CAPI feedback loop',
    tasks: [
      { id: 'd1-1', label: 'Verify Meta Pixel + PostHog integration fires Lead and Contact events with zero duplicates' },
      { id: 'd1-2', label: 'Configure Meta Events Manager Offline Dataset for SHA-256 Purchase uploads' },
      { id: 'd1-3', label: 'Fund M-Pesa prepaid balance accounting for 16% Kenya digital VAT deduction' }
    ]
  },
  {
    phase: 'Days 3-4: Standardized Naming Taxonomy',
    subtitle: 'Enforce immutable agency naming conventions across Campaign, Ad Set, and Ad',
    tasks: [
      { id: 'd3-1', label: 'Lock Campaign/Ad Set/Ad taxonomy: LEADS_ABO_TOF_KE-NBO -> VID_GROUP-MARKUP_V1_A001' },
      { id: 'd3-2', label: 'Match utm_content=A001 to Asset IDs and activate 3 WhatsApp icebreaker buttons' }
    ]
  },
  {
    phase: 'Days 5-6: Creative Batching & Offer QA',
    subtitle: 'Produce modular 5-second hooks and verify mobile above-the-fold conversion clarity',
    tasks: [
      { id: 'd5-1', label: 'Film 3-5 modular 5-sec vertical hooks around vehicle (all number plates hidden/blurred)' },
      { id: 'd5-2', label: 'Audit mobile landing page so flat daily rate, vehicle capacity, and WhatsApp CTA appear above fold' }
    ]
  },
  {
    phase: 'Days 7-10: Live Launch & Diagnostic Cadence',
    subtitle: 'Protect the 72-hour learning lock, enforce kill rules, and log first optimization',
    tasks: [
      { id: 'd7-1', label: 'Launch Hook A001 at lean daily budget; make zero targeting/budget edits for 72 hours' },
      { id: 'd7-2', label: 'At Day 10 (4x daily budget spent), diagnose Hook Rate, CTR, and Close Rate to Kill or Scale' }
    ]
  }
];

const OFFER_QA_ITEMS = [
  { id: 'qa-1', label: 'Flat daily rate (e.g., KES 30,000/day) and driver inclusions visible above the fold on mobile' },
  { id: 'qa-2', label: 'Vehicle capacity (7-seater 4x4 + guide) and specifications match exact ad promise' },
  { id: 'qa-3', label: 'All vehicle registration number plates hidden or blurred across every video and image asset' },
  { id: 'qa-4', label: '3 Click-to-WhatsApp pre-qualifying icebreaker buttons active inside Meta Ads Manager' },
  { id: 'qa-5', label: 'PostHog + Meta Pixel verified for clean non-duplicate firing on WhatsApp and Quote taps' },
  { id: 'qa-6', label: 'WhatsApp Business automated greeting and 5-minute Speed-to-Lead quote template saved' }
];

const NAV_GROUPS = [
  {
    label: 'OVERVIEW',
    items: [
      { id: 'summary', label: 'Financial Summary', icon: BarChart3 },
      { id: 'portfolio', label: 'Agency Portfolio', icon: Briefcase }
    ]
  },
  {
    label: 'ACQUISITION',
    items: [
      { id: 'economics', label: 'Unit Economics', icon: Calculator },
      { id: 'creatives', label: 'Creative Diagnostics', icon: Target }
    ]
  },
  {
    label: 'REVENUE & ATTRIBUTION',
    items: [
      { id: 'crm', label: 'WhatsApp CRM & CAPI', icon: MessageSquare },
      { id: 'taxonomy', label: 'Taxonomy & Offer QA', icon: Tag }
    ]
  },
  {
    label: 'OPERATIONS',
    items: [
      { id: 'sprint', label: '10-Day Sprint & Routine', icon: ClipboardList },
      { id: 'casestudy', label: 'Case Study Report', icon: FileText }
    ]
  }
];

const ADMIN_NAV_GROUP = {
  label: 'ADMINISTRATION',
  items: [{ id: 'team', label: 'Team & Access', icon: Users }]
};

const hoursAgoISO = (hours) => new Date(Date.now() - hours * 3600 * 1000).toISOString();
const daysAgoDate = (days) => new Date(Date.now() - days * 86400 * 1000).toISOString().slice(0, 10);

// ============================================================================
// PRE-LOADED CLIENT WORKSPACES
// ============================================================================

const DEFAULT_CLIENTS = [
  {
    id: 'client-krescent-001',
    name: 'Krescent Adventures',
    metaAccountId: '384434063915420',
    website: 'https://krescentadventures.com',
    coreOffer: '4x4 Nissan Safari Van (7-Seater + Guide)',
    currency: 'KES',
    currentPhase: 'Phase 2: Buy Data',
    economics: {
      dailyRate: 30000,
      avgTripDays: 3,
      avgOrderValue: 90000,
      grossMarginPct: 50,
      dailyBudget: 200,
      vatRate: 16,
      targetCpl: 350,
      closeRatePct: 10,
      depositPct: 30,
      fleetUnits: 1,
      fleetMaxMonthlyBookings: 8
    },
    topUps: [
      {
        id: 'tu-k1',
        date: daysAgoDate(10),
        method: 'M-Pesa Prepaid',
        grossAmount: 3500,
        note: 'Initial Phase 2 learning budget top-up (15.1 days funded)'
      }
    ],
    creatives: [
      {
        id: 'cr-k1',
        assetId: 'A001',
        adName: 'VID_GROUP-MARKUP_V1_A001',
        bucket: '70% Winner',
        status: 'Active',
        launchDate: hoursAgoISO(120),
        spend: 1000,
        impressions: 16400,
        threeSecPlays: 5412,
        outboundClicks: 262,
        leads: 4
      },
      {
        id: 'cr-k2',
        assetId: 'A002',
        adName: 'VID_POPUP-ROOF_V1_A002',
        bucket: '20% Variation',
        status: 'Active',
        launchDate: hoursAgoISO(28),
        spend: 260,
        impressions: 4100,
        threeSecPlays: 1271,
        outboundClicks: 57,
        leads: 1
      },
      {
        id: 'cr-k3',
        assetId: 'A003',
        adName: 'VID_STATIC-RATES_V1_A003',
        bucket: '10% Wildcard',
        status: 'Killed',
        launchDate: hoursAgoISO(168),
        spend: 840,
        impressions: 11200,
        threeSecPlays: 2240,
        outboundClicks: 90,
        leads: 0
      },
      {
        id: 'cr-k4',
        assetId: 'A004',
        adName: 'VID_FAMILY-WEEKEND_V1_A004',
        bucket: '20% Variation',
        status: 'Paused',
        launchDate: hoursAgoISO(144),
        spend: 420,
        impressions: 6800,
        threeSecPlays: 1496,
        outboundClicks: 88,
        leads: 1
      }
    ],
    leads: [
      {
        id: 'KA-1001',
        createdAt: hoursAgoISO(144),
        name: 'Brian Kamau',
        phone: '0712345678',
        email: 'brian.kamau@example.co.ke',
        fbclid: 'IwAR2krescent981273x',
        assetId: 'A001',
        icebreaker: '3-Day Mara/Amboseli Quote',
        responseMins: 3,
        quoteValue: 90000,
        addonsValue: 6500,
        stage: 'Deposit Paid',
        depositPaid: 27000,
        capiExported: false
      },
      {
        id: 'KA-1002',
        createdAt: hoursAgoISO(48),
        name: 'Wanjiku Njoroge',
        phone: '+254 722 987 654',
        email: 'wanjiku.n@example.com',
        fbclid: '',
        assetId: 'A001',
        icebreaker: 'Check 4x4 Availability',
        responseMins: 4,
        quoteValue: 90000,
        addonsValue: 0,
        stage: 'Completed',
        depositPaid: 90000,
        capiExported: true
      },
      {
        id: 'KA-1003',
        createdAt: hoursAgoISO(14),
        name: 'David Ochieng',
        phone: '0733112233',
        email: '',
        fbclid: '',
        assetId: 'A002',
        icebreaker: 'Airport Transfer / Custom',
        responseMins: 8,
        quoteValue: 60000,
        addonsValue: 5000,
        stage: 'Quoted',
        depositPaid: 0,
        capiExported: false
      },
      {
        id: 'KA-1004',
        createdAt: hoursAgoISO(2),
        name: 'Amina Hassan',
        phone: '+254700554433',
        email: '',
        fbclid: '',
        assetId: 'A001',
        icebreaker: 'Check 4x4 Availability',
        responseMins: 2,
        quoteValue: 90000,
        addonsValue: 0,
        stage: 'New Inquiry',
        depositPaid: 0,
        capiExported: false
      }
    ],
    qaChecklist: {
      'qa-1': true,
      'qa-2': true,
      'qa-3': true,
      'qa-4': true,
      'qa-5': false,
      'qa-6': true
    },
    sprintChecklist: {
      'd1-1': true,
      'd1-2': true,
      'd1-3': true,
      'd3-1': true,
      'd3-2': true,
      'd5-1': true,
      'd5-2': false,
      'd7-1': true,
      'd7-2': false
    },
    streakDays: 7,
    ruleOf100Logs: [
      {
        id: 'r-1',
        date: daysAgoDate(1),
        speedMins: 40,
        creativeMins: 30,
        dataMins: 30,
        notes: 'Closed Brian Kamau 30% deposit (KES 27,000). Killed A003 after KES 840 with zero leads.'
      },
      {
        id: 'r-2',
        date: daysAgoDate(0),
        speedMins: 40,
        creativeMins: 30,
        dataMins: 30,
        notes: 'Launched A002 pop-up roof hook under 72h learning lock. Audited PostHog Lead events.'
      }
    ]
  },
  {
    id: 'client-nairobi-exec-002',
    name: 'Nairobi Executive Transfers',
    metaAccountId: '912044812004192',
    website: 'https://nairobiexec.co.ke',
    coreOffer: 'Airport & Corporate Prado Transfers',
    currency: 'KES',
    currentPhase: 'Phase 3: Print & Scale',
    economics: {
      dailyRate: 45000,
      avgTripDays: 1,
      avgOrderValue: 45000,
      grossMarginPct: 55,
      dailyBudget: 500,
      vatRate: 16,
      targetCpl: 400,
      closeRatePct: 15,
      depositPct: 50,
      fleetUnits: 3,
      fleetMaxMonthlyBookings: 25
    },
    topUps: [
      {
        id: 'tu-ne-1',
        date: daysAgoDate(12),
        method: 'M-Pesa Prepaid',
        grossAmount: 12000,
        note: 'Phase 3 scaling balance refill'
      }
    ],
    creatives: [
      {
        id: 'cr-ne-1',
        assetId: 'A001',
        adName: 'VID_JKIA-PRADO_V1_A001',
        bucket: '70% Winner',
        status: 'Active',
        launchDate: hoursAgoISO(240),
        spend: 4200,
        impressions: 58000,
        threeSecPlays: 18560,
        outboundClicks: 928,
        leads: 14
      },
      {
        id: 'cr-ne-2',
        assetId: 'A002',
        adName: 'VID_CORP-RETAINER_V2_A002',
        bucket: '20% Variation',
        status: 'Active',
        launchDate: hoursAgoISO(120),
        spend: 1400,
        impressions: 19500,
        threeSecPlays: 5460,
        outboundClicks: 254,
        leads: 4
      }
    ],
    leads: [
      {
        id: 'NE-2001',
        createdAt: hoursAgoISO(36),
        name: 'Sarah Mwangi (Apex Corp)',
        phone: '+254711223344',
        email: 'sarah@apexcorp.co.ke',
        fbclid: 'IwAR3exec8812',
        assetId: 'A001',
        icebreaker: 'Airport Transfer / Custom',
        responseMins: 2,
        quoteValue: 45000,
        addonsValue: 10000,
        stage: 'Deposit Paid',
        depositPaid: 27500,
        capiExported: false
      },
      {
        id: 'NE-2002',
        createdAt: hoursAgoISO(96),
        name: 'James Kiprop',
        phone: '0720111222',
        email: 'jkiprop@example.com',
        fbclid: '',
        assetId: 'A001',
        icebreaker: 'Airport Transfer / Custom',
        responseMins: 3,
        quoteValue: 45000,
        addonsValue: 0,
        stage: 'Completed',
        depositPaid: 45000,
        capiExported: true
      }
    ],
    qaChecklist: {
      'qa-1': true,
      'qa-2': true,
      'qa-3': true,
      'qa-4': true,
      'qa-5': true,
      'qa-6': true
    },
    sprintChecklist: {
      'd1-1': true,
      'd1-2': true,
      'd1-3': true,
      'd3-1': true,
      'd3-2': true,
      'd5-1': true,
      'd5-2': true,
      'd7-1': true,
      'd7-2': true
    },
    streakDays: 24,
    ruleOf100Logs: [
      {
        id: 'r-ne-1',
        date: daysAgoDate(0),
        speedMins: 40,
        creativeMins: 30,
        dataMins: 30,
        notes: 'Sustained KES 500/day budget at 8.0:1 LTGP:CAC ratio. Exported Purchase CAPI batch.'
      }
    ]
  }
];

// ============================================================================
// DIAGNOSTIC UTILITIES
// ============================================================================

async function sha256Hex(str) {
  const clean = String(str || '').trim().toLowerCase();
  if (!clean) return '';
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(clean);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
    }
  } catch (err) {
    console.warn('Web Crypto subtle unavailable:', err);
  }
  return clean;
}



function diagnoseCreative(ad, dailyBudget, targetCpl, currency = 'KES') {
  const spend = Number(ad.spend) || 0;
  const impressions = Number(ad.impressions) || 0;
  const threeSecPlays = Number(ad.threeSecPlays) || 0;
  const outboundClicks = Number(ad.outboundClicks) || 0;
  const leads = Number(ad.leads) || 0;

  const hookRate = impressions > 0 ? (threeSecPlays / impressions) * 100 : 0;
  const outboundCtr = impressions > 0 ? (outboundClicks / impressions) * 100 : 0;
  const cpl = leads > 0 ? spend / leads : null;

  const hoursActive = getHoursSince(ad.launchDate);
  const isLocked72h = ad.status === 'Active' && hoursActive < 72;
  const killThreshold = Math.max(4 * (Number(dailyBudget) || 200), 1);

  let verdict = {
    code: 'TESTING',
    label: 'Testing',
    tone: 'neutral',
    detail: 'Collecting initial delivery signal.'
  };

  if (isLocked72h) {
    verdict = {
      code: 'LOCKED',
      label: `Learning Lock (${Math.round(72 - hoursActive)}h left)`,
      tone: 'caution',
      detail: 'Protected under 72-hour learning window. Do not edit budget or targeting.'
    };
  } else if (spend >= killThreshold && leads === 0) {
    verdict = {
      code: 'KILL',
      label: `Kill (${currency} ${killThreshold.toLocaleString()}+ / 0 Leads)`,
      tone: 'alert',
      detail: `Exceeded 4x daily budget threshold (${currency} ${killThreshold.toLocaleString()}) with zero leads.`
    };
  } else if (impressions > 0 && hookRate < 25) {
    verdict = {
      code: 'FIX_HOOK',
      label: 'Fix Hook (<25%)',
      tone: 'caution',
      detail: 'Opening 3 seconds underperform benchmark. Replace hook; preserve body.'
    };
  } else if (impressions > 0 && hookRate >= 25 && outboundCtr < 1.0) {
    verdict = {
      code: 'FIX_CTA',
      label: 'Fix Offer / CTA (<1% CTR)',
      tone: 'caution',
      detail: 'Hook holds attention, but price anchor or WhatsApp CTA needs strengthening.'
    };
  } else if (leads >= 2 && cpl !== null && cpl <= (Number(targetCpl) || 350)) {
    verdict = {
      code: 'WINNER',
      label: 'Winner: Scale',
      tone: 'healthy',
      detail: '2+ leads at or below Target CPL. Eligible for 70% budget allocation.'
    };
  }

  return { hookRate, outboundCtr, cpl, hoursActive, isLocked72h, verdict };
}


// ============================================================================
// MAIN APPLICATION SHELL
// ============================================================================

/**
 * Admin Command Center.
 * - Local mode (no Supabase env): seeded state persisted to localStorage.
 * - Remote mode (`remote`): all workspaces loaded from Supabase; every edit is
 *   diffed and written back (RLS restricts this to admin profiles).
 */
export default function AdminCommandCenter({ remote = false, profile = null, onSignOut = null }) {
  const [clients, setClients] = useState(() => {
    if (remote) return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.schemaVersion === SCHEMA_VERSION && Array.isArray(parsed.clients) && parsed.clients.length > 0) {
          return parsed.clients;
        }
      }
    } catch (err) {
      console.error('Failed to read localStorage:', err);
    }
    return DEFAULT_CLIENTS;
  });

  const [activeClientId, setActiveClientId] = useState(() => {
    if (remote) return readJson(REMOTE_PREFS_KEY)?.activeClientId || null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.schemaVersion === SCHEMA_VERSION && parsed.activeClientId) {
          return parsed.activeClientId;
        }
      }
    } catch {
      // ignore
    }
    return remote ? null : DEFAULT_CLIENTS[0].id;
  });

  const [activeView, setActiveView] = useState('summary');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  const [isQuickLeadOpen, setIsQuickLeadOpen] = useState(false);
  const [isPreviewingPortal, setIsPreviewingPortal] = useState(false);
  const [remoteStatus, setRemoteStatus] = useState(remote ? 'loading' : 'ready');
  // { source: 'browser' | 'file', workspaces: [...] } while the import picker is open.
  const [importRequest, setImportRequest] = useState(null);
  const [localPending, setLocalPending] = useState(() => (remote ? readUnmigratedLocalClients() : []));
  const navGroups = useMemo(() => (remote ? [...NAV_GROUPS, ADMIN_NAV_GROUP] : NAV_GROUPS), [remote]);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  const loadRemote = async () => {
    try {
      const list = await fetchWorkspaces();
      setClients(list);
      setRemoteStatus('ready');
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      setRemoteStatus('error');
    }
  };

  useEffect(() => {
    if (remote) loadRemote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remote]);

  useEffect(() => {
    try {
      if (remote) {
        // Supabase is the source of truth; only remember the selected workspace.
        localStorage.setItem(REMOTE_PREFS_KEY, JSON.stringify({ activeClientId }));
        return;
      }
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          schemaVersion: SCHEMA_VERSION,
          updatedAt: new Date().toISOString(),
          activeClientId,
          clients
        })
      );
    } catch (err) {
      console.error('Failed to persist state:', err);
    }
  }, [clients, activeClientId, remote]);

  const showToast = (msg, type = 'healthy') => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast((prev) => (prev?.msg === msg ? null : prev));
    }, 3200);
  };

  const activeClient = useMemo(
    () => clients.find((c) => c.id === activeClientId) || clients[0],
    [clients, activeClientId]
  );

  const activeAnalytics = useMemo(
    () => (activeClient ? computeWorkspaceAnalytics(activeClient) : null),
    [activeClient]
  );

  const currentNavMeta = useMemo(() => {
    for (const g of navGroups) {
      const found = g.items.find((i) => i.id === activeView);
      if (found) return { group: g.label, ...found };
    }
    return { group: 'OVERVIEW', id: 'summary', label: 'Financial Summary' };
  }, [activeView, navGroups]);

  const updateActiveClient = (updater) => {
    const prevClient = activeClient;
    if (!prevClient) return;
    let next = typeof updater === 'function' ? updater(prevClient) : { ...prevClient, ...updater };
    if (remote) next = ensureUuids(next);
    setClients((prev) => prev.map((c) => (c.id === prevClient.id ? next : c)));
    if (remote) {
      persistClientDiff(prevClient, next).catch((err) => {
        console.error('Supabase write failed:', err);
        showToast(`Save failed: ${err.message || 'Supabase error'}. Reloading.`, 'alert');
        loadRemote();
      });
    }
  };

  // JSON Backup & Restore
  const handleExportJSON = () => {
    const payload = {
      schemaVersion: SCHEMA_VERSION,
      platform: 'AdPulse Agency OS v3',
      exportedAt: new Date().toISOString(),
      clients
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adpulse-agency-os-v3-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported all client workspaces to JSON backup.');
  };

  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const list = Array.isArray(parsed) ? parsed : parsed.clients;
        if (!Array.isArray(list) || list.length === 0) throw new Error('Invalid format');
        if (remote) {
          setImportRequest({ source: 'file', workspaces: list });
          return;
        }
        setClients(list);
        setActiveClientId(list[0].id);
        showToast(`Restored ${list.length} workspace(s) from backup.`);
      } catch {
        showToast('Invalid JSON backup file.', 'alert');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDemo = () => {
    setClients(DEFAULT_CLIENTS);
    setActiveClientId(DEFAULT_CLIENTS[0].id);
    setActiveView('summary');
    localStorage.removeItem(STORAGE_KEY);
    showToast('Restored default Krescent Adventures and Nairobi Executive Transfers presets.');
  };

  const handleCreateClient = async (data) => {
    const id = `client-${Date.now()}`;
    const aov = Number(data.avgOrderValue) || 45000;
    const draft = {
      id,
      name: data.name.trim(),
      metaAccountId: data.metaAccountId.trim() || (remote ? '' : '000000000000000'),
      website: data.website.trim() || 'https://example.com',
      coreOffer: data.coreOffer.trim() || 'Core Flagship Service',
      currency: data.currency || 'KES',
      currentPhase: data.currentPhase || 'Phase 1: Track Money',
      economics: {
        dailyRate: aov,
        avgTripDays: 1,
        avgOrderValue: aov,
        grossMarginPct: Number(data.grossMarginPct) || 50,
        dailyBudget: Number(data.dailyBudget) || 300,
        vatRate: Number(data.vatRate) || 16,
        targetCpl: Number(data.targetCpl) || 350,
        closeRatePct: Number(data.closeRatePct) || 12,
        depositPct: Number(data.depositPct) || 30,
        fleetUnits: Number(data.fleetUnits) || 1,
        fleetMaxMonthlyBookings: Number(data.fleetMaxMonthlyBookings) || 12
      },
      topUps: [],
      creatives: [
        {
          id: `cr-${Date.now()}`,
          assetId: 'A001',
          adName: 'VID_CORE-HOOK_V1_A001',
          bucket: '70% Winner',
          status: 'Active',
          launchDate: new Date().toISOString(),
          spend: 0,
          impressions: 0,
          threeSecPlays: 0,
          outboundClicks: 0,
          leads: 0
        }
      ],
      leads: [],
      qaChecklist: {},
      sprintChecklist: {},
      streakDays: 0,
      ruleOf100Logs: []
    };
    let created = draft;
    if (remote) {
      try {
        created = await createWorkspace(draft);
      } catch (err) {
        showToast(`Could not create workspace: ${err.message}`, 'alert');
        return;
      }
    }
    setClients((prev) => [...prev, created]);
    setActiveClientId(created.id);
    setActiveView('summary');
    setIsAddClientOpen(false);
    showToast(`Created client workspace "${created.name}".`);
  };

  const handleDeleteClient = async (idToDelete) => {
    if (clients.length <= 1) {
      showToast('At least one workspace must remain active.', 'alert');
      return;
    }
    if (remote) {
      try {
        await deleteWorkspace(idToDelete);
      } catch (err) {
        showToast(`Could not delete workspace: ${err.message}`, 'alert');
        return;
      }
    }
    const next = clients.filter((c) => c.id !== idToDelete);
    setClients(next);
    if (activeClientId === idToDelete) {
      setActiveClientId(next[0].id);
    }
    showToast('Client workspace removed.');
  };

  const handleQuickLogLead = (leadEntry) => {
    updateActiveClient((prev) => ({
      ...prev,
      leads: [leadEntry, ...(prev.leads || [])]
    }));
    setIsQuickLeadOpen(false);
    showToast(`Logged inquiry from ${leadEntry.name} (${normalizeKenyaPhoneE164(leadEntry.phone)}).`);
  };

  const markLocalMigrated = () => {
    try {
      localStorage.setItem(LOCAL_MIGRATED_KEY, new Date().toISOString());
    } catch {
      // ignore
    }
    setLocalPending([]);
  };

  const handleImportToSupabase = async (selected) => {
    try {
      const summary = await importWorkspaces(selected, clients);
      if (importRequest?.source === 'browser') markLocalMigrated();
      setImportRequest(null);
      await loadRemote();
      showToast(
        `Imported: ${summary.created} new, ${summary.merged} merged workspace(s); ${summary.leads} leads, ${summary.creatives} ads, ${summary.topUps} top-ups.`
      );
    } catch (err) {
      console.error('Import failed:', err);
      showToast(`Import failed: ${err.message}. Re-running skips items already imported.`, 'alert');
      await loadRemote();
    }
  };

  const importModal = importRequest && (
    <LocalDataImport
      source={importRequest.source}
      workspaces={importRequest.workspaces}
      existing={clients}
      onImport={handleImportToSupabase}
      onClose={() => setImportRequest(null)}
    />
  );

  // Remote-mode loading / empty / error states (no workspace to render yet).
  if (!activeClient) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center p-6">
        <div className="card-surface rounded-xl p-6 w-full max-w-md text-center space-y-4">
          <div className="text-sm font-semibold text-[#0F172A]">
            {remoteStatus === 'loading'
              ? 'Loading agency workspaces'
              : remoteStatus === 'error'
                ? 'Could not load workspaces from Supabase'
                : 'No client workspaces yet'}
          </div>
          <p className="text-xs text-[#64748B]">
            {remoteStatus === 'error'
              ? 'Confirm supabase/schema.sql has been applied and your profile role is admin.'
              : remoteStatus === 'loading'
                ? 'Fetching workspaces, creatives, leads and M-Pesa top-ups.'
                : 'Create the first workspace to begin tracking.'}
          </p>
          {remoteStatus !== 'loading' && (
            <div className="flex items-center justify-center gap-2">
              {remoteStatus === 'error' ? (
                <button
                  onClick={loadRemote}
                  className="px-3 py-1.5 rounded-lg bg-[#0F172A] text-white text-xs font-medium cursor-pointer"
                >
                  Retry
                </button>
              ) : (
                <button
                  onClick={() => setIsAddClientOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#0F172A] text-white text-xs font-medium cursor-pointer"
                >
                  New Client Workspace
                </button>
              )}
              {remoteStatus === 'ready' && localPending.length > 0 && (
                <button
                  onClick={() => setImportRequest({ source: 'browser', workspaces: localPending })}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-[#334155] cursor-pointer"
                >
                  Import {localPending.length} from this browser
                </button>
              )}
              {onSignOut && (
                <button
                  onClick={onSignOut}
                  className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white text-xs font-medium text-[#334155] cursor-pointer"
                >
                  Sign Out
                </button>
              )}
            </div>
          )}
        </div>
        {isAddClientOpen && (
          <AddClientModal onClose={() => setIsAddClientOpen(false)} onCreate={handleCreateClient} />
        )}
        {importModal}
      </div>
    );
  }

  // Admin "Preview Client Portal": render exactly what the client sees for the active workspace.
  if (isPreviewingPortal) {
    return (
      <ClientPortalView
        client={activeClient}
        previewBanner={{
          label: `Admin preview of ${activeClient.name}`,
          onExit: () => setIsPreviewingPortal(false)
        }}
        onConfirmDeposit={(lead, amount) =>
          updateActiveClient((prev) => ({
            ...prev,
            leads: prev.leads.map((l) =>
              l.id === lead.id ? { ...l, stage: 'Deposit Paid', depositPaid: amount } : l
            )
          }))
        }
      />
    );
  }

  const SidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-[#E5E7EB]">
      {/* Brand Wordmark */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-[#E5E7EB] shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-md bg-[#0F172A] flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <div className="leading-none">
            <div className="text-[15px] font-bold tracking-tight text-[#0F172A]">AdPulse</div>
            <div className="text-[9px] font-semibold tracking-[0.16em] text-[#64748B] mt-0.5 uppercase">
              Agency OS
            </div>
          </div>
        </div>
        <button
          onClick={() => setMobileNavOpen(false)}
          className="lg:hidden p-1 text-slate-500 hover:text-slate-900 cursor-pointer"
          aria-label="Close navigation"
        >
          <X className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>

      {/* Workspace Switcher */}
      <div className="p-4 border-b border-[#F1F5F9] space-y-2 shrink-0">
        <label
          htmlFor="sidebar-ws-select"
          className="block text-[11px] font-semibold uppercase tracking-wider text-[#64748B]"
        >
          Client Workspace
        </label>
        <div className="relative">
          <select
            id="sidebar-ws-select"
            value={activeClient.id}
            onChange={(e) => {
              setActiveClientId(e.target.value);
              setMobileNavOpen(false);
            }}
            className="w-full appearance-none bg-[#F7F8FA] border border-[#E5E7EB] hover:border-slate-300 rounded-lg px-3 py-2 pr-8 text-xs font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-[#0F172A] cursor-pointer truncate"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.currency})
              </option>
            ))}
          </select>
          <Building2
            className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            strokeWidth={1.75}
          />
        </div>
        <button
          onClick={() => {
            setIsAddClientOpen(true);
            setMobileNavOpen(false);
          }}
          className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-dashed border-slate-300 hover:border-[#0F172A] hover:bg-[#F7F8FA] text-xs font-medium text-[#475569] hover:text-[#0F172A] transition cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.75} />
          New Client Workspace
        </button>
      </div>

      {/* Grouped Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5" aria-label="Primary Navigation">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="px-2.5 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                const showAlertDot =
                  (item.id === 'crm' && activeAnalytics.staleCapiLeads.length > 0) ||
                  (item.id === 'creatives' && activeAnalytics.fragmentationRisk);

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveView(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] transition cursor-pointer ${
                      isActive
                        ? 'bg-[#0F172A] text-white font-semibold'
                        : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F1F5F9] font-medium'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#64748B]'}`}
                        strokeWidth={1.75}
                      />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {showAlertDot && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isActive ? 'bg-amber-300' : 'bg-[#991B1B]'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Sidebar Footer: Backup / Restore */}
      <div className="p-3 border-t border-[#E5E7EB] bg-[#F7F8FA]/60 shrink-0 space-y-2">
        {remote && profile && (
          <div className="px-1 text-[11px] text-[#64748B] truncate">
            Signed in as <span className="font-mono text-[#334155]">{profile.email}</span>
          </div>
        )}
        {remote && localPending.length > 0 && (
          <div className="rounded-md border border-[#FDE68A] bg-[#FFFBEB] p-2.5 space-y-1.5">
            <div className="text-[11px] text-[#92400E]">
              {localPending.length} workspace(s) saved in this browser from local mode.
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setImportRequest({ source: 'browser', workspaces: localPending })}
                className="text-[11px] font-semibold text-[#0F172A] underline cursor-pointer"
              >
                Review and import
              </button>
              <button onClick={markLocalMigrated} className="text-[11px] text-[#64748B] cursor-pointer">
                Dismiss
              </button>
            </div>
          </div>
        )}
        <div className="grid gap-1.5 grid-cols-2">
          <button
            onClick={handleExportJSON}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-[#E5E7EB] hover:border-slate-300 text-xs font-medium text-[#334155] transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#475569]" strokeWidth={1.75} />
            Export JSON
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-[#E5E7EB] hover:border-slate-300 text-xs font-medium text-[#334155] transition cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#475569]" strokeWidth={1.75} />
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportJSON}
            className="hidden"
          />
        </div>
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-mono text-[#64748B]">
            {remote ? 'v4.0 Supabase Live' : 'v4.0 Local Mode'}
          </span>
          <button
            onClick={remote ? loadRemote : handleResetDemo}
            className="inline-flex items-center gap-1 text-[11px] text-[#64748B] hover:text-[#0F172A] transition cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" strokeWidth={1.75} />
            {remote ? 'Reload Data' : 'Reset Presets'}
          </button>
        </div>
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="w-full inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white border border-[#E5E7EB] hover:border-slate-300 text-xs font-medium text-[#334155] transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-[#475569]" strokeWidth={1.75} />
            Sign Out
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-[#0F172A] antialiased">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border shadow-md text-xs font-medium ${
              toast.type === 'alert'
                ? 'bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]'
                : 'bg-[#0F172A] border-[#0F172A] text-white'
            }`}
          >
            {toast.type === 'alert' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.75} />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" strokeWidth={1.75} />
            )}
            <span>{toast.msg}</span>
          </div>
        </div>
      )}

      {/* Desktop Fixed Left Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:block z-30">
        {SidebarContent}
      </aside>

      {/* Mobile Slide-Over Sidebar Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative w-64 max-w-[85vw] h-full z-50 shadow-xl">
            {SidebarContent}
          </div>
        </div>
      )}

      {/* Main Layout Shell */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        {/* Sticky Top Utility Bar */}
        <header className="sticky top-0 z-20 h-14 bg-white border-b border-[#E5E7EB] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-1.5 rounded-md border border-[#E5E7EB] text-[#475569] hover:text-[#0F172A] cursor-pointer"
              aria-label="Open navigation"
            >
              <Menu className="w-4 h-4" strokeWidth={1.75} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] font-medium truncate">
                <span className="truncate">{activeClient.name}</span>
                <ChevronRight className="w-3 h-3 shrink-0" strokeWidth={1.75} />
                <span className="text-[#475569]">{currentNavMeta.label}</span>
              </div>
              <h1 className="text-sm font-semibold text-[#0F172A] leading-tight truncate">
                {currentNavMeta.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] font-mono text-[11px] text-[#334155] tabular-nums">
              ACT {activeClient.metaAccountId}
            </span>
            <span className="hidden sm:inline-flex">
              <StatusBadge tone="neutral">{activeClient.currentPhase}</StatusBadge>
            </span>
            {remote && (
              <span className="hidden xl:inline-flex items-center px-2.5 py-1 rounded-md bg-[#F1F5F9] border border-[#E2E8F0] font-mono text-[11px] text-[#334155] tabular-nums">
                Meta sync{' '}
                {activeClient.lastSyncedAt
                  ? new Date(activeClient.lastSyncedAt).toLocaleString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : 'pending'}
              </span>
            )}
            <button
              onClick={() => setIsPreviewingPortal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:border-slate-300 text-[#334155] text-xs font-medium transition cursor-pointer"
              title="Preview the Executive Client Portal for this workspace"
            >
              <Eye className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Preview Client Portal</span>
            </button>
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-white hover:border-slate-300 text-[#334155] text-xs font-medium transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={1.75} />
                Sign Out
              </button>
            )}
            <button
              onClick={() => setIsQuickLeadOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-medium transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={2} />
              Log Lead
            </button>
          </div>
        </header>

        {/* Dedicated Page Viewport */}
        <main className="flex-1 max-w-[1320px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeView === 'summary' && (
            <FinancialSummaryView
              client={activeClient}
              analytics={activeAnalytics}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'portfolio' && (
            <AgencyPortfolioView
              clients={clients}
              activeClientId={activeClient.id}
              onSelectClient={(id) => {
                setActiveClientId(id);
                setActiveView('summary');
              }}
              onOpenAddModal={() => setIsAddClientOpen(true)}
              onDeleteClient={handleDeleteClient}
            />
          )}

          {activeView === 'economics' && (
            <UnitEconomicsView
              client={activeClient}
              analytics={activeAnalytics}
              onUpdateEconomics={(patch) =>
                updateActiveClient((prev) => ({
                  ...prev,
                  economics: { ...prev.economics, ...patch }
                }))
              }
              onUpdatePhase={(phase) => updateActiveClient({ currentPhase: phase })}
              onUpdateTopUps={(topUps) => updateActiveClient({ topUps })}
              showToast={showToast}
            />
          )}

          {activeView === 'creatives' && (
            <CreativeDiagnosticsView
              client={activeClient}
              analytics={activeAnalytics}
              onUpdateCreatives={(creatives) => updateActiveClient({ creatives })}
              showToast={showToast}
            />
          )}

          {activeView === 'crm' && (
            <WhatsAppCrmView
              client={activeClient}
              analytics={activeAnalytics}
              onUpdateLeads={(leads) => updateActiveClient({ leads })}
              showToast={showToast}
            />
          )}

          {activeView === 'taxonomy' && (
            <TaxonomyAndQaView
              client={activeClient}
              onToggleQa={(qaId) =>
                updateActiveClient((prev) => ({
                  ...prev,
                  qaChecklist: {
                    ...prev.qaChecklist,
                    [qaId]: !prev.qaChecklist?.[qaId]
                  }
                }))
              }
              showToast={showToast}
            />
          )}

          {activeView === 'sprint' && (
            <SprintAndRoutineView
              client={activeClient}
              onToggleTask={(taskId) =>
                updateActiveClient((prev) => ({
                  ...prev,
                  sprintChecklist: {
                    ...prev.sprintChecklist,
                    [taskId]: !prev.sprintChecklist?.[taskId]
                  }
                }))
              }
              onAddRuleLog={(entry) =>
                updateActiveClient((prev) => ({
                  ...prev,
                  streakDays: Math.min(100, (prev.streakDays || 0) + 1),
                  ruleOf100Logs: [entry, ...(prev.ruleOf100Logs || [])]
                }))
              }
              onUpdateStreak={(val) =>
                updateActiveClient({ streakDays: Math.max(0, Math.min(100, Number(val) || 0)) })
              }
              showToast={showToast}
            />
          )}

          {activeView === 'team' && remote && (
            <TeamAccess workspaces={clients} currentUserId={profile?.id} showToast={showToast} />
          )}

          {activeView === 'casestudy' && (
            <CaseStudyReportView
              client={activeClient}
              analytics={activeAnalytics}
              showToast={showToast}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      {importModal}
      {isAddClientOpen && (
        <AddClientModal
          onClose={() => setIsAddClientOpen(false)}
          onCreate={handleCreateClient}
        />
      )}

      {isQuickLeadOpen && (
        <QuickLogLeadModal
          client={activeClient}
          onClose={() => setIsQuickLeadOpen(false)}
          onSave={handleQuickLogLead}
        />
      )}
    </div>
  );
}

// ============================================================================
// VIEW 1: FINANCIAL SUMMARY (DEFAULT EXECUTIVE LANDING VIEW)
// ============================================================================

function FinancialSummaryView({ client, analytics, onNavigate }) {
  const { economics, currency, leads, creatives } = client;
  const isHealthyRatio = analytics.projectedLtgpCac >= 3.0;
  const recentDeposits = leads.filter((l) => l.stage === 'Deposit Paid' || l.stage === 'Completed');
  const activeAds = creatives.filter((c) => c.status === 'Active');

  return (
    <div className="space-y-6">
      {/* Executive Sub-Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-[#0F172A] tracking-tight">
            {client.name} — Executive Financial Summary
          </h2>
          <p className="text-xs text-[#64748B] mt-0.5">
            {client.coreOffer} • {client.website.replace(/^https?:\/\//, '')} • Flat AOV{' '}
            <span className="font-mono tabular-nums text-[#0F172A] font-medium">
              {formatMoney(economics.avgOrderValue, currency)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge tone={isHealthyRatio ? 'healthy' : 'alert'}>
            {isHealthyRatio ? 'Unit Economics: Scalable (>=3:1)' : 'Unit Economics: Below 3:1 Floor'}
          </StatusBadge>
        </div>
      </div>

      {/* 4 Crisp Executive KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card-surface rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              30-Day Outlay (Incl. {economics.vatRate}% VAT)
            </span>
            <Wallet className="w-4 h-4 text-[#64748B]" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-semibold font-mono tabular-nums text-[#0F172A] mt-2">
            {formatMoney(analytics.trueCashOutlay, currency)}
          </div>
          <div className="text-xs text-[#64748B] mt-1.5 tabular-nums">
            Pre-tax {formatMoney(analytics.thirtyDayPreTaxSpend, currency)} + {formatMoney(analytics.vatAmount, currency)} VAT
          </div>
        </div>

        <div className="card-surface rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Projected 30-Day Gross Profit
            </span>
            <TrendingUp className="w-4 h-4 text-[#065F46]" strokeWidth={1.75} />
          </div>
          <div className="text-2xl font-semibold font-mono tabular-nums text-[#0F172A] mt-2">
            {formatMoney(analytics.projectedGrossProfit, currency)}
          </div>
          <div className="text-xs text-[#64748B] mt-1.5 tabular-nums">
            {formatDec(analytics.projectedBookings, 1)} trips @ {economics.grossMarginPct}% margin ({formatMoney(analytics.gpPerBooking, currency)}/trip)
          </div>
        </div>

        <div className="card-surface rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Live LTGP : CAC Ratio
            </span>
            <Award className="w-4 h-4 text-[#64748B]" strokeWidth={1.75} />
          </div>
          <div className="flex items-baseline gap-2.5 mt-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-[#0F172A]">
              {formatDec(analytics.projectedLtgpCac, 1)} : 1
            </span>
            <StatusBadge tone={isHealthyRatio ? 'healthy' : 'alert'}>
              {isHealthyRatio ? 'Scale' : 'Fix Offer'}
            </StatusBadge>
          </div>
          <div className="text-xs text-[#64748B] mt-1.5 tabular-nums">
            Max CAC ceiling: {formatMoney(analytics.maxAllowableCac, currency)} (LTGP / 3)
          </div>
        </div>

        <div className="card-surface rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              M-Pesa VAT Runway
            </span>
            <Clock className="w-4 h-4 text-[#64748B]" strokeWidth={1.75} />
          </div>
          <div className="flex items-baseline gap-2.5 mt-2">
            <span className="text-2xl font-semibold font-mono tabular-nums text-[#0F172A]">
              {formatDec(Math.max(0, analytics.daysRunwayLeft), 1)}d
            </span>
            <span className="text-xs font-mono text-[#64748B] tabular-nums">
              of {formatDec(analytics.fundedRunwayDays, 1)}d funded
            </span>
          </div>
          <div className="text-xs text-[#64748B] mt-1.5 tabular-nums">
            Net remaining: {formatMoney(Math.max(0, analytics.remainingNetBalance), currency, 2)}
          </div>
        </div>
      </div>

      {/* Middle Row: Custom SVG 30-Day Scenario Chart + Active Guardrail Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Custom SVG Scenario Comparison Chart */}
        <div className="lg:col-span-8 card-surface rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-[#F1F5F9]">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">
                30-Day Financial Scenario Projection
              </h3>
              <p className="text-xs text-[#64748B]">
                Gross Profit vs. True Cash Outlay ({formatMoney(analytics.trueCashOutlay, currency)} incl. {economics.vatRate}% VAT)
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-[#475569]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#0F172A]" /> Gross Profit
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#CBD5E1]" /> Cash Outlay (VAT)
              </span>
            </div>
          </div>

          <ScenarioSvgChart
            scenarios={analytics.scenarios}
            outlay={analytics.trueCashOutlay}
            currency={currency}
          />

          {/* Compact Scenario Breakdown Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-[#F1F5F9]">
            {analytics.scenarios.map((sc) => (
              <div key={sc.label} className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[#475569]">
                    {sc.label}
                  </span>
                  <span className="font-mono text-xs font-semibold text-[#065F46] tabular-nums">
                    {formatDec(sc.ratio, 1)}:1
                  </span>
                </div>
                <div className="text-sm font-semibold font-mono text-[#0F172A] mt-1 tabular-nums">
                  {formatMoney(sc.grossProfit, currency)}
                </div>
                <div className="text-[11px] text-[#64748B] mt-0.5 tabular-nums">
                  CPL {formatMoney(sc.cpl, currency)} • {formatDec(sc.bookings, 1)} bookings
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Guardrail Alerts Panel */}
        <div className="lg:col-span-4 card-surface rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9]">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">Active Guardrail Alerts</h3>
              <p className="text-xs text-[#64748B]">Automated account hygiene checks</p>
            </div>
            <StatusBadge tone={analytics.alerts.length === 0 ? 'healthy' : 'caution'}>
              {analytics.alerts.length} Active
            </StatusBadge>
          </div>

          <div className="flex-1 mt-4 space-y-2.5">
            {analytics.alerts.length === 0 ? (
              <div className="p-4 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-xs text-[#065F46] flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.75} />
                <div>
                  <div className="font-semibold">All operational guardrails passed</div>
                  <p className="mt-0.5 opacity-90">
                    Unit economics, VAT runway, creative concurrency, and CAPI freshness are within target thresholds.
                  </p>
                </div>
              </div>
            ) : (
              analytics.alerts.map((al, idx) => (
                <button
                  key={idx}
                  onClick={() => onNavigate(al.targetView)}
                  className={`w-full text-left p-3 rounded-lg border transition cursor-pointer ${
                    al.severity === 'alert'
                      ? 'bg-[#FEF2F2] border-[#FECACA] hover:border-red-300'
                      : 'bg-[#FFFBEB] border-[#FDE68A] hover:border-amber-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        al.severity === 'alert' ? 'text-[#991B1B]' : 'text-[#92400E]'
                      }`}
                    >
                      {al.title}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#64748B] shrink-0" strokeWidth={1.75} />
                  </div>
                  <p className="text-[11px] text-[#475569] mt-1 leading-relaxed">{al.detail}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row: Executive Summary Tables (Recent Deposits + Active Ads) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Deposits Ledger */}
        <div className="card-surface rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">Recent Deposits & Closed Revenue</h3>
              <p className="text-xs text-[#64748B]">
                Total collected: <span className="font-mono font-medium text-[#0F172A] tabular-nums">{formatMoney(analytics.totalDepositsCollected, currency)}</span>
              </p>
            </div>
            <button
              onClick={() => onNavigate('crm')}
              className="text-xs font-medium text-[#475569] hover:text-[#0F172A] inline-flex items-center gap-1 cursor-pointer"
            >
              Open CRM <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-[#E5E7EB] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  <th className="py-2.5 px-4">Client / Asset</th>
                  <th className="py-2.5 px-3">Stage</th>
                  <th className="py-2.5 px-4 text-right">Deposit Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-xs">
                {recentDeposits.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-6 text-center text-[#64748B]">
                      No paid deposits recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentDeposits.slice(0, 4).map((l) => (
                    <tr key={l.id} className="hover:bg-[#F7F8FA]">
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#0F172A]">{l.name}</div>
                        <div className="text-[11px] font-mono text-[#64748B]">{l.assetId} • {l.icebreaker}</div>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge tone="healthy">{l.stage}</StatusBadge>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#0F172A] tabular-nums">
                        {formatMoney(l.depositPaid, currency)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Ads Executive Summary */}
        <div className="card-surface rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">Active Creative Diagnostics</h3>
              <p className="text-xs text-[#64748B]">
                {activeAds.length} active creative(s) • Logged spend{' '}
                <span className="font-mono font-medium text-[#0F172A] tabular-nums">
                  {formatMoney(analytics.totalCreativeSpend, currency)}
                </span>
              </p>
            </div>
            <button
              onClick={() => onNavigate('creatives')}
              className="text-xs font-medium text-[#475569] hover:text-[#0F172A] inline-flex items-center gap-1 cursor-pointer"
            >
              Full Matrix <ArrowUpRight className="w-3.5 h-3.5" strokeWidth={1.75} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F7F8FA] border-b border-[#E5E7EB] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                  <th className="py-2.5 px-4">Asset / Ad Name</th>
                  <th className="py-2.5 px-3 text-right">Hook / CTR</th>
                  <th className="py-2.5 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9] text-xs">
                {activeAds.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="py-6 text-center text-[#64748B]">
                      No active creatives running.
                    </td>
                  </tr>
                ) : (
                  activeAds.map((ad) => {
                    const diag = diagnoseCreative(ad, economics.dailyBudget, economics.targetCpl, currency);
                    return (
                      <tr key={ad.id} className="hover:bg-[#F7F8FA]">
                        <td className="py-3 px-4">
                          <div className="font-mono font-medium text-[#0F172A]">{ad.adName}</div>
                          <div className="text-[11px] text-[#64748B] tabular-nums">
                            {formatMoney(ad.spend, currency)} spent • {ad.leads} lead(s)
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-[#334155]">
                          {formatDec(diag.hookRate, 1)}% / {formatDec(diag.outboundCtr, 2)}%
                        </td>
                        <td className="py-3 px-4 text-right">
                          <StatusBadge tone={diag.verdict.tone}>{diag.verdict.label}</StatusBadge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Custom Clean Institutional SVG Grouped Bar Chart (No external chart libs)
function ScenarioSvgChart({ scenarios, outlay, currency }) {
  const maxVal = Math.max(
    outlay * 1.2,
    ...scenarios.map((s) => s.grossProfit),
    1000
  );

  const chartHeight = 190;
  const chartWidth = 600;
  const padLeft = 72;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 34;
  const plotW = chartWidth - padLeft - padRight;
  const plotH = chartHeight - padTop - padBottom;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    val: maxVal * t,
    y: padTop + plotH - plotH * t
  }));

  const groupWidth = plotW / scenarios.length;

  return (
    <div className="w-full overflow-x-auto mt-3">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-auto min-w-[440px]"
        role="img"
        aria-label="30-Day Scenario Comparison Chart"
      >
        {/* Horizontal Hairline Grid */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line
              x1={padLeft}
              y1={tick.y}
              x2={chartWidth - padRight}
              y2={tick.y}
              stroke="#F1F5F9"
              strokeWidth="1"
            />
            <text
              x={padLeft - 8}
              y={tick.y + 3.5}
              textAnchor="end"
              fill="#64748B"
              fontSize="10"
              fontFamily="IBM Plex Mono, monospace"
            >
              {tick.val >= 1000 ? `${Math.round(tick.val / 1000)}k` : Math.round(tick.val)}
            </text>
          </g>
        ))}

        {/* Grouped Bars */}
        {scenarios.map((sc, idx) => {
          const cx = padLeft + groupWidth * idx + groupWidth / 2;
          const barW = 34;
          const gap = 8;

          const gpH = Math.max(2, (sc.grossProfit / maxVal) * plotH);
          const outH = Math.max(2, (outlay / maxVal) * plotH);

          const gpY = padTop + plotH - gpH;
          const outY = padTop + plotH - outH;

          return (
            <g key={sc.label}>
              {/* Outlay Bar */}
              <rect
                x={cx - barW - gap / 2}
                y={outY}
                width={barW}
                height={outH}
                rx="3"
                fill="#CBD5E1"
              />
              {/* Gross Profit Bar */}
              <rect
                x={cx + gap / 2}
                y={gpY}
                width={barW}
                height={gpH}
                rx="3"
                fill={idx === 1 ? '#0F172A' : '#334155'}
              />
              {/* Value label above GP bar */}
              <text
                x={cx + gap / 2 + barW / 2}
                y={gpY - 6}
                textAnchor="middle"
                fill="#0F172A"
                fontSize="10"
                fontWeight="600"
                fontFamily="IBM Plex Mono, monospace"
              >
                {currency} {Math.round(sc.grossProfit / 1000)}k
              </text>
              {/* X-Axis Label */}
              <text
                x={cx}
                y={chartHeight - 10}
                textAnchor="middle"
                fill="#475569"
                fontSize="11"
                fontWeight="500"
                fontFamily="Inter, sans-serif"
              >
                {sc.label}
              </text>
            </g>
          );
        })}

        {/* Baseline */}
        <line
          x1={padLeft}
          y1={padTop + plotH}
          x2={chartWidth - padRight}
          y2={padTop + plotH}
          stroke="#E5E7EB"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
}

// ============================================================================
// VIEW 2: AGENCY PORTFOLIO (MULTI-CLIENT EXECUTIVE LEDGER)
// ============================================================================

function AgencyPortfolioView({ clients, activeClientId, onSelectClient, onOpenAddModal, onDeleteClient }) {
  const rows = useMemo(
    () => clients.map((c) => ({ client: c, stats: computeWorkspaceAnalytics(c) })),
    [clients]
  );

  const totalDaily = rows.reduce((s, r) => s + (Number(r.client.economics.dailyBudget) || 0), 0);
  const totalOutlay = rows.reduce((s, r) => s + r.stats.trueCashOutlay, 0);
  const totalDeposits = rows.reduce((s, r) => s + r.stats.totalDepositsCollected, 0);
  const totalAlerts = rows.reduce((s, r) => s + r.stats.alerts.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#0F172A] tracking-tight">Agency Portfolio Ledger</h2>
          <p className="text-xs text-[#64748B]">
            Side-by-side financial monitoring across all independent client workspaces.
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-medium transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={2} />
          New Client Workspace
        </button>
      </div>

      {/* Portfolio Aggregate Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-surface rounded-xl p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Managed Accounts</div>
          <div className="text-2xl font-semibold font-mono tabular-nums text-[#0F172A] mt-1.5">{clients.length}</div>
        </div>
        <div className="card-surface rounded-xl p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Combined 30d Outlay</div>
          <div className="text-2xl font-semibold font-mono tabular-nums text-[#0F172A] mt-1.5">
            KES {Math.round(totalOutlay).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5 tabular-nums">KES {totalDaily.toLocaleString()}/day pre-tax</div>
        </div>
        <div className="card-surface rounded-xl p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Portfolio Deposits</div>
          <div className="text-2xl font-semibold font-mono tabular-nums text-[#065F46] mt-1.5">
            KES {totalDeposits.toLocaleString()}
          </div>
        </div>
        <div className="card-surface rounded-xl p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Open Guardrail Alerts</div>
          <div className={`text-2xl font-semibold font-mono tabular-nums mt-1.5 ${totalAlerts > 0 ? 'text-[#92400E]' : 'text-[#065F46]'}`}>
            {totalAlerts}
          </div>
        </div>
      </div>

      {/* Portfolio Comparison Table */}
      <div className="card-surface rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-[#E5E7EB] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="py-3 px-4">Workspace & Account ID</th>
                <th className="py-3 px-3 text-right">Daily Budget</th>
                <th className="py-3 px-3 text-right">30d Outlay (VAT)</th>
                <th className="py-3 px-3 text-right">Leads</th>
                <th className="py-3 px-3 text-right">Deposits</th>
                <th className="py-3 px-3 text-right">LTGP : CAC</th>
                <th className="py-3 px-3 text-right">Runway</th>
                <th className="py-3 px-3">Health</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-xs">
              {rows.map(({ client, stats }) => {
                const isHealthy = stats.projectedLtgpCac >= 3.0 && stats.staleCapiLeads.length === 0;
                const isSelected = client.id === activeClientId;
                return (
                  <tr key={client.id} className={isSelected ? 'bg-[#F7F8FA]/80' : 'hover:bg-[#F7F8FA]'}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#0F172A]">{client.name}</span>
                        {isSelected && <StatusBadge tone="neutral">Active</StatusBadge>}
                      </div>
                      <div className="text-[11px] font-mono text-[#64748B] mt-0.5">
                        {client.metaAccountId} • {client.currentPhase}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums text-[#0F172A]">
                      {formatMoney(client.economics.dailyBudget, client.currency)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums text-[#334155]">
                      {formatMoney(stats.trueCashOutlay, client.currency)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums text-[#334155]">
                      {stats.totalActualLeads}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-medium tabular-nums text-[#0F172A]">
                      {formatMoney(stats.totalDepositsCollected, client.currency)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-semibold tabular-nums">
                      <span className={stats.projectedLtgpCac >= 3 ? 'text-[#065F46]' : 'text-[#991B1B]'}>
                        {formatDec(stats.projectedLtgpCac, 1)} : 1
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono tabular-nums">
                      <span className={stats.daysRunwayLeft < 5 ? 'text-[#92400E] font-semibold' : 'text-[#334155]'}>
                        {formatDec(Math.max(0, stats.daysRunwayLeft), 1)}d
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge tone={isHealthy ? 'healthy' : stats.projectedLtgpCac < 3 ? 'alert' : 'caution'}>
                        {isHealthy ? 'Healthy' : `${stats.alerts.length} Alert(s)`}
                      </StatusBadge>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectClient(client.id)}
                        className="px-3 py-1.5 rounded-md bg-white border border-[#E5E7EB] hover:border-[#0F172A] text-xs font-medium text-[#0F172A] transition cursor-pointer mr-1.5"
                      >
                        Open Workspace
                      </button>
                      {clients.length > 1 && (
                        <button
                          onClick={() => onDeleteClient(client.id)}
                          title="Delete Workspace"
                          className="p-1.5 text-[#64748B] hover:text-[#991B1B] transition cursor-pointer align-middle"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 3: UNIT ECONOMICS, VAT RUNWAY & REINVESTMENT CALCULATOR
// ============================================================================

function UnitEconomicsView({
  client,
  analytics,
  onUpdateEconomics,
  onUpdatePhase,
  onUpdateTopUps,
  showToast
}) {
  const { economics, currency, currentPhase, topUps } = client;
  const [newTopUp, setNewTopUp] = useState({
    grossAmount: 3500,
    method: 'M-Pesa Prepaid',
    note: ''
  });

  const isScalable = analytics.projectedLtgpCac >= 3.0;
  const safeReinvestLow = Math.round(analytics.totalDepositsCollected * 0.185);
  const safeReinvestHigh = Math.round(analytics.totalDepositsCollected * 0.37);
  const suggestedScaledDaily =
    analytics.totalDepositsCollected >= analytics.trueCashOutlay
      ? Math.max(economics.dailyBudget, Math.min(2000, Math.round((economics.dailyBudget * 2.5) / 50) * 50))
      : economics.dailyBudget;

  const handleAddTopUp = (e) => {
    e.preventDefault();
    const gross = Number(newTopUp.grossAmount) || 0;
    if (gross <= 0) {
      showToast('Enter a valid gross top-up amount.', 'alert');
      return;
    }
    const entry = {
      id: `tu-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      method: newTopUp.method,
      grossAmount: gross,
      note: newTopUp.note.trim() || 'Prepaid ad balance top-up'
    };
    onUpdateTopUps([entry, ...(topUps || [])]);
    setNewTopUp({ ...newTopUp, note: '' });
    const net = gross / (1 + economics.vatRate / 100);
    showToast(`Logged ${formatMoney(gross, currency)} top-up (${formatMoney(net, currency, 2)} net usable).`);
  };

  return (
    <div className="space-y-6">
      {/* 3-Phase Budget Stage Selector */}
      <div className="card-surface rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
            3-Phase Acquisition Budget Stage
          </h3>
          <StatusBadge tone="neutral">{currentPhase}</StatusBadge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PHASES.map((p) => {
            const selected = currentPhase === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onUpdatePhase(p.id)}
                className={`text-left p-3.5 rounded-lg border transition cursor-pointer ${
                  selected
                    ? 'bg-[#F7F8FA] border-[#0F172A] ring-1 ring-[#0F172A]'
                    : 'bg-white border-[#E5E7EB] hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#0F172A]">{p.short}</span>
                  {selected && <CheckCircle2 className="w-4 h-4 text-[#0F172A]" strokeWidth={1.75} />}
                </div>
                <p className="text-[11px] text-[#64748B] mt-1 leading-relaxed">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fleet Warning if exceeded */}
      {analytics.fleetExceeded && (
        <div className="rounded-xl p-4 bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-3">
          <Car className="w-4 h-4 text-[#92400E] shrink-0 mt-0.5" strokeWidth={1.75} />
          <div className="text-xs text-[#92400E]">
            <strong>Fleet Capacity Alert:</strong> Projected monthly bookings ({formatDec(analytics.projectedBookings, 1)}) exceed your current fleet limit of{' '}
            <span className="font-mono font-semibold tabular-nums">{economics.fleetMaxMonthlyBookings} trips/mo</span>. Secure partner vehicles before raising daily spend.
          </div>
        </div>
      )}

      {/* Main Economics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <div className="lg:col-span-5 card-surface rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
            <h3 className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#475569]" strokeWidth={1.75} />
              Hormozi 3:1 Unit Economics
            </h3>
            <span className="font-mono text-xs text-[#64748B]">{currency}</span>
          </div>

          <NumberControl
            label="Daily Ad Budget (Pre-Tax)"
            value={economics.dailyBudget}
            min={100}
            max={5000}
            step={50}
            unit={currency}
            prefix
            onChange={(v) => onUpdateEconomics({ dailyBudget: v })}
          />
          <NumberControl
            label="Kenya Digital Ad VAT %"
            value={economics.vatRate}
            min={0}
            max={25}
            step={1}
            unit="%"
            onChange={(v) => onUpdateEconomics({ vatRate: v })}
          />
          <NumberControl
            label="Average Order Value (AOV)"
            value={economics.avgOrderValue}
            min={5000}
            max={300000}
            step={5000}
            unit={currency}
            prefix
            onChange={(v) => onUpdateEconomics({ avgOrderValue: v })}
          />
          <NumberControl
            label="Gross Margin % (Net of Fuel/Driver)"
            value={economics.grossMarginPct}
            min={10}
            max={90}
            step={1}
            unit="%"
            onChange={(v) => onUpdateEconomics({ grossMarginPct: v })}
          />
          <NumberControl
            label="Target WhatsApp CPL"
            value={economics.targetCpl}
            min={50}
            max={2000}
            step={25}
            unit={currency}
            prefix
            onChange={(v) => onUpdateEconomics({ targetCpl: v })}
          />
          <NumberControl
            label="Lead-to-Deposit Close Rate %"
            value={economics.closeRatePct}
            min={1}
            max={50}
            step={1}
            unit="%"
            onChange={(v) => onUpdateEconomics({ closeRatePct: v })}
          />
          <NumberControl
            label="Upfront Deposit %"
            value={economics.depositPct}
            min={10}
            max={100}
            step={5}
            unit="%"
            onChange={(v) => onUpdateEconomics({ depositPct: v })}
          />
          <NumberControl
            label="Fleet Monthly Booking Cap"
            value={economics.fleetMaxMonthlyBookings}
            min={1}
            max={60}
            step={1}
            unit="trips/mo"
            onChange={(v) => onUpdateEconomics({ fleetMaxMonthlyBookings: v })}
          />
        </div>

        {/* Outputs, 70/20/10 Split & Reinvestment */}
        <div className="lg:col-span-7 space-y-5">
          {/* Verdict Summary */}
          <div className="card-surface rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-[#0F172A]">3:1 Ratio Verdict</h3>
                <StatusBadge tone={isScalable ? 'healthy' : 'alert'}>
                  {isScalable ? 'Scale (>= 3.0:1)' : 'Fix Offer (< 3.0:1)'}
                </StatusBadge>
              </div>
              <p className="text-xs text-[#64748B] mt-1.5 leading-relaxed">
                Gross Profit per trip:{' '}
                <strong className="font-mono text-[#0F172A] tabular-nums">
                  {formatMoney(analytics.gpPerBooking, currency)}
                </strong>{' '}
                • Max Allowable CAC:{' '}
                <strong className="font-mono text-[#0F172A] tabular-nums">
                  {formatMoney(analytics.maxAllowableCac, currency)}
                </strong>
              </p>
            </div>
            <div className="text-left sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-[#F1F5F9]">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                Projected LTGP : CAC
              </div>
              <div
                className={`text-2xl font-semibold font-mono tabular-nums ${
                  isScalable ? 'text-[#065F46]' : 'text-[#991B1B]'
                }`}
              >
                {formatDec(analytics.projectedLtgpCac, 1)} : 1
              </div>
            </div>
          </div>

          {/* 70/20/10 Allocation */}
          <div className="card-surface rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                70 / 20 / 10 Budget Allocation
              </h4>
              <span className="font-mono text-xs text-[#0F172A] tabular-nums">
                {formatMoney(economics.dailyBudget, currency)}/day
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-[#F1F5F9]">
              <div className="bg-[#0F172A] h-full" style={{ width: '70%' }} />
              <div className="bg-[#64748B] h-full" style={{ width: '20%' }} />
              <div className="bg-[#CBD5E1] h-full" style={{ width: '10%' }} />
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs pt-1">
              <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-3">
                <div className="text-[#475569] font-medium">70% Proven Winners</div>
                <div className="font-mono font-semibold text-[#0F172A] mt-0.5 tabular-nums">
                  {formatMoney(economics.dailyBudget * 0.7, currency)}/d
                </div>
              </div>
              <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-3">
                <div className="text-[#475569] font-medium">20% Hook Variations</div>
                <div className="font-mono font-semibold text-[#0F172A] mt-0.5 tabular-nums">
                  {formatMoney(economics.dailyBudget * 0.2, currency)}/d
                </div>
              </div>
              <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-3">
                <div className="text-[#475569] font-medium">10% Wildcards</div>
                <div className="font-mono font-semibold text-[#0F172A] mt-0.5 tabular-nums">
                  {formatMoney(economics.dailyBudget * 0.1, currency)}/d
                </div>
              </div>
            </div>
          </div>

          {/* Client-Funded Reinvestment Calculator */}
          <div className="card-surface rounded-xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#475569]" strokeWidth={1.75} />
                Client-Funded Reinvestment Calculator
              </h4>
              <span className="font-mono text-xs font-semibold text-[#065F46] tabular-nums">
                CRM Deposits: {formatMoney(analytics.totalDepositsCollected, currency)}
              </span>
            </div>
            <p className="text-xs text-[#475569] leading-relaxed">
              Collected deposits currently recover{' '}
              <strong className="font-mono text-[#0F172A] tabular-nums">
                {formatDec(
                  analytics.trueCashOutlay > 0 ? analytics.totalDepositsCollected / analytics.trueCashOutlay : 0,
                  1
                )}
                x
              </strong>{' '}
              your 30-day VAT-inclusive outlay ({formatMoney(analytics.trueCashOutlay, currency)}).
              {analytics.totalDepositsCollected > 0 ? (
                <>
                  {' '}
                  Recommended reinvestment band:{' '}
                  <strong className="font-mono text-[#0F172A] tabular-nums">
                    {formatMoney(safeReinvestLow, currency)} - {formatMoney(safeReinvestHigh, currency)}
                  </strong>{' '}
                  to scale daily budget toward{' '}
                  <strong className="font-mono text-[#0F172A] tabular-nums">
                    {formatMoney(suggestedScaledDaily, currency)}/day
                  </strong>
                  .
                </>
              ) : (
                ' Log your first booking deposit in the CRM to unlock self-funded scaling.'
              )}
            </p>
            {analytics.totalDepositsCollected >= analytics.trueCashOutlay &&
              suggestedScaledDaily > economics.dailyBudget && (
                <button
                  onClick={() => {
                    onUpdateEconomics({ dailyBudget: suggestedScaledDaily });
                    showToast(`Updated daily budget to ${formatMoney(suggestedScaledDaily, currency)}/day.`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-medium transition cursor-pointer"
                >
                  Apply Safe Scale ({formatMoney(economics.dailyBudget, currency)} to {formatMoney(suggestedScaledDaily, currency)}/day)
                </button>
              )}
          </div>
        </div>
      </div>

      {/* M-Pesa Prepaid Top-Up & 16% VAT Runway Ledger */}
      <div className="card-surface rounded-xl p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 pb-4 border-b border-[#F1F5F9]">
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A]">
              M-Pesa Prepaid Top-Up & {economics.vatRate}% VAT Runway Ledger
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Prepaid top-ups deduct {economics.vatRate}% VAT upfront (Net Usable = Gross / {(1 + economics.vatRate / 100).toFixed(2)}).
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="bg-[#F7F8FA] border border-[#E5E7EB] px-3 py-2 rounded-lg">
              <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Net Remaining</span>
              <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                {formatMoney(analytics.remainingNetBalance, currency, 2)}
              </span>
            </div>
            <div className="bg-[#F7F8FA] border border-[#E5E7EB] px-3 py-2 rounded-lg">
              <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Runway Left</span>
              <span className="font-mono font-semibold text-[#0F172A] tabular-nums">
                {formatDec(Math.max(0, analytics.daysRunwayLeft), 1)} Days
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleAddTopUp} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-medium text-[#475569] mb-1">Gross Top-Up ({currency})</label>
            <input
              type="number"
              min="1"
              value={newTopUp.grossAmount}
              onChange={(e) => setNewTopUp({ ...newTopUp, grossAmount: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs font-mono tabular-nums text-[#0F172A] focus:outline-none focus:border-[#0F172A]"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-[11px] font-medium text-[#475569] mb-1">Payment Method</label>
            <select
              value={newTopUp.method}
              onChange={(e) => setNewTopUp({ ...newTopUp, method: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#0F172A]"
            >
              <option value="M-Pesa Prepaid">M-Pesa Prepaid</option>
              <option value="Visa / Mastercard">Visa / Mastercard</option>
            </select>
          </div>
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-medium text-[#64748B] mb-1 tabular-nums">
              Net Usable: {formatMoney((Number(newTopUp.grossAmount) || 0) / (1 + economics.vatRate / 100), currency, 2)}
            </label>
            <input
              type="text"
              value={newTopUp.note}
              onChange={(e) => setNewTopUp({ ...newTopUp, note: e.target.value })}
              placeholder="Reference note (e.g., Week 3 refill)"
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#0F172A]"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-medium text-xs py-2 px-3 rounded-lg transition cursor-pointer"
            >
              Log Top-Up
            </button>
          </div>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-[#E5E7EB] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3 text-right">Gross Paid</th>
                <th className="py-2.5 px-3 text-right">VAT ({economics.vatRate}%)</th>
                <th className="py-2.5 px-3 text-right">Net Usable</th>
                <th className="py-2.5 px-3">Note</th>
                <th className="py-2.5 px-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-xs">
              {(topUps || []).length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-6 text-center text-[#64748B]">
                    No prepaid top-ups logged yet.
                  </td>
                </tr>
              ) : (
                topUps.map((tu) => {
                  const net = tu.grossAmount / (1 + economics.vatRate / 100);
                  const vat = tu.grossAmount - net;
                  return (
                    <tr key={tu.id} className="hover:bg-[#F7F8FA]">
                      <td className="py-2.5 px-3 font-mono tabular-nums text-[#475569]">{tu.date}</td>
                      <td className="py-2.5 px-3 text-[#0F172A]">{tu.method}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-medium tabular-nums text-[#0F172A]">
                        {formatMoney(tu.grossAmount, currency, 2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-[#92400E]">
                        -{formatMoney(vat, currency, 2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold tabular-nums text-[#065F46]">
                        {formatMoney(net, currency, 2)}
                      </td>
                      <td className="py-2.5 px-3 text-[#64748B]">{tu.note}</td>
                      <td className="py-2.5 px-2 text-right">
                        <button
                          onClick={() => onUpdateTopUps(topUps.filter((x) => x.id !== tu.id))}
                          className="p-1 text-[#64748B] hover:text-[#991B1B] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-[#F7F8FA] border-t border-[#E5E7EB] font-mono text-xs tabular-nums">
                <td colSpan="2" className="py-2.5 px-3 font-semibold text-[#334155]">
                  Total ({formatMoney(analytics.totalCreativeSpend, currency)} Ad Spend Logged)
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-[#0F172A]">
                  {formatMoney(analytics.totalGrossTopUps, currency, 2)}
                </td>
                <td className="py-2.5 px-3 text-right text-[#92400E]">
                  -{formatMoney(analytics.totalVatDeducted, currency, 2)}
                </td>
                <td className="py-2.5 px-3 text-right font-semibold text-[#065F46]">
                  {formatMoney(analytics.netUsableFromTopUps, currency, 2)}
                </td>
                <td colSpan="2" className="py-2.5 px-3 text-right font-semibold text-[#0F172A]">
                  Remaining: {formatMoney(analytics.remainingNetBalance, currency, 2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

function NumberControl({ label, value, min, max, step, unit, prefix = false, onChange }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-[#334155]">{label}</label>
        <div className="flex items-center bg-[#F7F8FA] border border-[#E5E7EB] rounded-md px-2 py-1">
          {prefix && <span className="text-[11px] font-mono text-[#64748B] mr-1">{unit}</span>}
          <input
            type="number"
            min={0}
            step={step}
            value={value}
            onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
            className="w-20 bg-transparent text-right text-xs font-mono font-semibold tabular-nums text-[#0F172A] focus:outline-none"
          />
          {!prefix && <span className="text-[11px] font-mono text-[#64748B] ml-1">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-[#E5E7EB] rounded-lg appearance-none cursor-pointer accent-[#0F172A]"
      />
    </div>
  );
}

// ============================================================================
// VIEW 4: CREATIVE DIAGNOSTICS MATRIX
// ============================================================================

function CreativeDiagnosticsView({ client, analytics, onUpdateCreatives, showToast }) {
  const { creatives, economics, currency } = client;

  const [newAd, setNewAd] = useState({
    assetId: `A00${creatives.length + 1}`,
    adName: `VID_NEW-HOOK_V1_A00${creatives.length + 1}`,
    bucket: '20% Variation',
    status: 'Active'
  });

  const handleField = (id, field, val) => {
    const numFields = ['spend', 'impressions', 'threeSecPlays', 'outboundClicks', 'leads'];
    onUpdateCreatives(
      creatives.map((c) =>
        c.id === id
          ? { ...c, [field]: numFields.includes(field) ? Math.max(0, Number(val) || 0) : val }
          : c
      )
    );
  };

  const handleAddAd = (e) => {
    e.preventDefault();
    if (!newAd.assetId.trim() || !newAd.adName.trim()) {
      showToast('Asset ID and Ad Name are required.', 'alert');
      return;
    }
    const created = {
      id: `cr-${Date.now()}`,
      assetId: newAd.assetId.trim().toUpperCase(),
      adName: newAd.adName.trim().toUpperCase(),
      bucket: newAd.bucket,
      status: newAd.status,
      launchDate: new Date().toISOString(),
      spend: 0,
      impressions: 0,
      threeSecPlays: 0,
      outboundClicks: 0,
      leads: 0
    };
    onUpdateCreatives([created, ...creatives]);
    const nextIdx = creatives.length + 2;
    setNewAd({
      assetId: `A00${nextIdx}`,
      adName: `VID_NEW-HOOK_V1_A00${nextIdx}`,
      bucket: '20% Variation',
      status: 'Active'
    });
    showToast(`Launched ${created.adName} under 72-hour learning lock.`);
  };

  const handleCloneRemake = (sourceAd) => {
    const nextIdx = creatives.length + 1;
    const nextAssetId = `A${String(nextIdx).padStart(3, '0')}`;
    let remade = sourceAd.adName.replace(/_V(\d+)_/i, (_, v) => `_V${Number(v) + 1}_`);
    if (remade === sourceAd.adName) remade = `${sourceAd.adName}_V2`;
    remade = remade.replace(/_A\d+$/i, `_${nextAssetId}`);
    if (!remade.endsWith(nextAssetId)) remade = `${remade}_${nextAssetId}`;

    const cloned = {
      id: `cr-${Date.now()}`,
      assetId: nextAssetId,
      adName: remade,
      bucket: '20% Variation',
      status: 'Active',
      launchDate: new Date().toISOString(),
      spend: 0,
      impressions: 0,
      threeSecPlays: 0,
      outboundClicks: 0,
      leads: 0
    };
    onUpdateCreatives([cloned, ...creatives]);
    showToast(`Cloned fatigue remake: ${cloned.adName} (72-hour lock started).`);
  };

  return (
    <div className="space-y-6">
      {analytics.fragmentationRisk && (
        <div className="rounded-xl p-4 bg-[#FEF2F2] border border-[#FECACA] flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-[#991B1B] shrink-0 mt-0.5" strokeWidth={1.75} />
          <div className="text-xs text-[#991B1B]">
            <strong>Budget Fragmentation Warning:</strong> You have {analytics.activeAdsCount} active ads on a{' '}
            <span className="font-mono font-semibold tabular-nums">{formatMoney(economics.dailyBudget, currency)}/day</span> budget. Keep at most 1-2 active creatives at or under KES 300/day.
          </div>
        </div>
      )}

      {/* Launch New Ad Variant */}
      <form onSubmit={handleAddAd} className="card-surface rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
          <h3 className="text-sm font-semibold text-[#0F172A]">Launch Modular Hook Variant</h3>
          <span className="text-xs font-mono text-[#64748B] tabular-nums">
            Kill Threshold: {formatMoney(4 * economics.dailyBudget, currency)} (4x Daily Budget) & 0 Leads
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-[#475569] mb-1">Asset ID</label>
            <input
              type="text"
              value={newAd.assetId}
              onChange={(e) => setNewAd({ ...newAd, assetId: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#0F172A]"
            />
          </div>
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-medium text-[#475569] mb-1">Ad Name (Taxonomy)</label>
            <input
              type="text"
              value={newAd.adName}
              onChange={(e) => setNewAd({ ...newAd, adName: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs font-mono text-[#0F172A] focus:outline-none focus:border-[#0F172A]"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-[#475569] mb-1">Bucket</label>
            <select
              value={newAd.bucket}
              onChange={(e) => setNewAd({ ...newAd, bucket: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-2 text-xs text-[#0F172A]"
            >
              <option value="70% Winner">70% Winner</option>
              <option value="20% Variation">20% Variation</option>
              <option value="10% Wildcard">10% Wildcard</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-[#475569] mb-1">Status</label>
            <select
              value={newAd.status}
              onChange={(e) => setNewAd({ ...newAd, status: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-2 text-xs text-[#0F172A]"
            >
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-medium py-2 rounded-lg transition cursor-pointer"
            >
              Add Creative
            </button>
          </div>
        </div>
      </form>

      {/* Diagnostic Matrix Table */}
      <div className="card-surface rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A]">Modular Hook Matrix</h3>
            <p className="text-xs text-[#64748B] tabular-nums">
              Benchmarks: Hook Rate &gt;= 25.0% • Outbound CTR &gt;= 1.00% • Target CPL &lt;= {formatMoney(economics.targetCpl, currency)}
            </p>
          </div>
          <span className="text-xs font-mono text-[#475569] tabular-nums">
            {analytics.activeAdsCount} Active / {creatives.length} Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-[#E5E7EB] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="py-3 px-4">Asset & Ad Name</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Spend</th>
                <th className="py-3 px-2 text-right">Impr.</th>
                <th className="py-3 px-2 text-right">3s Plays</th>
                <th className="py-3 px-2 text-right">Hook %</th>
                <th className="py-3 px-2 text-right">Clicks</th>
                <th className="py-3 px-2 text-right">CTR %</th>
                <th className="py-3 px-2 text-right">Leads</th>
                <th className="py-3 px-2 text-right">CPL</th>
                <th className="py-3 px-3">Verdict</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-xs">
              {creatives.map((ad) => {
                const diag = diagnoseCreative(ad, economics.dailyBudget, economics.targetCpl, currency);
                return (
                  <tr key={ad.id} className="hover:bg-[#F7F8FA]">
                    <td className="py-3 px-4 min-w-[205px]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#0F172A]">
                          {ad.assetId}
                        </span>
                        <span className="text-[11px] text-[#64748B] font-mono tabular-nums">
                          {Math.floor(diag.hoursActive / 24)}d {Math.floor(diag.hoursActive % 24)}h
                        </span>
                      </div>
                      {ad.metaAdId && (
                        <span className="block mt-1 text-[10px] font-medium uppercase tracking-wider text-[#64748B]">
                          Synced from Meta
                        </span>
                      )}
                      <input
                        type="text"
                        value={ad.adName}
                        readOnly={Boolean(ad.metaAdId)}
                        onChange={(e) => handleField(ad.id, 'adName', e.target.value)}
                        className="w-full bg-transparent font-mono text-xs font-medium text-[#0F172A] mt-1 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-300 rounded px-0.5"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <select
                        value={ad.status}
                        disabled={Boolean(ad.metaAdId)}
                        title={ad.metaAdId ? 'Status is synced from Meta Ads Manager' : undefined}
                        onChange={(e) => handleField(ad.id, 'status', e.target.value)}
                        className="bg-white border border-[#E5E7EB] rounded-md px-2 py-1 text-xs font-medium text-[#0F172A] cursor-pointer"
                      >
                        <option value="Active">Active</option>
                        <option value="Paused">Paused</option>
                        <option value="Killed">Killed</option>
                      </select>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <InlineNum value={ad.spend} readOnly={Boolean(ad.metaAdId)} onChange={(v) => handleField(ad.id, 'spend', v)} />
                    </td>
                    <td className="py-3 px-2 text-right">
                      <InlineNum value={ad.impressions} readOnly={Boolean(ad.metaAdId)} onChange={(v) => handleField(ad.id, 'impressions', v)} />
                    </td>
                    <td className="py-3 px-2 text-right">
                      <InlineNum value={ad.threeSecPlays} readOnly={Boolean(ad.metaAdId)} onChange={(v) => handleField(ad.id, 'threeSecPlays', v)} />
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-medium tabular-nums">
                      <span className={diag.hookRate >= 25 ? 'text-[#065F46]' : 'text-[#92400E]'}>
                        {formatDec(diag.hookRate, 1)}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <InlineNum value={ad.outboundClicks} readOnly={Boolean(ad.metaAdId)} onChange={(v) => handleField(ad.id, 'outboundClicks', v)} />
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-medium tabular-nums">
                      <span className={diag.outboundCtr >= 1.0 ? 'text-[#065F46]' : 'text-[#92400E]'}>
                        {formatDec(diag.outboundCtr, 2)}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <InlineNum value={ad.leads} readOnly={Boolean(ad.metaAdId)} onChange={(v) => handleField(ad.id, 'leads', v)} />
                    </td>
                    <td className="py-3 px-2 text-right font-mono tabular-nums text-[#334155]">
                      {diag.cpl !== null ? Math.round(diag.cpl).toLocaleString() : '-'}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge tone={diag.verdict.tone} icon={diag.isLocked72h ? Lock : undefined}>
                        {diag.verdict.label}
                      </StatusBadge>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleCloneRemake(ad)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#E5E7EB] hover:border-[#0F172A] text-[11px] font-medium text-[#0F172A] mr-1.5 transition cursor-pointer"
                      >
                        + Remake Hook
                      </button>
                      <button
                        onClick={() => onUpdateCreatives(creatives.filter((x) => x.id !== ad.id))}
                        className="p-1 text-[#64748B] hover:text-[#991B1B] cursor-pointer align-middle"
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function InlineNum({ value, onChange, readOnly = false }) {
  if (readOnly) {
    return (
      <span
        className="inline-block w-16 text-right px-1.5 py-1 font-mono text-xs tabular-nums text-[#0F172A]"
        title="Synced from Meta"
      >
        {Number(value || 0).toLocaleString()}
      </span>
    );
  }
  return (
    <input
      type="number"
      min="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-16 text-right bg-[#F7F8FA] border border-transparent hover:border-[#E5E7EB] focus:bg-white focus:border-[#0F172A] rounded px-1.5 py-1 font-mono text-xs tabular-nums text-[#0F172A] focus:outline-none"
    />
  );
}

// ============================================================================
// VIEW 5: WHATSAPP CRM & 2026 META CAPI EXPORTER
// ============================================================================

function WhatsAppCrmView({ client, analytics, onUpdateLeads, showToast }) {
  const { leads, creatives, economics, currency } = client;
  const [stageFilter, setStageFilter] = useState('ALL');
  const [quoteDrawerOpen, setQuoteDrawerOpen] = useState(false);

  const [newLead, setNewLead] = useState({
    name: '',
    phone: '07',
    email: '',
    fbclid: '',
    assetId: creatives[0]?.assetId || 'A001',
    icebreaker: ICEBREAKER_OPTIONS[0],
    responseMins: 3,
    quoteValue: economics.avgOrderValue,
    addonsValue: 0,
    stage: 'New Inquiry'
  });

  const handleAddLead = (e) => {
    e.preventDefault();
    if (!newLead.name.trim() || !newLead.phone.trim()) {
      showToast('Lead Name and Phone number are required.', 'alert');
      return;
    }
    const qv = Number(newLead.quoteValue) || 0;
    const av = Number(newLead.addonsValue) || 0;
    const dep =
      newLead.stage === 'Deposit Paid'
        ? Math.round((qv + av) * (economics.depositPct / 100))
        : newLead.stage === 'Completed'
        ? qv + av
        : 0;

    const entry = {
      id: `LD-${String(Date.now()).slice(-5)}`,
      createdAt: new Date().toISOString(),
      name: newLead.name.trim(),
      phone: newLead.phone.trim(),
      email: newLead.email.trim(),
      fbclid: newLead.fbclid.trim(),
      assetId: newLead.assetId,
      icebreaker: newLead.icebreaker,
      responseMins: Math.max(0, Number(newLead.responseMins) || 0),
      quoteValue: qv,
      addonsValue: av,
      stage: newLead.stage,
      depositPaid: dep,
      capiExported: false
    };

    onUpdateLeads([entry, ...leads]);
    setNewLead({ ...newLead, name: '', phone: '07', email: '', fbclid: '', addonsValue: 0, stage: 'New Inquiry' });
    showToast(`Logged lead ${entry.name} (${normalizeKenyaPhoneE164(entry.phone)}).`);
  };

  const handleStageChange = (id, nextStage) => {
    onUpdateLeads(
      leads.map((l) => {
        if (l.id !== id) return l;
        const total = (Number(l.quoteValue) || 0) + (Number(l.addonsValue) || 0);
        let nextDep = Number(l.depositPaid) || 0;
        if (nextStage === 'Deposit Paid' && nextDep === 0) {
          nextDep = Math.round(total * (economics.depositPct / 100));
        } else if (nextStage === 'Completed' && nextDep < total) {
          nextDep = total;
        }
        return { ...l, stage: nextStage, depositPaid: nextDep };
      })
    );
  };

  const handleExportMetaCapiCSV = async () => {
    const qualifying = leads.filter((l) => l.stage === 'Deposit Paid' || l.stage === 'Completed');
    if (qualifying.length === 0) {
      showToast('No Deposit Paid or Completed leads available to export.', 'alert');
      return;
    }

    const headers = [
      'event_name',
      'event_time',
      'order_id',
      'value',
      'currency',
      'ph',
      'em',
      'fbc',
      'country',
      'action_source',
      'data_processing_options',
      'asset_id'
    ];

    const rows = await Promise.all(
      qualifying.map(async (lead) => {
        const hashedPh = await sha256Hex(normalizeKenyaPhoneE164(lead.phone));
        const hashedEm = lead.email ? await sha256Hex(lead.email) : '';
        const hashedCountry = await sha256Hex('ke');
        const eventTimeIso = new Date(lead.createdAt || Date.now()).toISOString();
        const totalValue =
          (Number(lead.quoteValue) || 0) + (Number(lead.addonsValue) || 0) ||
          Number(lead.depositPaid) ||
          0;
        const fbcVal = lead.fbclid ? `fb.1.${Date.now()}.${lead.fbclid}` : '';

        return [
          'Purchase',
          eventTimeIso,
          lead.id,
          totalValue,
          currency,
          hashedPh,
          hashedEm,
          fbcVal,
          hashedCountry,
          'physical_store',
          'non-ldu',
          lead.assetId || 'UNKNOWN'
        ].join(',');
      })
    );

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const slug = client.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    a.download = `meta-capi-2026-sha256-${slug}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    const exportedIds = new Set(qualifying.map((q) => q.id));
    onUpdateLeads(leads.map((l) => (exportedIds.has(l.id) ? { ...l, capiExported: true } : l)));
    showToast(`Exported ${qualifying.length} SHA-256 Purchase event(s) for Meta Events Manager.`);
  };

  const visibleLeads = stageFilter === 'ALL' ? leads : leads.filter((l) => l.stage === stageFilter);

  return (
    <div className="space-y-6">
      {/* 7-Day CAPI Freshness Alert */}
      {analytics.staleCapiLeads.length > 0 && (
        <div className="rounded-xl p-4 bg-[#FEF2F2] border border-[#FECACA] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[#991B1B] shrink-0 mt-0.5" strokeWidth={1.75} />
            <div className="text-xs text-[#991B1B]">
              <strong>7-Day Meta CAPI Freshness Alert ({analytics.staleCapiLeads.length} overdue):</strong>{' '}
              Deposit Paid / Completed bookings older than 5 days have not been uploaded. Export now to preserve Meta attribution window accuracy.
            </div>
          </div>
          <button
            onClick={handleExportMetaCapiCSV}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-[#991B1B] hover:bg-red-900 text-white text-xs font-medium cursor-pointer"
          >
            Export SHA-256 CSV
          </button>
        </div>
      )}

      {/* Action Bar & CRM Metrics */}
      <div className="card-surface rounded-xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-5 flex-1">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">WhatsApp Leads</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[#0F172A] mt-1">{leads.length}</div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">Deposits Collected</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[#065F46] mt-1">
              {formatMoney(analytics.totalDepositsCollected, currency)}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">5-Min SLA Breaches</div>
            <div className={`text-xl font-semibold font-mono tabular-nums mt-1 ${analytics.slaBreaches.length > 0 ? 'text-[#991B1B]' : 'text-[#065F46]'}`}>
              {analytics.slaBreaches.length}
            </div>
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">CAPI Exported</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[#0F172A] mt-1">
              {leads.filter((l) => l.capiExported).length}/{analytics.closedBookings}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setQuoteDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-[#E5E7EB] hover:border-[#0F172A] text-xs font-medium text-[#0F172A] transition cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
            Instant Quote Builder
          </button>
          <button
            onClick={handleExportMetaCapiCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-medium transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" strokeWidth={1.75} />
            Export 2026 CAPI CSV (SHA-256)
          </button>
        </div>
      </div>

      {/* Inline Add Lead Form */}
      <form onSubmit={handleAddLead} className="card-surface rounded-xl p-5 space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0F172A]">Log Incoming WhatsApp Inquiry</h3>
          <span className="text-[11px] font-mono text-[#64748B] tabular-nums">
            Kenya E.164 Preview: {normalizeKenyaPhoneE164(newLead.phone) || '2547...'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-medium text-[#475569] mb-1">Lead Name *</label>
            <input
              type="text"
              value={newLead.name}
              onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
              placeholder="e.g., Peter Mutua"
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#0F172A] focus:outline-none focus:border-[#0F172A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#475569] mb-1">Phone *</label>
            <input
              type="text"
              value={newLead.phone}
              onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
              placeholder="0712345678"
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono text-[#0F172A] focus:outline-none focus:border-[#0F172A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#475569] mb-1">Source Asset</label>
            <select
              value={newLead.assetId}
              onChange={(e) => setNewLead({ ...newLead, assetId: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-2 font-mono text-[#0F172A]"
            >
              {creatives.map((c) => (
                <option key={c.id} value={c.assetId}>{c.assetId}</option>
              ))}
              <option value="ORGANIC">ORGANIC</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#475569] mb-1">Response (mins)</label>
            <input
              type="number"
              min="0"
              value={newLead.responseMins}
              onChange={(e) => setNewLead({ ...newLead, responseMins: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono tabular-nums text-[#0F172A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#475569] mb-1">Quote ({currency})</label>
            <input
              type="number"
              min="0"
              value={newLead.quoteValue}
              onChange={(e) => setNewLead({ ...newLead, quoteValue: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono tabular-nums text-[#0F172A]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs items-end">
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-medium text-[#475569] mb-1">Icebreaker Selected</label>
            <select
              value={newLead.icebreaker}
              onChange={(e) => setNewLead({ ...newLead, icebreaker: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-2 text-[#0F172A]"
            >
              {ICEBREAKER_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#475569] mb-1">Email (Hashed)</label>
            <input
              type="email"
              value={newLead.email}
              onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
              placeholder="Optional"
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#0F172A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#475569] mb-1">Add-ons ({currency})</label>
            <input
              type="number"
              min="0"
              value={newLead.addonsValue}
              onChange={(e) => setNewLead({ ...newLead, addonsValue: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono tabular-nums text-[#0F172A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#475569] mb-1">Stage</label>
            <select
              value={newLead.stage}
              onChange={(e) => setNewLead({ ...newLead, stage: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-2 text-[#0F172A]"
            >
              {LEAD_STAGES.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-medium text-xs py-2 px-3 rounded-lg transition cursor-pointer"
            >
              Add Lead
            </button>
          </div>
        </div>
      </form>

      {/* Pipeline Table */}
      <div className="card-surface rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#F1F5F9] flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[#0F172A]">Speed-to-Lead Pipeline</h3>
          <div className="flex flex-wrap gap-1">
            {['ALL', ...LEAD_STAGES].map((st) => (
              <button
                key={st}
                onClick={() => setStageFilter(st)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                  stageFilter === st
                    ? 'bg-[#0F172A] text-white'
                    : 'bg-[#F7F8FA] text-[#475569] border border-[#E5E7EB] hover:text-[#0F172A]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-[#E5E7EB] text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
                <th className="py-3 px-4">Lead & E.164 Phone</th>
                <th className="py-3 px-3">Asset / Icebreaker</th>
                <th className="py-3 px-2 text-center">SLA</th>
                <th className="py-3 px-3 text-right">Quote + Add-ons</th>
                <th className="py-3 px-3">Stage</th>
                <th className="py-3 px-3 text-right">Deposit Paid</th>
                <th className="py-3 px-3 text-center">CAPI</th>
                <th className="py-3 px-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9] text-xs">
              {visibleLeads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-[#64748B]">
                    No leads in this stage.
                  </td>
                </tr>
              ) : (
                visibleLeads.map((lead) => {
                  const slaBreach = (Number(lead.responseMins) || 0) > 5;
                  const isPaidStage = lead.stage === 'Deposit Paid' || lead.stage === 'Completed';
                  const ageDays = getHoursSince(lead.createdAt) / 24;
                  const isStaleCapi = isPaidStage && !lead.capiExported && ageDays >= 5;

                  return (
                    <tr key={lead.id} className="hover:bg-[#F7F8FA]">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0F172A]">{lead.name}</div>
                        <div className="font-mono text-[11px] text-[#475569] tabular-nums">
                          {normalizeKenyaPhoneE164(lead.phone)}
                        </div>
                        <div className="text-[11px] text-[#64748B] tabular-nums">
                          {new Date(lead.createdAt).toLocaleDateString()} ({Math.floor(ageDays)}d ago)
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#0F172A]">
                          {lead.assetId}
                        </span>
                        <div className="text-[11px] text-[#64748B] mt-1">{lead.icebreaker}</div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <StatusBadge tone={slaBreach ? 'alert' : 'healthy'}>
                          <span className="font-mono tabular-nums">
                            {lead.responseMins}m{slaBreach ? ' Breach' : ''}
                          </span>
                        </StatusBadge>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-[#0F172A]">
                        <div>{((Number(lead.quoteValue) || 0) + (Number(lead.addonsValue) || 0)).toLocaleString()}</div>
                        {(Number(lead.addonsValue) || 0) > 0 && (
                          <div className="text-[10px] text-[#64748B]">+{Number(lead.addonsValue).toLocaleString()} add-on</div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={lead.stage}
                          onChange={(e) => handleStageChange(lead.id, e.target.value)}
                          className="bg-white border border-[#E5E7EB] rounded-md px-2 py-1 text-xs font-medium text-[#0F172A] cursor-pointer"
                        >
                          {LEAD_STAGES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <input
                          type="number"
                          min="0"
                          value={lead.depositPaid}
                          onChange={(e) =>
                            onUpdateLeads(
                              leads.map((x) =>
                                x.id === lead.id ? { ...x, depositPaid: Math.max(0, Number(e.target.value) || 0) } : x
                              )
                            )
                          }
                          className="w-24 text-right bg-[#F7F8FA] border border-[#E5E7EB] focus:bg-white focus:border-[#0F172A] rounded-md px-2 py-1 font-mono text-xs tabular-nums font-medium text-[#0F172A] focus:outline-none"
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        {lead.capiExported ? (
                          <StatusBadge tone="healthy" icon={Check}>Exported</StatusBadge>
                        ) : isStaleCapi ? (
                          <StatusBadge tone="alert" icon={AlertTriangle}>Upload Due</StatusBadge>
                        ) : isPaidStage ? (
                          <StatusBadge tone="caution">Ready</StatusBadge>
                        ) : (
                          <span className="text-[#64748B]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => onUpdateLeads(leads.filter((x) => x.id !== lead.id))}
                          className="p-1 text-[#64748B] hover:text-[#991B1B] cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1-Click Instant WhatsApp Quote Builder Modal */}
      {quoteDrawerOpen && (
        <InstantQuoteModal
          client={client}
          onClose={() => setQuoteDrawerOpen(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function InstantQuoteModal({ client, onClose, showToast }) {
  const { economics, currency } = client;
  const [cfg, setCfg] = useState({
    tripDays: economics.avgTripDays || 3,
    groupSize: 7,
    destination: 'Maasai Mara / Amboseli',
    includeAddon: true,
    addonPrice: 6500
  });
  const [copied, setCopied] = useState(false);

  const quoteText = useMemo(() => {
    const days = Math.max(1, Number(cfg.tripDays) || 1);
    const group = Math.max(1, Number(cfg.groupSize) || 1);
    const rate = Number(economics.dailyRate) || Math.round(economics.avgOrderValue / (economics.avgTripDays || 1));
    const baseTotal = days * rate;
    const perPerson = Math.round(baseTotal / group);
    const addon = cfg.includeAddon ? Number(cfg.addonPrice) || 0 : 0;
    const grandTotal = baseTotal + addon;
    const depositAmt = Math.round(grandTotal * (economics.depositPct / 100));

    return (
      `Hello, here is your instant ${client.name} quote for ${cfg.destination} (${days} Day${days > 1 ? 's' : ''}):\n\n` +
      `Service: ${client.coreOffer}\n` +
      `Flat Rate: ${formatMoney(rate, currency)}/day x ${days} days = ${formatMoney(baseTotal, currency)}\n` +
      `Group Split (${group} guests): ${formatMoney(perPerson, currency)} per person (no per-person agency markups)\n` +
      (addon > 0 ? `Optional Transfer Add-on: ${formatMoney(addon, currency)}\n` : '') +
      `Total Package: ${formatMoney(grandTotal, currency)}\n` +
      `Booking Deposit (${economics.depositPct}%): ${formatMoney(depositAmt, currency)} via M-Pesa/Bank to lock dates.\n\n` +
      `Reply with your preferred travel dates to confirm vehicle availability.`
    );
  }, [cfg, economics, client, currency]);

  const handleCopy = () => {
    navigator.clipboard?.writeText(quoteText);
    setCopied(true);
    showToast('WhatsApp quote copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px]">
      <div className="bg-white border border-[#E5E7EB] rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A]">Instant WhatsApp Quote Builder</h3>
            <p className="text-xs text-[#64748B]">Reply within the 5-minute Speed-to-Lead SLA</p>
          </div>
          <button onClick={onClose} className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer">
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-[#475569] mb-1">Trip Days</label>
            <input
              type="number"
              min="1"
              value={cfg.tripDays}
              onChange={(e) => setCfg({ ...cfg, tripDays: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 font-mono tabular-nums text-[#0F172A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#475569] mb-1">Group Size</label>
            <input
              type="number"
              min="1"
              value={cfg.groupSize}
              onChange={(e) => setCfg({ ...cfg, groupSize: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 font-mono tabular-nums text-[#0F172A]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-[#475569] mb-1">Add-on ({currency})</label>
            <input
              type="number"
              min="0"
              value={cfg.addonPrice}
              onChange={(e) => setCfg({ ...cfg, addonPrice: e.target.value })}
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 font-mono tabular-nums text-[#0F172A]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <input
            type="text"
            value={cfg.destination}
            onChange={(e) => setCfg({ ...cfg, destination: e.target.value })}
            className="flex-1 bg-white border border-[#E5E7EB] rounded-lg px-3 py-1.5 text-[#0F172A]"
            placeholder="Route / Destination"
          />
          <label className="inline-flex items-center gap-1.5 text-[#475569] cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={cfg.includeAddon}
              onChange={(e) => setCfg({ ...cfg, includeAddon: e.target.checked })}
              className="accent-[#0F172A]"
            />
            Include Transfer
          </label>
        </div>

        <pre className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-3.5 text-xs text-[#334155] whitespace-pre-wrap font-sans leading-relaxed max-h-56 overflow-y-auto">
          {quoteText}
        </pre>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-xs font-medium text-[#475569] hover:text-[#0F172A] cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-medium cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" strokeWidth={2} /> : <Copy className="w-3.5 h-3.5" strokeWidth={1.75} />}
            {copied ? 'Copied Quote' : 'Copy to Clipboard'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 6: TAXONOMY, POSTHOG UTM BUILDER & OFFER QA
// ============================================================================

function TaxonomyAndQaView({ client, onToggleQa, showToast }) {
  const [tax, setTax] = useState({
    objective: 'LEADS',
    budgetModel: 'ABO',
    funnel: 'TOF',
    market: 'KE-NBO',
    audience: 'BROAD',
    ageRange: '26-58',
    placement: 'ALL',
    optEvent: 'WA-CONV',
    format: 'VID',
    angle: 'GROUP-MARKUP',
    version: 'V1',
    assetId: client.creatives[0]?.assetId || 'A001'
  });

  const campaignName = `${tax.objective}_${tax.budgetModel}_${tax.funnel}_${tax.market}`.toUpperCase();
  const adSetName = `${tax.audience}_${tax.ageRange}_${tax.placement}_${tax.optEvent}`.toUpperCase();
  const adName = `${tax.format}_${tax.angle}_${tax.version}_${tax.assetId}`.toUpperCase();

  const utmUrl = useMemo(() => {
    try {
      const base = client.website?.startsWith('http')
        ? client.website
        : `https://${client.website || 'krescentadventures.com'}`;
      const u = new URL(base);
      u.searchParams.set('utm_source', 'meta');
      u.searchParams.set('utm_medium', 'paid');
      u.searchParams.set('utm_campaign', campaignName.toLowerCase());
      u.searchParams.set('utm_content', tax.assetId.toUpperCase());
      return u.toString();
    } catch {
      return `${client.website}/?utm_source=meta&utm_medium=paid&utm_campaign=${campaignName.toLowerCase()}&utm_content=${tax.assetId}`;
    }
  }, [client.website, campaignName, tax.assetId]);

  const copyStr = (val, label) => {
    navigator.clipboard?.writeText(val);
    showToast(`Copied ${label} to clipboard.`);
  };

  const qaDone = OFFER_QA_ITEMS.filter((q) => client.qaChecklist?.[q.id]).length;
  const qaPct = Math.round((qaDone / OFFER_QA_ITEMS.length) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Naming Taxonomy & UTM Builder */}
      <div className="lg:col-span-7 space-y-6">
        <div className="card-surface rounded-xl p-5 space-y-4">
          <div className="border-b border-[#F1F5F9] pb-3">
            <h3 className="text-sm font-semibold text-[#0F172A]">Immutable Agency Naming Generator</h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Enforce clean taxonomy across Meta Ads Manager and PostHog attribution.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { key: 'objective', label: 'Objective', opts: ['LEADS', 'ENG', 'SALES'] },
              { key: 'budgetModel', label: 'Budget Model', opts: ['ABO', 'CBO'] },
              { key: 'funnel', label: 'Funnel Stage', opts: ['TOF', 'MOF', 'BOF'] },
              { key: 'market', label: 'Market', opts: ['KE-NBO', 'KE-ALL', 'KE-MSA'] },
              { key: 'audience', label: 'Audience', opts: ['BROAD', 'RETARG', 'LAL'] },
              { key: 'ageRange', label: 'Age Bracket', opts: ['26-58', '25-60', '22-55'] },
              { key: 'placement', label: 'Placement', opts: ['ALL', 'REELS', 'FEEDS'] },
              { key: 'optEvent', label: 'Opt Event', opts: ['WA-CONV', 'LEAD', 'PURCH'] }
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-[11px] font-medium text-[#475569] mb-1">{f.label}</label>
                <select
                  value={tax[f.key]}
                  onChange={(e) => setTax({ ...tax, [f.key]: e.target.value })}
                  className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2 py-1.5 font-mono text-xs text-[#0F172A]"
                >
                  {f.opts.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1">Format</label>
              <select
                value={tax.format}
                onChange={(e) => setTax({ ...tax, format: e.target.value })}
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2 py-1.5 font-mono text-xs text-[#0F172A]"
              >
                <option value="VID">VID</option>
                <option value="IMG">IMG</option>
                <option value="CAR">CAR</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1">Hook Angle</label>
              <input
                type="text"
                value={tax.angle}
                onChange={(e) => setTax({ ...tax, angle: e.target.value.replace(/\s+/g, '-') })}
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 font-mono text-xs text-[#0F172A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1">Version</label>
              <input
                type="text"
                value={tax.version}
                onChange={(e) => setTax({ ...tax, version: e.target.value })}
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 font-mono text-xs text-[#0F172A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1">Asset ID</label>
              <input
                type="text"
                value={tax.assetId}
                onChange={(e) => setTax({ ...tax, assetId: e.target.value })}
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-1.5 font-mono text-xs text-[#0F172A]"
              />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {[
              { label: 'Campaign Name', value: campaignName },
              { label: 'Ad Set Name', value: adSetName },
              { label: 'Ad Name', value: adName }
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">{row.label}</div>
                  <div className="font-mono text-xs font-semibold text-[#0F172A] truncate">{row.value}</div>
                </div>
                <button
                  onClick={() => copyStr(row.value, row.label)}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#E5E7EB] hover:border-[#0F172A] text-xs font-medium text-[#0F172A] cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" strokeWidth={1.75} /> Copy
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* PostHog UTM Link Builder */}
        <div className="card-surface rounded-xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#475569]" strokeWidth={1.75} />
            PostHog & Meta Pixel UTM Link Builder
          </h3>
          <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-3.5 font-mono text-xs text-[#334155] break-all">
            {utmUrl}
          </div>
          <button
            onClick={() => copyStr(utmUrl, 'UTM Tracking URL')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-medium cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" strokeWidth={1.75} /> Copy Full UTM Link
          </button>
        </div>
      </div>

      {/* Right: Offer & Number-Plate-Blur Compliance QA */}
      <div className="lg:col-span-5 card-surface rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#475569]" strokeWidth={1.75} />
              Mobile Offer & Compliance QA
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">Pre-flight verification for {client.name}</p>
          </div>
          <span className="font-mono font-semibold text-sm text-[#0F172A] tabular-nums">{qaPct}%</span>
        </div>

        <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
          <div className="h-full bg-[#0F172A] transition-all" style={{ width: `${qaPct}%` }} />
        </div>

        <div className="space-y-2">
          {OFFER_QA_ITEMS.map((item) => {
            const checked = !!client.qaChecklist?.[item.id];
            return (
              <label
                key={item.id}
                onClick={() => onToggleQa(item.id)}
                className={`flex items-start gap-3 p-3 rounded-lg border transition cursor-pointer ${
                  checked
                    ? 'bg-[#F7F8FA] border-[#E5E7EB] text-[#64748B]'
                    : 'bg-white border-[#E5E7EB] hover:border-slate-300 text-[#0F172A]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {}}
                  className="mt-0.5 w-4 h-4 accent-[#0F172A] cursor-pointer"
                />
                <span className={`text-xs leading-relaxed ${checked ? 'line-through' : ''}`}>
                  {item.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 7: 10-DAY SPRINT & RULE OF 100 ROUTINE
// ============================================================================

const SPRINT_BLOCKS = {
  speed: { label: 'Speed-to-Lead & Quotes', mins: 40 },
  creative: { label: 'Creative & B-Roll Hooks', mins: 30 },
  data: { label: 'Data & Ad Hygiene', mins: 30 }
};

function SprintAndRoutineView({ client, onToggleTask, onAddRuleLog, onUpdateStreak, showToast }) {
  const { sprintChecklist, ruleOf100Logs, streakDays = 0 } = client;

  const blocks = SPRINT_BLOCKS;

  const [activeBlock, setActiveBlock] = useState('speed');
  const [secondsLeft, setSecondsLeft] = useState(40 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [logNotes, setLogNotes] = useState('');

  // Latest values for the interval callback, so the timer isn't reset on every tick.
  const latestRef = useRef({ secondsLeft, activeBlock, showToast });
  useEffect(() => {
    latestRef.current = { secondsLeft, activeBlock, showToast };
  });

  useEffect(() => {
    if (!isRunning) return;
    const t = setInterval(() => {
      const { secondsLeft: s, activeBlock: block, showToast: toast } = latestRef.current;
      if (s <= 1) {
        setSecondsLeft(0);
        setIsRunning(false);
        toast(`Completed ${SPRINT_BLOCKS[block].label} session.`);
      } else {
        setSecondsLeft(s - 1);
      }
    }, 1000);
    return () => clearInterval(t);
  }, [isRunning]);

  const selectBlock = (k) => {
    setIsRunning(false);
    setActiveBlock(k);
    setSecondsLeft(blocks[k].mins * 60);
  };

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  const allTasks = SPRINT_PHASES.flatMap((p) => p.tasks);
  const doneCount = allTasks.filter((t) => sprintChecklist?.[t.id]).length;
  const sprintPct = Math.round((doneCount / allTasks.length) * 100);

  const handleLogToday = (e) => {
    e.preventDefault();
    onAddRuleLog({
      id: `r-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      speedMins: 40,
      creativeMins: 30,
      dataMins: 30,
      notes: logNotes.trim() || 'Completed full 100-minute daily operating routine.'
    });
    setLogNotes('');
    showToast(`Logged Day ${Math.min(100, streakDays + 1)} of 100.`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: 10-Day Sprint */}
      <div className="lg:col-span-7 space-y-4">
        <div className="card-surface rounded-xl p-5">
          <div className="flex items-center justify-between mb-2.5">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">10-Day Senior Media Buyer Sprint</h3>
              <p className="text-xs text-[#64748B]">Implementation SOP for {client.name}</p>
            </div>
            <div className="text-right">
              <span className="text-base font-semibold font-mono text-[#0F172A] tabular-nums">{sprintPct}%</span>
              <div className="text-[11px] text-[#64748B] tabular-nums">{doneCount}/{allTasks.length} completed</div>
            </div>
          </div>
          <div className="w-full h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div className="h-full bg-[#0F172A] transition-all" style={{ width: `${sprintPct}%` }} />
          </div>
        </div>

        {SPRINT_PHASES.map((group) => (
          <div key={group.phase} className="card-surface rounded-xl p-4 space-y-2.5">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#0F172A]">{group.phase}</h4>
              <p className="text-[11px] text-[#64748B]">{group.subtitle}</p>
            </div>
            {group.tasks.map((task) => {
              const checked = !!sprintChecklist?.[task.id];
              return (
                <label
                  key={task.id}
                  onClick={() => onToggleTask(task.id)}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition cursor-pointer ${
                    checked
                      ? 'bg-[#F7F8FA] border-[#E5E7EB] text-[#64748B]'
                      : 'bg-white border-[#E5E7EB] hover:border-slate-300 text-[#0F172A]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}}
                    className="mt-0.5 w-4 h-4 accent-[#0F172A] cursor-pointer"
                  />
                  <span className={`text-xs leading-relaxed ${checked ? 'line-through' : ''}`}>
                    {task.label}
                  </span>
                </label>
              );
            })}
          </div>
        ))}
      </div>

      {/* Right: Rule of 100 Countdown Timer & 100-Day Streak */}
      <div className="lg:col-span-5 space-y-5">
        <div className="card-surface rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#0F172A]">100-Day Execution Streak</h3>
              <p className="text-xs text-[#64748B]">100 minutes/day x 100 consecutive days</p>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                max="100"
                value={streakDays}
                onChange={(e) => onUpdateStreak(e.target.value)}
                className="w-14 text-center bg-[#F7F8FA] border border-[#E5E7EB] rounded-md py-1 font-mono font-semibold text-[#0F172A] text-sm tabular-nums"
              />
              <span className="text-xs font-mono text-[#64748B]">/ 100</span>
            </div>
          </div>
          <div className="w-full h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#0F172A] transition-all"
              style={{ width: `${Math.min(100, streakDays)}%` }}
            />
          </div>
        </div>

        <div className="card-surface rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#475569]" strokeWidth={1.75} />
            Rule of 100 Focus Timer
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {[
              { k: 'speed', t: '40m Leads', s: 'WhatsApp' },
              { k: 'creative', t: '30m Hooks', s: 'Creative' },
              { k: 'data', t: '30m Data', s: 'Hygiene' }
            ].map((b) => (
              <button
                key={b.k}
                onClick={() => selectBlock(b.k)}
                className={`p-2.5 rounded-lg border text-left transition cursor-pointer ${
                  activeBlock === b.k
                    ? 'bg-[#0F172A] border-[#0F172A] text-white'
                    : 'bg-[#F7F8FA] border-[#E5E7EB] text-[#475569] hover:text-[#0F172A]'
                }`}
              >
                <div className="text-xs font-semibold">{b.t}</div>
                <div className="text-[10px] opacity-80">{b.s}</div>
              </button>
            ))}
          </div>

          <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-xl p-5 text-center">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              {blocks[activeBlock].label}
            </div>
            <div className="text-4xl font-semibold font-mono tabular-nums text-[#0F172A] my-2">
              {fmtTime(secondsLeft)}
            </div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-medium cursor-pointer"
              >
                {isRunning ? <Pause className="w-3.5 h-3.5" strokeWidth={1.75} /> : <Play className="w-3.5 h-3.5" strokeWidth={1.75} />}
                {isRunning ? 'Pause' : 'Start Session'}
              </button>
              <button
                onClick={() => {
                  setIsRunning(false);
                  setSecondsLeft(blocks[activeBlock].mins * 60);
                }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-[#E5E7EB] hover:border-slate-300 text-[#475569] text-xs font-medium cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} /> Reset
              </button>
            </div>
          </div>

          <form onSubmit={handleLogToday} className="flex gap-2">
            <input
              type="text"
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              placeholder="Summary of today's execution..."
              className="flex-1 bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs text-[#0F172A] focus:outline-none focus:border-[#0F172A]"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-medium cursor-pointer"
            >
              Log Day
            </button>
          </form>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {(ruleOf100Logs || []).map((log) => (
              <div key={log.id} className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-3 text-xs">
                <div className="flex justify-between font-mono text-[11px] text-[#64748B] tabular-nums">
                  <span>{log.date}</span>
                  <span className="font-semibold text-[#065F46]">100 mins logged</span>
                </div>
                <p className="text-[#334155] mt-1 leading-relaxed">{log.notes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VIEW 8: INSTITUTIONAL CASE STUDY REPORT (PII-REDACTED TEAR-SHEET)
// ============================================================================

function CaseStudyReportView({ client, analytics, showToast }) {
  const { currency, creatives } = client;
  const [copied, setCopied] = useState(false);
  const [reportDate] = useState(() => new Date().toISOString().slice(0, 10));

  const winningCreative = useMemo(() => {
    const sorted = [...creatives].sort((a, b) => (Number(b.leads) || 0) - (Number(a.leads) || 0));
    return sorted[0] || null;
  }, [creatives]);

  const pitchSummaryText = `PAID ACQUISITION PERFORMANCE REPORT — ${client.name.toUpperCase()}
Core Offer: ${client.coreOffer}
Stage: ${client.currentPhase}

VERIFIED FINANCIAL SUMMARY (CUSTOMER PII REDACTED):
- Total Ad Outlay (incl. ${client.economics.vatRate}% VAT): ${formatMoney(analytics.actualOutlayInclVat, currency)}
- Qualified WhatsApp Inquiries: ${analytics.totalActualLeads}
- Confirmed Paid Bookings: ${analytics.closedBookings}
- Verified Gross Revenue: ${formatMoney(analytics.actualGrossRevenue, currency)}
- Verified Gross Profit (${client.economics.grossMarginPct}% margin): ${formatMoney(analytics.actualGrossProfit, currency)}
- Verified Cash ROAS: ${formatDec(analytics.verifiedRoas, 1)}x
- Verified LTGP:CAC Ratio: ${formatDec(analytics.verifiedLtgpCac, 1)} : 1
- Top Performing Creative Asset: ${winningCreative ? `${winningCreative.assetId} (${winningCreative.adName})` : 'In Testing'}

Attribution Stack: Meta Pixel + PostHog UTMs + SHA-256 Offline CAPI Dataset.`;

  const handleCopyPitch = () => {
    navigator.clipboard?.writeText(pitchSummaryText);
    setCopied(true);
    showToast('Copied PII-redacted Case Study summary to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card-surface rounded-xl p-6 sm:p-8 space-y-6">
        {/* Tear-Sheet Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge tone="healthy" icon={FileCheck2}>
                Verified Proof-of-Work • PII Redacted
              </StatusBadge>
              <span className="font-mono text-xs text-[#64748B]">{reportDate}</span>
            </div>
            <h2 className="text-xl font-bold text-[#0F172A] tracking-tight mt-3">{client.name}</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {client.coreOffer} • {client.website.replace(/^https?:\/\//, '')}
            </p>
          </div>

          <button
            onClick={handleCopyPitch}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-medium transition cursor-pointer shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5" strokeWidth={2} /> : <Share2 className="w-3.5 h-3.5" strokeWidth={1.75} />}
            {copied ? 'Copied Summary' : 'Copy Pitch Summary'}
          </button>
        </div>

        {/* Institutional Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Total Outlay (Incl. VAT)
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[#0F172A] mt-1.5">
              {formatMoney(analytics.actualOutlayInclVat, currency)}
            </div>
          </div>

          <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Verified Gross Revenue
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[#0F172A] mt-1.5">
              {formatMoney(analytics.actualGrossRevenue, currency)}
            </div>
          </div>

          <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#065F46]">
              Verified LTGP : CAC
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[#065F46] mt-1.5">
              {formatDec(analytics.verifiedLtgpCac, 1)} : 1
            </div>
          </div>

          <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Cash ROAS (Revenue / Outlay)
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[#0F172A] mt-1.5">
              {formatDec(analytics.verifiedRoas, 1)}x
            </div>
          </div>

          <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Inquiries to Paid Bookings
            </div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[#0F172A] mt-1.5">
              {analytics.totalActualLeads} -&gt; {analytics.closedBookings}
            </div>
          </div>

          <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-4">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#64748B]">
              Top Winning Asset
            </div>
            <div className="text-xs font-semibold font-mono text-[#0F172A] mt-2 truncate">
              {winningCreative ? winningCreative.adName : 'N/A'}
            </div>
            <div className="text-[11px] text-[#64748B] mt-0.5 tabular-nums">
              {winningCreative ? `${winningCreative.leads} verified leads` : ''}
            </div>
          </div>
        </div>

        {/* Compliance Footer */}
        <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-4 flex items-center gap-3 text-xs text-[#475569]">
          <ShieldCheck className="w-4 h-4 text-[#065F46] shrink-0" strokeWidth={1.75} />
          <span>
            Customer names, phone numbers, and email addresses are automatically excluded from this report for safe external sharing and agency proposals.
          </span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: NEW CLIENT WORKSPACE
// ============================================================================

function AddClientModal({ onClose, onCreate }) {
  const [form, setForm] = useState({
    name: '',
    metaAccountId: '',
    website: 'https://',
    coreOffer: '',
    currency: 'KES',
    currentPhase: 'Phase 1: Track Money',
    dailyBudget: 300,
    vatRate: 16,
    avgOrderValue: 45000,
    grossMarginPct: 50,
    targetCpl: 350,
    closeRatePct: 12,
    depositPct: 30,
    fleetUnits: 1,
    fleetMaxMonthlyBookings: 12
  });

  const gp = (Number(form.avgOrderValue) || 0) * ((Number(form.grossMarginPct) || 0) / 100);
  const maxCac = gp / 3;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onCreate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px]">
      <div className="bg-white border border-[#E5E7EB] rounded-xl max-w-xl w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#F1F5F9]">
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">Onboard New Client Workspace</h2>
            <p className="text-xs text-[#64748B]">Isolated financial ledger, VAT runway, and attribution profile</p>
          </div>
          <button onClick={onClose} className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer">
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1">Client Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Mara Ridge Eco Safaris"
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#0F172A] focus:outline-none focus:border-[#0F172A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1">Meta Ad Account ID</label>
              <input
                type="text"
                value={form.metaAccountId}
                onChange={(e) => setForm({ ...form, metaAccountId: e.target.value })}
                placeholder="e.g., 384434063915420"
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono text-[#0F172A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1">Website Domain</label>
              <input
                type="text"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#0F172A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1">Core Offer</label>
              <input
                type="text"
                value={form.coreOffer}
                onChange={(e) => setForm({ ...form, coreOffer: e.target.value })}
                placeholder="e.g., 4x4 Cruiser Hire + Guide"
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#0F172A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value, vatRate: e.target.value === 'KES' ? 16 : 0 })}
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-2 text-[#0F172A]"
              >
                <option value="KES">KES</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1">VAT %</label>
              <input
                type="number"
                value={form.vatRate}
                onChange={(e) => setForm({ ...form, vatRate: e.target.value })}
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono tabular-nums text-[#0F172A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1">Daily Budget</label>
              <input
                type="number"
                value={form.dailyBudget}
                onChange={(e) => setForm({ ...form, dailyBudget: e.target.value })}
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono tabular-nums text-[#0F172A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1">Avg Order Value</label>
              <input
                type="number"
                value={form.avgOrderValue}
                onChange={(e) => setForm({ ...form, avgOrderValue: e.target.value })}
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono tabular-nums text-[#0F172A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1">Gross Margin %</label>
              <input
                type="number"
                value={form.grossMarginPct}
                onChange={(e) => setForm({ ...form, grossMarginPct: e.target.value })}
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono tabular-nums text-[#0F172A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1">Fleet Cap / Mo</label>
              <input
                type="number"
                value={form.fleetMaxMonthlyBookings}
                onChange={(e) => setForm({ ...form, fleetMaxMonthlyBookings: e.target.value })}
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono tabular-nums text-[#0F172A]"
              />
            </div>
          </div>

          <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-lg p-3 flex items-center justify-around text-center">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">GP / Booking</div>
              <div className="font-mono font-semibold text-[#0F172A] tabular-nums">{formatMoney(gp, form.currency)}</div>
            </div>
            <div className="h-6 w-px bg-[#E5E7EB]" />
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">Max CAC (3:1)</div>
              <div className="font-mono font-semibold text-[#065F46] tabular-nums">{formatMoney(maxCac, form.currency)}</div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-[#475569] font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white font-medium cursor-pointer"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: QUICK LOG LEAD (FROM TOP UTILITY BAR)
// ============================================================================

function QuickLogLeadModal({ client, onClose, onSave }) {
  const { creatives, economics, currency } = client;
  const [form, setForm] = useState({
    name: '',
    phone: '07',
    assetId: creatives[0]?.assetId || 'A001',
    icebreaker: ICEBREAKER_OPTIONS[0],
    responseMins: 3,
    quoteValue: economics.avgOrderValue,
    stage: 'New Inquiry'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;
    const qv = Number(form.quoteValue) || 0;
    const dep =
      form.stage === 'Deposit Paid'
        ? Math.round(qv * (economics.depositPct / 100))
        : form.stage === 'Completed'
        ? qv
        : 0;

    onSave({
      id: `LD-${String(Date.now()).slice(-5)}`,
      createdAt: new Date().toISOString(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: '',
      fbclid: '',
      assetId: form.assetId,
      icebreaker: form.icebreaker,
      responseMins: Math.max(0, Number(form.responseMins) || 0),
      quoteValue: qv,
      addonsValue: 0,
      stage: form.stage,
      depositPaid: dep,
      capiExported: false
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-[1px]">
      <div className="bg-white border border-[#E5E7EB] rounded-xl max-w-md w-full p-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
          <div>
            <h3 className="text-sm font-semibold text-[#0F172A]">Quick Log WhatsApp Lead</h3>
            <p className="text-xs text-[#64748B]">{client.name}</p>
          </div>
          <button onClick={onClose} className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer">
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-4 text-xs">
          <div>
            <label className="block text-[11px] font-medium text-[#475569] mb-1">Lead Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Client name"
              className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 text-[#0F172A] focus:outline-none focus:border-[#0F172A]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1">Phone (E.164) *</label>
              <input
                type="text"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-3 py-2 font-mono text-[#0F172A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1">Source Asset</label>
              <select
                value={form.assetId}
                onChange={(e) => setForm({ ...form, assetId: e.target.value })}
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-2 font-mono text-[#0F172A]"
              >
                {creatives.map((c) => (
                  <option key={c.id} value={c.assetId}>{c.assetId}</option>
                ))}
                <option value="ORGANIC">ORGANIC</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1">SLA (mins)</label>
              <input
                type="number"
                min="0"
                value={form.responseMins}
                onChange={(e) => setForm({ ...form, responseMins: e.target.value })}
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-2 font-mono tabular-nums text-[#0F172A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1">Quote ({currency})</label>
              <input
                type="number"
                min="0"
                value={form.quoteValue}
                onChange={(e) => setForm({ ...form, quoteValue: e.target.value })}
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2.5 py-2 font-mono tabular-nums text-[#0F172A]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#475569] mb-1">Stage</label>
              <select
                value={form.stage}
                onChange={(e) => setForm({ ...form, stage: e.target.value })}
                className="w-full bg-white border border-[#E5E7EB] rounded-lg px-2 py-2 text-[#0F172A]"
              >
                {LEAD_STAGES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-[#475569] font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-[#0F172A] hover:bg-slate-800 text-white font-medium cursor-pointer"
            >
              Save Lead
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}