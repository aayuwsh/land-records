import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { StatusBadge, ConfidenceBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/Charts';
import type { LandDocument } from '@/types';
import { Upload, Filter, FileText, ChevronRight } from 'lucide-react';

export function DocumentsPage() {
  const [documents, setDocuments] = useState<LandDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [villageFilter, setVillageFilter] = useState<string>('all');

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setLoading(true);
    const { data } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    setDocuments((data || []) as LandDocument[]);
    setLoading(false);
  }

  const filtered = documents.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (typeFilter !== 'all' && d.document_type !== typeFilter) return false;
    if (villageFilter !== 'all' && d.village !== villageFilter) return false;
    return true;
  });

  const villages = [...new Set(documents.map((d) => d.village).filter(Boolean))] as string[];
  const statuses = ['pending_registrar_approval', 'approved_for_processing', 'correction_required', 'uploaded', 'processing', 'extracted', 'review_required', 'under_review', 'verified', 'approved', 'duplicate', 'conflict', 'rejected', 'digitized'];
  const types = ['khasra', 'khatauni', 'jamabandi', 'mutation_record', 'sale_deed', 'registration_record', 'property_register', 'tax_record'];

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto fade-in">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.25em] uppercase mb-2">
            Document Management
          </p>
          <h1 className="font-serif text-4xl font-light text-[#1c1c1c]">Documents</h1>
        </div>
        <Link
          to="/documents/upload"
          className="bg-[#3d7068] text-[#f7f6f2] px-5 py-2.5 mono-data text-[10px] tracking-[0.2em] uppercase cta-btn editorial-ease flex items-center gap-2"
        >
          <Upload size={12} /> Upload
        </Link>
      </div>

      {/* Filters */}
      <div className="border border-[#e5e4de] p-4 flex flex-wrap gap-4 items-center">
        <Filter size={14} className="text-[#b4b4b4]" />
        <div className="flex items-center gap-2">
          <label className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border border-[#e5e4de] px-2 py-1 text-xs text-[#1c1c1c] outline-none focus:border-[#3d7068]"
          >
            <option value="all">All</option>
            {statuses.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Type</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-transparent border border-[#e5e4de] px-2 py-1 text-xs text-[#1c1c1c] outline-none focus:border-[#3d7068]"
          >
            <option value="all">All</option>
            {types.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Village</label>
          <select
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            className="bg-transparent border border-[#e5e4de] px-2 py-1 text-xs text-[#1c1c1c] outline-none focus:border-[#3d7068]"
          >
            <option value="all">All</option>
            {villages.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <span className="ml-auto text-[10px] mono-data text-[#b4b4b4]">
          {filtered.length} of {documents.length} documents
        </span>
      </div>

      {/* Table */}
      <div className="border border-[#e5e4de] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#e5e4de] bg-[#f7f6f2]/50">
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">File</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Type</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Location</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Lang</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Quality</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Confidence</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Status</th>
              <th className="px-4 py-3 text-left text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Progress</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e4de]">
            {loading ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center text-sm text-[#b4b4b4]">Loading documents...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-12 text-center">
                <FileText size={24} className="mx-auto text-[#e5e4de] mb-2" />
                <p className="text-sm text-[#b4b4b4]">No documents found</p>
              </td></tr>
            ) : (
              filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-white/40 editorial-ease">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-[#b4b4b4] flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-[#1c1c1c] truncate">{doc.original_filename}</p>
                        <p className="text-[9px] mono-data text-[#b4b4b4]">{formatSize(doc.file_size)} · {doc.page_count}p</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#6b7280]">{doc.document_type?.replace(/_/g, ' ') || '—'}</td>
                  <td className="px-4 py-3 text-xs text-[#6b7280]">{doc.village || '—'}</td>
                  <td className="px-4 py-3 text-[10px] mono-data text-[#6b7280] uppercase">{doc.detected_language || '—'}</td>
                  <td className="px-4 py-3">
                    {doc.quality_score != null ? <ConfidenceBadge score={doc.quality_score} /> : <span className="text-[10px] mono-data text-[#b4b4b4]">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {doc.overall_confidence != null ? <ConfidenceBadge score={doc.overall_confidence} /> : <span className="text-[10px] mono-data text-[#b4b4b4]">—</span>}
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={doc.status} /></td>
                  <td className="px-4 py-3 w-24">
                    {doc.processing_progress > 0 && doc.processing_progress < 100 ? (
                      <ProgressBar value={doc.processing_progress} color="#4a6fa5" />
                    ) : doc.processing_progress === 100 ? (
                      <span className="text-[9px] mono-data text-[#3d7068] uppercase">Done</span>
                    ) : (
                      <span className="text-[9px] mono-data text-[#b4b4b4] uppercase">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link to={`/documents/${doc.id}`} className="text-[#b4b4b4] hover:text-[#3d7068]">
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
