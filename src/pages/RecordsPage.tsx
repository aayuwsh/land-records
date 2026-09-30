import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { StatusBadge, ConfidenceBadge } from '@/components/StatusBadge';
import type { LandRecord } from '@/types';
import { LandPlot, ChevronRight, Filter, Search } from 'lucide-react';

export function RecordsPage() {
  const [records, setRecords] = useState<LandRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [villageFilter, setVillageFilter] = useState('all');

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    setLoading(true);
    const { data } = await supabase
      .from('land_records')
      .select('*')
      .order('created_at', { ascending: false });
    setRecords((data || []) as LandRecord[]);
    setLoading(false);
  }

  const villages = [...new Set(records.map((r) => r.village).filter(Boolean))] as string[];
  const statuses = ['pending', 'auto_validated', 'review_required', 'under_review', 'verified', 'approved', 'rejected'];

  const filtered = records.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      if (!r.owner_name?.toLowerCase().includes(q) &&
          !r.survey_number?.toLowerCase().includes(q) &&
          !r.khasra_number?.toLowerCase().includes(q) &&
          !r.village?.toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== 'all' && r.verification_status !== statusFilter) return false;
    if (villageFilter !== 'all' && r.village !== villageFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto fade-in">
      <div>
        <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.25em] uppercase mb-2">
          Verified Land Records
        </p>
        <h1 className="font-serif text-4xl font-light text-[#1c1c1c]">Land Records</h1>
      </div>

      {/* Filters */}
      <div className="border border-[#e5e4de] p-4 flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={14} className="text-[#b4b4b4]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by owner, survey, khasra, village..."
            className="bg-transparent text-sm text-[#1c1c1c] outline-none flex-1 placeholder:text-[#b4b4b4] placeholder:text-xs"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-transparent border border-[#e5e4de] px-2 py-1 text-xs text-[#1c1c1c] outline-none focus:border-[#3d7068]"
        >
          <option value="all">All Status</option>
          {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select
          value={villageFilter}
          onChange={(e) => setVillageFilter(e.target.value)}
          className="bg-transparent border border-[#e5e4de] px-2 py-1 text-xs text-[#1c1c1c] outline-none focus:border-[#3d7068]"
        >
          <option value="all">All Villages</option>
          {villages.map((v) => <option key={v} value={v}>{v}</option>)}
        </select>
        <span className="text-[10px] mono-data text-[#b4b4b4]">{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="border border-[#e5e4de] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e4de] bg-[#f7f6f2]/50">
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Survey</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Khasra</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Owner</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Area</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Village</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Year</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Conf.</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e4de]">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-[#b4b4b4]">Loading records...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center">
                <LandPlot size={24} className="mx-auto text-[#e5e4de] mb-2" />
                <p className="text-sm text-[#b4b4b4]">No records found</p>
              </td></tr>
            ) : (
              filtered.map((rec) => (
                <tr key={rec.id} className="hover:bg-white/40 editorial-ease">
                  <td className="px-4 py-3 text-sm mono-data text-[#1c1c1c]">{rec.survey_number || '—'}</td>
                  <td className="px-4 py-3 text-xs mono-data text-[#6b7280]">{rec.khasra_number || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[#1c1c1c]">{rec.owner_name || '—'}</td>
                  <td className="px-4 py-3 text-xs mono-data text-[#6b7280]">{rec.area ? `${rec.area} ${rec.area_unit}` : '—'}</td>
                  <td className="px-4 py-3 text-xs text-[#6b7280]">{rec.village || '—'}</td>
                  <td className="px-4 py-3 text-xs mono-data text-[#6b7280]">{rec.record_year || '—'}</td>
                  <td className="px-4 py-3">{rec.confidence_score != null && <ConfidenceBadge score={rec.confidence_score} />}</td>
                  <td className="px-4 py-3"><StatusBadge status={rec.verification_status} /></td>
                  <td className="px-4 py-3">
                    <Link to={`/records/${rec.id}`} className="text-[#b4b4b4] hover:text-[#3d7068]">
                      <ChevronRight size={14} />
                    </Link>
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
