import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToastContext } from '@/context/ToastContext';
import { StatusBadge } from '@/components/StatusBadge';
import type { LandDocument } from '@/types';
import {
  Stamp, Check, X, AlertCircle, FileText,
  ChevronRight, Eye, ArrowLeft
} from 'lucide-react';

export function RegistrarApprovalPage() {
  const { session, profile } = useAuth();
  const { showToast } = useToastContext();
  const [documents, setDocuments] = useState<LandDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState<LandDocument | null>(null);
  const [action, setAction] = useState<'approve' | 'reject' | 'correction' | null>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  async function loadDocuments() {
    setLoading(true);
    const { data } = await supabase
      .from('documents')
      .select('*')
      .in('status', ['pending_registrar_approval', 'correction_required'])
      .order('created_at', { ascending: false });
    setDocuments((data || []) as LandDocument[]);
    setLoading(false);
  }

  async function submitAction() {
    if (!selectedDoc || !action) return;
    if ((action === 'reject' || action === 'correction') && !reason.trim()) {
      showToast(`${action === 'reject' ? 'Rejection reason' : 'Correction instructions'} is required`, 'warning');
      return;
    }

    setSubmitting(true);

    if (action === 'approve') {
      await supabase.from('documents').update({
        status: 'approved_for_processing',
        approved_by: session?.user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: null,
        correction_instructions: null,
      }).eq('id', selectedDoc.id);

      await supabase.from('audit_logs').insert({
        user_id: session?.user.id,
        user_name: profile?.full_name || 'Registrar',
        user_role: 'registrar',
        action: 'document_approved_by_registrar',
        entity_type: 'document',
        entity_id: selectedDoc.id,
        details: { filename: selectedDoc.original_filename },
      });

      showToast('Document approved for AI processing', 'success');
    } else if (action === 'reject') {
      await supabase.from('documents').update({
        status: 'rejected',
        rejection_reason: reason,
      }).eq('id', selectedDoc.id);

      await supabase.from('audit_logs').insert({
        user_id: session?.user.id,
        user_name: profile?.full_name || 'Registrar',
        user_role: 'registrar',
        action: 'document_rejected_by_registrar',
        entity_type: 'document',
        entity_id: selectedDoc.id,
        details: { reason },
      });

      showToast('Document rejected', 'info');
    } else if (action === 'correction') {
      await supabase.from('documents').update({
        status: 'correction_required',
        correction_instructions: reason,
      }).eq('id', selectedDoc.id);

      await supabase.from('audit_logs').insert({
        user_id: session?.user.id,
        user_name: profile?.full_name || 'Registrar',
        user_role: 'registrar',
        action: 'correction_requested',
        entity_type: 'document',
        entity_id: selectedDoc.id,
        details: { instructions: reason },
      });

      showToast('Correction requested from uploader', 'info');
    }

    setSubmitting(false);
    setAction(null);
    setReason('');
    setSelectedDoc(null);
    loadDocuments();
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-[#e5e4de] border-t-[#3d7068] rounded-full animate-spin" />
      </div>
    );
  }

  if (selectedDoc) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto fade-in">
        <div className="flex items-center gap-4">
          <button onClick={() => { setSelectedDoc(null); setAction(null); setReason(''); }} className="text-[#b4b4b4] hover:text-[#1c1c1c]">
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.25em] uppercase mb-2">
              Registrar Review
            </p>
            <h1 className="font-serif text-3xl font-light text-[#1c1c1c]">Document Approval</h1>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-0 border border-[#e5e4de]">
          {/* Document preview */}
          <div className="border-r border-[#e5e4de]">
            <div className="px-4 py-3 border-b border-[#e5e4de] bg-[#f7f6f2]/50">
              <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
                <FileText size={12} /> Document Preview
              </p>
            </div>
            <div className="p-6 bg-[#f7f6f2]/30 min-h-[400px] flex items-center justify-center">
              <div className="w-full max-w-sm">
                <div className="border border-[#e5e4de] bg-white p-6 shadow-sm">
                  <div className="flex justify-between text-[8px] mono-data text-[#b4b4b4] mb-3">
                    <span>REF: {selectedDoc.reference_number || '—'}</span>
                    <span>{selectedDoc.record_year}</span>
                  </div>
                  <div className="border-t border-b border-[#e5e4de] py-4 my-3">
                    <p className="text-center font-serif text-sm text-[#1c1c1c] mb-2">
                      {selectedDoc.document_type?.toUpperCase().replace(/_/g, ' ') || 'DOCUMENT'}
                    </p>
                    {selectedDoc.ocr_text && (
                      <div className="space-y-2">
                        {selectedDoc.ocr_text.split('\n').map((line, i) => (
                          <p key={i} className="text-[10px] text-[#1c1c1c] leading-relaxed font-serif text-center">
                            {line}
                          </p>
                        ))}
                      </div>
                    )}
                    {!selectedDoc.ocr_text && (
                      <p className="text-[10px] text-[#b4b4b4] text-center italic">No OCR text yet — document not processed</p>
                    )}
                  </div>
                  <div className="text-center text-[8px] mono-data text-[#b4b4b4]">
                    {selectedDoc.village}, {selectedDoc.district}, {selectedDoc.state}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata + actions */}
          <div>
            <div className="px-4 py-3 border-b border-[#e5e4de] bg-[#f7f6f2]/50">
              <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
                <Eye size={12} /> Document Metadata
              </p>
            </div>
            <div className="divide-y divide-[#e5e4de]">
              {[
                { label: 'Filename', value: selectedDoc.original_filename },
                { label: 'File Size', value: formatSize(selectedDoc.file_size) },
                { label: 'Pages', value: String(selectedDoc.page_count) },
                { label: 'Type', value: selectedDoc.document_type?.replace(/_/g, ' ') || '—' },
                { label: 'State', value: selectedDoc.state || '—' },
                { label: 'District', value: selectedDoc.district || '—' },
                { label: 'Tehsil', value: selectedDoc.tehsil || '—' },
                { label: 'Village', value: selectedDoc.village || '—' },
                { label: 'Record Year', value: String(selectedDoc.record_year || '—') },
                { label: 'Source Dept', value: selectedDoc.source_department || '—' },
                { label: 'Reference No', value: selectedDoc.reference_number || '—' },
                { label: 'Uploaded', value: new Date(selectedDoc.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) },
              ].map((f) => (
                <div key={f.label} className="px-4 py-2.5 flex justify-between items-center">
                  <span className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">{f.label}</span>
                  <span className="text-sm text-[#1c1c1c] text-right max-w-[60%] truncate">{f.value}</span>
                </div>
              ))}
            </div>

            {selectedDoc.status === 'correction_required' && selectedDoc.correction_instructions && (
              <div className="px-4 py-3 bg-[#faf3e8] border-t border-[#e5e4de]">
                <p className="text-[10px] mono-data text-[#c47830] tracking-[0.1em] uppercase mb-1">Previous Correction Instructions</p>
                <p className="text-xs text-[#1c1c1c]">{selectedDoc.correction_instructions}</p>
              </div>
            )}

            {/* Action area */}
            {!action ? (
              <div className="border-t border-[#e5e4de] p-4 space-y-2">
                <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-2">Registrar Actions</p>
                <button
                  onClick={() => setAction('approve')}
                  className="w-full bg-[#3d7068] text-[#f7f6f2] py-2.5 mono-data text-[10px] tracking-[0.2em] uppercase cta-btn editorial-ease flex items-center justify-center gap-2"
                >
                  <Check size={12} /> Approve for Processing
                </button>
                <button
                  onClick={() => setAction('correction')}
                  className="w-full border border-[#c47830] text-[#c47830] py-2.5 mono-data text-[10px] tracking-[0.2em] uppercase hover:bg-[#c47830] hover:text-[#f7f6f2] editorial-ease flex items-center justify-center gap-2"
                >
                  <AlertCircle size={12} /> Request Correction
                </button>
                <button
                  onClick={() => setAction('reject')}
                  className="w-full border border-[#b54545] text-[#b54545] py-2.5 mono-data text-[10px] tracking-[0.2em] uppercase hover:bg-[#b54545] hover:text-[#f7f6f2] editorial-ease flex items-center justify-center gap-2"
                >
                  <X size={12} /> Reject Document
                </button>
              </div>
            ) : (
              <div className="border-t border-[#e5e4de] p-4 space-y-3">
                <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase">
                  {action === 'approve' ? 'Confirm Approval' : action === 'reject' ? 'Rejection Reason' : 'Correction Instructions'}
                </p>
                {(action === 'reject' || action === 'correction') && (
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    autoFocus
                    placeholder={action === 'reject' ? 'Provide a mandatory rejection reason...' : 'Provide correction instructions for the uploader...'}
                    className="w-full bg-transparent border border-[#e5e4de] p-2 text-sm text-[#1c1c1c] outline-none focus:border-[#3d7068] placeholder:text-[#b4b4b4] placeholder:text-xs"
                  />
                )}
                {action === 'approve' && (
                  <p className="text-xs text-[#6b7280]">Approving this document will send it to the AI processing pipeline.</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={submitAction}
                    disabled={submitting}
                    className="flex-1 bg-[#3d7068] text-[#f7f6f2] py-2.5 mono-data text-[10px] tracking-[0.2em] uppercase cta-btn editorial-ease disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Confirm'}
                  </button>
                  <button
                    onClick={() => { setAction(null); setReason(''); }}
                    className="flex-1 border border-[#e5e4de] text-[#6b7280] py-2.5 mono-data text-[10px] tracking-[0.2em] uppercase hover:bg-[#f7f6f2] editorial-ease"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto fade-in">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.25em] uppercase mb-2">
            Registrar Approval Queue
          </p>
          <h1 className="font-serif text-4xl font-light text-[#1c1c1c]">Registrar Approval</h1>
        </div>
        <div className="text-right">
          <p className="font-serif text-3xl font-light text-[#c47830]">{documents.length}</p>
          <p className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase">Pending Review</p>
        </div>
      </div>

      <div className="border border-[#e5e4de] p-4 bg-[#faf3e8]/30 flex items-center gap-3">
        <Stamp size={16} className="text-[#c47830] flex-shrink-0" />
        <p className="text-xs text-[#6b7280]">
          Documents uploaded by operators must be reviewed and approved by a Registrar before AI processing can begin.
          No document enters the processing pipeline without registrar approval.
        </p>
      </div>

      {documents.length === 0 ? (
        <div className="border border-[#e5e4de] p-12 text-center">
          <Check size={24} className="mx-auto text-[#3d7068] mb-2" />
          <p className="text-sm text-[#1c1c1c]">No documents pending approval</p>
          <p className="text-[10px] mono-data text-[#b4b4b4] mt-1">All uploaded documents have been reviewed</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="border border-[#e5e4de] p-4 hover:border-[#3d7068] cursor-pointer editorial-ease"
              onClick={() => setSelectedDoc(doc)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-[#b4b4b4]" />
                  <p className="text-sm text-[#1c1c1c] font-medium">{doc.original_filename}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={doc.status} />
                  <ChevronRight size={14} className="text-[#b4b4b4]" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                <div>
                  <p className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">Type</p>
                  <p className="text-xs text-[#1c1c1c]">{doc.document_type?.replace(/_/g, ' ') || '—'}</p>
                </div>
                <div>
                  <p className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">Location</p>
                  <p className="text-xs text-[#1c1c1c]">{doc.village || '—'}, {doc.district || '—'}</p>
                </div>
                <div>
                  <p className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">Size</p>
                  <p className="text-xs mono-data text-[#1c1c1c]">{formatSize(doc.file_size)}</p>
                </div>
                <div>
                  <p className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">Uploaded</p>
                  <p className="text-xs text-[#1c1c1c]">{new Date(doc.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                </div>
              </div>
              {doc.correction_instructions && (
                <div className="mt-3 px-3 py-2 bg-[#faf3e8] border-l-2 border-[#c47830]">
                  <p className="text-[9px] mono-data text-[#c47830] tracking-[0.1em] uppercase mb-1">Correction Requested</p>
                  <p className="text-xs text-[#1c1c1c]">{doc.correction_instructions}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
