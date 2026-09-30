import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToastContext } from '@/context/ToastContext';
import { StatusBadge, ConfidenceBadge, PriorityBadge } from '@/components/StatusBadge';
import type { VerificationTask, LandRecord, LandDocument, ExtractedField, ValidationResult } from '@/types';
import {
  FileCheck2, ChevronRight, Check, X, RotateCcw, Eye,
  AlertTriangle, FileText, MessageSquare
} from 'lucide-react';

export function VerificationPage() {
  const { session } = useAuth();
  const { showToast } = useToastContext();
  const [tasks, setTasks] = useState<VerificationTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<VerificationTask | null>(null);
  const [record, setRecord] = useState<LandRecord | null>(null);
  const [document, setDocument] = useState<LandDocument | null>(null);
  const [fields, setFields] = useState<ExtractedField[]>([]);
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    setLoading(true);
    const { data } = await supabase
      .from('verification_tasks')
      .select('*')
      .in('status', ['pending', 'in_progress'])
      .order('created_at', { ascending: false });
    setTasks((data || []) as VerificationTask[]);
    setLoading(false);
  }

  async function selectTask(task: VerificationTask) {
    setSelectedTask(task);
    setEditingField(null);
    setComment('');

    if (task.land_record_id) {
      const [recRes, valRes] = await Promise.all([
        supabase.from('land_records').select('*').eq('id', task.land_record_id).maybeSingle(),
        supabase.from('validation_results').select('*').eq('land_record_id', task.land_record_id).order('created_at', { ascending: false }),
      ]);
      setRecord(recRes.data as LandRecord | null);
      setValidations((valRes.data || []) as ValidationResult[]);

      if (recRes.data?.document_id) {
        const [docRes, fieldsRes] = await Promise.all([
          supabase.from('documents').select('*').eq('id', recRes.data.document_id).maybeSingle(),
          supabase.from('extracted_fields').select('*').eq('document_id', recRes.data.document_id).order('confidence', { ascending: true }),
        ]);
        setDocument(docRes.data as LandDocument | null);
        setFields((fieldsRes.data || []) as ExtractedField[]);
      }
    }
  }

  async function saveFieldEdit(field: ExtractedField) {
    if (!editValue.trim()) return;
    await supabase.from('extracted_fields').update({
      is_corrected: true,
      corrected_value: editValue,
      corrected_by: session?.user.id,
      corrected_at: new Date().toISOString(),
    }).eq('id', field.id);

    // Store feedback correction
    await supabase.from('feedback_corrections').insert({
      document_id: field.document_id,
      land_record_id: record?.id,
      field_name: field.field_name,
      original_prediction: field.field_value,
      corrected_value: editValue,
      model_version: field.model_version,
      corrected_by: session?.user.id,
    });

    // Audit log
    await supabase.from('audit_logs').insert({
      user_id: session?.user.id,
      user_name: 'Demo Verification Officer',
      user_role: 'verification_officer',
      action: 'field_corrected',
      entity_type: 'land_record',
      entity_id: record?.id,
      details: { field: field.field_name, from: field.field_value, to: editValue },
    });

    showToast(`Field "${field.field_name}" corrected`, 'success');
    setEditingField(null);
    if (selectedTask) selectTask(selectedTask);
  }

  async function approveRecord() {
    if (!record || !selectedTask) return;

    await supabase.from('land_records').update({
      verification_status: 'approved',
      verified_by: session?.user.id,
      verified_at: new Date().toISOString(),
      verification_comment: comment || null,
    }).eq('id', record.id);

    await supabase.from('documents').update({
      status: 'approved',
    }).eq('id', record.document_id);

    await supabase.from('verification_tasks').update({
      status: 'completed',
      comments: comment || 'Approved',
      completed_at: new Date().toISOString(),
    }).eq('id', selectedTask.id);

    await supabase.from('audit_logs').insert({
      user_id: session?.user.id,
      user_name: 'Demo Verification Officer',
      user_role: 'verification_officer',
      action: 'record_approved',
      entity_type: 'land_record',
      entity_id: record.id,
      details: { confidence: record.confidence_score, comment },
    });

    showToast('Record approved successfully', 'success');
    setSelectedTask(null);
    loadTasks();
  }

  async function rejectRecord() {
    if (!record || !selectedTask) return;

    await supabase.from('land_records').update({
      verification_status: 'rejected',
      verified_by: session?.user.id,
      verified_at: new Date().toISOString(),
      verification_comment: comment || 'Rejected',
    }).eq('id', record.id);

    await supabase.from('documents').update({ status: 'rejected' }).eq('id', record.document_id);

    await supabase.from('verification_tasks').update({
      status: 'rejected',
      comments: comment || 'Rejected',
      completed_at: new Date().toISOString(),
    }).eq('id', selectedTask.id);

    await supabase.from('audit_logs').insert({
      user_id: session?.user.id,
      user_name: 'Demo Verification Officer',
      user_role: 'verification_officer',
      action: 'record_rejected',
      entity_type: 'land_record',
      entity_id: record.id,
      details: { comment },
    });

    showToast('Record rejected', 'info');
    setSelectedTask(null);
    loadTasks();
  }

  async function requestReprocessing() {
    if (!record || !selectedTask) return;

    await supabase.from('documents').update({
      status: 'processing',
      processing_progress: 0,
    }).eq('id', record.document_id);

    await supabase.from('verification_tasks').update({
      status: 'reprocessing',
      comments: 'Requested reprocessing',
    }).eq('id', selectedTask.id);

    await supabase.from('audit_logs').insert({
      user_id: session?.user.id,
      user_name: 'Demo Verification Officer',
      user_role: 'verification_officer',
      action: 'reprocessing_requested',
      entity_type: 'land_record',
      entity_id: record.id,
    });

    showToast('Reprocessing requested', 'info');
    setSelectedTask(null);
    loadTasks();
  }

  const fieldLabels: Record<string, string> = {
    survey_number: 'Survey Number',
    khasra_number: 'Khasra Number',
    owner_name: 'Owner Name',
    father_husband_name: "Father's Name",
    area: 'Area',
    village: 'Village',
    mutation_number: 'Mutation Number',
    plot_number: 'Plot Number',
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto fade-in">
      <div>
        <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.25em] uppercase mb-2">
          Human Verification Center
        </p>
        <h1 className="font-serif text-4xl font-light text-[#1c1c1c]">Verification</h1>
      </div>

      {!selectedTask ? (
        /* Task list */
        <>
          <div className="border border-[#e5e4de] p-4 flex items-center justify-between">
            <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase">
              Pending Verification Tasks ({tasks.length})
            </p>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="border border-[#e5e4de] p-6 text-center">
                <div className="w-8 h-8 border-2 border-[#e5e4de] border-t-[#3d7068] rounded-full animate-spin mx-auto" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="border border-[#e5e4de] p-12 text-center">
                <FileCheck2 size={24} className="mx-auto text-[#3d7068] mb-2" />
                <p className="text-sm text-[#1c1c1c]">All records verified</p>
                <p className="text-[10px] mono-data text-[#b4b4b4] mt-1">No pending verification tasks</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="border border-[#e5e4de] p-4 hover:border-[#3d7068] cursor-pointer editorial-ease"
                  onClick={() => selectTask(task)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <PriorityBadge priority={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                    <ChevronRight size={14} className="text-[#b4b4b4]" />
                  </div>
                  <p className="text-sm text-[#1c1c1c]">{task.comments}</p>
                  <p className="text-[9px] mono-data text-[#b4b4b4] mt-1">
                    {new Date(task.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* Split-screen verification */
        <div className="space-y-4">
          {/* Task header */}
          <div className="border border-[#e5e4de] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <PriorityBadge priority={selectedTask.priority} />
              <p className="text-sm text-[#1c1c1c]">{selectedTask.comments}</p>
            </div>
            <button
              onClick={() => setSelectedTask(null)}
              className="text-[10px] mono-data text-[#b4b4b4] hover:text-[#1c1c1c] tracking-[0.15em] uppercase"
            >
              Back to List
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-0 border border-[#e5e4de]">
            {/* Left: Original document */}
            <div className="border-r border-[#e5e4de]">
              <div className="px-4 py-3 border-b border-[#e5e4de] bg-[#f7f6f2]/50">
                <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
                  <FileText size={12} /> Original Document
                </p>
              </div>
              <div className="p-6 bg-[#f7f6f2]/30 min-h-[500px] flex items-center justify-center">
                {document ? (
                  <div className="w-full max-w-sm">
                    <div className="border border-[#e5e4de] bg-white p-6 shadow-sm">
                      <div className="flex justify-between text-[8px] mono-data text-[#b4b4b4] mb-3">
                        <span>REF: {document.reference_number}</span>
                        <span>{document.record_year}</span>
                      </div>
                      <div className="border-t border-b border-[#e5e4de] py-4 my-3">
                        <p className="text-center font-serif text-sm text-[#1c1c1c] mb-2">
                          {document.document_type?.toUpperCase().replace(/_/g, ' ')}
                        </p>
                        <div className="space-y-2">
                          {document.ocr_text?.split('\n').map((line, i) => (
                            <p key={i} className="text-[10px] text-[#1c1c1c] leading-relaxed font-serif text-center">
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>
                      <div className="text-center text-[8px] mono-data text-[#b4b4b4]">
                        {document.village}, {document.district}, {document.state}
                      </div>
                      <div className="flex justify-between mt-3 text-[7px] mono-data text-[#b4b4b4]">
                        <span>Page 1 of {document.page_count}</span>
                        <span>{document.detected_language?.toUpperCase()}</span>
                      </div>
                    </div>
                    {document.quality_score != null && (
                      <div className="mt-3 flex items-center justify-between text-[10px]">
                        <span className="mono-data text-[#b4b4b4] uppercase">Quality</span>
                        <ConfidenceBadge score={document.quality_score} />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-[#b4b4b4]">No document available</p>
                )}
              </div>
            </div>

            {/* Right: Extracted fields */}
            <div>
              <div className="px-4 py-3 border-b border-[#e5e4de] bg-[#f7f6f2]/50">
                <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
                  <Eye size={12} /> AI Extracted Fields
                </p>
              </div>
              <div className="divide-y divide-[#e5e4de] min-h-[300px]">
                {fields.length === 0 ? (
                  <p className="px-4 py-8 text-sm text-[#b4b4b4] text-center">No fields extracted</p>
                ) : (
                  fields.map((field) => {
                    const isEditing = editingField === field.id;
                    const displayValue = field.is_corrected && field.corrected_value ? field.corrected_value : field.field_value;
                    const lowConf = field.confidence < 70;
                    return (
                      <div key={field.id} className={`px-4 py-3 ${lowConf ? 'bg-[#f8eded]/20' : ''}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">
                            {fieldLabels[field.field_name] || field.field_name}
                          </span>
                          <div className="flex items-center gap-2">
                            <ConfidenceBadge score={field.confidence} />
                            {lowConf && <AlertTriangle size={11} className="text-[#b54545]" />}
                          </div>
                        </div>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              autoFocus
                              className="flex-1 bg-transparent border-b border-[#3d7068] py-1 text-sm text-[#1c1c1c] outline-none"
                            />
                            <button
                              onClick={() => saveFieldEdit(field)}
                              className="text-[#3d7068] hover:text-[#2a5249]"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingField(null)}
                              className="text-[#b4b4b4] hover:text-[#b54545]"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#1c1c1c] font-medium">
                              {displayValue || '—'}
                            </span>
                            <button
                              onClick={() => { setEditingField(field.id); setEditValue(displayValue || ''); }}
                              className="text-[9px] mono-data text-[#b4b4b4] hover:text-[#3d7068] tracking-[0.1em] uppercase"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                        {field.is_corrected && (
                          <p className="text-[9px] mono-data text-[#3d7068] mt-1">
                            Corrected from: {field.field_value}
                          </p>
                        )}
                        <p className="text-[9px] mono-data text-[#b4b4b4] mt-1">
                          {field.extraction_method} · {field.model_version}
                          {field.bbox && ` · bbox [${field.bbox.join(', ')}]`}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Validation issues */}
              {validations.filter((v) => v.status !== 'pass').length > 0 && (
                <div className="border-t border-[#e5e4de]">
                  <div className="px-4 py-3 border-b border-[#e5e4de]">
                    <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
                      <AlertTriangle size={12} className="text-[#c47830]" /> Validation Issues
                    </p>
                  </div>
                  <div className="divide-y divide-[#e5e4de]">
                    {validations.filter((v) => v.status !== 'pass').map((val) => (
                      <div key={val.id} className="px-4 py-2 flex items-start gap-2">
                        <span className="w-1.5 h-1.5 mt-1.5 flex-shrink-0" style={{
                          backgroundColor: val.status === 'fail' ? '#b54545' : '#c47830'
                        }} />
                        <div>
                          <span className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">{val.rule.replace(/_/g, ' ')}</span>
                          <p className="text-xs text-[#1c1c1c]">{val.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Comment */}
              <div className="border-t border-[#e5e4de] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare size={12} className="text-[#b4b4b4]" />
                  <span className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">Verification Comment</span>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={2}
                  placeholder="Add a note about this verification..."
                  className="w-full bg-transparent border border-[#e5e4de] p-2 text-sm text-[#1c1c1c] outline-none focus:border-[#3d7068] placeholder:text-[#b4b4b4] placeholder:text-xs"
                />
              </div>

              {/* Actions */}
              <div className="border-t border-[#e5e4de] p-4 flex gap-2">
                <button
                  onClick={rejectRecord}
                  className="flex-1 border border-[#b54545] text-[#b54545] py-2.5 mono-data text-[10px] tracking-[0.2em] uppercase hover:bg-[#b54545] hover:text-[#f7f6f2] editorial-ease flex items-center justify-center gap-2"
                >
                  <X size={12} /> Reject
                </button>
                <button
                  onClick={requestReprocessing}
                  className="flex-1 border border-[#c47830] text-[#c47830] py-2.5 mono-data text-[10px] tracking-[0.2em] uppercase hover:bg-[#c47830] hover:text-[#f7f6f2] editorial-ease flex items-center justify-center gap-2"
                >
                  <RotateCcw size={12} /> Reprocess
                </button>
                <button
                  onClick={approveRecord}
                  className="flex-1 bg-[#3d7068] text-[#f7f6f2] py-2.5 mono-data text-[10px] tracking-[0.2em] uppercase cta-btn editorial-ease flex items-center justify-center gap-2"
                >
                  <Check size={12} /> Approve
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
