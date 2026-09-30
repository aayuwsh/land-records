import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToastContext } from '@/context/ToastContext';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';

interface UploadedFile {
  file: File;
  progress: number;
  status: 'ready' | 'uploading' | 'uploaded' | 'error';
  documentId?: string;
}

const MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024;
const PDF_BUCKET = 'land-records';

async function isPdf(file: File) {
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) return false;
  const bytes = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  return String.fromCharCode(...bytes) === '%PDF-';
}

const DOC_TYPES = [
  'khasra', 'khatauni', 'jamabandi', 'mutation_record',
  'sale_deed', 'registration_record', 'property_register',
  'ownership_certificate', 'tax_record', 'cadastral_map', 'other',
];

const LANGUAGES = ['en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'pa', 'kn', 'ml'];

export function DocumentUploadPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { showToast } = useToastContext();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [metadata, setMetadata] = useState({
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    tehsil: 'Sadar',
    village: '',
    record_year: '2024',
    document_type: 'khasra',
    language: 'en',
    source_department: 'Revenue Department',
    reference_number: '',
  });
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList) return;
    const accepted: File[] = [];
    for (const file of Array.from(fileList)) {
      if (file.size > MAX_PDF_SIZE_BYTES) {
        showToast(`${file.name} exceeds the 50 MB limit`, 'warning');
      } else if (await isPdf(file)) {
        accepted.push(file);
      } else {
        showToast(`${file.name} was skipped — upload a valid PDF`, 'warning');
      }
    }
    setFiles((prev) => [...prev, ...accepted.map((file) => ({ file, progress: 0, status: 'ready' as const }))]);
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function uploadAll() {
    if (files.length === 0) {
      showToast('Please select at least one file', 'warning');
      return;
    }
    if (!metadata.village) {
      showToast('Village is required', 'warning');
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const uf = files[i];
      try {
        setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, progress: 30 } : f));

        const safeName = uf.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${session?.user.id || 'anonymous'}/${crypto.randomUUID()}-${safeName}`;
        const { error: storageError } = await supabase.storage
          .from(PDF_BUCKET)
          .upload(storagePath, uf.file, { contentType: 'application/pdf', upsert: false });
        if (storageError) throw storageError;

        setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, progress: 70 } : f));
        const { data, error } = await supabase
          .from('documents')
          .insert({
            filename: uf.file.name,
            original_filename: uf.file.name,
            file_type: uf.file.name.split('.').pop()?.toLowerCase(),
            file_size: uf.file.size,
            page_count: 0,
            file_url: storagePath,
            status: 'pending_registrar_approval',
            document_type: metadata.document_type,
            state: metadata.state,
            district: metadata.district,
            tehsil: metadata.tehsil,
            village: metadata.village,
            record_year: parseInt(metadata.record_year) || null,
            source_department: metadata.source_department,
            reference_number: metadata.reference_number || null,
            created_by: session?.user.id,
          })
          .select()
          .single();

        if (error) {
          await supabase.storage.from(PDF_BUCKET).remove([storagePath]);
          throw error;
        }

        setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, progress: 100, status: 'uploaded', documentId: data.id } : f));

        // Log to audit
        await supabase.from('audit_logs').insert({
          user_id: session?.user.id,
          user_name: 'Demo Operator',
          user_role: 'operator',
          action: 'document_uploaded',
          entity_type: 'document',
          entity_id: data.id,
          details: { filename: uf.file.name, village: metadata.village, storage_bucket: PDF_BUCKET },
        });
      } catch {
        setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: 'error' } : f));
        showToast(`Failed to upload ${uf.file.name}`, 'error');
      }
    }
    showToast(`${files.length} document(s) uploaded successfully`, 'success');
  }

  function startProcessing() {
    const uploaded = files.filter((f) => f.status === 'uploaded' && f.documentId);
    if (uploaded.length === 0) return;
    // Navigate to processing page with the first document
    navigate('/processing');
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto fade-in">
      <div>
        <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.25em] uppercase mb-2">
          Document Ingestion
        </p>
        <h1 className="font-serif text-4xl font-light text-[#1c1c1c]">Upload Documents</h1>
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed p-12 text-center transition-colors editorial-ease ${
          dragActive ? 'border-[#3d7068] bg-[#eaf2f0]/20' : 'border-[#e5e4de]'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Upload size={28} className="mx-auto text-[#b4b4b4] mb-3" strokeWidth={1} />
        <p className="text-sm text-[#1c1c1c] mb-1">Drag and drop files here</p>
        <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase mb-4">
          PDF only · validated file signature · Max 50 MB
        </p>
        <button
          onClick={() => inputRef.current?.click()}
          className="border border-[#e5e4de] px-4 py-2 mono-data text-[10px] tracking-[0.2em] uppercase text-[#1c1c1c] hover:border-[#3d7068] hover:text-[#3d7068] editorial-ease"
        >
          Browse Files
        </button>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="border border-[#e5e4de]">
          <div className="px-4 py-3 border-b border-[#e5e4de]">
            <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase">
              Selected Files ({files.length})
            </p>
          </div>
          <div className="divide-y divide-[#e5e4de]">
            {files.map((uf, i) => (
              <div key={i} className="px-4 py-3 flex items-center gap-4">
                {uf.status === 'uploaded' ? (
                  <CheckCircle size={16} className="text-[#3d7068] flex-shrink-0" />
                ) : uf.status === 'error' ? (
                  <AlertCircle size={16} className="text-[#b54545] flex-shrink-0" />
                ) : (
                  <FileText size={16} className="text-[#b4b4b4] flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1c1c1c] truncate">{uf.file.name}</p>
                  <p className="text-[9px] mono-data text-[#b4b4b4]">
                    {(uf.file.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                {(uf.status === 'uploading' || uf.status === 'ready') && (
                  <div className="w-24 h-1 bg-[#e5e4de] relative overflow-hidden">
                    <div className="h-full bg-[#3d7068] transition-all duration-500" style={{ width: `${uf.progress}%` }} />
                  </div>
                )}
                {uf.status === 'uploaded' && (
                  <span className="text-[9px] mono-data text-[#3d7068] tracking-[0.1em] uppercase">Uploaded</span>
                )}
                {uf.status === 'error' && (
                  <span className="text-[9px] mono-data text-[#b54545] tracking-[0.1em] uppercase">Error</span>
                )}
                <button onClick={() => removeFile(i)} className="text-[#b4b4b4] hover:text-[#b54545]">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata form */}
      <div className="border border-[#e5e4de] p-6">
        <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-4">
          Document Metadata
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { key: 'state', label: 'State' },
            { key: 'district', label: 'District' },
            { key: 'tehsil', label: 'Tehsil' },
            { key: 'village', label: 'Village', required: true },
            { key: 'record_year', label: 'Record Year' },
            { key: 'reference_number', label: 'Reference Number' },
            { key: 'source_department', label: 'Source Department' },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase mb-2">
                {field.label} {field.required && <span className="text-[#b54545]">*</span>}
              </label>
              <input
                type={field.key === 'record_year' ? 'number' : 'text'}
                value={(metadata as Record<string, string>)[field.key]}
                onChange={(e) => setMetadata((prev) => ({ ...prev, [field.key]: e.target.value }))}
                className="w-full bg-transparent border-b border-[#e5e4de] py-2 text-sm text-[#1c1c1c] outline-none focus:border-[#3d7068] editorial-ease"
              />
            </div>
          ))}
          <div>
            <label className="block text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase mb-2">
              Document Type
            </label>
            <select
              value={metadata.document_type}
              onChange={(e) => setMetadata((prev) => ({ ...prev, document_type: e.target.value }))}
              className="w-full bg-transparent border-b border-[#e5e4de] py-2 text-sm text-[#1c1c1c] outline-none focus:border-[#3d7068]"
            >
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase mb-2">
              Language
            </label>
            <select
              value={metadata.language}
              onChange={(e) => setMetadata((prev) => ({ ...prev, language: e.target.value }))}
              className="w-full bg-transparent border-b border-[#e5e4de] py-2 text-sm text-[#1c1c1c] outline-none focus:border-[#3d7068]"
            >
              {LANGUAGES.map((l) => <option key={l} value={l}>{l === 'en' ? 'English' : l === 'hi' ? 'Hindi' : l.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={uploadAll}
          disabled={files.length === 0 || files.every((f) => f.status === 'uploaded')}
          className="bg-[#3d7068] text-[#f7f6f2] px-6 py-2.5 mono-data text-[10px] tracking-[0.2em] uppercase cta-btn editorial-ease disabled:opacity-40"
        >
          Upload {files.length > 0 ? `(${files.length})` : ''}
        </button>
        {files.some((f) => f.status === 'uploaded') && (
          <button
            onClick={startProcessing}
            className="border border-[#1c1c1c] text-[#1c1c1c] px-6 py-2.5 mono-data text-[10px] tracking-[0.2em] uppercase hover:bg-[#1c1c1c] hover:text-[#f7f6f2] editorial-ease"
          >
            Go to Processing
          </button>
        )}
      </div>
    </div>
  );
}
