import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { StatusBadge, ConfidenceBadge } from '@/components/StatusBadge';
import type { LandRecord, Owner, ValidationResult, AuditLog, MapPlot, RecordMapLink, LandDocument } from '@/types';
import {
  ArrowLeft, User, MapPin, Ruler, FileText, Calendar,
  Building, History, Map as MapIcon, AlertTriangle, CheckCircle
} from 'lucide-react';

export function RecordDetailPage() {
  const { id } = useParams();
  const [record, setRecord] = useState<LandRecord | null>(null);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [validations, setValidations] = useState<ValidationResult[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [mapLink, setMapLink] = useState<{ plot: MapPlot; link: RecordMapLink } | null>(null);
  const [document, setDocument] = useState<LandDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadRecord(id);
  }, [id]);

  async function loadRecord(recId: string) {
    setLoading(true);
    const [recRes, ownersRes, valRes, auditRes, docRes] = await Promise.all([
      supabase.from('land_records').select('*').eq('id', recId).maybeSingle(),
      supabase.from('owners').select('*').eq('land_record_id', recId),
      supabase.from('validation_results').select('*').eq('land_record_id', recId).order('created_at', { ascending: false }),
      supabase.from('audit_logs').select('*').eq('entity_id', recId).order('created_at', { ascending: false }),
      supabase.from('documents').select('*').eq('id', recId).maybeSingle(),
    ]);

    const rec = recRes.data as LandRecord | null;
    setRecord(rec);
    setOwners((ownersRes.data || []) as Owner[]);
    setValidations((valRes.data || []) as ValidationResult[]);
    setAuditLogs((auditRes.data || []) as AuditLog[]);

    if (rec?.document_id) {
      const docData = await supabase.from('documents').select('*').eq('id', rec.document_id).maybeSingle();
      setDocument(docData.data as LandDocument | null);
    }

    // Load map link
    const linkRes = await supabase
      .from('record_map_links')
      .select('*')
      .eq('land_record_id', recId)
      .maybeSingle();
    if (linkRes.data) {
      const plotRes = await supabase
        .from('map_plots')
        .select('*')
        .eq('id', (linkRes.data as RecordMapLink).map_plot_id)
        .maybeSingle();
      if (plotRes.data) {
        setMapLink({ plot: plotRes.data as MapPlot, link: linkRes.data as RecordMapLink });
      }
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-2 border-[#e5e4de] border-t-[#3d7068] rounded-full animate-spin" />
      </div>
    );
  }

  if (!record) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-[#b4b4b4]">Record not found</p>
        <Link to="/records" className="text-[#3d7068] text-xs mt-2 inline-block">Back to Records</Link>
      </div>
    );
  }

  const fields = [
    { label: 'Survey Number', value: record.survey_number, icon: FileText },
    { label: 'Khasra Number', value: record.khasra_number, icon: FileText },
    { label: 'Khata Number', value: record.khata_number, icon: FileText },
    { label: 'Plot Number', value: record.plot_number, icon: FileText },
    { label: 'Area', value: record.area ? `${record.area} ${record.area_unit}` : null, icon: Ruler },
    { label: 'Land Classification', value: record.land_classification, icon: Building },
    { label: 'Land Usage', value: record.land_usage, icon: Building },
    { label: 'Ownership Type', value: record.ownership_type, icon: User },
    { label: 'Mutation Number', value: record.mutation_number, icon: FileText },
    { label: 'Mutation Date', value: record.mutation_date, icon: Calendar },
    { label: 'Registration Number', value: record.registration_number, icon: FileText },
    { label: 'Transaction Type', value: record.transaction_type, icon: FileText },
  ];

  const locationFields = [
    { label: 'State', value: record.state },
    { label: 'District', value: record.district },
    { label: 'Tehsil', value: record.tehsil },
    { label: 'Village', value: record.village },
    { label: 'Ward', value: record.ward },
  ];

  const passedValidations = validations.filter((v) => v.status === 'pass').length;
  const failedValidations = validations.filter((v) => v.status === 'fail').length;
  const warningValidations = validations.filter((v) => v.status === 'warn').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto fade-in">
      <Link to="/records" className="flex items-center gap-2 text-xs text-[#b4b4b4] hover:text-[#1c1c1c] editorial-ease">
        <ArrowLeft size={12} /> Back to Records
      </Link>

      {/* Header */}
      <div className="border border-[#e5e4de] p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-2">Land Record</p>
            <h1 className="font-serif text-3xl font-light text-[#1c1c1c]">
              Survey {record.survey_number} — {record.owner_name}
            </h1>
            <p className="text-sm text-[#6b7280] mt-1">
              {record.village}, {record.tehsil}, {record.district}, {record.state}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <StatusBadge status={record.verification_status} />
              {record.confidence_score != null && <ConfidenceBadge score={record.confidence_score} />}
              {record.record_year && <span className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">Year {record.record_year}</span>}
            </div>
          </div>
          {mapLink && (
            <Link to="/maps" className="border border-[#e5e4de] px-4 py-2 hover:border-[#3d7068] editorial-ease flex items-center gap-2">
              <MapIcon size={14} className="text-[#3d7068]" />
              <span className="text-[10px] mono-data tracking-[0.15em] uppercase">View on Map</span>
            </Link>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main: Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Land identification */}
          <div className="border border-[#e5e4de]">
            <div className="px-4 py-3 border-b border-[#e5e4de]">
              <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase">Land Identification & Details</p>
            </div>
            <div className="grid sm:grid-cols-2 divide-y divide-[#e5e4de] sm:divide-y-0">
              {fields.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className={`px-4 py-3 ${i % 2 === 0 ? 'sm:border-r border-[#e5e4de]' : ''} ${i >= 2 ? 'border-t sm:border-t-0' : ''}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={12} className="text-[#b4b4b4]" />
                      <span className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.15em] uppercase">{f.label}</span>
                    </div>
                    <p className="text-sm text-[#1c1c1c]">{f.value || '—'}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Location */}
          <div className="border border-[#e5e4de]">
            <div className="px-4 py-3 border-b border-[#e5e4de]">
              <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
                <MapPin size={12} /> Location
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 divide-x divide-[#e5e4de]">
              {locationFields.map((f) => (
                <div key={f.label} className="px-3 py-3">
                  <p className="text-[9px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase mb-1">{f.label}</p>
                  <p className="text-sm text-[#1c1c1c]">{f.value || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Owners */}
          <div className="border border-[#e5e4de]">
            <div className="px-4 py-3 border-b border-[#e5e4de]">
              <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
                <User size={12} /> Owner Information
              </p>
            </div>
            <div className="divide-y divide-[#e5e4de]">
              {owners.map((owner) => (
                <div key={owner.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#1c1c1c] font-medium">{owner.name}</p>
                    {owner.father_husband_name && (
                      <p className="text-xs text-[#6b7280] mt-0.5">S/o {owner.father_husband_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {owner.ownership_share && <span className="text-xs mono-data text-[#6b7280]">{owner.ownership_share}</span>}
                    {owner.is_primary && <span className="text-[9px] mono-data text-[#3d7068] tracking-[0.1em] uppercase">Primary</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Validation results */}
          <div className="border border-[#e5e4de]">
            <div className="px-4 py-3 border-b border-[#e5e4de] flex items-center justify-between">
              <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase">Validation Results</p>
              <div className="flex gap-3 text-[10px] mono-data">
                <span className="text-[#3d7068]">{passedValidations} PASS</span>
                <span className="text-[#c47830]">{warningValidations} WARN</span>
                <span className="text-[#b54545]">{failedValidations} FAIL</span>
              </div>
            </div>
            <div className="divide-y divide-[#e5e4de]">
              {validations.length === 0 ? (
                <p className="px-4 py-6 text-sm text-[#b4b4b4] text-center">No validation results</p>
              ) : (
                validations.map((val) => (
                  <div key={val.id} className="px-4 py-3 flex items-start gap-3">
                    {val.status === 'pass' ? <CheckCircle size={14} className="text-[#3d7068] flex-shrink-0 mt-0.5" /> :
                     val.status === 'fail' ? <AlertTriangle size={14} className="text-[#b54545] flex-shrink-0 mt-0.5" /> :
                     <AlertTriangle size={14} className="text-[#c47830] flex-shrink-0 mt-0.5" />}
                    <div>
                      <span className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.1em] uppercase">{val.rule.replace(/_/g, ' ')}</span>
                      <p className="text-xs text-[#1c1c1c] mt-0.5">{val.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar: Map link, document, history */}
        <div className="space-y-6">
          {/* Map association */}
          {mapLink && (
            <div className="border border-[#e5e4de] p-4">
              <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-3">Map Association</p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b7280]">Plot</span>
                  <span className="mono-data text-[#1c1c1c]">{mapLink.plot.plot_number}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b7280]">Survey</span>
                  <span className="mono-data text-[#1c1c1c]">{mapLink.plot.survey_number}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b7280]">Match</span>
                  <ConfidenceBadge score={mapLink.link.match_confidence || 0} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#6b7280]">Status</span>
                  <span className="text-[10px] mono-data uppercase tracking-[0.1em]" style={{
                    color: mapLink.link.match_status === 'verified' ? '#3d7068' : mapLink.link.match_status === 'requires_verification' ? '#c47830' : '#4a6fa5'
                  }}>
                    {mapLink.link.match_status.replace(/_/g, ' ')}
                  </span>
                </div>
                {mapLink.plot.is_ai_derived && (
                  <div className="mt-2 px-2 py-1 bg-[#faf3e8] text-[9px] mono-data text-[#c47830] tracking-[0.1em] uppercase">
                    AI-derived geometry — requires validation
                  </div>
                )}
              </div>
              <Link to="/maps" className="mt-3 block text-center text-[10px] mono-data text-[#3d7068] tracking-[0.15em] uppercase hover:underline">
                Open GIS Map
              </Link>
            </div>
          )}

          {/* Source document */}
          {document && (
            <Link to={`/documents/${document.id}`} className="block border border-[#e5e4de] p-4 hover:border-[#3d7068] editorial-ease">
              <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase mb-2">Source Document</p>
              <p className="text-sm text-[#1c1c1c] truncate">{document.original_filename}</p>
              <p className="text-[10px] mono-data text-[#b4b4b4] mt-1">
                {document.detected_language?.toUpperCase()} · {document.document_type?.replace(/_/g, ' ')}
              </p>
            </Link>
          )}

          {/* History / Audit */}
          <div className="border border-[#e5e4de]">
            <div className="px-4 py-3 border-b border-[#e5e4de]">
              <p className="text-[10px] mono-data text-[#b4b4b4] tracking-[0.2em] uppercase flex items-center gap-2">
                <History size={12} /> Record History
              </p>
            </div>
            <div className="divide-y divide-[#e5e4de] max-h-64 overflow-y-auto">
              {auditLogs.map((log) => (
                <div key={log.id} className="px-4 py-3">
                  <span className="text-[9px] mono-data text-[#3d7068] tracking-[0.1em] uppercase">{log.action.replace(/_/g, ' ')}</span>
                  <p className="text-xs text-[#1c1c1c] mt-1">{log.user_name}</p>
                  <p className="text-[9px] mono-data text-[#b4b4b4] mt-0.5">
                    {new Date(log.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
