import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { StatusBadge, ConfidenceBadge } from '@/components/StatusBadge';
import type { LandRecord } from '@/types';
import { Search, ChevronRight, LandPlot } from 'lucide-react';

export function SearchPage() {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<LandRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    village: '',
    status: 'all',
    minConfidence: '',
    minArea: '',
  });

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  async function performSearch(q: string) {
    setLoading(true);
    let dbQuery = supabase.from('land_records').select('*');

    if (q) {
      dbQuery = dbQuery.or(`owner_name.ilike.%${q}%,survey_number.ilike.%${q}%,khasra_number.ilike.%${q}%,village.ilike.%${q}%,khata_number.ilike.%${q}%`);
    }
    if (filters.village) {
      dbQuery = dbQuery.ilike('village', `%${filters.village}%`);
    }
    if (filters.status !== 'all') {
      dbQuery = dbQuery.eq('verification_status', filters.status);
    }
    if (filters.minConfidence) {
      dbQuery = dbQuery.gte('confidence_score', parseFloat(filters.minConfidence));
    }
    if (filters.minArea) {
      dbQuery = dbQuery.gte('area', parseFloat(filters.minArea));
    }

    const { data } = await dbQuery.order('created_at', { ascending: false }).limit(50);
    setResults((data || []) as LandRecord[]);
    setLoading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    performSearch(query);
  }

  const statuses = ['all', 'pending', 'auto_validated', 'review_required', 'under_review', 'verified', 'approved', 'rejected'];

  return (
    <div className="space-y-6 max-w-7xl mx-auto fade-in">
      <div>
        <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.25em] uppercase mb-2">
          Advanced Record Search
        </p>
        <h1 className="font-serif text-4xl font-light text-[#1c1c1c]">Search</h1>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="border border-[#e5e4de] p-4">
        <div className="flex items-center gap-3 mb-4">
          <Search size={16} className="text-[#b4b4b4]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by owner, survey number, khasra, village..."
            className="flex-1 bg-transparent text-sm text-[#1c1c1c] outline-none placeholder:text-[#b4b4b4] placeholder:text-xs"
            autoFocus
          />
          <button type="submit" className="bg-[#3d7068] text-[#f7f6f2] px-4 py-2 mono-data text-[10px] tracking-[0.2em] uppercase">
            Search
          </button>
        </div>

        {/* Filters */}
        <div className="grid sm:grid-cols-4 gap-3 pt-3 border-t border-[#e5e4de]">
          <div>
            <label className="block text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase mb-1">Village</label>
            <input
              type="text"
              value={filters.village}
              onChange={(e) => setFilters({ ...filters, village: e.target.value })}
              placeholder="e.g. Rampur"
              className="w-full bg-transparent border-b border-[#e5e4de] py-1 text-sm text-[#1c1c1c] outline-none focus:border-[#3d7068] placeholder:text-[#b4b4b4] placeholder:text-xs"
            />
          </div>
          <div>
            <label className="block text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full bg-transparent border-b border-[#e5e4de] py-1 text-sm text-[#1c1c1c] outline-none focus:border-[#3d7068]"
            >
              {statuses.map((s) => <option key={s} value={s}>{s === 'all' ? 'All' : s.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase mb-1">Min Confidence</label>
            <input
              type="number"
              value={filters.minConfidence}
              onChange={(e) => setFilters({ ...filters, minConfidence: e.target.value })}
              placeholder="e.g. 70"
              className="w-full bg-transparent border-b border-[#e5e4de] py-1 text-sm text-[#1c1c1c] outline-none focus:border-[#3d7068] placeholder:text-[#b4b4b4] placeholder:text-xs"
            />
          </div>
          <div>
            <label className="block text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase mb-1">Min Area (ha)</label>
            <input
              type="number"
              value={filters.minArea}
              onChange={(e) => setFilters({ ...filters, minArea: e.target.value })}
              placeholder="e.g. 2.0"
              className="w-full bg-transparent border-b border-[#e5e4de] py-1 text-sm text-[#1c1c1c] outline-none focus:border-[#3d7068] placeholder:text-[#b4b4b4] placeholder:text-xs"
            />
          </div>
        </div>
      </form>

      {/* Results */}
      <div>
        <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-3">
          {loading ? 'Searching...' : `${results.length} result(s)`}
        </p>

        <div className="border border-[#e5e4de] divide-y divide-[#e5e4de]">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-2 border-[#e5e4de] border-t-[#3d7068] rounded-full animate-spin mx-auto" />
            </div>
          ) : results.length === 0 ? (
            <div className="p-12 text-center">
              <LandPlot size={24} className="mx-auto text-[#e5e4de] mb-2" />
              <p className="text-sm text-[#b4b4b4]">No records found. Try adjusting your search.</p>
            </div>
          ) : (
            results.map((rec) => (
              <Link
                key={rec.id}
                to={`/records/${rec.id}`}
                className="px-4 py-3 flex items-center justify-between hover:bg-white/40 editorial-ease block"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-10 h-10 border border-[#e5e4de] flex items-center justify-center flex-shrink-0">
                    <LandPlot size={14} className="text-[#3d7068]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-[#1c1c1c] truncate">
                      {rec.owner_name} — Survey {rec.survey_number}
                    </p>
                    <p className="text-[10px] mono-data text-[#b4b4b4] mt-0.5">
                      {rec.village}, {rec.district} · {rec.area} {rec.area_unit} · {rec.record_year}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {rec.confidence_score != null && <ConfidenceBadge score={rec.confidence_score} />}
                  <StatusBadge status={rec.verification_status} />
                  <ChevronRight size={14} className="text-[#b4b4b4]" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
