import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { StatusBadge, ConfidenceBadge } from '@/components/StatusBadge';
import { ProgressBar } from '@/components/Charts';
import type { LandDocument, PipelineStage, PageOcrResult, PageRelevance, ExtractionEvidence, FieldConflict } from '@/types';
import {
  ArrowLeft, FileText, ScanLine, Layers, Search, Filter,
  Brain, CheckCircle, AlertTriangle, AlertCircle,
  FileCheck2, Globe, Table, ChevronRight, Eye, History, Zap, Clock
} from 'lucide-react';

const STAGE_ICONS: Record<string, typeof FileText> = {
  pdf_parsing: FileText,
  page_ocr: ScanLine,
  structure_detection: Layers,
  page_indexing: Search,
  relevance_detection: Filter,
  relevant_page_selection: Zap,
  llm_extraction: Brain,
  validation: FileCheck2,
  confidence_scoring: CheckCircle,
  final_json: CheckCircle,
};

const STAGE_LABELS: Record<string, string> = {
  pdf_parsing: 'PDF Parsing',
  page_ocr: 'Page-by-Page OCR',
  structure_detection: 'Structure Detection',
  page_indexing: 'Page Indexing',
  relevance_detection: 'Relevance Detection',
  relevant_page_selection: 'Page Selection',
  llm_extraction: 'LLM Extraction',
  validation: 'Validation',
  confidence_scoring: 'Confidence Scoring',
  final_json: 'Final JSON',
};

