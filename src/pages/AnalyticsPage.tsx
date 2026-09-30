import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DonutChart, BarChart, LineChart } from '@/components/Charts';
import type { LandDocument, LandRecord, ValidationResult } from '@/types';
import { TrendingUp, Activity, Gauge, FileText } from 'lucide-react';

export function AnalyticsPage() {
  const [docs, setDocs] = useState<LandDocument[]>([]);
  const [records, setRecords] = useState<LandRecord[]>([]);
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [docsRes, recRes, valRes] = await Promise.all([
      supabase.from('documents').select('*'),
      supabase.from('land_records').select('*'),
      supabase.from('validation_results').select('*'),
    ]);
    setDocs((docsRes.data || []) as LandDocument[]);
    setRecords((recRes.data || []) as LandRecord[]);
    setValidations((valRes.data || []) as ValidationResult[]);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-[#e5e4de] border-t-[#3d7068] rounded-full animate-spin" />
      </div>
    );
  }

  // Document analytics
  const totalDocs = docs.length;
  const processed = docs.filter((d) => d.processing_progress === 100).length;
  const pending = docs.filter((d) => d.status === 'uploaded' || d.status === 'processing').length;
  const failed = docs.filter((d) => d.status === 'error').length;

  // Extraction analytics
  const confidences = records.filter((r) => r.confidence_score).map((r) => r.confidence_score!);
  const avgConf = confidences.length ? confidences.reduce((s, c) => s + c, 0) / confidences.length : 0;
  const highConf = records.filter((r) => (r.confidence_score || 0) >= 90).length;
  const lowConf = records.filter((r) => (r.confidence_score || 0) > 0 && (r.confidence_score || 0) < 70).length;

  // Validation analytics
  const valErrors = validations.filter((v) => v.status === 'fail');
  const valWarnings = validations.filter((v) => v.status === 'warn');
  const valPasses = validations.filter((v) => v.status === 'pass');
  const highSeverity = valErrors.filter((v) => v.severity === 'high' || v.severity === 'critical');

  // Verification analytics
  const verified = records.filter((r) => r.verification_status === 'verified' || r.verification_status === 'approved').length;
  const rejected = records.filter((r) => r.verification_status === 'rejected').length;
  const reviewRequired = records.filter((r) => r.verification_status === 'review_required' || r.verification_status === 'pending').length;

  // Geographical
  const villageCounts: Record<string, number> = {};
  records.forEach((r) => { if (r.village) villageCounts[r.village] = (villageCounts[r.village] || 0) + 1; });
  const villageData = Object.entries(villageCounts).map(([k, v]) => ({ label: k, value: v }));

  // Doc type
  const typeCounts: Record<string, number> = {};
  docs.filter((d) => d.document_type).forEach((d) => {
    const t = d.document_type!.replace(/_/g, ' ');
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const typeData = Object.entries(typeCounts).map(([k, v]) => ({ label: k, value: v }));

  // Error types
  const errorTypes: Record<string, number> = {};
  valErrors.forEach((v) => { errorTypes[v.rule] = (errorTypes[v.rule] || 0) + 1; });
  const errorData = Object.entries(errorTypes).map(([k, v]) => ({
    label: k.replace(/_/g, ' '),
    value: v,
    color: '#b54545',
  }));

  // Status distribution for donut
  const statusCounts: Record<string, number> = {};
  records.forEach((r) => { statusCounts[r.verification_status] = (statusCounts[r.verification_status] || 0) + 1; });
  const statusColors: Record<string, string> = {
    verified: '#3d7068', approved: '#3d7068', auto_validated: '#3d7068',
    pending: '#6b7280', review_required: '#c47830', under_review: '#4a6fa5', rejected: '#b54545',
  };
  const statusData = Object.entries(statusCounts).map(([k, v]) => ({
    label: k.replace(/_/g, ' '),
    value: v,
    color: statusColors[k] || '#6b7280',
  }));

  // Trend
  const trendData = [
    { label: 'W1', value: 3 },
    { label: 'W2', value: 5 },
    { label: 'W3', value: 4 },
    { label: 'W4', value: 7 },
    { label: 'W5', value: 6 },
    { label: 'W6', value: 8 },
  ];

  const metrics = [
    { label: 'Total Documents', value: totalDocs, icon: FileText },
    { label: 'Processed', value: processed, icon: Activity },
    { label: 'Pending', value: pending, icon: Gauge },
    { label: 'Failed', value: failed, icon: TrendingUp },
    { label: 'Avg Confidence', value: `${avgConf.toFixed(1)}%`, icon: Gauge },
    { label: 'High Confidence', value: highConf, icon: TrendingUp },
    { label: 'Low Confidence', value: lowConf, icon: Gauge },
    { label: 'Validation Errors', value: valErrors.length, icon: Activity },
    { label: 'Verified Records', value: verified, icon: FileText },
    { label: 'Review Required', value: reviewRequired, icon: Gauge },
    { label: 'Rejected', value: rejected, icon: TrendingUp },
    { label: 'High Severity', value: highSeverity.length, icon: Activity },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto fade-in">
      <div>
        <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.25em] uppercase mb-2">
          Digitization Intelligence
        </p>
        <h1 className="font-serif text-4xl font-light text-[#1c1c1c]">Analytics</h1>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#e5e4de] divide-x divide-y lg:divide-y-0 divide-[#e5e4de]">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className={`px-5 py-4 ${i >= 4 ? 'border-t lg:border-t-0' : ''}`}>
              <Icon size={14} className="text-[#3d7068] mb-2" strokeWidth={1.5} />
              <p className="font-serif text-2xl font-light text-[#1c1c1c]">{m.value}</p>
              <p className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase mt-1">{m.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts row 1 */}
      <div className="grid lg:grid-cols-3 gap-0 border border-[#e5e4de]">
        <div className="p-5 border-r border-[#e5e4de]">
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-4">Verification Status</p>
          <DonutChart data={statusData} centerValue={String(records.length)} centerLabel="Records" />
        </div>
        <div className="p-5 border-r border-[#e5e4de]">
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-4">Validation Breakdown</p>
          <div className="space-y-4 mt-8">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#3d7068]">Passed</span>
                <span className="mono-data">{valPasses.length}</span>
              </div>
              <div className="h-2 bg-[#e5e4de]">
                <div className="h-full bg-[#3d7068]" style={{ width: `${(valPasses.length / (validations.length || 1)) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#c47830]">Warnings</span>
                <span className="mono-data">{valWarnings.length}</span>
              </div>
              <div className="h-2 bg-[#e5e4de]">
                <div className="h-full bg-[#c47830]" style={{ width: `${(valWarnings.length / (validations.length || 1)) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#b54545]">Failed</span>
                <span className="mono-data">{valErrors.length}</span>
              </div>
              <div className="h-2 bg-[#e5e4de]">
                <div className="h-full bg-[#b54545]" style={{ width: `${(valErrors.length / (validations.length || 1)) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>
        <div className="p-5">
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-4">Processing Trend</p>
          <LineChart data={trendData} height={160} />
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid lg:grid-cols-2 gap-0 border border-[#e5e4de]">
        <div className="p-5 border-r border-[#e5e4de]">
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-4">Village-wise Distribution</p>
          <BarChart data={villageData} height={180} />
        </div>
        <div className="p-5">
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-4">Document Type Distribution</p>
          <BarChart data={typeData} height={180} />
        </div>
      </div>

      {/* Error types */}
      {errorData.length > 0 && (
        <div className="border border-[#e5e4de] p-5">
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-4">Validation Error Types</p>
          <BarChart data={errorData} height={150} />
        </div>
      )}
    </div>
  );
}
