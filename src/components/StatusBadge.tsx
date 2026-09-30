import type { DocumentStatus, VerificationStatus } from '@/types';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  uploaded: { label: 'Uploaded', color: '#6b7280', bg: '#f3f4f6' },
  pending_registrar_approval: { label: 'Pending Registrar', color: '#c47830', bg: '#faf3e8' },
  approved_for_processing: { label: 'Approved for Processing', color: '#3d7068', bg: '#eaf2f0' },
  correction_required: { label: 'Correction Required', color: '#c47830', bg: '#faf3e8' },
  processing: { label: 'Processing', color: '#4a6fa5', bg: '#eef2f9' },
  extracted: { label: 'Extracted', color: '#4a6fa5', bg: '#eef2f9' },
  validation_pending: { label: 'Validation Pending', color: '#c47830', bg: '#faf3e8' },
  review_required: { label: 'Review Required', color: '#c47830', bg: '#faf3e8' },
  under_review: { label: 'Under Review', color: '#4a6fa5', bg: '#eef2f9' },
  verified: { label: 'Verified', color: '#3d7068', bg: '#eaf2f0' },
  approved: { label: 'Approved', color: '#3d7068', bg: '#eaf2f0' },
  rejected: { label: 'Rejected', color: '#b54545', bg: '#f8eded' },
  duplicate: { label: 'Duplicate', color: '#b54545', bg: '#f8eded' },
  conflict: { label: 'Conflict', color: '#b54545', bg: '#f8eded' },
  error: { label: 'Error', color: '#b54545', bg: '#f8eded' },
  digitized: { label: 'Digitized', color: '#3d7068', bg: '#eaf2f0' },
  pending: { label: 'Pending', color: '#6b7280', bg: '#f3f4f6' },
  auto_validated: { label: 'Auto Validated', color: '#3d7068', bg: '#eaf2f0' },
  in_progress: { label: 'In Progress', color: '#4a6fa5', bg: '#eef2f9' },
  completed: { label: 'Completed', color: '#3d7068', bg: '#eaf2f0' },
  reprocessing: { label: 'Reprocessing', color: '#c47830', bg: '#faf3e8' },
};

export function StatusBadge({ status }: { status: DocumentStatus | VerificationStatus | string }) {
  const config = STATUS_CONFIG[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' };
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.15em] whitespace-nowrap"
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      {config.label}
    </span>
  );
}

export function ConfidenceBadge({ score, threshold = 70 }: { score: number; threshold?: number }) {
  const color = score >= 90 ? '#3d7068' : score >= threshold ? '#c47830' : '#b54545';
  const bg = score >= 90 ? '#eaf2f0' : score >= threshold ? '#faf3e8' : '#f8eded';
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono tracking-[0.05em] whitespace-nowrap"
      style={{ color, backgroundColor: bg }}
    >
      {score.toFixed(0)}%
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const config: Record<string, { color: string; bg: string }> = {
    urgent: { color: '#b54545', bg: '#f8eded' },
    high: { color: '#c47830', bg: '#faf3e8' },
    medium: { color: '#4a6fa5', bg: '#eef2f9' },
    low: { color: '#6b7280', bg: '#f3f4f6' },
  };
  const c = config[priority] || config.medium;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.15em]"
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      {priority}
    </span>
  );
}
