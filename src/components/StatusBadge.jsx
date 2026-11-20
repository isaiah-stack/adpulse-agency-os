// Semantic status badge helper (restrained institutional palette)
export default function StatusBadge({ tone = 'neutral', children, icon: Icon }) {
  const styles = {
    healthy: 'text-[#065F46] bg-[#ECFDF5] border-[#A7F3D0]',
    caution: 'text-[#92400E] bg-[#FFFBEB] border-[#FDE68A]',
    alert: 'text-[#991B1B] bg-[#FEF2F2] border-[#FECACA]',
    neutral: 'text-[#334155] bg-[#F1F5F9] border-[#E2E8F0]'
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-xs font-medium whitespace-nowrap ${
        styles[tone] || styles.neutral
      }`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.75} />}
      {children}
    </span>
  );
}
