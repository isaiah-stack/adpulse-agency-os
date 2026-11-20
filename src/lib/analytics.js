// Shared, pure financial utilities used by the Admin Command Center and the Client Portal.

export const formatMoney = (amount, currency = 'KES', decimals = 0) => {
  const num = Number(amount);
  const safe = isFinite(num) && !isNaN(num) ? num : 0;
  return `${currency} ${safe.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
};

export const formatDec = (num, digits = 1) => {
  const n = Number(num);
  if (!isFinite(n) || isNaN(n)) return (0).toFixed(digits);
  return n.toFixed(digits);
};

export function normalizeKenyaPhoneE164(rawPhone) {
  if (!rawPhone) return '';
  let digits = String(rawPhone).replace(/[^\d]/g, '');
  if (digits.startsWith('0') && digits.length === 10) {
    digits = '254' + digits.slice(1);
  } else if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
    digits = '254' + digits;
  }
  return digits;
}

export function getHoursSince(isoDate) {
  if (!isoDate) return 999;
  const ts = new Date(isoDate).getTime();
  if (isNaN(ts)) return 999;
  return Math.max(0, (Date.now() - ts) / (1000 * 3600));
}

export function computeWorkspaceAnalytics(client) {
  const ec = client.economics;
  const dailyBudget = Number(ec.dailyBudget) || 0;
  const vatRate = Number(ec.vatRate) || 0;
  const aov = Number(ec.avgOrderValue) || 0;
  const gmPct = Number(ec.grossMarginPct) || 0;
  const targetCpl = Number(ec.targetCpl) || 1;
  const closeRatePct = Number(ec.closeRatePct) || 0;
  const depositPct = Number(ec.depositPct) || 0;
  const fleetCap = Number(ec.fleetMaxMonthlyBookings) || 1;

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

  // Scenario models for Financial Summary Chart (Conservative / Base / Optimistic)
  const buildScenario = (label, cplMultiplier, closeMultiplier) => {
    const cpl = Math.max(50, targetCpl * cplMultiplier);
    const cr = Math.min(80, closeRatePct * closeMultiplier);
    const leads = thirtyDayPreTaxSpend / cpl;
    const bookings = leads * (cr / 100);
    const revenue = bookings * aov;
    const grossProfit = bookings * gpPerBooking;
    const ratio = trueCashOutlay > 0 ? grossProfit / trueCashOutlay : 0;
    return { label, cpl, closeRate: cr, leads, bookings, revenue, grossProfit, ratio };
  };

  const scenarios = [
    buildScenario('Conservative', 1.43, 0.85),
    buildScenario('Base Target', 1.0, 1.0),
    buildScenario('Optimistic', 0.65, 1.2)
  ];

  // M-Pesa / Prepaid VAT Runway Ledger
  const totalGrossTopUps = (client.topUps || []).reduce((s, t) => s + (Number(t.grossAmount) || 0), 0);
  const netUsableFromTopUps = totalGrossTopUps / (1 + vatRate / 100);
  const totalVatDeducted = totalGrossTopUps - netUsableFromTopUps;
  const fundedRunwayDays = dailyBudget > 0 ? netUsableFromTopUps / dailyBudget : 0;

  const totalCreativeSpend = (client.creatives || []).reduce((s, c) => s + (Number(c.spend) || 0), 0);
  // Prepaid balance must be measured against spend since the first top-up (synced from
  // Meta as prepaidSpend). Ad-level spend is a rolling 30-day window once synced, so it
  // is only used as a fallback (local mode / never-synced workspaces).
  const hasPrepaidSpend = client.prepaidSpend !== null && client.prepaidSpend !== undefined;
  const spendAgainstBalance = hasPrepaidSpend ? Number(client.prepaidSpend) || 0 : totalCreativeSpend;
  const remainingNetBalance = netUsableFromTopUps - spendAgainstBalance;
  const daysRunwayLeft = dailyBudget > 0 ? remainingNetBalance / dailyBudget : 0;

  // Actual CRM & Creative Performance.
  // When creative spend is a synced rolling window (spendWindowDays), leads are limited to
  // the same window so ROI, cost per inquiry and ROAS compare like with like.
  const windowDays = Number(client.spendWindowDays) || 0;
  const allLeads = client.leads || [];
  const windowLeads = windowDays
    ? allLeads.filter((l) => getHoursSince(l.createdAt) <= windowDays * 24)
    : allLeads;
  const isPaid = (l) => l.stage === 'Deposit Paid' || l.stage === 'Completed';
  const totalActualLeads = windowLeads.length;
  const paidLeads = windowLeads.filter(isPaid);
  const closedBookings = paidLeads.length;
  const totalDepositsCollected = windowLeads.reduce(
    (s, l) => s + (Number(l.depositPaid) || 0),
    0
  );
  const actualGrossRevenue = paidLeads.reduce(
    (s, l) => s + (Number(l.quoteValue) || 0) + (Number(l.addonsValue) || 0),
    0
  );
  const actualGrossProfit = actualGrossRevenue * (gmPct / 100);
  const actualOutlayInclVat = totalCreativeSpend * (1 + vatRate / 100);
  const verifiedRoas = actualOutlayInclVat > 0 ? actualGrossRevenue / actualOutlayInclVat : 0;
  const verifiedLtgpCac =
    actualOutlayInclVat > 0 && actualGrossProfit > 0
      ? actualGrossProfit / actualOutlayInclVat
      : projectedLtgpCac;

  // Guardrails
  const activeAdsCount = (client.creatives || []).filter((c) => c.status === 'Active').length;
  const fragmentationRisk = client.currency === 'KES' && dailyBudget <= 300 && activeAdsCount > 2;
  const staleCapiLeads = allLeads.filter(isPaid).filter(
    (l) => !l.capiExported && getHoursSince(l.createdAt) >= 5 * 24
  );
  const slaBreaches = (client.leads || []).filter((l) => (Number(l.responseMins) || 0) > 5);

  const alerts = [];
  if (projectedLtgpCac < 3.0) {
    alerts.push({
      severity: 'alert',
      title: 'LTGP:CAC Below 3.0:1 Floor',
      detail: `Current ratio (${formatDec(projectedLtgpCac, 1)}:1) is below target. Fix offer or CPL before scaling.`,
      targetView: 'economics'
    });
  }
  if (staleCapiLeads.length > 0) {
    alerts.push({
      severity: 'alert',
      title: `Meta CAPI 7-Day Window Alert (${staleCapiLeads.length} overdue)`,
      detail: 'Paid booking(s) older than 5 days pending SHA-256 Offline Conversions CSV upload.',
      targetView: 'crm'
    });
  }
  if (fragmentationRisk) {
    alerts.push({
      severity: 'caution',
      title: 'Budget Fragmentation Risk',
      detail: `${activeAdsCount} active ads on ${formatMoney(dailyBudget, client.currency)}/day. Limit to 1-2 ads.`,
      targetView: 'creatives'
    });
  }
  if (daysRunwayLeft < 5) {
    alerts.push({
      severity: 'caution',
      title: `Low M-Pesa VAT Runway (${formatDec(Math.max(0, daysRunwayLeft), 1)} days left)`,
      detail: `Remaining net balance is ${formatMoney(Math.max(0, remainingNetBalance), client.currency, 2)}. Schedule refill.`,
      targetView: 'economics'
    });
  }
  if (fleetExceeded) {
    alerts.push({
      severity: 'caution',
      title: 'Fleet Capacity Ceiling Reached',
      detail: `Projected ${formatDec(projectedBookings, 1)} bookings/mo exceeds ${fleetCap}/mo fleet capacity.`,
      targetView: 'economics'
    });
  }
  if (slaBreaches.length > 0) {
    alerts.push({
      severity: 'caution',
      title: `Speed-to-Lead SLA Breach (${slaBreaches.length})`,
      detail: 'One or more WhatsApp inquiries exceeded the 5-minute response benchmark.',
      targetView: 'crm'
    });
  }

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
    scenarios,
    totalGrossTopUps,
    netUsableFromTopUps,
    totalVatDeducted,
    fundedRunwayDays,
    totalCreativeSpend,
    spendAgainstBalance,
    windowDays,
    remainingNetBalance,
    daysRunwayLeft,
    totalActualLeads,
    closedBookings,
    totalDepositsCollected,
    actualGrossRevenue,
    actualGrossProfit,
    actualOutlayInclVat,
    verifiedRoas,
    verifiedLtgpCac,
    activeAdsCount,
    fragmentationRisk,
    staleCapiLeads,
    slaBreaches,
    alerts,
    depositPerBooking: aov * (depositPct / 100)
  };
}
