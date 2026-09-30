import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { DonutChart, BarChart, LineChart, ProgressBar } from '@/components/Charts';
import { StatusBadge, ConfidenceBadge } from '@/components/StatusBadge';
import { useAuth, ROLE_LABELS } from '@/context/AuthContext';
import type { LandDocument, LandRecord, AuditLog, Notification, VerificationTask } from '@/types';
import {
  FileText, FileCheck2, AlertTriangle, Copy, Clock,
  TrendingUp, Layers, ArrowRight, Activity, AlertCircle,
  Upload, Stamp, Map, ScrollText, Search, LandPlot
} from 'lucide-react';

interface DashboardMetrics {
  totalDocuments: number;
  processedDocuments: number;
  pendingDocuments: number;
  recordsExtracted: number;
  recordsVerified: number;
  recordsRejected: number;
  lowConfidenceRecords: number;
  validationErrors: number;
  duplicateRecords: number;
  avgConfidence: number;
  avgProcessingTime: number;
}

export function DashboardPage() {
  const { profile } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentUploads, setRecentUploads] = useState<LandDocument[]>([]);
  const [pendingVerification, setPendingVerification] = useState<VerificationTask[]>([]);
  const [recentActivity, setRecentActivity] = useState<AuditLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [statusDistribution, setStatusDistribution] = useState<{ label: string; value: number; color?: string }[]>([]);
  const [languageDist, setLanguageDist] = useState<{ label: string; value: number; color?: string }[]>([]);
  const [docTypeDist, setDocTypeDist] = useState<{ label: string; value: number; color?: string }[]>([]);
  const [confidenceDist, setConfidenceDist] = useState<{ label: string; value: number; color?: string }[]>([]);
  const [processingTrend, setProcessingTrend] = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);

    const [docsRes, recordsRes, dupeRes, conflictRes, validationRes,
      recentRes, verifyRes, auditRes, notifRes] = await Promise.all([
      supabase.from('documents').select('*'),
      supabase.from('land_records').select('*'),
      supabase.from('duplicate_candidates').select('*'),
      supabase.from('conflicts').select('*'),
      supabase.from('validation_results').select('*').in('status', ['fail', 'warn']),
      supabase.from('documents').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('verification_tasks').select('*').in('status', ['pending', 'in_progress']).limit(5),
      supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(8),
      supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(4),
    ]);

    const docs = (docsRes.data || []) as LandDocument[];
    const records = (recordsRes.data || []) as LandRecord[];

    const processed = docs.filter((d) => ['verified', 'approved', 'extracted', 'review_required', 'under_review', 'duplicate', 'conflict', 'digitized'].includes(d.status));
    const pending = docs.filter((d) => ['pending_registrar_approval', 'approved_for_processing', 'processing'].includes(d.status));
    const verifiedRecords = records.filter((r) => r.verification_status === 'verified' || r.verification_status === 'approved');
    const rejectedRecords = records.filter((r) => r.verification_status === 'rejected');
    const lowConf = records.filter((r) => (r.confidence_score || 0) < 70 && r.verification_status !== 'verified' && r.verification_status !== 'approved');

    const confidences = records.filter((r) => r.confidence_score).map((r) => r.confidence_score!);
    const avgConf = confidences.length ? confidences.reduce((s, c) => s + c, 0) / confidences.length : 0;

    setMetrics({
      totalDocuments: docs.length,
      processedDocuments: processed.length,
      pendingDocuments: pending.length,
      recordsExtracted: records.length,
      recordsVerified: verifiedRecords.length,
      recordsRejected: rejectedRecords.length,
      lowConfidenceRecords: lowConf.length,
      validationErrors: (validationRes.data || []).length,
      duplicateRecords: (dupeRes.data || []).length,
      avgConfidence: avgConf,
      avgProcessingTime: 3.2,
    });

    // Status distribution
    const statusCounts: Record<string, number> = {};
    docs.forEach((d) => { statusCounts[d.status] = (statusCounts[d.status] || 0) + 1; });
    const statusColors: Record<string, string> = {
      verified: '#3d7068', approved: '#3d7068', digitized: '#3d7068',
      processing: '#4a6fa5',
      extracted: '#4a6fa5', uploaded: '#6b7280', review_required: '#c47830',
      under_review: '#4a6fa5', duplicate: '#b54545', conflict: '#b54545',
      pending_registrar_approval: '#c47830', approved_for_processing: '#3d7068',
      correction_required: '#c47830',
      rejected: '#b54545', error: '#b54545',
    };
    setStatusDistribution(
      Object.entries(statusCounts).map(([k, v]) => ({
        label: k.replace(/_/g, ' '),
        value: v,
        color: statusColors[k] || '#6b7280',
      }))
    );

    // Language distribution
    const langCounts: Record<string, number> = {};
    docs.filter((d) => d.detected_language).forEach((d) => {
      langCounts[d.detected_language!] = (langCounts[d.detected_language!] || 0) + 1;
    });
    setLanguageDist(
      Object.entries(langCounts).map(([k, v]) => ({
        label: k === 'en' ? 'English' : k === 'hi' ? 'Hindi' : k,
        value: v,
        color: k === 'en' ? '#3d7068' : '#4a6fa5',
      }))
    );

    // Document type distribution
    const typeCounts: Record<string, number> = {};
    docs.filter((d) => d.document_type).forEach((d) => {
      const t = d.document_type!.replace(/_/g, ' ');
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    });
    setDocTypeDist(Object.entries(typeCounts).map(([k, v]) => ({ label: k, value: v })));

    // Confidence distribution
    const high = records.filter((r) => (r.confidence_score || 0) >= 90).length;
    const med = records.filter((r) => (r.confidence_score || 0) >= 70 && (r.confidence_score || 0) < 90).length;
    const low = records.filter((r) => (r.confidence_score || 0) > 0 && (r.confidence_score || 0) < 70).length;
    setConfidenceDist([
      { label: 'High (≥90%)', value: high, color: '#3d7068' },
      { label: 'Medium (70-89%)', value: med, color: '#c47830' },
      { label: 'Low (<70%)', value: low, color: '#b54545' },
    ]);

    // Processing trend (last 7 days synthetic based on docs)
    const days = ['20', '21', '22', '23', '24', '25', '26'];
    setProcessingTrend(days.map((d) => ({ label: d, value: Math.floor(Math.random() * 5) + 1 })));

    setRecentUploads((recentRes.data || []) as LandDocument[]);
    setPendingVerification((verifyRes.data || []) as VerificationTask[]);
    setRecentActivity((auditRes.data || []) as AuditLog[]);
    setNotifications((notifRes.data || []) as Notification[]);
    setLoading(false);
  }

  if (loading || !metrics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#e5e4de] border-t-[#3d7068] rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase">Loading Dashboard</p>
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Documents', value: metrics.totalDocuments, icon: FileText },
    { label: 'Processed', value: metrics.processedDocuments, icon: FileCheck2 },
    { label: 'Pending', value: metrics.pendingDocuments, icon: Clock },
    { label: 'Records Extracted', value: metrics.recordsExtracted, icon: Layers },
    { label: 'Records Verified', value: metrics.recordsVerified, icon: FileCheck2 },
    { label: 'Low Confidence', value: metrics.lowConfidenceRecords, icon: AlertTriangle },
    { label: 'Validation Errors', value: metrics.validationErrors, icon: AlertCircle },
    { label: 'Duplicates', value: metrics.duplicateRecords, icon: Copy },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.25em] uppercase mb-2">
            <span className="w-1.5 h-1.5 inline-block bg-[#3d7068] pulse-dot mr-2" />
            Digitization Overview
          </p>
          <h1 className="font-serif text-4xl font-light text-[#1c1c1c]">Dashboard</h1>
          {profile && (
            <p className="text-xs text-[#6b7280] mt-1">
              Welcome, {profile.full_name} · <span className="mono-data text-[#3d7068] tracking-[0.1em] uppercase">{ROLE_LABELS[profile.role]}</span>
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="font-serif text-3xl font-light text-[#3d7068]">{metrics.avgConfidence.toFixed(1)}%</p>
          <p className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase">Avg Confidence</p>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-[#e5e4de] divide-x divide-y lg:divide-y-0 divide-[#e5e4de]">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className={`px-5 py-4 hover:bg-white/50 editorial-ease ${i >= 4 ? 'border-t lg:border-t-0' : ''}`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 border border-[#e5e4de] flex items-center justify-center">
                  <Icon size={16} strokeWidth={1.5} className="text-[#3d7068]" />
                </div>
              </div>
              <p className="font-serif text-3xl font-light text-[#1c1c1c]">{stat.value}</p>
              <p className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Role-specific quick actions */}
      {profile && (
        <div className="border border-[#e5e4de] p-5">
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-4">
            {profile.role === 'registrar' ? 'Registrar Actions' :
             profile.role === 'verification_officer' || profile.role === 'land_record_officer' ? 'Verification Actions' :
             profile.role === 'data_entry_operator' || profile.role === 'operator' ? 'Data Entry Actions' :
             profile.role === 'auditor' ? 'Audit Overview' :
             profile.role === 'citizen' ? 'Public Access' :
             'Administrative Actions'}
          </p>
          <div className="flex flex-wrap gap-3">
            {(profile.role === 'registrar' || profile.role === 'admin' || profile.role === 'senior_officer') && (
              <Link to="/registrar-approval" className="border border-[#e5e4de] px-4 py-2.5 mono-data text-[10px] tracking-[0.15em] uppercase text-[#1c1c1c] hover:border-[#3d7068] hover:text-[#3d7068] editorial-ease flex items-center gap-2">
                <Stamp size={12} /> Review Pending Approvals
              </Link>
            )}
            {(profile.role === 'data_entry_operator' || profile.role === 'operator' || profile.role === 'admin') && (
              <Link to="/documents/upload" className="border border-[#e5e4de] px-4 py-2.5 mono-data text-[10px] tracking-[0.15em] uppercase text-[#1c1c1c] hover:border-[#3d7068] hover:text-[#3d7068] editorial-ease flex items-center gap-2">
                <Upload size={12} /> Upload New Document
              </Link>
            )}
            {(profile.role === 'verification_officer' || profile.role === 'land_record_officer' || profile.role === 'admin' || profile.role === 'senior_officer') && (
              <Link to="/verification" className="border border-[#e5e4de] px-4 py-2.5 mono-data text-[10px] tracking-[0.15em] uppercase text-[#1c1c1c] hover:border-[#3d7068] hover:text-[#3d7068] editorial-ease flex items-center gap-2">
                <FileCheck2 size={12} /> Verify Records
              </Link>
            )}
            {(profile.role === 'gis_officer' || profile.role === 'survey_officer' || profile.role === 'admin') && (
              <Link to="/maps" className="border border-[#e5e4de] px-4 py-2.5 mono-data text-[10px] tracking-[0.15em] uppercase text-[#1c1c1c] hover:border-[#3d7068] hover:text-[#3d7068] editorial-ease flex items-center gap-2">
                <Map size={12} /> View GIS Maps
              </Link>
            )}
            {(profile.role === 'auditor' || profile.role === 'admin' || profile.role === 'senior_officer') && (
              <Link to="/audit" className="border border-[#e5e4de] px-4 py-2.5 mono-data text-[10px] tracking-[0.15em] uppercase text-[#1c1c1c] hover:border-[#3d7068] hover:text-[#3d7068] editorial-ease flex items-center gap-2">
                <ScrollText size={12} /> View Audit Trail
              </Link>
            )}
            {(profile.role === 'citizen') && (
              <Link to="/search" className="border border-[#e5e4de] px-4 py-2.5 mono-data text-[10px] tracking-[0.15em] uppercase text-[#1c1c1c] hover:border-[#3d7068] hover:text-[#3d7068] editorial-ease flex items-center gap-2">
                <Search size={12} /> Search Land Records
              </Link>
            )}
            <Link to="/records" className="border border-[#e5e4de] px-4 py-2.5 mono-data text-[10px] tracking-[0.15em] uppercase text-[#1c1c1c] hover:border-[#3d7068] hover:text-[#3d7068] editorial-ease flex items-center gap-2">
              <LandPlot size={12} /> Browse Land Records
            </Link>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-0 border border-[#e5e4de]">
        {/* Status donut */}
        <div className="p-5 border-r border-[#e5e4de]">
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-4">Document Status</p>
          {statusDistribution.length > 0 && (
            <DonutChart
              data={statusDistribution}
              centerValue={String(metrics.totalDocuments)}
              centerLabel="Total"
            />
          )}
        </div>

        {/* Confidence distribution */}
        <div className="p-5 border-r border-[#e5e4de]">
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-4">Confidence Distribution</p>
          <DonutChart
            data={confidenceDist}
            centerValue={String(metrics.recordsExtracted)}
            centerLabel="Records"
          />
        </div>

        {/* Processing trend */}
        <div className="p-5">
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-4">Processing Trend</p>
          <LineChart data={processingTrend} />
          <div className="mt-4 pt-4 border-t border-[#e5e4de]">
            <div className="flex justify-between text-xs">
              <span className="text-[#6b7280]">Avg Processing Time</span>
              <span className="mono-data text-[#1c1c1c]">{metrics.avgProcessingTime}s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Second row: distributions */}
      <div className="grid lg:grid-cols-2 gap-0 border border-[#e5e4de]">
        <div className="p-5 border-r border-[#e5e4de]">
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-4">Document Type Distribution</p>
          <BarChart data={docTypeDist} height={150} />
        </div>
        <div className="p-5">
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-4">Language Distribution</p>
          {languageDist.length > 0 ? (
            <DonutChart data={languageDist} size={140} />
          ) : (
            <p className="text-sm text-[#b4b4b4]">No language data yet</p>
          )}
        </div>
      </div>

      {/* Bottom: Recent activity + Pending verification + Alerts */}
      <div className="grid lg:grid-cols-3 gap-0 border border-[#e5e4de]">
        {/* Recent uploads */}
        <div className="p-5 border-r border-[#e5e4de]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase">Recent Uploads</p>
            <Link to="/documents" className="text-[10px] mono-data text-[#3d7068] hover:underline flex items-center gap-1">
              View All <ArrowRight size={10} />
            </Link>
          </div>
          <div className="space-y-3">
            {recentUploads.map((doc) => (
              <Link key={doc.id} to={`/documents/${doc.id}`} className="block group">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-[#1c1c1c] group-hover:text-[#3d7068] editorial-ease truncate flex-1">
                    {doc.original_filename}
                  </p>
                  <StatusBadge status={doc.status} />
                </div>
                {doc.processing_progress < 100 && doc.processing_progress > 0 && (
                  <ProgressBar value={doc.processing_progress} />
                )}
                <p className="text-[9px] mono-data text-[#b4b4b4] mt-1">
                  {doc.village || '—'} · {doc.detected_language?.toUpperCase() || '—'}
                </p>
              </Link>
            ))}
          </div>
        </div>

        {/* Pending verification */}
        <div className="p-5 border-r border-[#e5e4de]">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase">Pending Verification</p>
            <Link to="/verification" className="text-[10px] mono-data text-[#3d7068] hover:underline flex items-center gap-1">
              Verify <ArrowRight size={10} />
            </Link>
          </div>
          <div className="space-y-3">
            {pendingVerification.length === 0 ? (
              <p className="text-sm text-[#b4b4b4] py-4 text-center">No pending tasks</p>
            ) : (
              pendingVerification.map((task) => (
                <div key={task.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#1c1c1c]">{task.priority} priority</span>
                    <StatusBadge status={task.status} />
                  </div>
                  <p className="text-[10px] text-[#6b7280] line-clamp-2">{task.comments}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System alerts */}
        <div className="p-5">
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-4">System Alerts</p>
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-2">
                <span
                  className="w-1.5 h-1.5 mt-1.5 flex-shrink-0"
                  style={{
                    backgroundColor:
                      n.severity === 'error' ? '#b54545' :
                      n.severity === 'warning' ? '#c47830' :
                      n.severity === 'success' ? '#3d7068' : '#4a6fa5',
                  }}
                />
                <div>
                  <p className="text-xs text-[#1c1c1c] font-medium">{n.title}</p>
                  <p className="text-[10px] text-[#6b7280] mt-0.5">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Audit activity */}
      <div className="border border-[#e5e4de]">
        <div className="px-5 py-3 border-b border-[#e5e4de] flex items-center justify-between">
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
            <Activity size={12} /> Recent Activity
          </p>
          <Link to="/audit" className="text-[10px] mono-data text-[#3d7068] hover:underline flex items-center gap-1">
            Full Audit Trail <ArrowRight size={10} />
          </Link>
        </div>
        <div className="divide-y divide-[#e5e4de]">
          {recentActivity.map((log) => (
            <div key={log.id} className="px-5 py-3 flex items-center gap-4 hover:bg-white/30 editorial-ease">
              <span className="text-[9px] mono-data text-[#b4b4b4] w-16 flex-shrink-0">
                {new Date(log.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-xs text-[#1c1c1c] font-medium w-32 flex-shrink-0 truncate">
                {log.user_name || 'System'}
              </span>
              <span className="text-[9px] mono-data text-[#3d7068] tracking-[0.1em] uppercase w-32 flex-shrink-0">
                {log.action.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-[#6b7280] flex-1 truncate">
                {log.details ? JSON.stringify(log.details).slice(0, 80) : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
