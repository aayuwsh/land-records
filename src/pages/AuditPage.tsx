import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { AuditLog } from '@/types';
import { ScrollText, Filter } from 'lucide-react';

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLogs();
  }, []);

  async function loadLogs() {
    setLoading(true);
    const { data } = await supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    setLogs((data || []) as AuditLog[]);
    setLoading(false);
  }

  const actions = [...new Set(logs.map((l) => l.action))];

  const filtered = logs.filter((l) => {
    if (actionFilter !== 'all' && l.action !== actionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!l.user_name?.toLowerCase().includes(q) &&
          !l.action.toLowerCase().includes(q) &&
          !l.entity_type?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto fade-in">
      <div>
        <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.25em] uppercase mb-2">
          Immutable Activity Log
        </p>
        <h1 className="font-serif text-4xl font-light text-[#1c1c1c]">Audit Trail</h1>
      </div>

      {/* Info banner */}
      <div className="border border-[#e5e4de] p-3 bg-[#eaf2f0]/20 flex items-center gap-3">
        <ScrollText size={14} className="text-[#3d7068]" />
        <p className="text-xs text-[#6b7280]">
          Audit logs are immutable — entries cannot be modified or deleted from the application interface.
        </p>
      </div>

      {/* Filters */}
      <div className="border border-[#e5e4de] p-4 flex flex-wrap gap-3 items-center">
        <Filter size={14} className="text-[#b4b4b4]" />
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="bg-transparent border border-[#e5e4de] px-2 py-1 text-xs text-[#1c1c1c] outline-none focus:border-[#3d7068]"
        >
          <option value="all">All Actions</option>
          {actions.map((a) => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by user or action..."
          className="bg-transparent border border-[#e5e4de] px-2 py-1 text-xs text-[#1c1c1c] outline-none focus:border-[#3d7068] placeholder:text-[#b4b4b4] placeholder:text-xs flex-1 min-w-[200px]"
        />
        <span className="text-[10px] mono-data text-[#b4b4b4]">{filtered.length} entries</span>
      </div>

      {/* Log table */}
      <div className="border border-[#e5e4de] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e4de] bg-[#f7f6f2]/50">
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Timestamp</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">User</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Role</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Action</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Entity</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e4de]">
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-[#b4b4b4]">Loading audit logs...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-[#b4b4b4]">No entries found</td></tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-white/30 editorial-ease">
                  <td className="px-4 py-2.5 text-[10px] mono-data text-[#6b7280] whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[#1c1c1c]">{log.user_name || '—'}</td>
                  <td className="px-4 py-2.5 text-[10px] mono-data text-[#b4b4b4] uppercase">{log.user_role || '—'}</td>
                  <td className="px-4 py-2.5 text-[10px] mono-data text-[#3d7068] tracking-[0.05em] uppercase">
                    {log.action.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[#6b7280]">{log.entity_type || '—'}</td>
                  <td className="px-4 py-2.5 text-[10px] mono-data text-[#b4b4b4] max-w-xs truncate">
                    {log.details ? JSON.stringify(log.details).slice(0, 100) : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
