import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { StatusBadge, ConfidenceBadge } from '@/components/StatusBadge';
import { ProgressBar, ScanLineProgress } from '@/components/Charts';
import type { LandDocument, ExtractedField, ValidationResult, LandRecord, AuditLog, DocumentVersion } from '@/types';
import {
  ArrowLeft, FileText, Globe, Gauge, ScanLine,
  CheckCircle, XCircle, AlertTriangle, Clock, Cog, Stamp, History, Brain
} from 'lucide-react';

export function DocumentDetailPage() {
  const { id } = useParams();
  const [doc, setDoc] = useState<LandDocument | null>(null);
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [record, setRecord] = useState<LandRecord | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeField, setActiveField] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadDocument(id);
  }, [id]);

  async function loadDocument(docId: string) {
    setLoading(true);
    const [docRes, fieldsRes, valRes, recordRes, auditRes, versionsRes] = await Promise.all([
      supabase.from('documents').select('*').eq('id', docId).maybeSingle(),
      supabase.from('extracted_fields').select('*').eq('document_id', docId).order('confidence', { ascending: false }),
      supabase.from('validation_results').select('*').eq('document_id', docId).order('created_at', { ascending: false }),
      supabase.from('land_records').select('*').eq('document_id', docId).maybeSingle(),
      supabase.from('audit_logs').select('*').eq('entity_id', docId).order('created_at', { ascending: false }),
      supabase.from('document_versions').select('*').eq('document_id', docId).order('version_number', { ascending: true }),
    ]);

    setDoc(docRes.data as LandDocument | null);
    setFields((fieldsRes.data || []) as ExtractedField[]);
    setValidations((valRes.data || []) as ValidationResult[]);
    setRecord(recordRes.data as LandRecord | null);
    setAuditLogs((auditRes.data || []) as AuditLog[]);
    setVersions((versionsRes.data || []) as DocumentVersion[]);
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

  const fieldLabels: Record<string, string> = {
    survey_number: 'Survey Number',
    khasra_number: 'Khasra Number',
    khata_number: 'Khata Number',
    owner_name: 'Owner Name',
    father_husband_name: "Father's/Husband's Name",
    area: 'Area',
    village: 'Village',
    mutation_number: 'Mutation Number',
    plot_number: 'Plot Number',
  };

  const isProcessing = doc.status === 'processing' || doc.status === 'approved_for_processing';

  return (
    <div className="space-y-6 max-w-7xl mx-auto fade-in">
      {/* Breadcrumb */}
      <Link to="/documents" className="flex items-center gap-2 text-xs text-[#b4b4b4] hover:text-[#1c1c1c] editorial-ease">
        <ArrowLeft size={12} /> Back to Documents
      </Link>

      {/* Pipeline link */}
      {(doc.status === 'processing' || doc.status === 'extracted' || doc.status === 'review_required' || doc.status === 'verified' || doc.status === 'approved') && (
        <Link to={`/pipeline/${doc.id}`} className="flex items-center gap-2 text-xs text-[#3d7068] hover:underline editorial-ease">
          <Brain size={12} /> View Extraction Pipeline
        </Link>
      )}

      {/* Header */}
      <div className="border border-[#e5e4de] p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 border border-[#e5e4de] flex items-center justify-center flex-shrink-0">
              <FileText size={22} className="text-[#3d7068]" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-light text-[#1c1c1c]">{doc.original_filename}</h1>
              <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase mt-1">
                {doc.file_type?.toUpperCase()} · {(doc.file_size / 1024).toFixed(0)} KB · {doc.page_count} page(s)
              </p>
              <div className="flex items-center gap-3 mt-3">
                <StatusBadge status={doc.status} />
                {doc.detected_language && (
                  <span className="text-[10px] mono-data text-[#6b7280] tracking-[0.1em] uppercase flex items-center gap-1">
                    <Globe size={10} /> {doc.detected_language === 'en' ? 'English' : 'Hindi'}
                  </span>
                )}
                {doc.document_type && (
                  <span className="text-[10px] mono-data text-[#6b7280] tracking-[0.1em] uppercase">
                    {doc.document_type.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            </div>
          </div>
          {doc.overall_confidence != null && (
            <div className="text-right">
              <p className="font-serif text-3xl font-light text-[#3d7068]">{doc.overall_confidence.toFixed(0)}%</p>
              <p className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase">Confidence</p>
            </div>
          )}
        </div>
      </div>

      {isProcessing && (
        <div className="border border-[#e5e4de] p-4 bg-[#eef2f9]/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] mono-data text-[#4a6fa5] tracking-[0.2em] uppercase flex items-center gap-2">
              <Cog size={12} className="animate-spin" /> Processing Pipeline
            </span>
            <span className="text-[10px] mono-data text-[#6b7280]">{doc.processing_progress}%</span>
          </div>
          <ProgressBar value={doc.processing_progress} color="#4a6fa5" />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Document preview + OCR text */}
        <div className="space-y-6">
          {/* Document preview */}
          <div className="border border-[#e5e4de]">
            <div className="px-4 py-3 border-b border-[#e5e4de]">
              <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
                <ScanLine size={12} /> Document Preview
              </p>
            </div>
            <div className="p-6 bg-[#f7f6f2]/50 min-h-[300px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-44 border border-[#e5e4de] bg-white mx-auto flex flex-col items-center justify-center p-4 relative">
                  <div className="absolute top-2 left-2 right-2 flex justify-between text-[7px] mono-data text-[#b4b4b4]">
                    <span>REF: {doc.reference_number}</span>
                    <span>{doc.record_year}</span>
                  </div>
                  <FileText size={32} className="text-[#e5e4de] mb-2" />
                  <div className="space-y-1.5 w-full">
                    {doc.ocr_text?.split('\n').slice(0, 4).map((line, i) => (
                      <div key={i} className="text-[8px] text-[#1c1c1c] leading-tight text-center font-serif">
                        {line}
                      </div>
                    ))}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 text-[7px] mono-data text-[#b4b4b4] text-center">
                    {doc.village}, {doc.district}
                  </div>
                </div>
                <p className="text-[9px] mono-data text-[#b4b4b4] mt-2 tracking-[0.1em] uppercase">
                  Page 1 of {doc.page_count}
                </p>
              </div>
            </div>
          </div>

          {/* Quality analysis */}
          {doc.quality_score != null && (
            <div className="border border-[#e5e4de]">
              <div className="px-4 py-3 border-b border-[#e5e4de]">
                <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
                  <Gauge size={12} /> Quality Analysis
                </p>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-[#1c1c1c]">Overall Quality</span>
                  <ConfidenceBadge score={doc.quality_score} threshold={70} />
                </div>
                {doc.quality_details && (
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(doc.quality_details).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between border-b border-[#e5e4de] py-2">
                        <span className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">{key}</span>
                        <span className="text-xs text-[#1c1c1c] capitalize">{val}</span>
                      </div>
                    ))}
                  </div>
                )}
                {doc.quality_score < 75 && (
                  <div className="mt-4 px-3 py-2 bg-[#faf3e8] border border-[#c47830]/20 text-xs text-[#c47830]">
                    Image enhancement recommended for optimal OCR accuracy
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OCR text */}
          {doc.ocr_text && (
            <div className="border border-[#e5e4de]">
              <div className="px-4 py-3 border-b border-[#e5e4de] flex items-center justify-between">
                <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase">OCR Output</p>
                {doc.ocr_confidence != null && <ConfidenceBadge score={doc.ocr_confidence} />}
              </div>
              <div className="p-4">
                <pre className="text-sm text-[#1c1c1c] whitespace-pre-wrap font-sans leading-relaxed">
                  {doc.ocr_text}
                </pre>
                <p className="text-[9px] mono-data text-[#b4b4b4] mt-3 pt-3 border-t border-[#e5e4de]">
                  Model: {doc.detected_language === 'hi' ? 'tesseract-hin-v1' : 'tesseract-eng-v1'} · Pipeline: OCR + NER
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Extracted fields + validation + audit */}
        <div className="space-y-6">
          {/* Extracted fields */}
          <div className="border border-[#e5e4de]">
            <div className="px-4 py-3 border-b border-[#e5e4de]">
              <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase">Extracted Fields</p>
            </div>
            <div className="divide-y divide-[#e5e4de]">
              {fields.length === 0 ? (
                <p className="px-4 py-6 text-sm text-[#b4b4b4] text-center">No fields extracted yet</p>
              ) : (
                fields.map((field) => {
                  const isActive = activeField === field.id;
                  return (
                    <div
                      key={field.id}
                      className={`px-4 py-3 cursor-pointer editorial-ease ${isActive ? 'bg-[#eaf2f0]/30' : 'hover:bg-white/30'}`}
                      onClick={() => setActiveField(isActive ? null : field.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-[#6b7280]">{fieldLabels[field.field_name] || field.field_name}</span>
                        <ConfidenceBadge score={field.confidence} />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#1c1c1c] font-medium">
                          {field.is_corrected && field.corrected_value ? field.corrected_value : field.field_value || '—'}
                        </span>
                        {field.is_corrected && (
                          <span className="text-[9px] mono-data text-[#3d7068] tracking-[0.1em] uppercase">Corrected</span>
                        )}
                      </div>
                      {isActive && (
                        <div className="mt-3 pt-3 border-t border-[#e5e4de] space-y-1.5 fade-in">
                          <div className="flex justify-between text-[10px]">
                            <span className="mono-data text-[#b4b4b4] uppercase">Method</span>
                            <span className="text-[#6b7280]">{field.extraction_method}</span>
                          </div>
                          <div className="flex justify-between text-[10px]">
                            <span className="mono-data text-[#b4b4b4] uppercase">Model</span>
                            <span className="text-[#6b7280]">{field.model_version}</span>
                          </div>
                          {field.source_page && (
                            <div className="flex justify-between text-[10px]">
                              <span className="mono-data text-[#b4b4b4] uppercase">Source</span>
                              <span className="text-[#6b7280]">Page {field.source_page}{field.bbox ? `, Region [${field.bbox.join(', ')}]` : ''}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Validation results */}
          <div className="border border-[#e5e4de]">
            <div className="px-4 py-3 border-b border-[#e5e4de]">
              <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase">Validation Results</p>
            </div>
            <div className="divide-y divide-[#e5e4de]">
              {validations.length === 0 ? (
                <p className="px-4 py-6 text-sm text-[#b4b4b4] text-center">No validation results</p>
              ) : (
                validations.map((val) => (
                  <div key={val.id} className="px-4 py-3 flex items-start gap-3">
                    {val.status === 'pass' ? (
                      <CheckCircle size={14} className="text-[#3d7068] flex-shrink-0 mt-0.5" />
                    ) : val.status === 'fail' ? (
                      <XCircle size={14} className="text-[#b54545] flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle size={14} className="text-[#c47830] flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">{val.rule.replace(/_/g, ' ')}</span>
                        {val.severity && (
                          <span className="text-[9px] mono-data uppercase tracking-[0.1em]" style={{
                            color: val.severity === 'high' || val.severity === 'critical' ? '#b54545' : val.severity === 'medium' ? '#c47830' : '#6b7280'
                          }}>
                            {val.severity}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#1c1c1c] mt-1">{val.message}</p>
                      {val.field_name && (
                        <p className="text-[10px] text-[#b4b4b4] mt-1">Field: {val.field_name}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Registrar info */}
          {(doc.rejection_reason || doc.correction_instructions || doc.approved_at) && (
            <div className="border border-[#e5e4de]">
              <div className="px-4 py-3 border-b border-[#e5e4de]">
                <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
                  <Stamp size={12} /> Registrar Review
                </p>
              </div>
              <div className="divide-y divide-[#e5e4de]">
                {doc.approved_at && (
                  <div className="px-4 py-3 flex justify-between items-center">
                    <span className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">Approved At</span>
                    <span className="text-xs text-[#3d7068]">{new Date(doc.approved_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                )}
                {doc.rejection_reason && (
                  <div className="px-4 py-3">
                    <span className="text-[9px] mono-data text-[#b54545] tracking-[0.1em] uppercase">Rejection Reason</span>
                    <p className="text-xs text-[#1c1c1c] mt-1">{doc.rejection_reason}</p>
                  </div>
                )}
                {doc.correction_instructions && (
                  <div className="px-4 py-3">
                    <span className="text-[9px] mono-data text-[#c47830] tracking-[0.1em] uppercase">Correction Instructions</span>
                    <p className="text-xs text-[#1c1c1c] mt-1">{doc.correction_instructions}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Version history */}
          {versions.length > 0 && (
            <div className="border border-[#e5e4de]">
              <div className="px-4 py-3 border-b border-[#e5e4de]">
                <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
                  <History size={12} /> Version History
                </p>
              </div>
              <div className="divide-y divide-[#e5e4de]">
                {versions.map((v) => (
                  <div key={v.id} className="px-4 py-3 flex items-start gap-3">
                    <span className="text-[9px] mono-data text-[#3d7068] w-12 flex-shrink-0">v{v.version_number}</span>
                    <div className="flex-1">
                      <p className="text-xs text-[#1c1c1c]">{v.reason || '—'}</p>
                      <p className="text-[9px] mono-data text-[#b4b4b4] mt-0.5">
                        {new Date(v.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Document History (audit trail) */}
          <div className="border border-[#e5e4de]">
            <div className="px-4 py-3 border-b border-[#e5e4de]">
              <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
                <Clock size={12} /> Document History
              </p>
            </div>
            <div className="divide-y divide-[#e5e4de]">
              {auditLogs.map((log) => (
                <div key={log.id} className="px-4 py-3 flex items-start gap-3">
                  <span className="text-[9px] mono-data text-[#b4b4b4] w-20 flex-shrink-0">
                    {new Date(log.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div className="flex-1">
                    <span className="text-[10px] mono-data text-[#3d7068] tracking-[0.1em] uppercase">{log.action.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-[#6b7280] ml-2">{log.user_name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Link to record */}
          {record && (
            <Link to={`/records/${record.id}`} className="block border border-[#e5e4de] p-4 hover:border-[#3d7068] editorial-ease group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase">Linked Land Record</p>
                  <p className="text-sm text-[#1c1c1c] mt-1">Survey {record.survey_number} · {record.owner_name}</p>
                </div>
                <StatusBadge status={record.verification_status} />
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
