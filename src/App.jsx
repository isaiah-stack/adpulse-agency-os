import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Building2,
  Plus,
  Download,
  Upload,
  Calculator,
  Sparkles,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  Play,
  Pause,
  RotateCcw,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Sliders,
  Layers,
  Award,
  Clock,
  ShieldAlert,
  FileSpreadsheet,
  RefreshCw,
  X,
  LayoutGrid,
  Lock,
  Flame,
  FileCheck2,
  Share2,
  Wallet,
  Car,
  Zap,
  Tag,
  ShieldCheck
} from 'lucide-react';

// ============================================================================
// SCHEMA VERSION & CONSTANTS
// ============================================================================

const SCHEMA_VERSION = 2;
const STORAGE_KEY = 'adpulse_agency_os_v2';

const PHASES = [
  {
    id: 'Phase 1: Track Money',
    short: 'Phase 1: Track Money',
    desc: 'Zero blind spots: Pixel, PostHog, UTMs & WhatsApp logging live before scaling.'
  },
  {
    id: 'Phase 2: Buy Data',
    short: 'Phase 2: Buy Data',
    desc: 'Learning budget: Test modular hooks sequentially & kill losers at 4× daily budget.'
  },
  {
    id: 'Phase 3: Print Money',
    short: 'Phase 3: Print Money',
    desc: 'Scale winners 70/20/10 using client deposits while holding LTGP:CAC ≥ 3:1.'
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
    phase: 'Days 1–2: Tracking & Signal Loop',
    subtitle: 'Verify PostHog + Meta Pixel hygiene and configure Offline CAPI feedback loop',
    tasks: [
      { id: 'd1-1', label: 'Verify Meta Pixel + PostHog integration fires Lead & Contact events with zero duplicates' },
      { id: 'd1-2', label: 'Configure Meta Events Manager Offline Dataset for SHA-256 Purchase uploads' },
      { id: 'd1-3', label: 'Top up M-Pesa prepaid balance accounting for 16% Kenya VAT deduction' }
    ]
  },
  {
    phase: 'Days 3–4: Standardized Naming Taxonomy',
    subtitle: 'Adopt immutable agency naming conventions across Campaign, Ad Set, and Ad',
    tasks: [
      { id: 'd3-1', label: 'Lock Campaign/Ad Set/Ad taxonomy: LEADS_ABO_TOF_KE-NBO → VID_GROUP-MARKUP_V1_A001' },
      { id: 'd3-2', label: 'Match utm_content=A001 to creative Asset IDs & set 3 WhatsApp icebreaker buttons' }
    ]
  },
  {
    phase: 'Days 5–6: Creative Batching & Offer Page QA',
    subtitle: 'Batch modular 5-second hooks & audit mobile landing page above-the-fold clarity',
    tasks: [
      { id: 'd5-1', label: 'Film 3–5 modular 5-sec vertical hooks around vehicle (number plates blurred/hidden)' },
      { id: 'd5-2', label: 'Verify flat daily rate, 7-seater specs & WhatsApp CTA appear above fold on mobile' }
    ]
  },
  {
    phase: 'Days 7–10: Live Launch & Diagnostic Cadence',
    subtitle: 'Protect the 72-hour learning lock, enforce kill rules, and log first optimization',
    tasks: [
      { id: 'd7-1', label: 'Launch Hook A001 at lean daily budget; do NOT edit targeting/budget for 72 hours' },
      { id: 'd7-2', label: 'At Day 10 (4× daily budget spent), diagnose Hook %, CTR %, & Close Rate to Kill or Scale' }
    ]
  }
];

const OFFER_QA_ITEMS = [
  { id: 'qa-1', label: 'Flat daily rate (e.g., KES 30,000/day) & inclusions visible above the fold on mobile' },
  { id: 'qa-2', label: 'Vehicle capacity (7-seater 4x4 + guide) & specs match exact ad promise' },
  { id: 'qa-3', label: 'All vehicle registration number plates hidden or blurred in every video/image creative' },
  { id: 'qa-4', label: '3 Click-to-WhatsApp pre-qualifying icebreaker buttons active in Meta Ads Manager' },
  { id: 'qa-5', label: 'PostHog + Meta Pixel verified for clean non-duplicate firing on WhatsApp/Quote taps' },
  { id: 'qa-6', label: 'WhatsApp Business instant greeting + 5-min Speed-to-Lead quote template saved' }
];

// Helper to create relative ISO dates for realistic seed demos (72h lock & 7-day CAPI alert)
const hoursAgoISO = (hours) => new Date(Date.now() - hours * 3600 * 1000).toISOString();
const daysAgoDate = (days) => new Date(Date.now() - days * 86400 * 1000).toISOString().slice(0, 10);

const DEFAULT_CLIENTS = [
  {
    id: 'client-krescent-001',
    name: 'Krescent Adventures',
    metaAccountId: '384434063915420',
    website: 'https://krescentadventures.com',
    coreOffer: '4x4 Nissan Safari Van + Guide',
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
        id: 'tu-1',
        date: daysAgoDate(10),
        method: 'M-Pesa Prepaid',
        grossAmount: 3500,
        note: 'Initial 15-day Phase 2 learning sprint top-up'
      }
    ],
    creatives: [
      {
        id: 'cr-k1',
        assetId: 'A001',
        adName: 'VID_GROUP-MARKUP_V1_A001',
        bucket: '70% Winner',
        status: 'Active',
        launchDate: hoursAgoISO(120), // 5 days ago
        spend: 1000,
        impressions: 16400,
        threeSecPlays: 5412, // 33.0% Hook
        outboundClicks: 262, // 1.60% CTR
        leads: 4
      },
      {
        id: 'cr-k2',
        assetId: 'A002',
        adName: 'VID_POPUP-ROOF-MARA_V1_A002',
        bucket: '20% Variation',
        status: 'Active',
        launchDate: hoursAgoISO(28), // < 72h -> LOCKED (<72h)
        spend: 260,
        impressions: 4100,
        threeSecPlays: 1271, // 31.0% Hook
        outboundClicks: 57, // 1.39% CTR
        leads: 1
      },
      {
        id: 'cr-k3',
        assetId: 'A003',
        adName: 'VID_STATIC-RATES_V1_A003',
        bucket: '10% Wildcard',
        status: 'Killed',
        launchDate: hoursAgoISO(168),
        spend: 840, // >= 4 * 200 (800) & 0 leads -> KILL
        impressions: 11200,
        threeSecPlays: 2240, // 20.0% Hook
        outboundClicks: 90, // 0.80% CTR
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
        threeSecPlays: 1496, // 22.0% Hook (<25% FIX HOOK)
        outboundClicks: 88, // 1.29% CTR
        leads: 1
      }
    ],
    leads: [
      {
        id: 'KA-1001',
        createdAt: hoursAgoISO(144), // 6 days ago -> Triggers 7-Day CAPI Freshness Alert!
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
        responseMins: 8, // >5 mins SLA breach
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
        notes: 'Closed Brian Kamau 30% deposit (KES 27k); killed A003 after KES 840 / 0 leads.'
      },
      {
        id: 'r-2',
        date: daysAgoDate(0),
        speedMins: 40,
        creativeMins: 30,
        dataMins: 30,
        notes: 'Launched A002 pop-up roof hook under 72h learning lock; audited PostHog events.'
      }
    ]
  },
  {
    id: 'client-nairobi-exec-002',
    name: 'Nairobi Executive Transfers',
    metaAccountId: '912045882104311',
    website: 'https://nairobiexec.co.ke',
    coreOffer: 'Executive Airport & Corporate Chauffeur',
    currency: 'KES',
    currentPhase: 'Phase 3: Print Money',
    economics: {
      dailyRate: 25000,
      avgTripDays: 1,
      avgOrderValue: 25000,
      grossMarginPct: 60,
      dailyBudget: 500,
      vatRate: 16,
      targetCpl: 250,
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
        grossAmount: 10000,
        note: 'Phase 3 scaling top-up'
      }
    ],
    creatives: [
      {
        id: 'cr-ne-1',
        assetId: 'A001',
        adName: 'VID_JKIA-FASTTRACK_V1_A001',
        bucket: '70% Winner',
        status: 'Active',
        launchDate: hoursAgoISO(240),
        spend: 4200,
        impressions: 58000,
        threeSecPlays: 18560, // 32.0%
        outboundClicks: 928, // 1.60%
        leads: 21
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
        threeSecPlays: 5460, // 28.0%
        outboundClicks: 254, // 1.30%
        leads: 6
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
        quoteValue: 25000,
        addonsValue: 10000,
        stage: 'Deposit Paid',
        depositPaid: 17500,
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
        quoteValue: 50000,
        addonsValue: 0,
        stage: 'Completed',
        depositPaid: 50000,
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
        notes: 'Scaled daily budget to KES 500/day after holding 9:1 LTGP:CAC.'
      }
    ]
  }
];

// ============================================================================
// UTILITY FUNCTIONS & PURE CALCULATORS
// ============================================================================

