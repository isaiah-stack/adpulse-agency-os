import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { matchWorkspace } from '../lib/dataService';

/**
 * Lets an admin choose which locally stored (or JSON-backup) workspaces to copy into
 * Supabase. Nothing is pre-selected, so demo presets are never imported by accident.
 */
export default function LocalDataImport({ source, workspaces, existing, onImport, onClose }) {
  const [selected, setSelected] = useState(() => new Set());
  const [busy, setBusy] = useState(false);

  const toggle = (id) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleImport = async () => {
    setBusy(true);
    try {
      await onImport(workspaces.filter((w) => selected.has(w.id)));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/40" onClick={busy ? undefined : onClose} />
      <div className="relative w-full max-w-lg card-surface rounded-xl shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E7EB]">
          <div>
            <h2 className="text-sm font-semibold text-[#0F172A]">Import into Supabase</h2>
            <p className="text-xs text-[#64748B] mt-0.5">
              {source === 'browser'
                ? 'Workspaces saved in this browser while running in local mode.'
                : 'Workspaces from the selected JSON backup.'}
            </p>
          </div>
          <button onClick={onClose} disabled={busy} className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer">
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-2 max-h-[50vh] overflow-y-auto">
          {workspaces.map((w) => {
            const match = matchWorkspace(w, existing);
            return (
              <label
                key={w.id}
                className="flex items-start gap-3 p-3 rounded-lg border border-[#E5E7EB] hover:bg-[#F7F8FA] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.has(w.id)}
                  onChange={() => toggle(w.id)}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-[#0F172A] truncate">{w.name}</div>
                  <div className="text-[11px] text-[#64748B] font-mono">
                    {(w.leads || []).length} leads · {(w.creatives || []).length} ads · {(w.topUps || []).length} top-ups
                  </div>
                  <div className="text-[11px] text-[#475569] mt-1">
                    {match
                      ? `Merges into existing "${match.name}": adds missing leads, ads and top-ups; keeps its Supabase settings.`
                      : 'Creates a new workspace.'}
                  </div>
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-[#E5E7EB]">
          <span className="text-[11px] text-[#64748B]">
            Demo presets (sample leads) should be left unticked.
          </span>
          <button
            onClick={handleImport}
            disabled={busy || selected.size === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0F172A] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-medium cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" strokeWidth={1.75} />
            {busy ? 'Importing' : `Import ${selected.size || ''}`.trim()}
          </button>
        </div>
      </div>
    </div>
  );
}