export function PipelinePage() {
  const { id } = useParams();
  const [doc, setDoc] = useState<LandDocument | null>(null);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [pageOcr, setPageOcr] = useState<PageOcrResult[]>([]);
  const [relevance, setRelevance] = useState<PageRelevance[]>([]);
  const [evidence, setEvidence] = useState<ExtractionEvidence[]>([]);
  const [conflicts, setConflicts] = useState<FieldConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPage, setSelectedPage] = useState<number | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadData(id);
  }, [id]);

  async function loadData(docId: string) {
    setLoading(true);
    const [docRes, stagesRes, ocrRes, relRes, evRes, confRes] = await Promise.all([
      supabase.from('documents').select('*').eq('id', docId).maybeSingle(),
      supabase.from('pipeline_stages').select('*').eq('document_id', docId).order('stage_order', { ascending: true }),
      supabase.from('page_ocr_results').select('*').eq('document_id', docId).order('page_number', { ascending: true }),
      supabase.from('page_relevance').select('*').eq('document_id', docId).order('page_number', { ascending: true }),
      supabase.from('extraction_evidence').select('*').eq('document_id', docId).order('confidence', { ascending: false }),
      supabase.from('field_conflicts').select('*').eq('document_id', docId).order('created_at', { ascending: false }),
    ]);

    setDoc(docRes.data as LandDocument | null);
    setStages((stagesRes.data || []) as PipelineStage[]);
    setPageOcr((ocrRes.data || []) as PageOcrResult[]);
    setRelevance((relRes.data || []) as PageRelevance[]);
    setEvidence((evRes.data || []) as ExtractionEvidence[]);
    setConflicts((confRes.data || []) as FieldConflict[]);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-[#e5e4de] border-t-[#3d7068] rounded-full animate-spin" />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-[#b4b4b4]">Document not found</p>
        <Link to="/documents" className="text-[#3d7068] text-xs mt-2 inline-block">Back to Documents</Link>
      </div>
    );
  }

  const completedStages = stages.filter((s) => s.status === 'completed').length;
  const overallProgress = stages.length > 0 ? Math.round((completedStages / stages.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto fade-in">
      {/* Breadcrumb */}
      <Link to={`/documents/${doc.id}`} className="flex items-center gap-2 text-xs text-[#b4b4b4] hover:text-[#1c1c1c] editorial-ease">
        <ArrowLeft size={12} /> Back to Document
      </Link>

      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.25em] uppercase mb-2">
            Extraction Pipeline
          </p>
          <h1 className="font-serif text-3xl font-light text-[#1c1c1c]">{doc.original_filename}</h1>
        </div>
        <div className="flex items-center gap-4">
          {doc.overall_confidence != null && (
            <div className="text-right">
              <p className="font-serif text-2xl font-light text-[#3d7068]">{doc.overall_confidence}%</p>
              <p className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase">Confidence</p>
            </div>
          )}
          <StatusBadge status={doc.status} />
        </div>
      </div>

      {/* Pipeline overview */}
      <div className="border border-[#e5e4de] p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase">Pipeline Progress</p>
          <span className="text-[10px] mono-data text-[#3d7068] tracking-[0.1em] uppercase">{completedStages}/{stages.length} Stages</span>
        </div>
        <ProgressBar value={overallProgress} color="#3d7068" />
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-0 mt-5">
          {stages.map((stage, i) => {
            const Icon = STAGE_ICONS[stage.stage_name] || FileText;
            const color = stage.status === 'completed' ? '#3d7068' : stage.status === 'running' ? '#4a6fa5' : stage.status === 'failed' ? '#b54545' : '#b4b4b4';
            const bg = stage.status === 'completed' ? '#eaf2f0' : stage.status === 'running' ? '#eef2f9' : stage.status === 'failed' ? '#f8eded' : '#f7f6f2';
            return (
              <div key={stage.id} className={`px-2 py-3 ${i < stages.length - 1 ? 'border-r border-[#e5e4de]' : ''}`}>
                <div className="w-8 h-8 border flex items-center justify-center mx-auto mb-2" style={{ borderColor: color, backgroundColor: bg }}>
                  <Icon size={14} style={{ color }} strokeWidth={1.5} className={stage.status === 'running' ? 'animate-spin' : ''} />
                </div>
                <p className="text-[8px] mono-data text-center tracking-[0.05em] uppercase leading-tight" style={{ color }}>{STAGE_LABELS[stage.stage_name] || stage.stage_name}</p>
                <p className="text-[7px] mono-data text-center text-[#b4b4b4] mt-1 capitalize">{stage.status}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stage details */}
      {stages.some((s) => s.result_summary) && (
        <div className="border border-[#e5e4de]">
          <div className="px-4 py-3 border-b border-[#e5e4de]">
            <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase">Stage Results</p>
          </div>
          <div className="divide-y divide-[#e5e4de]">
            {stages.filter((s) => s.result_summary).map((stage) => (
              <div key={stage.id} className="px-4 py-3">
                <div className="flex items-center gap-3 mb-2">
                  {stage.status === 'completed' ? (
                    <CheckCircle size={12} className="text-[#3d7068]" />
                  ) : stage.status === 'failed' ? (
                    <AlertCircle size={12} className="text-[#b54545]" />
                  ) : (
                    <Clock size={12} className="text-[#4a6fa5]" />
                  )}
                  <span className="text-[10px] mono-data text-[#1c1c1c] tracking-[0.1em] uppercase">{STAGE_LABELS[stage.stage_name] || stage.stage_name}</span>
                  {stage.completed_at && (
                    <span className="text-[9px] mono-data text-[#b4b4b4]">
                      {new Date(stage.completed_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="pl-7 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(stage.result_summary as Record<string, unknown>).map(([key, val]) => (
                    <div key={key}>
                      <span className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">{key.replace(/_/g, ' ')}</span>
                      <p className="text-xs text-[#1c1c1c]">{String(val)}</p>
                    </div>
                  ))}
                </div>
                {stage.error_message && (
                  <p className="pl-7 mt-2 text-xs text-[#b54545]">{stage.error_message}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Page-level OCR results */}
      {pageOcr.length > 0 && (
        <div className="border border-[#e5e4de]">
          <div className="px-4 py-3 border-b border-[#e5e4de] flex items-center justify-between">
            <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
              <ScanLine size={12} /> Page OCR Results ({pageOcr.length} pages)
            </p>
          </div>
          <div className="divide-y divide-[#e5e4de]">
            {pageOcr.map((page) => (
              <div key={page.id} className="px-4 py-3">
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setSelectedPage(selectedPage === page.page_number ? null : page.page_number)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] mono-data text-[#b4b4b4] w-16">Page {page.page_number}</span>
                    {page.ocr_status === 'completed' ? (
                      <CheckCircle size={12} className="text-[#3d7068]" />
                    ) : page.ocr_status === 'failed' ? (
                      <AlertCircle size={12} className="text-[#b54545]" />
                    ) : (
                      <div className="w-3 h-3 border border-[#e5e4de] border-t-[#4a6fa5] rounded-full animate-spin" />
                    )}
                    {page.detected_language && (
                      <span className="text-[9px] mono-data text-[#6b7280] tracking-[0.1em] uppercase flex items-center gap-1">
                        <Globe size={10} /> {page.detected_language === 'hi' ? 'Hindi' : 'English'}
                      </span>
                    )}
                    {page.tables && page.tables.length > 0 && (
                      <span className="text-[9px] mono-data text-[#6b7280] tracking-[0.1em] uppercase flex items-center gap-1">
                        <Table size={10} /> {page.tables.length} table(s)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {page.ocr_confidence > 0 && <ConfidenceBadge score={page.ocr_confidence} />}
                    <ChevronRight size={12} className={`text-[#b4b4b4] transition-transform ${selectedPage === page.page_number ? 'rotate-90' : ''}`} />
                  </div>
                </div>
                {selectedPage === page.page_number && (
                  <div className="mt-3 pt-3 border-t border-[#e5e4de] space-y-2 fade-in">
                    {page.text && (
                      <div>
                        <p className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase mb-1">Extracted Text</p>
                        <pre className="text-xs text-[#1c1c1c] whitespace-pre-wrap font-sans leading-relaxed bg-[#f7f6f2]/50 p-3 border border-[#e5e4de]">
                          {page.text}
                        </pre>
                      </div>
                    )}
                    {page.error_message && (
                      <p className="text-xs text-[#b54545]">{page.error_message}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Page relevance scores */}
      {relevance.length > 0 && (
        <div className="border border-[#e5e4de]">
          <div className="px-4 py-3 border-b border-[#e5e4de]">
            <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
              <Filter size={12} /> Page Relevance Detection
            </p>
          </div>
          <div className="divide-y divide-[#e5e4de]">
            {relevance.map((rel) => {
              const color = rel.priority === 'high' ? '#3d7068' : rel.priority === 'medium' ? '#c47830' : '#6b7280';
              const bg = rel.priority === 'high' ? '#eaf2f0' : rel.priority === 'medium' ? '#faf3e8' : '#f3f4f6';
              return (
                <div key={rel.id} className="px-4 py-3 flex items-center gap-4">
                  <span className="text-[9px] mono-data text-[#b4b4b4] w-16">Page {rel.page_number}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] mono-data tracking-[0.1em] uppercase px-2 py-0.5" style={{ color, backgroundColor: bg }}>
                        {rel.priority}
                      </span>
                      {rel.sent_to_llm && (
                        <span className="text-[9px] mono-data text-[#4a6fa5] tracking-[0.1em] uppercase flex items-center gap-1">
                          <Brain size={10} /> Sent to LLM
                        </span>
                      )}
                    </div>
                    {rel.reasons && rel.reasons.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {rel.reasons.map((reason, i) => (
                          <span key={i} className="text-[9px] text-[#6b7280] bg-[#f7f6f2] px-2 py-0.5">{reason}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-serif text-lg font-light" style={{ color }}>{(rel.relevance_score * 100).toFixed(0)}%</p>
                    <p className="text-[8px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">Relevance</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Evidence tracking */}
      {evidence.length > 0 && (
        <div className="border border-[#e5e4de]">
          <div className="px-4 py-3 border-b border-[#e5e4de]">
            <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
              <Eye size={12} /> Extraction Evidence ({evidence.length} fields)
            </p>
          </div>
          <div className="divide-y divide-[#e5e4de]">
            {evidence.map((ev) => {
              const isOpen = selectedEvidence === ev.id;
              return (
                <div key={ev.id} className="px-4 py-3">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setSelectedEvidence(isOpen ? null : ev.id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className="text-[9px] mono-data text-[#3d7068] tracking-[0.1em] uppercase">{ev.field_path}</span>
                      <span className="text-sm text-[#1c1c1c] font-medium truncate">{ev.field_value || '—'}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-[9px] mono-data text-[#b4b4b4]">Page {ev.page_number}</span>
                      <ConfidenceBadge score={Math.round(ev.confidence * 100)} />
                      <ChevronRight size={12} className={`text-[#b4b4b4] transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-[#e5e4de] space-y-2 fade-in">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <span className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">Field</span>
                          <p className="text-xs text-[#1c1c1c]">{ev.field_path}</p>
                        </div>
                        <div>
                          <span className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">Value</span>
                          <p className="text-xs text-[#1c1c1c]">{ev.field_value || '—'}</p>
                        </div>
                        <div>
                          <span className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">Source Page</span>
                          <p className="text-xs text-[#1c1c1c]">Page {ev.page_number}</p>
                        </div>
                        <div>
                          <span className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">Method</span>
                          <p className="text-xs text-[#1c1c1c]">{ev.extraction_method || '—'}</p>
                        </div>
                      </div>
                      {ev.source_text && (
                        <div>
                          <span className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">Source Text (Evidence)</span>
                          <p className="text-xs text-[#1c1c1c] bg-[#f7f6f2]/50 p-2 border border-[#e5e4de] mt-1 font-mono">
                            "{ev.source_text}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="border border-[#b54545]/30 bg-[#f8eded]/30">
          <div className="px-4 py-3 border-b border-[#b54545]/20">
            <p className="text-[10px] mono-data text-[#b54545] tracking-[0.2em] uppercase flex items-center gap-2">
              <AlertTriangle size={12} /> Field Conflicts ({conflicts.length})
            </p>
          </div>
          <div className="divide-y divide-[#b54545]/10">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="px-4 py-3">
                <p className="text-[10px] mono-data text-[#b54545] tracking-[0.1em] uppercase mb-2">{conflict.field_path}</p>
                <div className="space-y-1">
                  {(conflict.conflict_values as { value: string; page: number }[]).map((cv, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[9px] mono-data text-[#b4b4b4]">Page {cv.page}</span>
                      <span className="text-sm text-[#1c1c1c]">{cv.value}</span>
                    </div>
                  ))}
                </div>
                {conflict.resolved && (
                  <p className="text-[9px] mono-data text-[#3d7068] tracking-[0.1em] uppercase mt-2">Resolved: {conflict.resolution}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Final extraction JSON */}
      {doc.extraction_json && (
        <div className="border border-[#e5e4de]">
          <div className="px-4 py-3 border-b border-[#e5e4de]">
            <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
              <History size={12} /> Final Extraction JSON
            </p>
          </div>
          <div className="p-4">
            <pre className="text-xs text-[#1c1c1c] whitespace-pre-wrap font-mono leading-relaxed bg-[#f7f6f2]/50 p-4 border border-[#e5e4de] max-h-96 overflow-auto">
              {JSON.stringify(doc.extraction_json, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