const formatMoney = (amount, currency = 'KES', decimals = 0) => {
  const num = Number(amount);
  const safe = isFinite(num) && !isNaN(num) ? num : 0;
  return `${currency} ${safe.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

const formatDec = (num, digits = 2) => {
  const n = Number(num);
  if (!isFinite(n) || isNaN(n)) return '0.00';
  return n.toFixed(digits);
};

// Kenya E.164 normalization: converts 07xx / 01xx / +2547xx / 2547xx -> digits-only 2547xx
function normalizeKenyaPhoneE164(rawPhone) {
  if (!rawPhone) return '';
  let digits = String(rawPhone).replace(/[^\d]/g, '');
  if (digits.startsWith('0') && digits.length === 10) {
    digits = '254' + digits.slice(1);
  } else if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
    digits = '254' + digits;
  }
  return digits;
}

// Real SHA-256 hashing via Web Crypto API for 2026 Meta CAPI Dataset compliance
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
    console.warn('Web Crypto subtle unavailable, returning normalized fallback:', err);
  }
  return clean;
}

function getHoursSince(isoDate) {
  if (!isoDate) return 999;
  const ts = new Date(isoDate).getTime();
  if (isNaN(ts)) return 999;
  return Math.max(0, (Date.now() - ts) / (1000 * 3600));
}

// Compute complete workspace analytics (used in Tab 1, Agency Overview, and Case Study)
function computeWorkspaceAnalytics(client) {
  const ec = client.economics;
  const dailyBudget = Number(ec.dailyBudget) || 0;
  const vatRate = Number(ec.vatRate) || 0;
  const aov = Number(ec.avgOrderValue) || 0;
  const gmPct = Number(ec.grossMarginPct) || 0;
  const targetCpl = Number(ec.targetCpl) || 1;
  const closeRatePct = Number(ec.closeRatePct) || 0;
  const depositPct = Number(ec.depositPct) || 0;
  const fleetCap = Number(ec.fleetMaxMonthlyBookings) || 1;

  // 30-day projections
  const thirtyDayPreTaxSpend = dailyBudget * 30;
  const vatAmount = thirtyDayPreTaxSpend * (vatRate / 100);
  const trueCashOutlay = thirtyDayPreTaxSpend + vatAmount;

  const gpPerBooking = aov * (gmPct / 100);
  const maxAllowableCac = gpPerBooking / 3;

  const projectedLeads = targetCpl > 0 ? thirtyDayPreTaxSpend / targetCpl : 0;
  const projectedBookings = projectedLeads * (closeRatePct / 100);
  const projectedRevenue = projectedBookings * aov;
  const projectedGrossProfit = projectedBookings * gpPerBooking;

  const projectedCac = projectedBookings > 0 ? trueCashOutlay / projectedBookings : Infinity;
  const projectedLtgpCac =
    projectedCac > 0 && isFinite(projectedCac) ? gpPerBooking / projectedCac : 0;

  const fleetExceeded = projectedBookings > fleetCap;

  // M-Pesa / Prepaid VAT Runway Ledger
  const totalGrossTopUps = (client.topUps || []).reduce((s, t) => s + (Number(t.grossAmount) || 0), 0);
  const netUsableFromTopUps = totalGrossTopUps / (1 + vatRate / 100);
  const totalVatDeducted = totalGrossTopUps - netUsableFromTopUps;

  const totalCreativeSpend = (client.creatives || []).reduce((s, c) => s + (Number(c.spend) || 0), 0);
  const remainingNetBalance = netUsableFromTopUps - totalCreativeSpend;
  const daysRunwayLeft = dailyBudget > 0 ? remainingNetBalance / dailyBudget : 0;

  // Actual CRM & Creative Performance
  const totalActualLeads = (client.leads || []).length;
  const paidLeads = (client.leads || []).filter(
    (l) => l.stage === 'Deposit Paid' || l.stage === 'Completed'
  );
  const closedBookings = paidLeads.length;
  const totalDepositsCollected = (client.leads || []).reduce(
    (s, l) => s + (Number(l.depositPaid) || 0),
    0
  );
  const actualGrossRevenue = paidLeads.reduce(
    (s, l) => s + (Number(l.quoteValue) || 0) + (Number(l.addonsValue) || 0),
    0
  );
  const actualGrossProfit = actualGrossRevenue * (gmPct / 100);
  const actualOutlayInclVat = totalCreativeSpend * (1 + vatRate / 100);
  const actualCac = closedBookings > 0 ? actualOutlayInclVat / closedBookings : Infinity;
  const verifiedLtgpCac =
    actualOutlayInclVat > 0 && actualGrossProfit > 0
      ? actualGrossProfit / actualOutlayInclVat
      : projectedLtgpCac;

  // Guardrail Checks
  const activeAdsCount = (client.creatives || []).filter((c) => c.status === 'Active').length;
  const fragmentationRisk = client.currency === 'KES' && dailyBudget <= 300 && activeAdsCount > 2;

  // 7-Day Meta CAPI Freshness Alerts (paid/completed leads > 5 days old and not exported)
  const staleCapiLeads = paidLeads.filter(
    (l) => !l.capiExported && getHoursSince(l.createdAt) >= 5 * 24
  );

  // Speed-to-lead SLA breaches (> 5 mins)
  const slaBreaches = (client.leads || []).filter((l) => (Number(l.responseMins) || 0) > 5);

  return {
    thirtyDayPreTaxSpend,
    vatAmount,
    trueCashOutlay,
    gpPerBooking,
    maxAllowableCac,
    projectedLeads,
    projectedBookings,
    projectedRevenue,
    projectedGrossProfit,
    projectedCac,
    projectedLtgpCac,
    fleetExceeded,
    totalGrossTopUps,
    netUsableFromTopUps,
    totalVatDeducted,
    totalCreativeSpend,
    remainingNetBalance,
    daysRunwayLeft,
    totalActualLeads,
    closedBookings,
    totalDepositsCollected,
    actualGrossRevenue,
    actualGrossProfit,
    actualOutlayInclVat,
    actualCac,
    verifiedLtgpCac,
    activeAdsCount,
    fragmentationRisk,
    staleCapiLeads,
    slaBreaches,
    depositPerBooking: aov * (depositPct / 100)
  };
}

// Evaluate individual creative diagnostics
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
    label: 'TESTING',
    tone: 'slate',
    detail: 'Gathering statistical signal.'
  };

  if (isLocked72h) {
    verdict = {
      code: 'LOCKED',
      label: `LOCKED (<72h • ${Math.round(72 - hoursActive)}h left)`,
      tone: 'sky',
      detail: 'Do not edit targeting or budget during Meta 72-hour learning window.'
    };
  } else if (spend >= killThreshold && leads === 0) {
    verdict = {
      code: 'KILL',
      label: `KILL: ${currency} ${killThreshold.toLocaleString()}+ / 0 LEADS`,
      tone: 'rose',
      detail: `Spent ≥ 4× daily budget (${currency} ${killThreshold.toLocaleString()}) with zero WhatsApp leads.`
    };
  } else if (impressions > 0 && hookRate < 25) {
    verdict = {
      code: 'FIX_HOOK',
      label: 'FIX HOOK (<25%)',
      tone: 'amber',
      detail: 'Opening 3 seconds fail to stop scroll. Replace hook; keep body.'
    };
  } else if (impressions > 0 && hookRate >= 25 && outboundCtr < 1.0) {
    verdict = {
      code: 'FIX_CTA',
      label: 'FIX OFFER/CTA (<1% CTR)',
      tone: 'orange',
      detail: 'People watch past 3s, but price anchor or WhatsApp CTA is weak.'
    };
  } else if (leads >= 2 && cpl !== null && cpl <= (Number(targetCpl) || 350)) {
    verdict = {
      code: 'WINNER',
      label: 'WINNER: SCALE',
      tone: 'emerald',
      detail: '2+ leads at or under Target CPL. Shift 70% budget here.'
    };
  }

  return {
    hookRate,
    outboundCtr,
    cpl,
    hoursActive,
    isLocked72h,
    verdict
  };
}

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================

export default function App() {
  const [clients, setClients] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.schemaVersion === SCHEMA_VERSION && Array.isArray(parsed.clients) && parsed.clients.length > 0) {
          return parsed.clients;
        }
      }
    } catch (err) {
      console.error('Failed to read schema-versioned localStorage:', err);
    }
    return DEFAULT_CLIENTS;
  });

  const [activeClientId, setActiveClientId] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.schemaVersion === SCHEMA_VERSION && parsed.activeClientId) {
          return parsed.activeClientId;
        }
      }
    } catch (err) {
      // ignore
    }
    return DEFAULT_CLIENTS[0].id;
  });

  const [activeTab, setActiveTab] = useState('economics');
  const [showAgencyOverview, setShowAgencyOverview] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);

  // Persist to schema-versioned localStorage
  useEffect(() => {
    try {
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
  }, [clients, activeClientId]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => {
      setToast((prev) => (prev?.msg === msg ? null : prev));
    }, 3500);
  };

  const activeClient = useMemo(
    () => clients.find((c) => c.id === activeClientId) || clients[0],
    [clients, activeClientId]
  );

  const activeAnalytics = useMemo(
    () => computeWorkspaceAnalytics(activeClient),
    [activeClient]
  );

  const updateActiveClient = (updater) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id !== activeClient.id) return c;
        return typeof updater === 'function' ? updater(c) : { ...c, ...updater };
      })
    );
  };

  // JSON Export
  const handleExportJSON = () => {
    const payload = {
      schemaVersion: SCHEMA_VERSION,
      platform: 'AdPulse Agency OS v2',
      exportedAt: new Date().toISOString(),
      clients
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adpulse-agency-os-v2-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported all client workspaces to JSON backup.');
  };

  // JSON Import
  const handleImportJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const list = Array.isArray(parsed) ? parsed : parsed.clients;
        if (!Array.isArray(list) || list.length === 0) {
          throw new Error('Invalid backup format');
        }
        setClients(list);
        setActiveClientId(list[0].id);
        showToast(`Restored ${list.length} client workspace(s) from backup.`);
      } catch (err) {
        showToast('Invalid JSON backup file. Please verify file format.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetDemo = () => {
    setClients(DEFAULT_CLIENTS);
    setActiveClientId(DEFAULT_CLIENTS[0].id);
    setShowAgencyOverview(false);
    localStorage.removeItem(STORAGE_KEY);
    showToast('Reset to default Krescent Adventures & Nairobi Executive Transfers presets.');
  };

  const handleCreateClient = (data) => {
    const id = `client-${Date.now()}`;
    const dailyRate = Number(data.dailyRate) || Number(data.avgOrderValue) || 25000;
    const avgTripDays = Number(data.avgTripDays) || 1;
    const aov = Number(data.avgOrderValue) || dailyRate * avgTripDays;

    const created = {
      id,
      name: data.name.trim(),
      metaAccountId: data.metaAccountId.trim() || '000000000000000',
      website: data.website.trim() || 'https://example.com',
      coreOffer: data.coreOffer.trim() || 'Core Flagship Offer',
      currency: data.currency || 'KES',
      currentPhase: data.currentPhase || 'Phase 1: Track Money',
      economics: {
        dailyRate,
        avgTripDays,
        avgOrderValue: aov,
        grossMarginPct: Number(data.grossMarginPct) || 50,
        dailyBudget: Number(data.dailyBudget) || 200,
        vatRate: Number(data.vatRate) || 16,
        targetCpl: Number(data.targetCpl) || 350,
        closeRatePct: Number(data.closeRatePct) || 10,
        depositPct: Number(data.depositPct) || 30,
        fleetUnits: Number(data.fleetUnits) || 1,
        fleetMaxMonthlyBookings: Number(data.fleetMaxMonthlyBookings) || 10
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

    setClients((prev) => [...prev, created]);
    setActiveClientId(id);
    setShowAgencyOverview(false);
    setIsAddModalOpen(false);
    showToast(`Created workspace "${created.name}".`);
  };

  const handleDeleteClient = (idToDelete) => {
    if (clients.length <= 1) {
      showToast('At least one workspace must remain active.', 'error');
      return;
    }
    const next = clients.filter((c) => c.id !== idToDelete);
    setClients(next);
    if (activeClientId === idToDelete) {
      setActiveClientId(next[0].id);
    }
    showToast('Client workspace deleted.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-md transition-all ${
            toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/50 text-rose-200'
              : 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      {/* Executive Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5">
            {/* Brand */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <TrendingUp className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-lg font-extrabold tracking-tight text-white">
                      AdPulse <span className="text-emerald-400">Agency OS</span>
                    </h1>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      v2.0 Prod
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Multi-Tenant Meta Ads, VAT Runway & 2026 CAPI Command Center
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="lg:hidden inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Client
              </button>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Agency Overview Toggle */}
              <button
                onClick={() => setShowAgencyOverview(!showAgencyOverview)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  showAgencyOverview
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'bg-slate-950 text-slate-200 border-slate-700 hover:border-emerald-500/50'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Agency Overview ({clients.length})
              </button>

              {/* Workspace Switcher */}
              <div className="flex items-center bg-slate-950 border border-slate-700/90 rounded-xl px-3 py-1.5 flex-1 sm:flex-initial min-w-[215px]">
                <Building2 className="w-4 h-4 text-emerald-400 mr-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <label htmlFor="ws-select" className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                    Client Workspace
                  </label>
                  <select
                    id="ws-select"
                    value={activeClient.id}
                    onChange={(e) => {
                      setActiveClientId(e.target.value);
                      setShowAgencyOverview(false);
                    }}
                    className="w-full bg-transparent text-xs sm:text-sm font-bold text-white focus:outline-none truncate cursor-pointer"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                        {c.name} ({c.currency})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* + Add Client Workspace */}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/15 transition cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                Add Client Workspace
              </button>

              {/* Backup / Restore / Reset */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={handleExportJSON}
                  title="Export JSON Backup"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Backup</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Restore JSON Backup"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline">Restore</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="hidden"
                />
                <button
                  onClick={handleResetDemo}
                  title="Reset Demo Data"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Client Metadata Strip */}
          {!showAgencyOverview && (
            <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
                <span className="inline-flex items-center gap-1.5 text-slate-200 font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {activeClient.name}
                </span>
                <span className="font-mono text-[11px] bg-slate-800/80 px-2 py-0.5 rounded text-slate-300">
                  Act: {activeClient.metaAccountId}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-semibold text-[11px]">
                  {activeClient.currentPhase}
                </span>
                <a
                  href={activeClient.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 transition"
                >
                  {activeClient.website.replace(/^https?:\/\//, '')}
                  <ExternalLink className="w-3 h-3" />
                </a>
                <span className="hidden md:inline text-slate-500">•</span>
                <span className="hidden md:inline text-slate-300">{activeClient.coreOffer}</span>
              </div>

              <div className="flex items-center gap-3">
                {activeAnalytics.staleCapiLeads.length > 0 && (
                  <button
                    onClick={() => setActiveTab('crm')}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[11px] font-bold cursor-pointer"
                  >
                    <AlertTriangle className="w-3 h-3" />
                    {activeAnalytics.staleCapiLeads.length} CAPI Upload Due
                  </button>
                )}
                {clients.length > 1 && (
                  <button
                    onClick={() => handleDeleteClient(activeClient.id)}
                    className="text-[11px] text-slate-500 hover:text-rose-400 inline-flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Remove
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 6-Tab Navigation */}
        {!showAgencyOverview && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-1 overflow-x-auto no-scrollbar" aria-label="Workspace Tabs">
              {[
                { id: 'economics', label: '1. Unit Economics & VAT', icon: Calculator },
                { id: 'creatives', label: '2. Creative Matrix', icon: Sparkles, badge: activeClient.creatives.length },
                { id: 'crm', label: '3. WhatsApp CRM & CAPI', icon: MessageSquare, badge: activeClient.leads.length },
                { id: 'taxonomy', label: '4. Taxonomy, UTM & QA', icon: Tag },
                { id: 'sprint', label: '5. 10-Day Sprint & Rule of 100', icon: Clock },
                { id: 'casestudy', label: '6. Case Study Snapshot', icon: Award }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center gap-1.5 px-3.5 py-3 text-xs font-semibold border-b-2 whitespace-nowrap transition cursor-pointer ${
                      isActive
                        ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                        : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] rounded-full font-mono ${
                          isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {showAgencyOverview ? (
          <AgencyOverviewPanel
            clients={clients}
            activeClientId={activeClient.id}
            onSelectClient={(id) => {
              setActiveClientId(id);
              setShowAgencyOverview(false);
            }}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />
        ) : (
          <>
            {activeTab === 'economics' && (
              <UnitEconomicsTab
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

            {activeTab === 'creatives' && (
              <CreativeMatrixTab
                client={activeClient}
                analytics={activeAnalytics}
                onUpdateCreatives={(creatives) => updateActiveClient({ creatives })}
                showToast={showToast}
              />
            )}

            {activeTab === 'crm' && (
              <WhatsAppCrmTab
                client={activeClient}
                analytics={activeAnalytics}
                onUpdateLeads={(leads) => updateActiveClient({ leads })}
                showToast={showToast}
              />
            )}

            {activeTab === 'taxonomy' && (
              <TaxonomyAndQaTab
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

            {activeTab === 'sprint' && (
              <SprintAndRuleTab
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
                onAddRuleLog={(logEntry) =>
                  updateActiveClient((prev) => ({
                    ...prev,
                    streakDays: Math.min(100, (prev.streakDays || 0) + 1),
                    ruleOf100Logs: [logEntry, ...(prev.ruleOf100Logs || [])]
                  }))
                }
                onUpdateStreak={(val) =>
                  updateActiveClient({ streakDays: Math.max(0, Math.min(100, Number(val) || 0)) })
                }
                showToast={showToast}
              />
            )}

            {activeTab === 'casestudy' && (
              <CaseStudyTab
                client={activeClient}
                analytics={activeAnalytics}
                showToast={showToast}
              />
            )}
          </>
        )}
      </main>

      {/* Add Client Modal */}
      {isAddModalOpen && (
        <AddClientModal
          onClose={() => setIsAddModalOpen(false)}
          onCreate={handleCreateClient}
        />
      )}
    </div>
  );
}

// ============================================================================
// AGENCY OVERVIEW PANEL (MULTI-CLIENT SIDE-BY-SIDE COMPARISON)
// ============================================================================

function AgencyOverviewPanel({ clients, activeClientId, onSelectClient, onOpenAddModal }) {
  const summaries = useMemo(
    () => clients.map((c) => ({ client: c, stats: computeWorkspaceAnalytics(c) })),
    [clients]
  );

  const totalDeposits = summaries.reduce((s, x) => s + x.stats.totalDepositsCollected, 0);
  const totalBookings = summaries.reduce((s, x) => s + x.stats.closedBookings, 0);
  const totalCapiAlerts = summaries.reduce((s, x) => s + x.stats.staleCapiLeads.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-emerald-400" />
            Agency Command Overview
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor all client workspaces independently — live LTGP:CAC ratios, VAT runway, and risk alerts.
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Onboard New Client
        </button>
      </div>

      {/* Portfolio Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">Managed Client Workspaces</div>
          <div className="text-2xl font-black font-mono text-white mt-1">{clients.length}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">Total Closed Bookings</div>
          <div className="text-2xl font-black font-mono text-emerald-400 mt-1">{totalBookings}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">Portfolio Deposits Collected</div>
          <div className="text-2xl font-black font-mono text-sky-400 mt-1">
            KES {totalDeposits.toLocaleString()}
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="text-xs text-slate-400">Pending 7-Day CAPI Alerts</div>
          <div className={`text-2xl font-black font-mono mt-1 ${totalCapiAlerts > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {totalCapiAlerts}
          </div>
        </div>
      </div>

      {/* Side-by-Side Client Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {summaries.map(({ client, stats }) => {
          const isHealthy = stats.projectedLtgpCac >= 3.0;
          const isCurrent = client.id === activeClientId;
          const alerts = [];
          if (!isHealthy) alerts.push('LTGP:CAC below 3:1 floor');
          if (stats.daysRunwayLeft < 5) alerts.push(`Low VAT Runway (${formatDec(stats.daysRunwayLeft, 1)}d left)`);
          if (stats.fragmentationRisk) alerts.push('Budget Fragmentation (>2 active ads)');
          if (stats.fleetExceeded) alerts.push('Projected bookings exceed fleet cap');
          if (stats.staleCapiLeads.length > 0) alerts.push(`${stats.staleCapiLeads.length} CAPI upload overdue (>5d)`);

          return (
            <div
              key={client.id}
              className={`bg-slate-900 rounded-2xl p-5 border transition ${
                isCurrent ? 'border-emerald-500/60 shadow-lg shadow-emerald-500/5' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white">{client.name}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-emerald-300">
                      {client.currentPhase}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {client.coreOffer} • Act: <span className="font-mono">{client.metaAccountId}</span>
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-lg text-xs font-black font-mono ${
                    isHealthy
                      ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  }`}
                >
                  {formatDec(stats.projectedLtgpCac, 1)}:1 LTGP:CAC
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-4 text-xs">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-500">Daily Budget</div>
                  <div className="font-mono font-bold text-white mt-0.5">
                    {formatMoney(client.economics.dailyBudget, client.currency)}
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-500">VAT Runway</div>
                  <div className={`font-mono font-bold mt-0.5 ${stats.daysRunwayLeft < 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {formatDec(Math.max(0, stats.daysRunwayLeft), 1)} Days
                  </div>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <div className="text-slate-500">Deposits Collected</div>
                  <div className="font-mono font-bold text-sky-400 mt-0.5">
                    {formatMoney(stats.totalDepositsCollected, client.currency)}
                  </div>
                </div>
              </div>

              {/* Live Alerts */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {alerts.length === 0 ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All guardrails green
                    </span>
                  ) : (
                    alerts.map((al, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-rose-300 text-[10px] font-bold"
                      >
                        <AlertTriangle className="w-3 h-3" /> {al}
                      </span>
                    ))
                  )}
                </div>

                <button
                  onClick={() => onSelectClient(client.id)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white text-xs font-bold transition cursor-pointer"
                >
                  Open Workspace →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// TAB 1: UNIT ECONOMICS, VAT RUNWAY & SCALING ENGINE
// ============================================================================

function UnitEconomicsTab({
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

  // Client-Funded Reinvestment Recommendation
  const safeReinvestLow = Math.round(analytics.totalDepositsCollected * 0.185); // ~5k on 27k
  const safeReinvestHigh = Math.round(analytics.totalDepositsCollected * 0.37); // ~10k on 27k
  const suggestedScaledDaily =
    analytics.totalDepositsCollected >= analytics.trueCashOutlay
      ? Math.max(economics.dailyBudget, Math.min(2000, Math.round((economics.dailyBudget * 2.5) / 50) * 50))
      : economics.dailyBudget;

  const handleAddTopUp = (e) => {
    e.preventDefault();
    const gross = Number(newTopUp.grossAmount) || 0;
    if (gross <= 0) {
      showToast('Enter a valid top-up amount.', 'error');
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
    showToast(`Logged ${formatMoney(gross, currency)} top-up (${formatMoney(net, currency, 2)} net usable after ${economics.vatRate}% VAT).`);
  };

  const handleDeleteTopUp = (id) => {
    onUpdateTopUps((topUps || []).filter((t) => t.id !== id));
    showToast('Top-up entry removed.');
  };

  return (
    <div className="space-y-6">
      {/* 3-Phase Budget Stage Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            3-Phase Paid Acquisition Stage (Hormozi Budget Roadmap)
          </h3>
          <span className="text-xs font-semibold text-emerald-400">Active: {currentPhase}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PHASES.map((p) => {
            const selected = currentPhase === p.id;
            return (
              <button
                key={p.id}
                onClick={() => onUpdatePhase(p.id)}
                className={`text-left p-3.5 rounded-xl border transition cursor-pointer ${
                  selected
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-extrabold ${selected ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {p.short}
                  </span>
                  {selected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] mt-1 leading-relaxed opacity-85">{p.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Verdict & Fleet Capacity Banners */}
      <div className="space-y-3">
        <div
          className={`rounded-2xl p-4 sm:p-5 border flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${
            isScalable
              ? 'bg-emerald-950/30 border-emerald-500/40'
              : 'bg-rose-950/30 border-rose-500/40'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className={`p-3 rounded-xl shrink-0 ${isScalable ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {isScalable ? <Award className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-extrabold text-white">3:1 LTGP:CAC Scaling Verdict</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase ${
                    isScalable ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                  }`}
                >
                  {isScalable ? 'SCALE (≥ 3:1)' : 'FIX OFFER (< 3:1)'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {isScalable
                  ? `Projected ${formatDec(analytics.projectedLtgpCac, 1)}:1 ratio — ${formatMoney(analytics.trueCashOutlay, currency)} monthly cash outlay (incl. ${economics.vatRate}% VAT) yields ${formatMoney(analytics.projectedGrossProfit, currency)} Gross Profit.`
                  : `Projected CAC exceeds Max Allowable CAC (${formatMoney(analytics.maxAllowableCac, currency)}). Lower CPL, improve WhatsApp close rate, or increase AOV before scaling.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 shrink-0">
            <div>
              <div className="text-[10px] uppercase text-slate-400">Projected LTGP:CAC</div>
              <div className={`text-2xl font-black font-mono ${isScalable ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatDec(analytics.projectedLtgpCac, 1)} : 1
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div>
              <div className="text-[10px] uppercase text-slate-400">Max CAC (LTGP÷3)</div>
              <div className="text-lg font-bold font-mono text-white">
                {formatMoney(analytics.maxAllowableCac, currency)}
              </div>
            </div>
          </div>
        </div>

        {/* Fleet Capacity Warning */}
        {analytics.fleetExceeded && (
          <div className="rounded-xl p-4 bg-amber-950/40 border border-amber-500/50 flex items-start gap-3">
            <Car className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200">
              <strong className="font-bold text-amber-300">Fleet Capacity Warning:</strong> Projected monthly bookings (
              <span className="font-mono font-bold">{formatDec(analytics.projectedBookings, 1)}</span>) exceed your current fleet cap of{' '}
              <span className="font-mono font-bold">{economics.fleetMaxMonthlyBookings} bookings/mo</span> ({economics.fleetUnits} vehicle{economics.fleetUnits > 1 ? 's' : ''}). Do not scale budget further until partner vans are on standby.
            </div>
          </div>
        )}
      </div>

      {/* Main Economics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Controls */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Unit Economics Controls
            </h3>
            <span className="text-xs font-mono text-emerald-400">{currency}</span>
          </div>

          <ParamSlider
            label="Daily Ad Budget (Pre-Tax)"
            value={economics.dailyBudget}
            min={100}
            max={5000}
            step={50}
            unit={currency}
            prefix
            onChange={(v) => onUpdateEconomics({ dailyBudget: v })}
          />
          <ParamSlider
            label="Kenya Digital Ad VAT %"
            value={economics.vatRate}
            min={0}
            max={25}
            step={1}
            unit="%"
            onChange={(v) => onUpdateEconomics({ vatRate: v })}
          />
          <ParamSlider
            label="Average Order Value (AOV)"
            value={economics.avgOrderValue}
            min={5000}
            max={300000}
            step={5000}
            unit={currency}
            prefix
            onChange={(v) => onUpdateEconomics({ avgOrderValue: v })}
          />
          <ParamSlider
            label="Gross Margin % (After Fuel/Driver/Ops)"
            value={economics.grossMarginPct}
            min={10}
            max={90}
            step={1}
            unit="%"
            onChange={(v) => onUpdateEconomics({ grossMarginPct: v })}
          />
          <ParamSlider
            label="Target WhatsApp Cost Per Lead (CPL)"
            value={economics.targetCpl}
            min={50}
            max={2000}
            step={25}
            unit={currency}
            prefix
            onChange={(v) => onUpdateEconomics({ targetCpl: v })}
          />
          <ParamSlider
            label="WhatsApp Lead-to-Booking Close Rate %"
            value={economics.closeRatePct}
            min={1}
            max={50}
            step={1}
            unit="%"
            onChange={(v) => onUpdateEconomics({ closeRatePct: v })}
          />
          <ParamSlider
            label="Upfront Deposit % (Cash Recovery)"
            value={economics.depositPct}
            min={10}
            max={100}
            step={5}
            unit="%"
            onChange={(v) => onUpdateEconomics({ depositPct: v })}
          />
          <ParamSlider
            label="Fleet Monthly Booking Capacity"
            value={economics.fleetMaxMonthlyBookings}
            min={1}
            max={60}
            step={1}
            unit="trips/mo"
            onChange={(v) => onUpdateEconomics({ fleetMaxMonthlyBookings: v })}
          />
        </div>

        {/* Right: Real-Time KPIs + 70/20/10 Split */}
        <div className="lg:col-span-7 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KpiCard
              title="30-Day Pre-Tax Ad Spend"
              value={formatMoney(analytics.thirtyDayPreTaxSpend, currency)}
              sub={`${formatMoney(economics.dailyBudget, currency)}/day × 30 days`}
              accent="slate"
            />
            <KpiCard
              title={`True Cash Outlay (Incl. ${economics.vatRate}% VAT)`}
              value={formatMoney(analytics.trueCashOutlay, currency)}
              sub={`Tax drag: ${formatMoney(analytics.vatAmount, currency)}/mo`}
              accent="amber"
            />
            <KpiCard
              title="Projected 30-Day Volume"
              value={`${formatDec(analytics.projectedBookings, 1)} Bookings`}
              sub={`${formatDec(analytics.projectedLeads, 1)} leads @ ${economics.closeRatePct}% close • Cap: ${economics.fleetMaxMonthlyBookings}/mo`}
              accent={analytics.fleetExceeded ? 'amber' : 'sky'}
            />
            <KpiCard
              title="Projected 30-Day Gross Profit"
              value={formatMoney(analytics.projectedGrossProfit, currency)}
              sub={`Revenue: ${formatMoney(analytics.projectedRevenue, currency)} (${formatMoney(analytics.gpPerBooking, currency)} GP/trip)`}
              accent="emerald"
            />
          </div>

          {/* 70 / 20 / 10 Budget Split Visual */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                70 / 20 / 10 Creative Budget Allocation
              </h4>
              <span className="text-xs font-mono text-slate-400">
                {formatMoney(economics.dailyBudget, currency)}/day
              </span>
            </div>
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-950">
              <div className="bg-emerald-500 h-full" style={{ width: '70%' }} />
              <div className="bg-sky-500 h-full" style={{ width: '20%' }} />
              <div className="bg-amber-400 h-full" style={{ width: '10%' }} />
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs pt-1">
              <div className="bg-slate-950 p-3 rounded-xl border border-emerald-500/20">
                <div className="text-emerald-400 font-bold">70% Winners</div>
                <div className="font-mono font-bold text-white mt-0.5">
                  {formatMoney(economics.dailyBudget * 0.7, currency)}/d
                </div>
                <div className="text-[10px] text-slate-500">
                  {formatMoney(analytics.thirtyDayPreTaxSpend * 0.7, currency)}/mo
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-sky-500/20">
                <div className="text-sky-400 font-bold">20% Variations</div>
                <div className="font-mono font-bold text-white mt-0.5">
                  {formatMoney(economics.dailyBudget * 0.2, currency)}/d
                </div>
                <div className="text-[10px] text-slate-500">
                  {formatMoney(analytics.thirtyDayPreTaxSpend * 0.2, currency)}/mo
                </div>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/20">
                <div className="text-amber-400 font-bold">10% Wildcards</div>
                <div className="font-mono font-bold text-white mt-0.5">
                  {formatMoney(economics.dailyBudget * 0.1, currency)}/d
                </div>
                <div className="text-[10px] text-slate-500">
                  {formatMoney(analytics.thirtyDayPreTaxSpend * 0.1, currency)}/mo
                </div>
              </div>
            </div>
          </div>

          {/* Client-Funded Reinvestment Calculator */}
          <div className="bg-slate-900 border border-sky-500/30 rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-sky-400" />
                Client-Funded Reinvestment Calculator
              </h4>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                CRM Deposits: {formatMoney(analytics.totalDepositsCollected, currency)}
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your collected CRM deposits cover{' '}
              <strong className="text-emerald-400 font-mono">
                {formatDec(
                  analytics.trueCashOutlay > 0 ? analytics.totalDepositsCollected / analytics.trueCashOutlay : 0,
                  1
                )}
                ×
              </strong>{' '}
              your entire 30-day VAT-inclusive ad outlay ({formatMoney(analytics.trueCashOutlay, currency)}).
              {analytics.totalDepositsCollected > 0 ? (
                <>
                  {' '}
                  Safe reinvestment window:{' '}
                  <strong className="text-sky-300 font-mono">
                    {formatMoney(safeReinvestLow, currency)} – {formatMoney(safeReinvestHigh, currency)}
                  </strong>{' '}
                  to scale daily spend toward{' '}
                  <strong className="text-white font-mono">
                    {formatMoney(suggestedScaledDaily, currency)}/day
                  </strong>
                  .
                </>
              ) : (
                ' Close your first 30% deposit in the CRM to unlock client-funded scaling.'
              )}
            </p>
            {analytics.totalDepositsCollected >= analytics.trueCashOutlay &&
              suggestedScaledDaily > economics.dailyBudget && (
                <button
                  onClick={() => {
                    onUpdateEconomics({ dailyBudget: suggestedScaledDaily });
                    showToast(`Scaled daily budget to ${formatMoney(suggestedScaledDaily, currency)}/day!`);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold text-xs transition cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Apply Safe Scale ({formatMoney(economics.dailyBudget, currency)} → {formatMoney(suggestedScaledDaily, currency)}/day)
                </button>
              )}
          </div>
        </div>
      </div>

      {/* M-Pesa / Prepaid Top-Up & VAT Runway Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              M-Pesa / Prepaid Top-Up & VAT Runway Ledger
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Meta deducts {economics.vatRate}% VAT upfront on prepaid top-ups (Net Usable = Gross ÷ {(1 + economics.vatRate / 100).toFixed(2)}).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl">
              <div className="text-[10px] uppercase text-slate-400">Net Balance Left</div>
              <div className={`text-sm font-black font-mono ${analytics.remainingNetBalance > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatMoney(analytics.remainingNetBalance, currency, 2)}
              </div>
            </div>
            <div className="bg-slate-950 border border-slate-800 px-3.5 py-2 rounded-xl">
              <div className="text-[10px] uppercase text-slate-400">Days of Runway</div>
              <div className={`text-sm font-black font-mono ${analytics.daysRunwayLeft >= 5 ? 'text-sky-400' : 'text-amber-400'}`}>
                {formatDec(Math.max(0, analytics.daysRunwayLeft), 1)} Days
              </div>
            </div>
          </div>
        </div>

        {/* Add Top-Up Form */}
        <form onSubmit={handleAddTopUp} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-3">
            <label className="block text-[11px] text-slate-400 mb-1">Gross Top-Up ({currency})</label>
            <input
              type="number"
              min="1"
              value={newTopUp.grossAmount}
              onChange={(e) => setNewTopUp({ ...newTopUp, grossAmount: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-[11px] text-slate-400 mb-1">Payment Method</label>
            <select
              value={newTopUp.method}
              onChange={(e) => setNewTopUp({ ...newTopUp, method: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="M-Pesa Prepaid">M-Pesa Prepaid</option>
              <option value="Visa / Mastercard">Visa / Mastercard</option>
            </select>
          </div>
          <div className="sm:col-span-4">
            <label className="block text-[11px] text-slate-400 mb-1">
              Preview: Net {formatMoney((Number(newTopUp.grossAmount) || 0) / (1 + economics.vatRate / 100), currency, 2)} | VAT{' '}
              {formatMoney(
                (Number(newTopUp.grossAmount) || 0) -
                  (Number(newTopUp.grossAmount) || 0) / (1 + economics.vatRate / 100),
                currency,
                2
              )}
            </label>
            <input
              type="text"
              value={newTopUp.note}
              onChange={(e) => setNewTopUp({ ...newTopUp, note: e.target.value })}
              placeholder="Note (e.g., Week 3 M-Pesa refill)"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-2.5 px-3 rounded-xl transition cursor-pointer"
            >
              + Log Top-Up
            </button>
          </div>
        </form>

        {/* Top-Up History Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] uppercase text-slate-400">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3 text-right">Gross Paid</th>
                <th className="py-2.5 px-3 text-right">VAT Deducted ({economics.vatRate}%)</th>
                <th className="py-2.5 px-3 text-right">Net Usable Ad Spend</th>
                <th className="py-2.5 px-3">Note</th>
                <th className="py-2.5 px-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {(topUps || []).length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-5 text-center text-slate-500">
                    No top-ups logged yet. Log your first M-Pesa deposit to track VAT runway.
                  </td>
                </tr>
              ) : (
                topUps.map((tu) => {
                  const net = tu.grossAmount / (1 + economics.vatRate / 100);
                  const vat = tu.grossAmount - net;
                  return (
                    <tr key={tu.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 font-mono text-slate-300">{tu.date}</td>
                      <td className="py-2.5 px-3 text-slate-200">{tu.method}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        {formatMoney(tu.grossAmount, currency, 2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-amber-400">
                        -{formatMoney(vat, currency, 2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                        {formatMoney(net, currency, 2)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">{tu.note}</td>
                      <td className="py-2.5 px-2 text-right">
                        <button
                          onClick={() => handleDeleteTopUp(tu.id)}
                          className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-950/90 font-mono text-[11px] border-t border-slate-700">
                <td colSpan="2" className="py-2.5 px-3 font-bold text-slate-300">
                  TOTAL LEDGER ({formatMoney(analytics.totalCreativeSpend, currency)} Ad Spend Logged)
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-white">
                  {formatMoney(analytics.totalGrossTopUps, currency, 2)}
                </td>
                <td className="py-2.5 px-3 text-right text-amber-400">
                  -{formatMoney(analytics.totalVatDeducted, currency, 2)}
                </td>
                <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                  {formatMoney(analytics.netUsableFromTopUps, currency, 2)}
                </td>
                <td colSpan="2" className="py-2.5 px-3 text-right text-sky-400 font-bold">
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

function ParamSlider({ label, value, min, max, step, unit, prefix = false, onChange }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-medium text-slate-300">{label}</label>
        <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg px-2 py-1">
          {prefix && <span className="text-[10px] text-slate-400 mr-1 font-mono">{unit}</span>}
          <input
            type="number"
            value={value}
            min={0}
            step={step}
            onChange={(e) => onChange(Math.max(0, Number(e.target.value)))}
            className="w-20 bg-transparent text-right text-xs font-mono font-bold text-emerald-400 focus:outline-none"
          />
          {!prefix && <span className="text-[10px] text-slate-400 ml-1 font-mono">{unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
      />
    </div>
  );
}

function KpiCard({ title, value, sub, accent = 'slate' }) {
  const borders = {
    slate: 'border-slate-800',
    emerald: 'border-emerald-500/30',
    amber: 'border-amber-500/30',
    sky: 'border-sky-500/30'
  };
  const colors = {
    slate: 'text-white',
    emerald: 'text-emerald-400',
    amber: 'text-amber-300',
    sky: 'text-sky-400'
  };
  return (
    <div className={`bg-slate-900 border ${borders[accent]} rounded-2xl p-4`}>
      <div className="text-xs text-slate-400 font-semibold">{title}</div>
      <div className={`text-xl font-black font-mono mt-1 ${colors[accent]}`}>{value}</div>
      <div className="text-[11px] text-slate-500 mt-1.5">{sub}</div>
    </div>
  );
}

// ============================================================================
// TAB 2: CREATIVE HOOK MATRIX, 72H LOCK & DIAGNOSTICS
// ============================================================================

function CreativeMatrixTab({ client, analytics, onUpdateCreatives, showToast }) {
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
      showToast('Asset ID and Ad Name are required.', 'error');
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
    const nextNum = creatives.length + 2;
    setNewAd({
      assetId: `A00${nextNum}`,
      adName: `VID_NEW-HOOK_V1_A00${nextNum}`,
      bucket: '20% Variation',
      status: 'Active'
    });
    showToast(`Launched ${created.adName} under 72-Hour Learning Lock.`);
  };

  // Clone as Fatigue Remake (increments version V1 -> V2 and assigns new Asset ID)
  const handleCloneFatigueRemake = (sourceAd) => {
    const nextIdx = creatives.length + 1;
    const nextAssetId = `A${String(nextIdx).padStart(3, '0')}`;
    let remadeName = sourceAd.adName.replace(/_V(\d+)_/i, (_, v) => `_V${Number(v) + 1}_`);
    if (remadeName === sourceAd.adName) {
      remadeName = `${sourceAd.adName}_V2`;
    }
    remadeName = remadeName.replace(/_A\d+$/i, `_${nextAssetId}`);
    if (!remadeName.endsWith(nextAssetId)) {
      remadeName = `${remadeName}_${nextAssetId}`;
    }

    const cloned = {
      id: `cr-${Date.now()}`,
      assetId: nextAssetId,
      adName: remadeName,
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
    showToast(`Cloned fatigue remake: ${cloned.adName} (Body preserved, fresh 72h lock).`);
  };

  const handleDelete = (id) => {
    onUpdateCreatives(creatives.filter((c) => c.id !== id));
    showToast('Creative removed from matrix.');
  };

  return (
    <div className="space-y-5">
      {/* Budget Fragmentation Guardrail Banner */}
      {analytics.fragmentationRisk && (
        <div className="rounded-2xl p-4 bg-rose-950/40 border border-rose-500/50 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-200">
            <strong className="font-bold text-rose-300">Budget Fragmentation Risk:</strong> You currently have{' '}
            <span className="font-mono font-bold">{analytics.activeAdsCount} Active ads</span> on a lean{' '}
            <span className="font-mono font-bold">{formatMoney(economics.dailyBudget, currency)}/day</span> budget.
            Run <strong>1–2 ads max</strong> at KES 150–200/day so Meta exits the learning phase cleanly.
          </div>
        </div>
      )}

      {/* Add New Hook Form */}
      <form onSubmit={handleAddAd} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add New Hook / Ad Variant
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Kill Floor: {formatMoney(4 * economics.dailyBudget, currency)} (4× Daily Budget) & 0 Leads
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-[11px] text-slate-400 mb-1">Asset ID</label>
            <input
              type="text"
              value={newAd.assetId}
              onChange={(e) => setNewAd({ ...newAd, assetId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-emerald-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-4">
            <label className="block text-[11px] text-slate-400 mb-1">Ad Name (Taxonomy)</label>
            <input
              type="text"
              value={newAd.adName}
              onChange={(e) => setNewAd({ ...newAd, adName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] text-slate-400 mb-1">70/20/10 Bucket</label>
            <select
              value={newAd.bucket}
              onChange={(e) => setNewAd({ ...newAd, bucket: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
            >
              <option value="70% Winner">70% Winner</option>
              <option value="20% Variation">20% Variation</option>
              <option value="10% Wildcard">10% Wildcard</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] text-slate-400 mb-1">Initial Status</label>
            <select
              value={newAd.status}
              onChange={(e) => setNewAd({ ...newAd, status: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
            >
              <option value="Active">Active</option>
              <option value="Paused">Paused</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer"
            >
              + Launch Ad
            </button>
          </div>
        </div>
      </form>

      {/* Diagnostic Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white">Creative Hook Matrix & 72-Hour Lock Diagnostics</h3>
            <p className="text-xs text-slate-400">
              Benchmarks: Hook Rate ≥ 25% • Outbound CTR ≥ 1.0% • Target CPL ≤ {formatMoney(economics.targetCpl, currency)}
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Active Ads: <strong className="text-white">{analytics.activeAdsCount}</strong> / {creatives.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                <th className="py-3 px-3">Asset / Ad Name</th>
                <th className="py-3 px-2">Bucket</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Spend</th>
                <th className="py-3 px-2 text-right">Impr.</th>
                <th className="py-3 px-2 text-right">3s Plays</th>
                <th className="py-3 px-2 text-right">Hook %</th>
                <th className="py-3 px-2 text-right">Clicks</th>
                <th className="py-3 px-2 text-right">CTR %</th>
                <th className="py-3 px-2 text-right">Leads</th>
                <th className="py-3 px-2 text-right">CPL</th>
                <th className="py-3 px-3">Automated Verdict</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {creatives.map((ad) => {
                const diag = diagnoseCreative(ad, economics.dailyBudget, economics.targetCpl, currency);
                const badgeStyles = {
                  emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
                  rose: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
                  amber: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
                  orange: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
                  sky: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
                  slate: 'bg-slate-800 text-slate-300 border-slate-700'
                };

                return (
                  <tr key={ad.id} className="hover:bg-slate-800/35 transition">
                    <td className="py-3 px-3 min-w-[205px]">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 font-mono text-[10px] font-bold text-emerald-400">
                          {ad.assetId}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {Math.floor(diag.hoursActive / 24)}d {Math.floor(diag.hoursActive % 24)}h
                        </span>
                      </div>
                      <input
                        type="text"
                        value={ad.adName}
                        onChange={(e) => handleField(ad.id, 'adName', e.target.value)}
                        className="w-full bg-transparent font-mono text-[11px] font-semibold text-white mt-1 focus:bg-slate-950 focus:px-1 rounded focus:outline-none"
                      />
                    </td>

                    <td className="py-3 px-2">
                      <select
                        value={ad.bucket}
                        onChange={(e) => handleField(ad.id, 'bucket', e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-1.5 py-1 text-[11px] text-slate-200 cursor-pointer"
                      >
                        <option value="70% Winner">70% Winner</option>
                        <option value="20% Variation">20% Variation</option>
                        <option value="10% Wildcard">10% Wildcard</option>
                      </select>
                    </td>

                    <td className="py-3 px-2">
                      <select
                        value={ad.status}
                        onChange={(e) => handleField(ad.id, 'status', e.target.value)}
                        className={`rounded-lg px-2 py-1 text-[11px] font-bold border cursor-pointer ${
                          ad.status === 'Active'
                            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                            : ad.status === 'Killed'
                            ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        <option value="Active" className="bg-slate-900">Active</option>
                        <option value="Paused" className="bg-slate-900">Paused</option>
                        <option value="Killed" className="bg-slate-900">Killed</option>
                      </select>
                    </td>

                    <td className="py-3 px-2 text-right">
                      <NumCell value={ad.spend} onChange={(v) => handleField(ad.id, 'spend', v)} />
                    </td>
                    <td className="py-3 px-2 text-right">
                      <NumCell value={ad.impressions} onChange={(v) => handleField(ad.id, 'impressions', v)} />
                    </td>
                    <td className="py-3 px-2 text-right">
                      <NumCell value={ad.threeSecPlays} onChange={(v) => handleField(ad.id, 'threeSecPlays', v)} />
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold">
                      <span className={diag.hookRate >= 25 ? 'text-emerald-400' : 'text-amber-400'}>
                        {formatDec(diag.hookRate, 1)}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <NumCell value={ad.outboundClicks} onChange={(v) => handleField(ad.id, 'outboundClicks', v)} />
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold">
                      <span className={diag.outboundCtr >= 1.0 ? 'text-emerald-400' : 'text-orange-400'}>
                        {formatDec(diag.outboundCtr, 2)}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      <NumCell value={ad.leads} onChange={(v) => handleField(ad.id, 'leads', v)} />
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-slate-300">
                      {diag.cpl !== null ? Math.round(diag.cpl).toLocaleString() : '—'}
                    </td>

                    <td className="py-3 px-3 min-w-[185px]">
                      <span
                        title={diag.verdict.detail}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-extrabold ${
                          badgeStyles[diag.verdict.tone]
                        }`}
                      >
                        {diag.isLocked72h && <Lock className="w-3 h-3" />}
                        {diag.verdict.label}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleCloneFatigueRemake(ad)}
                        title="Clone as Fatigue Remake (increments version & keeps body)"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-sky-500/20 hover:text-sky-300 text-slate-300 text-[10px] font-semibold mr-1 transition cursor-pointer"
                      >
                        <Copy className="w-3 h-3" /> Remake
                      </button>
                      <button
                        onClick={() => handleDelete(ad.id)}
                        title="Delete Creative"
                        className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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

function NumCell({ value, onChange }) {
  return (
    <input
      type="number"
      min="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-16 text-right bg-slate-950/70 border border-transparent hover:border-slate-700 focus:border-emerald-500 rounded px-1.5 py-1 font-mono text-xs text-white focus:outline-none"
    />
  );
}

// ============================================================================
// TAB 3: WHATSAPP SPEED-TO-LEAD CRM, QUOTE BUILDER & 2026 META CAPI EXPORTER
// ============================================================================

function WhatsAppCrmTab({ client, analytics, onUpdateLeads, showToast }) {
  const { leads, creatives, economics, currency } = client;
  const [stageFilter, setStageFilter] = useState('ALL');

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

  // 1-Click Instant Quote Builder state
  const [quoteCfg, setQuoteCfg] = useState({
    tripDays: economics.avgTripDays || 3,
    groupSize: 7,
    destination: 'Maasai Mara / Amboseli',
    includeAirportAddon: true,
    airportAddonPrice: 6500
  });
  const [copiedQuote, setCopiedQuote] = useState(false);

  const normalizedPreview = normalizeKenyaPhoneE164(newLead.phone);

  const handleAddLead = (e) => {
    e.preventDefault();
    if (!newLead.name.trim() || !newLead.phone.trim()) {
      showToast('Lead Name and Phone number are required.', 'error');
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
    setNewLead({
      ...newLead,
      name: '',
      phone: '07',
      email: '',
      fbclid: '',
      addonsValue: 0,
      stage: 'New Inquiry'
    });
    showToast(`Logged WhatsApp lead: ${entry.name} (${normalizeKenyaPhoneE164(entry.phone)}).`);
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

  const handleLeadField = (id, field, val) => {
    onUpdateLeads(leads.map((l) => (l.id === id ? { ...l, [field]: val } : l)));
  };

  // Real SHA-256 2026 Meta Events Manager Dataset CSV Exporter
  const handleExportMetaCapiCSV = async () => {
    const qualifying = leads.filter(
      (l) => l.stage === 'Deposit Paid' || l.stage === 'Completed'
    );

    if (qualifying.length === 0) {
      showToast('No "Deposit Paid" or "Completed" leads available for Meta CAPI export.', 'error');
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
        const normPhone = normalizeKenyaPhoneE164(lead.phone);
        const hashedPh = await sha256Hex(normPhone);
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

    // Mark exported leads as capiExported: true
    const exportedIds = new Set(qualifying.map((q) => q.id));
    onUpdateLeads(
      leads.map((l) => (exportedIds.has(l.id) ? { ...l, capiExported: true } : l))
    );
    showToast(`Exported ${qualifying.length} SHA-256 Purchase event(s) & marked CAPI Exported!`);
  };

  // Build Instant WhatsApp Quote text
  const instantQuoteText = useMemo(() => {
    const days = Math.max(1, Number(quoteCfg.tripDays) || 1);
    const group = Math.max(1, Number(quoteCfg.groupSize) || 1);
    const rate = Number(economics.dailyRate) || Math.round(economics.avgOrderValue / (economics.avgTripDays || 1));
    const baseTotal = days * rate;
    const perPerson = Math.round(baseTotal / group);
    const addon = quoteCfg.includeAirportAddon ? Number(quoteCfg.airportAddonPrice) || 0 : 0;
    const grandTotal = baseTotal + addon;
    const depositAmt = Math.round(grandTotal * (economics.depositPct / 100));

    return `Hello! Here is your instant *${client.name}* quote for *${quoteCfg.destination}* (${days} Day${days > 1 ? 's' : ''}):\n\n` +
      `🚐 *Offer:* ${client.coreOffer}\n` +
      `💵 *Flat Rate:* ${formatMoney(rate, currency)}/day × ${days} days = *${formatMoney(baseTotal, currency)}*\n` +
      `👥 *Group Split (${group} pax):* Only *${formatMoney(perPerson, currency)}/person* (no hidden per-person markups!)\n` +
      (addon > 0 ? `✈️ *Optional Airport/Hotel Transfer Add-on:* ${formatMoney(addon, currency)}\n` : '') +
      `✅ *Total:* ${formatMoney(grandTotal, currency)}\n` +
      `🔒 *Lock Your Dates:* ${economics.depositPct}% deposit (*${formatMoney(depositAmt, currency)}*) via M-Pesa/Bank.\n\n` +
      `Reply with your preferred travel dates so we confirm availability immediately!`;
  }, [quoteCfg, economics, client, currency]);

  const handleCopyQuote = () => {
    navigator.clipboard?.writeText(instantQuoteText);
    setCopiedQuote(true);
    showToast('WhatsApp instant quote copied to clipboard!');
    setTimeout(() => setCopiedQuote(false), 2000);
  };

  const visibleLeads = stageFilter === 'ALL' ? leads : leads.filter((l) => l.stage === stageFilter);

  return (
    <div className="space-y-6">
      {/* 7-Day Meta CAPI Freshness Alert */}
      {analytics.staleCapiLeads.length > 0 && (
        <div className="rounded-2xl p-4 bg-rose-950/40 border border-rose-500/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-xs text-rose-200">
              <strong className="font-bold text-rose-300">
                7-Day Meta CAPI Freshness Alert ({analytics.staleCapiLeads.length} overdue):
              </strong>{' '}
              You have Deposit Paid / Completed booking(s) older than 5 days that haven&apos;t been uploaded to Meta Events Manager. Export now to stay inside Meta&apos;s strict 7-day CAPI attribution window (62-day offline max).
            </div>
          </div>
          <button
            onClick={handleExportMetaCapiCSV}
            className="shrink-0 px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white font-bold text-xs cursor-pointer"
          >
            Export SHA-256 CSV Now
          </button>
        </div>
      )}

      {/* Top CRM Stats + Export Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1">
          <div>
            <div className="text-xs text-slate-400">Logged WhatsApp Leads</div>
            <div className="text-xl font-black font-mono text-white">{leads.length}</div>
            <div className="text-[11px] text-emerald-400">{analytics.closedBookings} Paid Bookings</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Deposits Collected</div>
            <div className="text-xl font-black font-mono text-emerald-400">
              {formatMoney(analytics.totalDepositsCollected, currency)}
            </div>
            <div className="text-[11px] text-slate-500">Feeds Reinvestment Calc</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">5-Min SLA Breaches</div>
            <div className={`text-xl font-black font-mono ${analytics.slaBreaches.length > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {analytics.slaBreaches.length}
            </div>
            <div className="text-[11px] text-slate-500">Target: Reply &lt; 5 mins</div>
          </div>
          <div>
            <div className="text-xs text-slate-400">CAPI Exported</div>
            <div className="text-xl font-black font-mono text-sky-400">
              {leads.filter((l) => l.capiExported).length}/{analytics.closedBookings}
            </div>
            <div className="text-[11px] text-slate-500">SHA-256 Meta Dataset</div>
          </div>
        </div>

        <button
          onClick={handleExportMetaCapiCSV}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer shrink-0"
        >
          <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
          Export 2026 Meta CAPI CSV (SHA-256)
        </button>
      </div>

      {/* Add Lead Form + 1-Click Instant Quote Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Log Incoming WhatsApp Lead */}
        <form onSubmit={handleAddLead} className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Log WhatsApp Lead & Attribution
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Lead Name *</label>
              <input
                type="text"
                value={newLead.name}
                onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                placeholder="e.g., Peter Mutua"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] text-slate-400">Phone (Kenya E.164) *</label>
                <span className="text-[10px] font-mono text-emerald-400">
                  → {normalizedPreview || '2547...'}
                </span>
              </div>
              <input
                type="text"
                value={newLead.phone}
                onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                placeholder="0712345678 or +2547..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Email (Optional, hashed for CAPI)</label>
              <input
                type="email"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                placeholder="client@example.com"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">fbclid (Optional)</label>
              <input
                type="text"
                value={newLead.fbclid}
                onChange={(e) => setNewLead({ ...newLead, fbclid: e.target.value })}
                placeholder="IwAR..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Source Asset ID</label>
              <select
                value={newLead.assetId}
                onChange={(e) => setNewLead({ ...newLead, assetId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-emerald-300"
              >
                {creatives.map((c) => (
                  <option key={c.id} value={c.assetId}>
                    {c.assetId} — {c.adName}
                  </option>
                ))}
                <option value="ORGANIC">ORGANIC</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Icebreaker Selected</label>
              <select
                value={newLead.icebreaker}
                onChange={(e) => setNewLead({ ...newLead, icebreaker: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              >
                {ICEBREAKER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Response (mins)</label>
              <input
                type="number"
                min="0"
                value={newLead.responseMins}
                onChange={(e) => setNewLead({ ...newLead, responseMins: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Quote ({currency})</label>
              <input
                type="number"
                min="0"
                value={newLead.quoteValue}
                onChange={(e) => setNewLead({ ...newLead, quoteValue: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Add-ons ({currency})</label>
              <input
                type="number"
                min="0"
                value={newLead.addonsValue}
                onChange={(e) => setNewLead({ ...newLead, addonsValue: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Stage</label>
              <select
                value={newLead.stage}
                onChange={(e) => setNewLead({ ...newLead, stage: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-2 text-white"
              >
                {LEAD_STAGES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs py-2.5 rounded-xl transition cursor-pointer"
          >
            + Add Lead to Speed-to-Lead CRM
          </button>
        </form>

        {/* 1-Click WhatsApp Instant Quote & Lead Magnet Copy Tool */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-3.5">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4" /> 1-Click WhatsApp Instant Quote Builder
            </h3>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Trip Days</label>
                <input
                  type="number"
                  min="1"
                  value={quoteCfg.tripDays}
                  onChange={(e) => setQuoteCfg({ ...quoteCfg, tripDays: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Group Size</label>
                <input
                  type="number"
                  min="1"
                  value={quoteCfg.groupSize}
                  onChange={(e) => setQuoteCfg({ ...quoteCfg, groupSize: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Add-on ({currency})</label>
                <input
                  type="number"
                  min="0"
                  value={quoteCfg.airportAddonPrice}
                  onChange={(e) => setQuoteCfg({ ...quoteCfg, airportAddonPrice: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 font-mono text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 text-xs">
              <input
                type="text"
                value={quoteCfg.destination}
                onChange={(e) => setQuoteCfg({ ...quoteCfg, destination: e.target.value })}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white"
                placeholder="Destination route..."
              />
              <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={quoteCfg.includeAirportAddon}
                  onChange={(e) => setQuoteCfg({ ...quoteCfg, includeAirportAddon: e.target.checked })}
                  className="accent-emerald-500"
                />
                Transfer Add-on
              </label>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-300 whitespace-pre-wrap font-sans leading-relaxed max-h-44 overflow-y-auto">
              {instantQuoteText}
            </pre>
          </div>

          <button
            type="button"
            onClick={handleCopyQuote}
            className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 font-bold text-xs transition cursor-pointer"
          >
            {copiedQuote ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedQuote ? 'Copied WhatsApp Quote!' : 'Copy Ready-to-Paste WhatsApp Quote'}
          </button>
        </div>
      </div>

      {/* Leads Pipeline Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-white">WhatsApp Speed-to-Lead & Deposit Ledger</h3>
          <div className="flex flex-wrap gap-1.5">
            {['ALL', ...LEAD_STAGES].map((st) => (
              <button
                key={st}
                onClick={() => setStageFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition ${
                  stageFilter === st
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase text-slate-400">
                <th className="py-3 px-3">Lead & E.164 Phone</th>
                <th className="py-3 px-2">Asset / Icebreaker</th>
                <th className="py-3 px-2 text-center">SLA</th>
                <th className="py-3 px-2 text-right">Quote + Add-ons</th>
                <th className="py-3 px-2">Stage</th>
                <th className="py-3 px-2 text-right">Deposit Paid</th>
                <th className="py-3 px-2 text-center">CAPI Status</th>
                <th className="py-3 px-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {visibleLeads.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-500">
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
                    <tr key={lead.id} className="hover:bg-slate-800/35">
                      <td className="py-3 px-3">
                        <div className="font-bold text-white">{lead.name}</div>
                        <div className="text-[11px] font-mono text-emerald-400">
                          {normalizeKenyaPhoneE164(lead.phone)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(lead.createdAt).toLocaleDateString()} • {Math.floor(ageDays)}d ago
                        </div>
                      </td>

                      <td className="py-3 px-2">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-emerald-400">
                          {lead.assetId}
                        </span>
                        <div className="text-[11px] text-slate-400 mt-1">{lead.icebreaker}</div>
                      </td>

                      <td className="py-3 px-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[11px] font-bold ${
                            slaBreach
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                              : 'bg-emerald-500/15 text-emerald-400'
                          }`}
                        >
                          {lead.responseMins}m {slaBreach ? 'SLA!' : ''}
                        </span>
                      </td>

                      <td className="py-3 px-2 text-right font-mono">
                        <div className="text-white font-semibold">
                          {((Number(lead.quoteValue) || 0) + (Number(lead.addonsValue) || 0)).toLocaleString()}
                        </div>
                        {(Number(lead.addonsValue) || 0) > 0 && (
                          <div className="text-[10px] text-sky-400">
                            +{Number(lead.addonsValue).toLocaleString()} add-on
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-2">
                        <select
                          value={lead.stage}
                          onChange={(e) => handleStageChange(lead.id, e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-white cursor-pointer"
                        >
                          {LEAD_STAGES.map((st) => (
                            <option key={st} value={st} className="bg-slate-900">
                              {st}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="py-3 px-2 text-right">
                        <input
                          type="number"
                          min="0"
                          value={lead.depositPaid}
                          onChange={(e) =>
                            handleLeadField(lead.id, 'depositPaid', Math.max(0, Number(e.target.value) || 0))
                          }
                          className="w-24 text-right bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono text-xs text-emerald-400 focus:border-emerald-500 focus:outline-none"
                        />
                      </td>

                      <td className="py-3 px-2 text-center">
                        {lead.capiExported ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-bold">
                            <Check className="w-3 h-3" /> Exported
                          </span>
                        ) : isStaleCapi ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                            <AlertTriangle className="w-3 h-3" /> Upload Due!
                          </span>
                        ) : isPaidStage ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-300 text-[10px] font-bold">
                            Ready
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-500">—</span>
                        )}
                      </td>

                      <td className="py-3 px-2 text-right">
                        <button
                          onClick={() => onUpdateLeads(leads.filter((x) => x.id !== lead.id))}
                          className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
    </div>
  );
}

// ============================================================================
// TAB 4: TAXONOMY, UTM BUILDER & OFFER QA
// ============================================================================

function TaxonomyAndQaTab({ client, onToggleQa, showToast }) {
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
      const base = client.website?.startsWith('http') ? client.website : `https://${client.website || 'krescentadventures.com'}`;
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
      {/* Left 7 Cols: Immutable Agency Naming Generator & UTM Builder */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-400" />
              Immutable Agency Naming Generator
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Standardize Meta Ads Manager names so PostHog & client audits tie cleanly to every creative.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {[
              { key: 'objective', label: 'Objective', opts: ['LEADS', 'ENG', 'SALES'] },
              { key: 'budgetModel', label: 'Budget Model', opts: ['ABO', 'CBO'] },
              { key: 'funnel', label: 'Funnel', opts: ['TOF', 'MOF', 'BOF'] },
              { key: 'market', label: 'Market', opts: ['KE-NBO', 'KE-ALL', 'KE-MSA'] },
              { key: 'audience', label: 'Audience', opts: ['BROAD', 'RETARG', 'LAL'] },
              { key: 'ageRange', label: 'Age', opts: ['26-58', '25-60', '22-55'] },
              { key: 'placement', label: 'Placement', opts: ['ALL', 'REELS', 'FEEDS'] },
              { key: 'optEvent', label: 'Opt Event', opts: ['WA-CONV', 'LEAD', 'PURCH'] }
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-[10px] text-slate-400 mb-1">{f.label}</label>
                <select
                  value={tax[f.key]}
                  onChange={(e) => setTax({ ...tax, [f.key]: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-white"
                >
                  {f.opts.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Format</label>
              <select
                value={tax.format}
                onChange={(e) => setTax({ ...tax, format: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-white"
              >
                <option value="VID">VID</option>
                <option value="IMG">IMG</option>
                <option value="CAR">CAR</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Hook Angle</label>
              <input
                type="text"
                value={tax.angle}
                onChange={(e) => setTax({ ...tax, angle: e.target.value.replace(/\s+/g, '-') })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Version</label>
              <input
                type="text"
                value={tax.version}
                onChange={(e) => setTax({ ...tax, version: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Asset ID</label>
              <input
                type="text"
                value={tax.assetId}
                onChange={(e) => setTax({ ...tax, assetId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 font-mono text-emerald-400"
              />
            </div>
          </div>

          {/* Generated Strings */}
          <div className="space-y-2 pt-2">
            {[
              { label: 'Campaign Name', value: campaignName },
              { label: 'Ad Set Name', value: adSetName },
              { label: 'Ad Name', value: adName }
            ].map((row) => (
              <div
                key={row.label}
                className="flex items-center justify-between gap-2 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <div className="text-[10px] uppercase text-slate-500 font-bold">{row.label}</div>
                  <div className="font-mono text-xs font-bold text-emerald-400 truncate">{row.value}</div>
                </div>
                <button
                  onClick={() => copyStr(row.value, row.label)}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200 text-[11px] font-bold transition cursor-pointer"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* PostHog + Meta Pixel UTM Builder */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-sky-400" />
            PostHog + Meta Pixel UTM URL Builder
          </h3>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-sky-300 break-all">
            {utmUrl}
          </div>
          <button
            onClick={() => copyStr(utmUrl, 'PostHog + Meta UTM URL')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/40 text-sky-300 font-bold text-xs transition cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" /> Copy Full UTM Tracking URL
          </button>
        </div>
      </div>

      {/* Right 5 Cols: Landing Page & Creative Compliance QA Checklist */}
      <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Landing Page & Creative QA
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Pre-flight checks for {client.name}</p>
          </div>
          <span className="font-mono font-black text-emerald-400 text-base">{qaPct}%</span>
        </div>

        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${qaPct}%` }} />
        </div>

        <div className="space-y-2.5">
          {OFFER_QA_ITEMS.map((item) => {
            const checked = !!client.qaChecklist?.[item.id];
            return (
              <label
                key={item.id}
                onClick={() => onToggleQa(item.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                  checked
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-400'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-200'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {}}
                  className="mt-0.5 w-4 h-4 accent-emerald-500 cursor-pointer"
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
// TAB 5: 10-DAY SPRINT & DAILY RULE OF 100 TIMER
// ============================================================================

function SprintAndRuleTab({ client, onToggleTask, onAddRuleLog, onUpdateStreak, showToast }) {
  const { sprintChecklist, ruleOf100Logs, streakDays = 0 } = client;

  const blocks = {
    speed: { label: 'Speed-to-Lead & Quotes', mins: 40 },
    creative: { label: 'Creative & B-Roll Hooks', mins: 30 },
    data: { label: 'Data & Ad Hygiene', mins: 30 }
  };

  const [activeBlock, setActiveBlock] = useState('speed');
  const [secondsLeft, setSecondsLeft] = useState(40 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [logNotes, setLogNotes] = useState('');

  useEffect(() => {
    if (!isRunning) return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          showToast(`Completed ${blocks[activeBlock].label} block!`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [isRunning, activeBlock]);

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
      notes: logNotes.trim() || 'Completed full 100-minute Rule of 100 daily sprint.'
    });
    setLogNotes('');
    showToast(`Day ${Math.min(100, streakDays + 1)}/100 logged!`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left 7 Cols: 10-Day Sprint */}
      <div className="lg:col-span-7 space-y-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-base font-bold text-white">10-Day Senior Media Buyer Sprint</h3>
              <p className="text-xs text-slate-400">Agency SOP execution for {client.name}</p>
            </div>
            <div className="text-right">
              <span className="text-lg font-black font-mono text-emerald-400">{sprintPct}%</span>
              <div className="text-[11px] text-slate-500">{doneCount}/{allTasks.length} Done</div>
            </div>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${sprintPct}%` }} />
          </div>
        </div>

        {SPRINT_PHASES.map((group) => (
          <div key={group.phase} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">{group.phase}</h4>
              <p className="text-[11px] text-slate-400">{group.subtitle}</p>
            </div>
            {group.tasks.map((task) => {
              const checked = !!sprintChecklist?.[task.id];
              return (
                <label
                  key={task.id}
                  onClick={() => onToggleTask(task.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                    checked
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-slate-500'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 text-slate-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {}}
                    className="mt-0.5 w-4 h-4 accent-emerald-500 cursor-pointer"
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

      {/* Right 5 Cols: Rule of 100 Timer + 100-Day Streak */}
      <div className="lg:col-span-5 space-y-5">
        {/* 100-Day Streak Card */}
        <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-bold text-white">100-Day Execution Streak</h3>
                <p className="text-[11px] text-slate-400">100 mins/day × 100 days in a row</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                max="100"
                value={streakDays}
                onChange={(e) => onUpdateStreak(e.target.value)}
                className="w-14 text-center bg-slate-950 border border-slate-700 rounded-lg py-1 font-mono font-black text-amber-400 text-sm"
              />
              <span className="text-xs font-mono text-slate-500">/ 100</span>
            </div>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all"
              style={{ width: `${Math.min(100, streakDays)}%` }}
            />
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            Rule of 100 Focus Timer
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {[
              { k: 'speed', t: '40m Leads', s: 'WhatsApp' },
              { k: 'creative', t: '30m Hooks', s: 'B-Roll' },
              { k: 'data', t: '30m Data', s: 'Hygiene' }
            ].map((b) => (
              <button
                key={b.k}
                onClick={() => selectBlock(b.k)}
                className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                  activeBlock === b.k
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-xs font-bold">{b.t}</div>
                <div className="text-[10px] opacity-75">{b.s}</div>
              </button>
            ))}
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-center">
            <div className="text-[11px] uppercase tracking-wider text-emerald-400 font-bold">
              {blocks[activeBlock].label}
            </div>
            <div className="text-4xl font-black font-mono text-white my-2">{fmtTime(secondsLeft)}</div>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer"
              >
                {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isRunning ? 'Pause' : 'Start Block'}
              </button>
              <button
                onClick={() => {
                  setIsRunning(false);
                  setSecondsLeft(blocks[activeBlock].mins * 60);
                }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>

          <form onSubmit={handleLogToday} className="flex gap-2">
            <input
              type="text"
              value={logNotes}
              onChange={(e) => setLogNotes(e.target.value)}
              placeholder="Log today's key win (increments streak)..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-emerald-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs cursor-pointer"
            >
              Log Day
            </button>
          </form>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {(ruleOf100Logs || []).map((log) => (
              <div key={log.id} className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-[11px]">
                <div className="flex justify-between font-mono text-slate-400">
                  <span>{log.date}</span>
                  <span className="text-emerald-400 font-bold">100 mins</span>
                </div>
                <p className="text-slate-300 mt-1">{log.notes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TAB 6: PROOF-OF-WORK CASE STUDY SNAPSHOT (PII-REDACTED)
// ============================================================================

function CaseStudyTab({ client, analytics, showToast }) {
  const { currency, creatives } = client;
  const [copied, setCopied] = useState(false);

  // Identify top winning hook by leads & lowest CPL
  const winningCreative = useMemo(() => {
    const sorted = [...creatives].sort((a, b) => (Number(b.leads) || 0) - (Number(a.leads) || 0));
    return sorted[0] || null;
  }, [creatives]);

  const pitchSummaryText = `🚀 PAID ACQUISITION CASE STUDY — ${client.name.toUpperCase()}
Offer: ${client.coreOffer}
Stage: ${client.currentPhase}

📊 VERIFIED PERFORMANCE (PII REDACTED):
• Total Ad Outlay (incl. ${client.economics.vatRate}% VAT): ${formatMoney(analytics.actualOutlayInclVat, currency)}
• Qualified WhatsApp Leads: ${analytics.totalActualLeads}
• Closed Paid Bookings: ${analytics.closedBookings}
• Verified Gross Revenue: ${formatMoney(analytics.actualGrossRevenue, currency)}
• Verified Gross Profit (${client.economics.grossMarginPct}% margin): ${formatMoney(analytics.actualGrossProfit, currency)}
• Verified LTGP:CAC Ratio: ${formatDec(analytics.verifiedLtgpCac, 1)} : 1
• Winning Hook Asset ID: ${winningCreative ? `${winningCreative.assetId} (${winningCreative.adName})` : 'In Testing'}

Built with closed-loop Meta Pixel + PostHog + SHA-256 Offline CAPI attribution.`;

  const handleCopyPitch = () => {
    navigator.clipboard?.writeText(pitchSummaryText);
    setCopied(true);
    showToast('Client-pitchable Case Study summary copied (all customer PII redacted).');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold uppercase tracking-wider">
              <FileCheck2 className="w-3.5 h-3.5" /> Verified Proof-of-Work Snapshot • PII Redacted
            </span>
            <h2 className="text-2xl font-black text-white mt-2.5">{client.name}</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              {client.coreOffer} • {client.website.replace(/^https?:\/\//, '')}
            </p>
          </div>

          <button
            onClick={handleCopyPitch}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition cursor-pointer shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
            {copied ? 'Pitch Summary Copied!' : 'Copy Pitch Summary'}
          </button>
        </div>

        {/* Metrics Showcase */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs text-slate-400">Total Outlay (incl. {client.economics.vatRate}% VAT)</div>
            <div className="text-xl font-black font-mono text-white mt-1">
              {formatMoney(analytics.actualOutlayInclVat, currency)}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs text-slate-400">Leads → Closed Bookings</div>
            <div className="text-xl font-black font-mono text-sky-400 mt-1">
              {analytics.totalActualLeads} → {analytics.closedBookings}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-emerald-500/40 rounded-2xl p-4">
            <div className="text-xs text-emerald-300">Verified LTGP : CAC</div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {formatDec(analytics.verifiedLtgpCac, 1)} : 1
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs text-slate-400">Gross Revenue Closed</div>
            <div className="text-xl font-black font-mono text-white mt-1">
              {formatMoney(analytics.actualGrossRevenue, currency)}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs text-slate-400">Gross Profit ({client.economics.grossMarginPct}%)</div>
            <div className="text-xl font-black font-mono text-emerald-400 mt-1">
              {formatMoney(analytics.actualGrossProfit, currency)}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
            <div className="text-xs text-slate-400">Winning Hook Asset ID</div>
            <div className="text-sm font-black font-mono text-amber-300 mt-1.5 truncate">
              {winningCreative ? winningCreative.adName : 'N/A'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {winningCreative ? `${winningCreative.leads} WhatsApp leads` : ''}
            </div>
          </div>
        </div>

        {/* Privacy Redaction Guarantee */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              All personal customer phone numbers, emails, and names are automatically stripped from this snapshot for safe client pitching & portfolio screenshots.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL: + ADD NEW CLIENT WORKSPACE
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
    avgOrderValue: 50000,
    grossMarginPct: 50,
    targetCpl: 350,
    closeRatePct: 12,
    depositPct: 30,
    fleetUnits: 2,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
          <div>
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-400" />
              Onboard New Client Workspace
            </h2>
            <p className="text-xs text-slate-400">Independent ledger, VAT runway & unit economics</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Client Name *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Mara Ridge Eco Safaris"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Meta Ad Account ID</label>
              <input
                type="text"
                value={form.metaAccountId}
                onChange={(e) => setForm({ ...form, metaAccountId: e.target.value })}
                placeholder="e.g., 384434063915420"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Domain / Website</label>
              <input
                type="text"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Core Flagship Offer</label>
              <input
                type="text"
                value={form.coreOffer}
                onChange={(e) => setForm({ ...form, coreOffer: e.target.value })}
                placeholder="e.g., 4x4 Cruiser Hire + Guide"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value, vatRate: e.target.value === 'KES' ? 16 : 0 })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-white"
              >
                <option value="KES">KES</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">VAT %</label>
              <input
                type="number"
                value={form.vatRate}
                onChange={(e) => setForm({ ...form, vatRate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Daily Budget</label>
              <input
                type="number"
                value={form.dailyBudget}
                onChange={(e) => setForm({ ...form, dailyBudget: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Avg Order Value</label>
              <input
                type="number"
                value={form.avgOrderValue}
                onChange={(e) => setForm({ ...form, avgOrderValue: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Gross Margin %</label>
              <input
                type="number"
                value={form.grossMarginPct}
                onChange={(e) => setForm({ ...form, grossMarginPct: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Fleet Cap / Mo</label>
              <input
                type="number"
                value={form.fleetMaxMonthlyBookings}
                onChange={(e) => setForm({ ...form, fleetMaxMonthlyBookings: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white"
              />
            </div>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-around text-center">
            <div>
              <div className="text-[10px] uppercase text-slate-400">GP / Booking</div>
              <div className="font-mono font-bold text-white">{formatMoney(gp, form.currency)}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400">Max CAC (3:1)</div>
              <div className="font-mono font-bold text-emerald-400">{formatMoney(maxCac, form.currency)}</div>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold cursor-pointer"
            >
              Create Workspace
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}