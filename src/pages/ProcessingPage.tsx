import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToastContext } from '@/context/ToastContext';
import { StatusBadge, ConfidenceBadge } from '@/components/StatusBadge';
import { ProgressBar, ScanLineProgress } from '@/components/Charts';
import type { LandDocument, ProcessingJob } from '@/types';
import {
  Cog, ScanLine, Globe, FileText, CheckCircle,
  ArrowRight, Layers, Gauge, Brain, Eye
} from 'lucide-react';

const PIPELINE_STEPS = [
  { key: 'pdf_parsing', label: 'PDF Parsing', icon: FileText },
  { key: 'page_ocr', label: 'Page OCR', icon: ScanLine },
  { key: 'relevance_detection', label: 'Relevance Detection', icon: Layers },
  { key: 'llm_extraction', label: 'LLM Extraction', icon: Brain },
  { key: 'validation', label: 'Validation', icon: CheckCircle },
  { key: 'confidence_scoring', label: 'Confidence Scoring', icon: Gauge },
];

interface ProcessingDoc extends LandDocument {
  currentStep?: string;
}

export function ProcessingPage() {
  const { session } = useAuth();
  const { showToast } = useToastContext();
  const [documents, setDocuments] = useState<ProcessingDoc[]>([]);
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    loadDocuments();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  async function loadDocuments() {
    setLoading(true);
    const { data } = await supabase
      .from('documents')
      .select('*')
      .in('status', ['approved_for_processing', 'processing', 'extracted', 'validation_pending', 'review_required'])
      .order('created_at', { ascending: false });
    setDocuments((data || []) as ProcessingDoc[]);
    setLoading(false);
  }

  async function startProcessing() {
    const queued = documents.filter((d) => d.status === 'approved_for_processing');
    if (queued.length === 0) {
      showToast('No documents approved for processing. A Registrar must approve documents first.', 'warning');
      return;
    }

    setProcessing(true);
    showToast(`Processing ${queued.length} document(s) through extraction pipeline...`, 'info');

    for (const doc of queued) {
      await processDocument(doc);
    }

    setProcessing(false);
    showToast('Pipeline processing complete', 'success');
    loadDocuments();
  }

  async function processDocument(doc: ProcessingDoc) {
    const docId = doc.id;

    // Set to processing
    await supabase.from('documents').update({
      status: 'processing',
      processing_progress: 5,
    }).eq('id', docId);

    // Call the extraction pipeline edge function
    try {
      const { data: { session: authSession } } = await supabase.auth.getSession();
      const accessToken = authSession?.access_token;

      const functionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/extraction-pipeline`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          documentId: docId,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Pipeline failed: ${errBody}`);
      }

      const result = await response.json();

      // Audit log
      await supabase.from('audit_logs').insert({
        user_id: session?.user.id,
        user_name: 'Demo Operator',
        user_role: 'operator',
        action: 'processing_completed',
        entity_type: 'document',
        entity_id: docId,
        details: {
          confidence: result.overall_confidence,
          fields_extracted: result.fields_extracted,
          pages_sent_to_llm: result.pages_sent_to_llm,
          conflicts: result.conflicts,
          requires_review: result.requires_manual_review,
        },
      });

      showToast(`${doc.original_filename}: ${result.fields_extracted} fields extracted, ${result.overall_confidence}% confidence`, 'success');
    } catch (err) {
      console.error('Pipeline error:', err);
      showToast(`Pipeline failed for ${doc.original_filename}`, 'error');

      await supabase.from('documents').update({
        status: 'error',
        processing_progress: 100,
      }).eq('id', docId);

      await supabase.from('audit_logs').insert({
        user_id: session?.user.id,
        user_name: 'Demo Operator',
        user_role: 'operator',
        action: 'processing_failed',
        entity_type: 'document',
        entity_id: docId,
        details: { error: err instanceof Error ? err.message : 'Unknown error' },
      });
    }

    await loadDocuments();
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto fade-in">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.25em] uppercase mb-2">
            AI Extraction Pipeline
          </p>
          <h1 className="font-serif text-4xl font-light text-[#1c1c1c]">Processing</h1>
        </div>
        <button
          onClick={startProcessing}
          disabled={processing || documents.filter((d) => d.status === 'approved_for_processing').length === 0}
          className="bg-[#3d7068] text-[#f7f6f2] px-5 py-2.5 mono-data text-[10px] tracking-[0.2em] uppercase cta-btn editorial-ease disabled:opacity-40 flex items-center gap-2"
        >
          <Cog size={12} className={processing ? 'animate-spin' : ''} />
          {processing ? 'Processing...' : 'Start Pipeline'}
        </button>
      </div>

      {/* Pipeline visualization */}
      <div className="border border-[#e5e4de] p-5">
        <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-4">Pipeline Stages</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-0">
          {PIPELINE_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.key} className={`px-3 py-3 ${i < PIPELINE_STEPS.length - 1 ? 'border-r border-[#e5e4de]' : ''} ${i >= 3 ? 'border-t lg:border-t-0' : ''}`}>
                <Icon size={16} className="text-[#3d7068] mb-2" strokeWidth={1.5} />
                <p className="text-[9px] mono-data text-[#1c1c1c] tracking-[0.05em] uppercase leading-tight">{step.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Documents in processing */}
      <div className="space-y-3">
        {loading ? (
          <div className="border border-[#e5e4de] p-6 text-center">
            <div className="w-8 h-8 border-2 border-[#e5e4de] border-t-[#3d7068] rounded-full animate-spin mx-auto" />
          </div>
        ) : documents.length === 0 ? (
          <div className="border border-[#e5e4de] p-12 text-center">
            <CheckCircle size={24} className="mx-auto text-[#3d7068] mb-2" />
            <p className="text-sm text-[#1c1c1c]">All documents processed</p>
            <p className="text-[10px] mono-data text-[#b4b4b4] mt-1">No documents in the processing queue</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className="border border-[#e5e4de] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-[#b4b4b4]" />
                  <div>
                    <p className="text-sm text-[#1c1c1c]">{doc.original_filename}</p>
                    <p className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">
                      {doc.village || '—'} · {doc.reference_number || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {doc.overall_confidence != null && <ConfidenceBadge score={doc.overall_confidence} />}
                  <StatusBadge status={doc.status} />
                </div>
              </div>

              {doc.status === 'processing' && (
                <>
                  <ProgressBar value={doc.processing_progress} color="#4a6fa5" />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[9px] mono-data text-[#4a6fa5] tracking-[0.1em] uppercase">
                      {doc.processing_progress}% — Processing
                    </span>
                    <ScanLineProgress />
                  </div>
                </>
              )}

              {doc.status === 'approved_for_processing' && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] mono-data text-[#3d7068] tracking-[0.1em] uppercase">Approved — Ready for Pipeline</span>
                  <ArrowRight size={10} className="text-[#b4b4b4]" />
                </div>
              )}

              {doc.status === 'extracted' && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] mono-data text-[#3d7068] tracking-[0.1em] uppercase">
                    Extraction complete — awaiting validation
                  </span>
                  <Link to={`/pipeline/${doc.id}`} className="text-[10px] mono-data text-[#3d7068] tracking-[0.1em] uppercase hover:underline flex items-center gap-1">
                    <Eye size={10} /> View Pipeline
                  </Link>
                </div>
              )}

              {doc.status === 'review_required' && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] mono-data text-[#c47830] tracking-[0.1em] uppercase">
                    Review required — low confidence or conflicts detected
                  </span>
                  <Link to={`/pipeline/${doc.id}`} className="text-[10px] mono-data text-[#c47830] tracking-[0.1em] uppercase hover:underline flex items-center gap-1">
                    <Eye size={10} /> View Pipeline
                  </Link>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
