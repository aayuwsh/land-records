import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToastContext } from '@/context/ToastContext';
import { BarChart } from '@/components/Charts';
import type { LandDocument, LandRecord, ValidationResult, Conflict, DuplicateCandidate } from '@/types';
import { FileBarChart, Download, FileText } from 'lucide-react';

export function ReportsPage() {
  const { showToast } = useToastContext();
  const [docs, setDocs] = useState<LandDocument[]>([]);
  const [records, setRecords] = useState<LandRecord[]>([]);
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [conflicts, setConflicts] = useState<Conflict[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [d, r, v, c, dup] = await Promise.all([
      supabase.from('documents').select('*'),
      supabase.from('land_records').select('*'),
      supabase.from('validation_results').select('*'),
      supabase.from('conflicts').select('*'),
      supabase.from('duplicate_candidates').select('*'),
    ]);
    setDocs((d.data || []) as LandDocument[]);
    setRecords((r.data || []) as LandRecord[]);
    setValidations((v.data || []) as ValidationResult[]);
    setConflicts((c.data || []) as Conflict[]);
    setDuplicates((dup.data || []) as DuplicateCandidate[]);
    setLoading(false);
  }

  function generateReport(type: string, format: string) {
    let data: Record<string, unknown>[] = [];
    let filename = '';

    switch (type) {
      case 'digitization':
        data = docs.map((d) => ({
          filename: d.original_filename,
          status: d.status,
          village: d.village,
          type: d.document_type,
          confidence: d.overall_confidence,
          year: d.record_year,
        }));
        filename = 'digitization_progress';
        break;
      case 'verification':
        data = records.map((r) => ({
          survey: r.survey_number,
          owner: r.owner_name,
          village: r.village,
          status: r.verification_status,
          confidence: r.confidence_score,
        }));
        filename = 'verification_report';
        break;
      case 'validation':
        data = validations.map((v) => ({
          rule: v.rule,
          status: v.status,
          severity: v.severity,
          message: v.message,
          field: v.field_name,
        }));
        filename = 'validation_errors';
        break;
      case 'duplicates':
        data = duplicates.map((d) => ({
          record_a: d.record_a_id,
          record_b: d.record_b_id,
          similarity: d.similarity_score,
          status: d.status,
        }));
        filename = 'duplicate_report';
        break;
      case 'conflicts':
        data = conflicts.map((c) => ({
          type: c.conflict_type,
          field: c.field_name,
          value_a: c.value_a,
          value_b: c.value_b,
          severity: c.severity,
          status: c.status,
        }));
        filename = 'conflict_report';
        break;
      default:
        return;
    }

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      downloadBlob(blob, `${filename}.json`);
      showToast(`${type} report exported as JSON`, 'success');
    } else if (format === 'csv') {
      const headers = data.length > 0 ? Object.keys(data[0]) : [];
      const csv = [
        headers.join(','),
        ...data.map((row) => headers.map((h) => String(row[h] ?? '')).join(',')),
      ].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      downloadBlob(blob, `${filename}.csv`);
      showToast(`${type} report exported as CSV`, 'success');
    }
  }

  function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-[#e5e4de] border-t-[#3d7068] rounded-full animate-spin" />
      </div>
    );
  }

  const reports = [
    {
      key: 'digitization',
      title: 'Digitization Progress',
      desc: 'Document processing status and completion metrics',
      count: docs.length,
      icon: FileBarChart,
    },
    {
      key: 'verification',
      title: 'Verification Report',
      desc: 'Record verification status and officer actions',
      count: records.length,
      icon: FileText,
    },
    {
      key: 'validation',
      title: 'Validation Error Report',
      desc: 'All validation results including failures and warnings',
      count: validations.length,
      icon: FileText,
    },
    {
      key: 'duplicates',
      title: 'Duplicate Report',
      desc: 'Detected duplicate record candidates',
      count: duplicates.length,
      icon: FileText,
    },
    {
      key: 'conflicts',
      title: 'Conflict Report',
      desc: 'Ownership and data conflicts between records',
      count: conflicts.length,
      icon: FileText,
    },
  ];

  // Village summary
  const villageCounts: Record<string, number> = {};
  records.forEach((r) => { if (r.village) villageCounts[r.village] = (villageCounts[r.village] || 0) + 1; });
  const villageData = Object.entries(villageCounts).map(([k, v]) => ({ label: k, value: v }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto fade-in">
      <div>
        <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.25em] uppercase mb-2">
          Report Generation
        </p>
        <h1 className="font-serif text-4xl font-light text-[#1c1c1c]">Reports</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 border border-[#e5e4de] divide-x divide-y lg:divide-y-0 divide-[#e5e4de]">
        {[
          { label: 'Documents', value: docs.length },
          { label: 'Records', value: records.length },
          { label: 'Validations', value: validations.length },
          { label: 'Duplicates', value: duplicates.length },
          { label: 'Conflicts', value: conflicts.length },
        ].map((s, i) => (
          <div key={i} className={`px-4 py-3 ${i >= 2 ? 'border-t lg:border-t-0' : ''}`}>
            <p className="font-serif text-2xl font-light text-[#1c1c1c]">{s.value}</p>
            <p className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Village chart */}
      <div className="border border-[#e5e4de] p-5">
        <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-4">Geographical Summary</p>
        <BarChart data={villageData} height={150} />
      </div>

      {/* Report cards */}
      <div className="space-y-3">
        <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase">Available Reports</p>
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <div key={report.key} className="border border-[#e5e4de] p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-10 h-10 border border-[#e5e4de] flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-[#3d7068]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-sm text-[#1c1c1c] font-medium">{report.title}</p>
                    <p className="text-xs text-[#6b7280] mt-0.5">{report.desc}</p>
                    <p className="text-[9px] mono-data text-[#b4b4b4] mt-1">{report.count} records</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => generateReport(report.key, 'csv')}
                    className="border border-[#e5e4de] px-3 py-2 mono-data text-[9px] tracking-[0.15em] uppercase text-[#1c1c1c] hover:border-[#3d7068] hover:text-[#3d7068] editorial-ease flex items-center gap-1"
                  >
                    <Download size={10} /> CSV
                  </button>
                  <button
                    onClick={() => generateReport(report.key, 'json')}
                    className="border border-[#e5e4de] px-3 py-2 mono-data text-[9px] tracking-[0.15em] uppercase text-[#1c1c1c] hover:border-[#3d7068] hover:text-[#3d7068] editorial-ease flex items-center gap-1"
                  >
                    <Download size={10} /> JSON
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border border-[#e5e4de] p-4 bg-[#f7f6f2]/50">
        <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">
          Prototype — CSV and JSON export available. PDF and Excel export available in production build.
        </p>
      </div>
    </div>
  );
}
